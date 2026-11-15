// Marks made by hand, as plain filled paths.
//
// The hand is in the geometry, not in filters: a stroke is an outline whose
// width follows the brush's pressure (a round landing, a press, a lift to a
// point), with edges that waver a little where the paper's fibres caught it.
// Where the brush ran dry the paper shows through in fine slivers along the
// stroke (dry-brush streaks), cut out by a mask. Nothing here is random at draw time: the
// same arguments always give the same string, so a surface that draws the
// mark as an image decodes it once.

type Point = [number, number]
type Sample = { x: number; y: number; nx: number; ny: number; t: number }

/** A small seeded generator, so a mark is the same on every draw. */
const seeded = (seed: number) => {
  let s = seed >>> 0

  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0

    return s / 4294967296
  }
}

/** The item at `i`, which the caller has kept in range. */
const at = <T>(xs: readonly T[], i: number): T => xs[Math.min(xs.length - 1, Math.max(0, i))] as T

/** Smooth 1D value noise in [0, 1]. */
const noise1 = (seed: number, n = 128) => {
  const r = seeded(seed)
  const v = Array.from({ length: n + 1 }, r)

  return (x: number): number => {
    const xx = ((x % n) + n) % n
    const i = Math.floor(xx)
    const f = xx - i
    const u = f * f * (3 - 2 * f)

    return at(v, i) * (1 - u) + at(v, i + 1) * u
  }
}

const f2 = (n: number): string => (Math.round(n * 100) / 100).toString()

export const smooth = (a: number, b: number, t: number): number => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)))

  return x * x * (3 - 2 * x)
}

export const bell = (a: number, peak: number, b: number, t: number): number =>
  t < peak ? smooth(a, peak, t) : 1 - smooth(peak, b, t)

/** A round end: the width rises as a quarter circle over the first `e` of the stroke. */
export const roundIn = (t: number, e: number): number => Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, t / e), 2)))
export const roundOut = (t: number, e: number): number => roundIn(1 - t, e)

/** A pointed end: the width falls to `tip` over the last `e`. */
export const taperOut = (t: number, e: number, tip = 0.06): number => tip + (1 - tip) * Math.pow(Math.min(1, (1 - t) / e), 0.8)
export const taperIn = (t: number, e: number, tip = 0.06): number => taperOut(1 - t, e, tip)

/** Catmull-Rom through the points, resampled evenly by length, with each sample's normal. */
const spline = (pts: Point[], count: number): Sample[] => {
  const dense: Point[] = []
  const p = [at(pts, 0), ...pts, at(pts, pts.length - 1)]

  for (let i = 1; i < p.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [at(p, i - 1), at(p, i), at(p, i + 1), at(p, i + 2)]

    for (let k = 0; k < 40; k += 1) {
      const t = k / 40
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t)
      dense.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])])
    }
  }

  dense.push(at(pts, pts.length - 1))
  const len = [0]

  for (let i = 1; i < dense.length; i += 1) {
    const [x0, y0] = at(dense, i - 1)
    const [x1, y1] = at(dense, i)
    len.push(at(len, i - 1) + Math.hypot(x1 - x0, y1 - y0))
  }

  const total = at(len, len.length - 1)
  const even: Point[] = []
  let j = 0

  for (let k = 0; k < count; k += 1) {
    const target = (total * k) / (count - 1)

    while (j < len.length - 2 && at(len, j + 1) < target) {
      j += 1
    }

    const f = (target - at(len, j)) / (at(len, j + 1) - at(len, j) || 1)
    const [ax, ay] = at(dense, j)
    const [bx, by] = at(dense, j + 1)
    even.push([ax + (bx - ax) * f, ay + (by - ay) * f])
  }

  return even.map(([x, y], i) => {
    const [ax, ay] = at(even, i - 1)
    const [bx, by] = at(even, i + 1)
    const dx = bx - ax
    const dy = by - ay
    const l = Math.hypot(dx, dy) || 1

    return { x, y, nx: -dy / l, ny: dx / l, t: i / (even.length - 1) }
  })
}

