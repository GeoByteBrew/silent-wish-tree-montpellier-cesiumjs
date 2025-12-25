type Moderation = {
  isFlagged: boolean
  reason?: string
  normalized: string
}

const urlLike = /\b(?:https?:\/\/|www\.)\S+/i

// Keep this small for MVP; expand later.
const blacklist = new Set([
  // EN
  'nazi',
  'hitler',
  'kill',
  'die',
  'terrorist',
  // FR
  'nazis',
  'tuer',
  'mort',
  'terroriste',
])

export function normalizeText(s: string): string {
  // Lowercase + remove diacritics (FR-friendly)
  const lowered = s.trim().toLowerCase()
  return lowered.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function moderateWish(text: string): Moderation {
  const normalized = normalizeText(text)
  if (urlLike.test(normalized)) return { isFlagged: true, reason: 'url', normalized }

  // word boundary-ish scan
  const words = normalized
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  for (const w of words) {
    if (blacklist.has(w)) return { isFlagged: true, reason: `blacklist:${w}`, normalized }
  }

  return { isFlagged: false, normalized }
}


