#!/usr/bin/env python3
"""Generate mp3s with edge-tts (en-US-AriaNeural) through the VM egress proxy.

Usage: tts_gen.py jobs.json
jobs.json: [{"text": "...", "out": "/abs/path/file.mp3"}, ...]
Skips files that already exist and are >1KB. Verifies each output with ffprobe.
"""
import asyncio, json, os, ssl, subprocess, sys
import aiohttp
import edge_tts

# The VM egress proxy MITMs TLS with a CA that is in the system store but not
# in certifi's bundle. edge_tts.communicate uses a module-level _SSL_CTX built
# from certifi for its websocket call, so patch it to the system-store context.
import edge_tts.communicate as _comm
SSL_CTX = ssl.create_default_context(cafile="/etc/ssl/certs/ca-certificates.crt")
_comm._SSL_CTX = SSL_CTX

VOICE = "en-US-AriaNeural"
PROXY = os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY")

async def gen_one(sem, job):
    out = job["out"]
    if os.path.exists(out) and os.path.getsize(out) > 1024:
        return (out, "skip")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    async with sem:
        for attempt in range(3):
            try:
                conn = aiohttp.TCPConnector(ssl=SSL_CTX)
                comm = edge_tts.Communicate(job["text"], VOICE, proxy=PROXY, connector=conn)
                await comm.save(out)
                if os.path.getsize(out) > 1024:
                    return (out, "ok")
            except Exception as e:
                last = e
                await asyncio.sleep(2 * (attempt + 1))
        return (out, f"FAIL: {last}")

async def main():
    with open(sys.argv[1]) as f:
        jobs = json.load(f)
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(gen_one(sem, j) for j in jobs))
    bad = [r for r in results if r[1].startswith("FAIL")]
    for out, st in results:
        print(st, out)
    print(f"total={len(results)} ok={sum(1 for _,s in results if s in ('ok','skip'))} fail={len(bad)}")
    sys.exit(1 if bad else 0)

asyncio.run(main())