const ring = (pts: Point[]): string => 'M' + pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join('L') + 'Z'

const outline = (line: Sample[], half: (p: Sample, i: number) => number): string => {
  const left: Point[] = []
  const right: Point[] = []

  line.forEach((p, i) => {
    const h = half(p, i)
    left.push([p.x + p.nx * h, p.y + p.ny * h])
    right.push([p.x - p.nx * h, p.y - p.ny * h])
  })

  return ring([...left, ...right.reverse()])
}

export type Stroke = { body: string; gaps: string }

export type BrushArgs = {
  /** The path the brush's centre takes, through these points. */
  pts: Point[]
  /** The stroke's width at t in [0, 1], its ends included. */
  width: (t: number) => number
  /** How far the brush has run dry at t: 0 wet, 1 bone dry. */
  dry?: (t: number) => number
  seed?: number
  samples?: number
  /** How much the edges waver, as a share of the width. */
  wobble?: number
  /** At most this many dry slivers. */
  streaks?: number
}

/** One stroke of the brush: its outline, and the slivers where it ran dry. */
export const brush = ({ pts, width, dry = () => 0, seed = 1, samples = 120, wobble = 0.05, streaks = 40 }: BrushArgs): Stroke => {
  const line = spline(pts, samples)
  const edgeL = noise1(seed * 7 + 1)
  const edgeR = noise1(seed * 7 + 2)
  const fibre = noise1(seed * 7 + 3)
  const left: Point[] = []
  const right: Point[] = []

  // Each side wavers on its own; the paper's fibres catch it a little.
  line.forEach(({ x, y, nx, ny, t }) => {
    const w = width(t) / 2
    const hl = w * (1 + wobble * (edgeL(t * 14) - 0.5) * 2) + 0.06 * (fibre(t * 90) - 0.5)
    const hr = w * (1 + wobble * (edgeR(t * 14) - 0.5) * 2) + 0.06 * (fibre(t * 90 + 40) - 0.5)
    left.push([x + nx * hl, y + ny * hl])
    right.push([x - nx * hr, y - ny * hr])
  })

  // Dry slivers: thin, pointed at both ends, lying along the stroke.
  const r = seeded(seed * 131 + 17)
  let gaps = ''
  let made = 0

  for (let i = 0; i < streaks * 4 && made < streaks; i += 1) {
    const mid = r()
    const d = dry(mid)

    if (d <= 0.02 || r() > d) {
      continue
    }

    const span = 0.06 + r() * 0.3 * d
    const ia = Math.round(Math.max(0, mid - span / 2) * (samples - 1))
    const ib = Math.round(Math.min(1, mid + span / 2) * (samples - 1))
    const off = (r() - 0.5) * 0.9
    const thick = (0.12 + r() * 0.3) * (0.6 + d)

    if (ib - ia < 3) {
      continue
    }

    const seg = line.slice(ia, ib + 1).map(p => ({ ...p, x: p.x + p.nx * off * width(p.t) * 0.5, y: p.y + p.ny * off * width(p.t) * 0.5 }))
    gaps += outline(seg, (_, k) => thick * Math.sin((Math.PI * k) / (seg.length - 1)))
    made += 1
  }

  return { body: ring([...left, ...right.reverse()]), gaps }
}

/** A stroke as SVG markup: its body in the color, the dry slivers cut out. `id` names its mask within one document. */
export const ink = (stroke: Stroke, color: string, id: string, opacity = 1): string =>
  stroke.gaps === ''
    ? `<path d="${stroke.body}" fill="${color}" opacity="${opacity}"/>`
    : `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="200" height="200">` +
      `<rect x="-10" y="-10" width="200" height="200" fill="#fff"/><path d="${stroke.gaps}" fill="#000"/></mask>` +
      `<path d="${stroke.body}" fill="${color}" opacity="${opacity}" mask="url(#${id})"/>`

/** An SVG document of the given size in CSS pixels. */
export const svg = (w: number, h: number, inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`
