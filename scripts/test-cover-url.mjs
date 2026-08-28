import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { transform } from 'esbuild'

const sourcePath = path.join(fileURLToPath(import.meta.url), '../../src/renderer/utils/cover.ts')
const source = await readFile(sourcePath, 'utf8')
const { code } = await transform(source, { format: 'esm', loader: 'ts' })
const module = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`)
const { getCoverUrl } = module

test('maps QQ covers to a supported size', () => {
  const url = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000003EshpH4Le3jj.jpg?max_age=315'

  assert.equal(
    getCoverUrl(url, 100),
    'https://y.gtimg.cn/music/photo_new/T002R150x150M000003EshpH4Le3jj.jpg?max_age=315'
  )
  assert.equal(
    getCoverUrl(url, 300),
    'https://y.gtimg.cn/music/photo_new/T002R300x300M000003EshpH4Le3jj.jpg?max_age=315'
  )
  assert.equal(
    getCoverUrl(url, 500),
    'https://y.gtimg.cn/music/photo_new/T002R500x500M000003EshpH4Le3jj.jpg?max_age=315'
  )
  assert.equal(
    getCoverUrl(url, 800),
    'https://y.gtimg.cn/music/photo_new/T002R500x500M000003EshpH4Le3jj.jpg?max_age=315'
  )
})

test('keeps NetEase cover sizing exact', () => {
  const url = 'https://p1.music.126.net/abc/def.jpg'

  assert.equal(getCoverUrl(url, 100), 'https://p1.music.126.net/abc/def.jpg?param=100y100')
  assert.equal(getCoverUrl(url, 300), 'https://p1.music.126.net/abc/def.jpg?param=300y300')
})

test('returns unknown and empty covers unchanged', () => {
  assert.equal(getCoverUrl('https://example.com/cover.jpg', 100), 'https://example.com/cover.jpg')
  assert.equal(getCoverUrl('', 100), '')
  assert.equal(getCoverUrl(null, 100), '')
})
