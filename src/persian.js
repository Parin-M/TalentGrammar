export function normalizePersian(word) {
  return word
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/ـ/g, "");
}

export function editsOne(word) {
  const alphabet = "آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی";
  const candidates = new Set();
  for (let index = 0; index < word.length; index++) {
    candidates.add(word.slice(0, index) + word.slice(index + 1));
    for (const char of alphabet) {
      candidates.add(word.slice(0, index) + char + word.slice(index + 1));
    }
  }
  for (let index = 0; index <= word.length; index++) {
    for (const char of alphabet) candidates.add(word.slice(0, index) + char + word.slice(index));
  }
  for (let index = 0; index < word.length - 1; index++) {
    candidates.add(word.slice(0, index) + word[index + 1] + word[index] + word.slice(index + 2));
  }
  return candidates;
}

export function suggestPersian(word, vocabulary) {
  const normalized = normalizePersian(word);
  if (!normalized || vocabulary.has(normalized) || !/[\u0600-\u06ff]/.test(normalized)) return null;
  let best = null;
  for (const candidate of editsOne(normalized)) {
    const frequency = vocabulary.get(candidate);
    if (frequency && (!best || frequency > best.frequency)) best = { candidate, frequency };
  }
  if (!best || best.frequency < 4) return null;
  return { replacement: best.candidate, confidence: 0.75, kind: "spelling", language: "fa" };
}
