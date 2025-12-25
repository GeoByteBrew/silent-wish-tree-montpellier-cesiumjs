import { normalizeText } from './moderation.ts'

const stopFR = new Set([
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'de',
  'du',
  'et',
  'ou',
  'a',
  'au',
  'aux',
  'je',
  'tu',
  'il',
  'elle',
  'on',
  'nous',
  'vous',
  'ils',
  'elles',
  'mon',
  'ma',
  'mes',
  'ton',
  'ta',
  'tes',
  'son',
  'sa',
  'ses',
  'pour',
  'avec',
  'sans',
  'dans',
  'sur',
  'en',
  'ce',
  'cette',
  'ces',
  'que',
  'qui',
  'ne',
  'pas',
  'plus',
  'tres',
  'trop',
])

const stopEN = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'without',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'my',
  'your',
  'our',
  'is',
  'are',
  'be',
  'not',
  'no',
  'yes',
  'more',
  'very',
  'too',
])

export function tokenize(text: string): string[] {
  const n = normalizeText(text)
  const words = n
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, '').replace(/^-+|-+$/g, ''))
    .filter((w) => w.length >= 3)

  return words.filter((w) => !stopFR.has(w) && !stopEN.has(w))
}


