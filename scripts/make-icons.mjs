// Génère les icônes PNG (pixel-art : une boussole) sans aucune dépendance.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(out, { recursive: true })

// 16×16, légende : . fond · o contour · g cadran vert · w blanc · r aiguille rouge · y or
const SPRITE = [
  '................',
  '.....oooooo.....',
  '...ooyyyyyyoo...',
  '..oyyggggggyyo..',
  '..oygggrgggggyo.'.slice(0, 16),
  '.oyggggrrgggggyo'.slice(0, 16),
  '.oygggrrrrggggyo'.slice(0, 16),
  '.oyggggrrgggggyo'.slice(0, 16),
  '.oyggggwwgggggyo'.slice(0, 16),
  '.oygggwwwwggggyo'.slice(0, 16),
  '.oyggggwwgggggyo'.slice(0, 16),
  '..oyggggwgggyo..',
  '..oyyggggggyyo..',
  '...ooyyyyyyoo...',
  '.....oooooo.....',
  '................',
]
const PAL = {
  '.': [14, 17, 24, 255],
  o: [0, 0, 0, 255],
  y: [245, 197, 24, 255],
  g: [60, 150, 80, 255],
  w: [242, 242, 247, 255],
  r: [239, 83, 80, 255],
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

function png(size, scale = 1) {
  // scale < 1 : le dessin est réduit pour laisser une marge (icône « maskable »)
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const sprite = Math.round(size * scale)
  const margin = Math.floor((size - sprite) / 2)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let ch = '.'
      const sx = Math.floor(((x - margin) / sprite) * 16)
      const sy = Math.floor(((y - margin) / sprite) * 16)
      if (sx >= 0 && sx < 16 && sy >= 0 && sy < 16) ch = SPRITE[sy][sx] ?? '.'
      const [r, g, b, a] = PAL[ch] ?? PAL['.']
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(join(out, 'icon-192.png'), png(192))
writeFileSync(join(out, 'icon-512.png'), png(512))
writeFileSync(join(out, 'icon-maskable-512.png'), png(512, 0.7))
writeFileSync(join(out, 'apple-touch-icon.png'), png(180))

const rects = SPRITE.flatMap((row, y) =>
  [...row].map((ch, x) => {
    const [r, g, b] = PAL[ch] ?? PAL['.']
    return `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`
  }),
).join('')
writeFileSync(
  join(out, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`,
)
console.log('Icônes créées dans public/')
