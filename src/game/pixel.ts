// Pixel art de Sasha : une lettre hexadécimale (0–f) = une couleur de la palette, « . » = transparent.

export const PALETTE = [
  '#000000', // 0 noir
  '#ffffff', // 1 blanc
  '#ef5350', // 2 rouge
  '#ff9800', // 3 orange
  '#f5c518', // 4 jaune
  '#66d17a', // 5 vert clair
  '#2e7d32', // 6 vert foncé
  '#4de2e0', // 7 turquoise
  '#2979ff', // 8 bleu
  '#1a237e', // 9 bleu nuit
  '#9c27b0', // a violet
  '#ff80ab', // b rose
  '#8d5a2b', // c marron
  '#ffcc99', // d peau
  '#9aa0a6', // e gris
  '#3a3f4b', // f anthracite
] as const

export type ArtKind = 'skin' | 'deck' | 'block'
export const ART_SIZE: Record<ArtKind, { w: number; h: number }> = {
  skin: { w: 16, h: 16 },
  deck: { w: 16, h: 6 },
  block: { w: 16, h: 16 },
}

export const DEFAULT_SKIN = [
  '................',
  '.....cccccc.....',
  '....cccccccc....',
  '....cddddddc....',
  '....cd0dd0dc....',
  '....dddddddd....',
  '.....dd22dd.....',
  '......dddd......',
  '...8888888888...',
  '..d8888888888d..',
  '..d8888888888d..',
  '..dd88888888dd..',
  '....99999999....',
  '....9999..9999..',
  '....9999..9999..',
  '...1111...1111..',
].join('')

export const DEFAULT_DECK = [
  '................',
  '..333333333333..',
  '.33333333333333.',
  '..000000000000..',
  '...11......11...',
  '...11......11...',
].join('')

export const blankArt = (kind: ArtKind) => '.'.repeat(ART_SIZE[kind].w * ART_SIZE[kind].h)

export function isValidArt(value: unknown, kind: ArtKind): value is string {
  const { w, h } = ART_SIZE[kind]
  return typeof value === 'string' && value.length === w * h && /^[0-9a-f.]+$/.test(value)
}

/** Dessin valide ou chaîne vide (= valeur par défaut). */
export function cleanArt(value: unknown, kind: ArtKind): string {
  return isValidArt(value, kind) ? value : ''
}

export function skinOf(skin: string): string {
  return skin || DEFAULT_SKIN
}
export function deckOf(deck: string): string {
  return deck || DEFAULT_DECK
}

export function hasPixels(art: string): boolean {
  return /[0-9a-f]/.test(art)
}

const urlCache = new Map<string, string>()

/** Convertit un dessin en image (data URL) — mise en cache pour ne pas redessiner à chaque rendu. */
export function artToUrl(art: string, kind: ArtKind): string {
  const key = kind + art
  const hit = urlCache.get(key)
  if (hit) return hit
  const { w, h } = ART_SIZE[kind]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  for (let i = 0; i < art.length; i++) {
    const ch = art[i]
    if (ch === '.') continue
    ctx.fillStyle = PALETTE[parseInt(ch, 16)]
    ctx.fillRect(i % w, Math.floor(i / w), 1, 1)
  }
  const url = canvas.toDataURL('image/png')
  if (urlCache.size > 60) urlCache.clear()
  urlCache.set(key, url)
  return url
}

/** Remplissage par zone (voisins haut/bas/gauche/droite). */
export function floodFill(cells: string[], w: number, h: number, x: number, y: number, color: string): string[] {
  const target = cells[y * w + x]
  if (target === color) return cells
  const out = cells.slice()
  const stack = [[x, y]]
  while (stack.length) {
    const [cx, cy] = stack.pop()!
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
    if (out[cy * w + cx] !== target) continue
    out[cy * w + cx] = color
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
  return out
}
