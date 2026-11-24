import topics from './topics.json'

export { topics }

export function dailyTopic(date = new Date()) {
  const day = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    - Date.UTC(date.getFullYear(), 0, 1)) / 86400000 + 1
  return topics[day % topics.length]
}

const episodeOneChunks = [
  ["I've got into … lately", ["I've got into cooking lately."]],
  ["I was supposed to …, but I ended up …", ["I was supposed to finish my code last night, but I ended up watching videos."]],
  ["It turns out …", ["It turns out my code actually worked on the first try.", "It turns out Taiyuan is much colder in the morning than I thought."]],
  ["I'm really into … these days", ["I'm really into listening to English podcasts these days."]],
  ["Long story short, …", ["Long story short, I stayed in my dorm and practised English all evening."]],
]

export function chunksFor(topic) {
  const topicChunks = topic.chunks.map(text => [text, []])
  const entries = topic.id === 1 ? [...topicChunks, ...episodeOneChunks] : topicChunks
  return entries.map(([text, examples]) => ({ text, examples }))
}
