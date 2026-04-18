const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (match, name: string) =>
      NAMED_ENTITIES[name.toLowerCase()] ?? match,
    )
}

function stripMusicAndSoundTags(input: string): string {
  return input.replace(/\[[^\]]{0,40}\]/g, ' ')
}

function collapseWhitespace(input: string): string {
  return input.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export function cleanTranscript(input: string): string {
  if (!input) return input
  const decoded = decodeHtmlEntities(input)
  const withoutTags = stripMusicAndSoundTags(decoded)
  return collapseWhitespace(withoutTags)
}
