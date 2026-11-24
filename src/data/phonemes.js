export const groups = [
  { label: '单元音', entries: [
    ['iː', 'sheep', 'front'], ['ɪ', 'ship', 'front'], ['ʊ', 'book', 'round'], ['uː', 'food', 'round'],
    ['e', 'bed', 'front'], ['ə', 'about', 'neutral'], ['ɜː', 'bird', 'neutral'], ['ɔː', 'law', 'round'],
    ['æ', 'cat', 'open'], ['ʌ', 'cup', 'open'], ['ɑː', 'car', 'open'], ['ɒ', 'hot', 'round'],
  ] },
  { label: '双元音', entries: [
    ['ɪə', 'near', 'front'], ['eə', 'hair', 'front'], ['ʊə', 'tour', 'round'], ['eɪ', 'day', 'front'],
    ['aɪ', 'my', 'open'], ['ɔɪ', 'boy', 'round'], ['əʊ', 'go', 'round'], ['aʊ', 'now', 'open'],
  ] },
  { label: '辅音', entries: [
    ['p', 'pen', 'closed'], ['b', 'bat', 'closed'], ['t', 'tea', 'ridge'], ['d', 'day', 'ridge'],
    ['k', 'key', 'back'], ['ɡ', 'go', 'back'], ['tʃ', 'chip', 'ridge'], ['dʒ', 'jam', 'ridge'],
    ['f', 'fan', 'lip'], ['v', 'vest', 'lip'], ['θ', 'think', 'teeth'], ['ð', 'this', 'teeth'],
    ['s', 'sink', 'ridge'], ['z', 'zoo', 'ridge'], ['ʃ', 'ship', 'ridge'], ['ʒ', 'vision', 'ridge'],
    ['h', 'hat', 'open'], ['m', 'man', 'closed'], ['n', 'net', 'ridge'], ['ŋ', 'sing', 'back'],
    ['l', 'leg', 'ridge'], ['r', 'red', 'ridge'], ['w', 'west', 'round'], ['j', 'yes', 'front'],
  ] },
  { label: '辅音组合', entries: [
    ['ts', 'cats', 'ridge'], ['dz', 'beds', 'ridge'], ['tr', 'tree', 'ridge'], ['dr', 'dream', 'ridge'],
  ] },
].map(({ label, entries }) => ({
  label,
  entries: entries.map(([symbol, example, shape]) => ({ symbol, example, shape })),
}))

export const phonemes = groups.flatMap(group => group.entries)
export const bySymbol = Object.fromEntries(phonemes.map(entry => [entry.symbol, entry]))

export const trapGroups = [
  { label: '/θ/ 与 /s/', symbols: ['θ', 's'], words: ['think', 'sink'] },
  { label: '/v/ 与 /w/', symbols: ['v', 'w'], words: ['vest', 'west'] },
  { label: '/ɪ/ 与 /iː/', symbols: ['ɪ', 'iː'], words: ['ship', 'sheep'] },
]
