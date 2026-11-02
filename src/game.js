// Pure Rumble Rally level generation: no Phaser, no physics.
//
// Level N is rebuilt from its number alone (a seeded random generator), so there is no level data to store.
// Coordinates are pixels, y grows downward. A level is a set of ground polylines (gaps between them are pits),
// crates to push, stars to collect and a finish flag.
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const TOTAL_LEVELS = 200
export const PACK = 10
export const PACKS = TOTAL_LEVELS / PACK
export const WORLDS = [
  { name: 'Sunny Meadow', sky: ['#38bdf8', '#e0f2fe'], hill: 0x86efac, top: 0x65a30d, dirt: 0x854d0e, accent: 0x84cc16 },
  { name: 'Desert Dunes', sky: ['#fb923c', '#fef3c7'], hill: 0xfcd34d, top: 0xf59e0b, dirt: 0x9a3412, accent: 0xf59e0b },
  { name: 'Frosty Peaks', sky: ['#60a5fa', '#f1f5f9'], hill: 0xe2e8f0, top: 0xbae6fd, dirt: 0x475569, accent: 0x38bdf8 },
  { name: 'Candy Hills', sky: ['#f472b6', '#fef9c3'], hill: 0xfbcfe8, top: 0xec4899, dirt: 0x9d174d, accent: 0xec4899 },
  { name: 'Night Canyon', sky: ['#1e1b4b', '#7c3aed'], hill: 0x5b21b6, top: 0xa78bfa, dirt: 0x312e81, accent: 0xa78bfa },
]
export const worldOf = (n) => Math.floor(((n - 1) / TOTAL_LEVELS) * WORLDS.length)
export const difficulty = (n) => (n - 1) / (TOTAL_LEVELS - 1)

const STEP = 30
const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2

export function generateLevel(n) {
  const rnd = mulberry32(n * 104729 + 7)
  const pick = (a, b) => a + rnd() * (b - a)
  const d = difficulty(n)
  const maxSlope = 0.25 + d * 0.12 // steepest hill, radians-ish (rise over run)
  const lines = []
  const crates = []
  const marks = [] // x positions that are good spots for stars
  let x = 0
  let y = 420
  let cur = [[-900, y], [x, y]]
  const clampY = (ny) => Math.max(240, Math.min(560, ny))

  const flat = (len) => {
    for (let k = STEP; k <= len; k += STEP) cur.push([x + k, y])
    x += len - (len % STEP)
    if (len % STEP) cur.push([x + (len % STEP), y]), (x += len % STEP)
  }
  const hill = (len, dy) => {
    const ny = clampY(y + dy)
    const real = ny - y
    const steps = Math.max(2, Math.round(len / STEP))
    for (let k = 1; k <= steps; k++) cur.push([x + (len * k) / steps, y + real * ease(k / steps)])
    x += len
    y = ny
  }
  const bumps = (count, h, w) => {
    for (let b = 0; b < count; b++) {
      const steps = Math.round(w / STEP)
      for (let k = 1; k <= steps; k++) cur.push([x + (w * k) / steps, y - h * Math.sin((Math.PI * k) / steps) ** 2])
      x += w
    }
  }
  const crateWall = () => {
    const size = 34
    const cols = 1 + Math.floor(rnd() * (1 + d))
    const rows = 1
    flat(160)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) crates.push({ x: x + 40 + c * (size + 2), y: y - size / 2 - r * size, s: size })
    }
    flat(80 + cols * (size + 2))
    flat(120)
  }
  const jump = () => {
    // A ramp up, a pit, then a landing slightly lower than the take-off.
    const rise = pick(34, 42)
    flat(140)
    hill(200, -rise)
    const gap = Math.round(pick(46, 58 + d * 26))
    marks.push(x + gap / 2)
    lines.push(cur)
    x += gap
    y = clampY(y + pick(16, 34))
    cur = [[x, y]]
    flat(260)
  }

  flat(560)
  const count = 5 + Math.floor(d * 8)
  const kinds = ['hill']
  if (d > 0.04) kinds.push('bumps')
  if (d > 0.1) kinds.push('crates')
  if (d > 0.15) kinds.push('jump', 'jump')
  if (d > 0.3) kinds.push('mountain')
  for (let s = 0; s < count; s++) {
    const kind = kinds[Math.floor(rnd() * kinds.length)]
    const before = x
    if (kind === 'hill') {
      const len = pick(260, 480)
      const dir = y > 470 ? -1 : y < 330 ? 1 : rnd() < 0.5 ? -1 : 1
      hill(len, dir * Math.min(len * maxSlope, pick(50, 170)))
    } else if (kind === 'bumps') bumps(2 + Math.floor(rnd() * (2 + d * 4)), pick(10, 14 + d * 14), pick(110, 170))
    else if (kind === 'crates') crateWall()
    else if (kind === 'jump') jump()
    else {
      const len = pick(300, 440)
      const rise = Math.min(len * maxSlope, pick(110, 190))
      if (y - rise < 250) hill(len, rise)
      else {
        hill(len, -rise)
        flat(60)
        hill(len, rise)
      }
    }
    marks.push((before + x) / 2)
    flat(rnd() < 0.5 ? 150 : 230)
  }
  flat(420)
  const flag = { x: x - 140, y }
  cur.push([x + 900, y])
  lines.push(cur)

  const groundAt = (px) => {
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i]
        const [x2, y2] = line[i + 1]
        if (px >= x1 && px <= x2) return y1 + ((y2 - y1) * (px - x1)) / (x2 - x1 || 1)
      }
    }
    return null
  }
  const stars = []
  const spots = [0.28, 0.58, 0.86].map((f) => f * x)
  for (const sx of spots) {
    // Snap to the nearest mark so stars sit over interesting terrain.
    const m = marks.reduce((best, v) => (Math.abs(v - sx) < Math.abs(best - sx) ? v : best), marks[0] ?? sx)
    const gx = Math.abs(m - sx) < 600 ? m : sx
    const gy = groundAt(gx) ?? groundAt(gx - 150) ?? y
    stars.push({ x: gx, y: gy - 85 })
  }

  let low = 0
  for (const l of lines) for (const p of l) low = Math.max(low, p[1])
  return { n, width: x, start: { x: 130, y: 420 - 44 }, lines, crates, stars, flag, killY: low + 420 }
}

export const starsFor = (got) => got
export const tagsOf = (n) => `${WORLDS[worldOf(n)].name}`

const cache = new Map()
export function levelData(n) {
  if (!cache.has(n)) cache.set(n, generateLevel(n))
  return cache.get(n)
}
