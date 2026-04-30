/** Word-safe trim for meta description (Google typically shows ~120–160 chars). */
export function clipMetaDescription(text: string, max = 158): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const i = cut.lastIndexOf(' ')
  const base = (i > 60 ? cut.slice(0, i) : cut).trimEnd()
  return `${base}…`
}
