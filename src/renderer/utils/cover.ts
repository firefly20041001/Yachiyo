const NETEASE_HOST = /(?:^|\.)music\.126\.net$/
const QQ_HOST = /(?:^|\.)y\.gtimg\.cn$/

export function getCoverUrl(url: string | undefined | null, size: number): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    if (NETEASE_HOST.test(parsed.hostname)) {
      parsed.searchParams.set('param', `${size}y${size}`)
      return parsed.toString()
    }

    if (QQ_HOST.test(parsed.hostname)) {
      parsed.pathname = parsed.pathname.replace(/R\d+x\d+M/, `R${size}x${size}M`)
      return parsed.toString()
    }

    return url
  } catch {
    return url
  }
}
