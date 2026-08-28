const NETEASE_HOST = /(?:^|\.)music\.126\.net$/
const QQ_HOST = /(?:^|\.)y\.gtimg\.cn$/
const QQ_SIZES = [150, 300, 500]

export function getCoverUrl(url: string | undefined | null, size: number): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    if (NETEASE_HOST.test(parsed.hostname)) {
      parsed.searchParams.set('param', `${size}y${size}`)
      return parsed.toString()
    }

    if (QQ_HOST.test(parsed.hostname)) {
      const qqSize = QQ_SIZES.find(candidate => candidate >= size) ?? QQ_SIZES[QQ_SIZES.length - 1]
      parsed.pathname = parsed.pathname.replace(/R\d+x\d+M/, `R${qqSize}x${qqSize}M`)
      return parsed.toString()
    }

    return url
  } catch {
    return url
  }
}
