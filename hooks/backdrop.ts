// The backdrop: the window is one sheet of handmade paper, bound as a book.
//
// Not a picture of paper lying somewhere: the sheet itself, edge to edge.
//
//   The sheet. Its surface has relief: a tooth lit from the upper left, so
//   it is light and shadow and not a tint; the fine parallel lines a paper
//   mould leaves (laid lines, and the wider chain lines across them); long
//   fibers caught in the pulp. The fore-edge and the foot are torn, and show
//   over a darker mount; the bound edge, on the left, is cut straight and
//   runs off the window, as a book's spine edge is.
//
//   The binding. A straight edge is lighter than a torn one, so the left
//   side is given its weight back by the sewing itself: not four plain
//   stitches but the hemp-leaf pattern (asa-no-ha toji), a band of thread
//   the width of three fingers that runs the whole height, a triangle of
//   thread at every hole. Where the spine meets the foot, a corner piece of
//   cloth is wrapped round it, as bound books have, dark and plain: the one
//   heavy thing on the left, level with the impression on the right.
//
//   The impression. The supplied line art is pressed into the sheet blind,
//   without ink: each line is a groove, read by the light on one rim and the
//   shade on the other. It is drawn large, across the lower right, and
//   dissolves outward from the eyes.
//
// Balance. Line against field. On the left the thread's geometry, saturated
// and ruled, anchored by the corner cloth; on the right a broad, soft,
// colorless field behind a torn edge; the reading column is the axis. The
// irises answer the thread across the sheet. The upper right is left empty.
// There are no words.
//
// Motion. The sheet is still while nothing happens. While a turn runs, ink
// soaks into the impression: it starts at her eyes and spreads outward
// through the grooves, ring by ring, until the whole drawing stands in ink
// and breathes; a glint runs down the thread, stitch after stitch; her
// irises glow. When the turn ends the ink dries from the outside in, and the
// drawing is a blind impression again.
//
// Every motion is a loop entered part-way through (a negative delay), never
// a one-off counted from zero: the desktop app changes the backdrop in place,
// and a one-off shows at its end state at once. So the ink does not soak in
// once and stop: while a turn runs it is a wave, leaving her eyes and
// crossing the drawing ring by ring, again and again, over ink that stands.
//
// Light. The sheet can follow the day: pale and cool at dawn, plain at
// midday, golden toward dusk, and at night a pool of lamplight with the
// corners falling away.
//
// Layout. No viewBox: the document is the window's size. The sheet and the
// binding are sized with CSS calc(); the impression sits in a nested <svg>
// that is a fixed share of the window's height, so it scales with the window.
// The figure is vector paths: the desktop app does not show an <image>.

import { FIGURE } from './figure'

/**
 * The colors that mean something, the same on either paper. Claude's work
 * is clay orange; what went through is green; what failed is terracotta. Ink is near black.
 */
export const ROLE = {
  claude: '#D97757', // the thread, the circle opening a reply, the files Claude made
  done: '#788C5D', // a tool call that went through, a file that was changed
  error: '#CC785C', // a tool call that failed; the irises too
  ink: '#141413', // every brush and pencil mark, the grooves' graphite
} as const

/** The paper the window is made of. */
export type Paper = 'washi' | 'white'

/** Everything about the sheet that changes with the paper. */
export type Recipe = {
  mount: string // what the sheet lies on, seen past its torn edge
  paper: string // the sheet
  panel: string // the app's own panels, laid over the sheet
  panelBoost: number // how much more solid the panels are than the glass setting says
  shade: [number, number, number] // the color of every shadow on the sheet, as 0..1 channels
  shadeHex: string // the same, for fills
  pulp: [number, number, number] // the mottling of the pulp
  pulpOpacity: number
  fiber: string // dark fibers
  fiberOpacity: number
  laid: number // how strong the mould's lines are
  tooth: number // how much of the grain setting's relief shows: cream paper takes it all, white paper less
  room: number // on white paper, how much the room around the window is shaded
  groove: number // how deep the impression's shaded rim
  cloth: string // the corner cloth
  dawn: string
  dusk: string
  lamp: string
  // The window: on cream paper its light lifts the paper; on white paper
  // there is no lifting white, so the room around it is shaded instead.
  window: 'lift' | 'shade'
  windowTint: Record<'dawn' | 'day' | 'dusk', string>
  lattice: number // how dark the lattice and the branch fall
  maple: [string, string]
  petal: string
}

export const RECIPES: Record<Paper, Recipe> = {
  washi: {
    mount: '#D6CEBE',
    paper: '#F2EFE6',
    panel: '#FAF9F5',
    panelBoost: 0,
    shade: [0.3, 0.23, 0.14],
    shadeHex: '#3F3222',
    pulp: [0.78, 0.62, 0.45],
    pulpOpacity: 0.34,
    fiber: '#6B5636',
    fiberOpacity: 0.2,
    laid: 0.075,
    tooth: 1,
    room: 0,
    groove: 0.3,
    cloth: '#8A8474',
    dawn: '#C9DCEC',
    dusk: '#D4A27F',
    lamp: '#F6DCA8',
    window: 'lift',
    windowTint: { dawn: '#E9F1F8', day: '#FFF8E8', dusk: '#F6D7B4' },
    lattice: 0.09,
    maple: ['#CC785C', '#D4A27F'],
    petal: '#E5B7BA',
  },
  white: {
    mount: '#E8E6DC',
    paper: '#FAF9F5',
    panel: '#FFFFFF',
    panelBoost: 0.08,
    shade: [0.2, 0.2, 0.19],
    shadeHex: '#2A2A28',
    pulp: [0.69, 0.68, 0.65],
    pulpOpacity: 0.1,
    fiber: '#B0AEA5',
    fiberOpacity: 0.26,
    laid: 0.04,
    tooth: 0.5,
    room: 0.085,
    groove: 0.22,
    cloth: '#8F8D86',
    dawn: '#BFD3E6',
    dusk: '#D4A27F',
    lamp: '#F3E3C4',
    window: 'shade',
    windowTint: { dawn: '#EEF3F8', day: '#FFFFFF', dusk: '#F7E3CC' },
    lattice: 0.1,
    maple: ['#CC785C', '#D4A27F'],
    petal: '#DFADB1',
  },
}

/** What the terminal draws beside a tool call's row: a faint rule. */
export const RULE = '#A89F8C'

/** Ink strength 1 to 3: 1 is the blind impression alone, 2 and 3 add graphite. */
export type Ink = 1 | 2 | 3

/** Grain 1 to 3: how rough the sheet's surface is. */
export type Grain = 1 | 2 | 3

/** Where a turn stands, for the ink: at rest, soaking in, standing, or drying. */
export type Phase = 'rest' | 'soaking' | 'soaked' | 'drying'

/** The hour's light. */
export type Daylight = 'dawn' | 'day' | 'dusk' | 'night'

/** The season, for what lies on the sheet by the binding. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** All that decides one drawing of the sheet. */
export type Look = {
  ink: Ink
  grain: Grain
  hasFigure: boolean
  paper: Paper
  phase: Phase
  light: Daylight
  /** The hour, 0 to 24, for where the window's light falls; absent, no window light. */
  hour?: number
  /** The season, for what lies by the binding; absent, nothing does. */
  season?: Season
}

const TOOTH: Record<Grain, number> = { 1: 0.2, 2: 0.34, 3: 0.5 }
const GRAPHITE: Record<Ink, number> = { 1: 0, 2: 0.06, 3: 0.15 }
const IRIS: Record<Ink, number> = { 1: 0.22, 2: 0.4, 3: 0.56 }
// How dark the ink stands while a turn runs.
const WET: Record<Ink, number> = { 1: 0.24, 2: 0.34, 3: 0.48 }

// Measures, in CSS pixels.
const EDGE = 12 // the mount showing past the sheet, right and bottom
const BAND = 64 // the sewn band's width, from the window's left edge
const SEW = { pitch: 132, main: 46, half: 23 } // the stitch pattern: its repeat, and its two rows of holes
const CORNER = { w: 58, h: 86 } // the corner cloth
// The impression fills this share of the window's height, and her eyes fall
// this far from the right edge, in the drawing's own pixels.
const IMPRESSION = { share: 66, eyesFromRight: 378, frame: 900 }
const EYES = { x: 350, y: 372 } // between her eyes, in the drawing's pixels

// A small seeded generator, so the fibers are the same on every draw.
const seeded = (seed: number) => {
  let s = seed >>> 0

  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0

    return s / 4294967296
  }
}

// Long fibers caught in the pulp: gently bent, lying every which way.
const fibers = (seed: number, count: number): string => {
  const next = seeded(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const x = Math.round(next() * 3400)
    const y = Math.round(next() * 2100)
    const length = 26 + next() * 90
    const angle = next() * Math.PI * 2
    const dx = Math.cos(angle) * length
    const dy = Math.sin(angle) * length
    const bend = (next() - 0.5) * length * 0.5
    d += `M${x} ${y}q${(dx / 2 - dy * (bend / length)).toFixed(0)} ${(dy / 2 + dx * (bend / length)).toFixed(0)} ${dx.toFixed(0)} ${dy.toFixed(0)}`
  }

  return d
}

const STYLE =
  `<style>` +
  // The sheet runs off the top and off the left; its torn edge shows right and below.
  `.sheet{x:-60px;y:-60px;width:calc(100% + ${60 - EDGE}px);height:calc(100% + ${60 - EDGE}px)}` +
  // The sewn margin, pressed flat, and the band of stitches down it.
  `.margin{x:0;y:0;width:${BAND + 22}px;height:calc(100% - ${EDGE}px)}` +
  `.sewn{x:0;y:0;width:${BAND}px;height:calc(100% - ${EDGE + 3}px)}` +
  // Everything that moves loops, and each loop is entered part-way through by
  // a negative delay, as the official scenes do it: the app changes the
  // backdrop in place, so nothing here may count on starting from zero.
  // The ink: a wave that leaves her eyes and crosses the drawing ring by ring.
  `@keyframes wave{0%{opacity:.34}20%{opacity:1}48%{opacity:.34}100%{opacity:.34}}` +
  `.ring{animation:wave 7s ease-in-out infinite}` +
  `.r0{animation-delay:-7s}.r1{animation-delay:-6.1s}.r2{animation-delay:-5.2s}.r3{animation-delay:-4.3s}` +
  // Her irises glow and ease.
  `@keyframes glow{0%,100%{opacity:.45}50%{opacity:1}}` +
  `.iris{animation:glow 3.8s ease-in-out infinite}` +
  // The glint runs down the thread.
  `@keyframes run{from{transform:translateY(-34vh)}to{transform:translateY(106vh)}}` +
  `.glint{animation:run 4.2s cubic-bezier(.45,0,.3,1) infinite}` +
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}.glint{display:none}}` +
  `</style>`

// One ring of the drawing, as a mask: white between two radii from her eyes,
// soft at both. Together the four rings cover the drawing evenly.
const RINGS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0.2, 0.32],
  [0.2, 0.32, 0.44, 0.56],
  [0.44, 0.56, 0.68, 0.8],
  [0.68, 0.8, 1, 1],
]

const ringMask = (i: number): string => {
  const [a, b, c, d] = RINGS[i] ?? [0, 0, 1, 1]
  const stop = (at: number, color: string): string => `<stop offset="${at}" stop-color="${color}"/>`

  return (
    `<radialGradient id="ring${i}G" gradientUnits="userSpaceOnUse" cx="${EYES.x}" cy="${EYES.y}" r="560">` +
    (b > 0 ? stop(a, '#000') : '') +
    stop(b, '#fff') +
    stop(c, '#fff') +
    (c < 1 ? stop(d, '#000') : '') +
    `</radialGradient>` +
    `<mask id="ring${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="${FIGURE.w}" height="${FIGURE.h}">` +
    `<rect width="${FIGURE.w}" height="${FIGURE.h}" fill="url(#ring${i}G)"/>` +
    `</mask>`
  )
}

// The stitch pattern, one repeat: the long thread down the main row of holes,
// a wrap round the spine at each main hole and each half hole, and from each
// half hole a thread up and a thread down to the main holes beside it.
const SEWING =
  `M${SEW.main} 0V${SEW.pitch}` +
  `M-3 ${SEW.pitch / 4}H${SEW.main}` +
  `M-3 ${(SEW.pitch * 3) / 4}H${SEW.half}` +
  `M${SEW.half} ${(SEW.pitch * 3) / 4}L${SEW.main} ${SEW.pitch / 4}` +
  `M${SEW.half} ${(SEW.pitch * 3) / 4}L${SEW.main} ${(SEW.pitch * 5) / 4}` +
  `M${SEW.half} ${-SEW.pitch / 4}L${SEW.main} ${SEW.pitch / 4}`

const f = (n: number): string => n.toFixed(3)

const defs = (look: Look): string => {
  const r = RECIPES[look.paper]
  const [sr, sg, sb] = r.shade
  const [pr, pg, pb] = r.pulp

  return (
    // The tooth: fine noise read as a surface and lit from the upper left, then
    // split into the shade it casts and the light it catches.
    `<filter id="tooth" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" result="n"/>` +
    `<feDiffuseLighting in="n" surfaceScale="1.3" lighting-color="#fff" result="lit"><feDistantLight azimuth="225" elevation="45"/></feDiffuseLighting>` +
    `<feColorMatrix in="lit" values="0 0 0 0 ${f(sr)} 0 0 0 0 ${f(sg)} 0 0 0 0 ${f(sb)} -1.5 0 0 0 1.06" result="shade"/>` +
    `<feColorMatrix in="lit" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -1.56" result="shine"/>` +
    `<feMerge><feMergeNode in="shade"/><feMergeNode in="shine"/></feMerge>` +
    `</filter>` +
    // Slow mottling: the pulp lies thicker here, thinner there.
    `<filter id="pulp" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="3" seed="3"/>` +
    `<feColorMatrix values="0 0 0 0 ${f(pr)} 0 0 0 0 ${f(pg)} 0 0 0 0 ${f(pb)} 1.5 0 0 0 -0.6"/>` +
    `</filter>` +
    // The torn edge, and the shadow the sheet casts on its mount.
    `<filter id="torn" x="-3%" y="-3%" width="106%" height="106%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="11" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" result="sheet"/>` +
    `<feGaussianBlur in="sheet" stdDeviation="3.2"/><feOffset dx="1" dy="2" result="b"/>` +
    `<feColorMatrix in="b" values="0 0 0 0 ${f(sr)} 0 0 0 0 ${f(sg)} 0 0 0 0 ${f(sb)} 0 0 0 0.42 0" result="shadow"/>` +
    `<feMerge><feMergeNode in="shadow"/><feMergeNode in="sheet"/></feMerge>` +
    `</filter>` +
    // Something lying on the sheet: a soft shadow down and to the right.
    `<filter id="lie" x="-20%" y="-20%" width="150%" height="150%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="2.4"/><feOffset dx="1.2" dy="2.2" result="b"/>` +
    `<feColorMatrix in="b" values="0 0 0 0 ${f(sr)} 0 0 0 0 ${f(sg)} 0 0 0 0 ${f(sb)} 0 0 0 0.42 0" result="shadow"/>` +
    `<feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>` +
    // Laid lines every 3px, a chain line every 31px: the mould's own pattern.
    `<pattern id="laid" patternUnits="userSpaceOnUse" width="31" height="3">` +
    `<rect width="31" height="1" y="1" fill="${r.shadeHex}" opacity="${r.laid}"/>` +
    `<rect width="1.4" height="3" x="15" fill="${r.shadeHex}" opacity="${f(r.laid * 0.93)}"/>` +
    `</pattern>` +
    // The cloth's weave: warp and weft, a pixel apart.
    `<pattern id="weave" patternUnits="userSpaceOnUse" width="3" height="3">` +
    `<rect width="3" height="1" fill="#000" opacity="0.13"/>` +
    `<rect width="1" height="3" fill="#fff" opacity="0.1"/>` +
    `</pattern>` +
    // The sewing: its shadow, the thread, and the plies that cross it, light
    // on the near side of each. Then the same threads once more, bare and
    // bright, for the glint to show through its mask.
    `<pattern id="sewing" patternUnits="userSpaceOnUse" width="${BAND}" height="${SEW.pitch}">` +
    `<g fill="none" stroke-linecap="round">` +
    `<path d="${SEWING}" stroke="${r.shadeHex}" stroke-opacity="0.26" stroke-width="2.6" transform="translate(0.9 1.5)"/>` +
    `<path d="${SEWING}" stroke="${ROLE.claude}" stroke-width="2.4"/>` +
    `<path d="${SEWING}" stroke="#fff" stroke-opacity="0.34" stroke-width="2.4" stroke-dasharray="1.1 2.5" stroke-linecap="butt"/>` +
    `</g>` +
    `<circle cx="${SEW.main}" cy="${SEW.pitch / 4}" r="2.6" fill="${r.shadeHex}" opacity="0.55"/>` +
    `<circle cx="${SEW.half}" cy="${(SEW.pitch * 3) / 4}" r="2.3" fill="${r.shadeHex}" opacity="0.55"/>` +
    `<circle cx="${SEW.main}" cy="${SEW.pitch / 4}" r="1.3" fill="${ROLE.claude}"/>` +
    `<circle cx="${SEW.half}" cy="${(SEW.pitch * 3) / 4}" r="1.1" fill="${ROLE.claude}"/>` +
    `</pattern>` +
    `<pattern id="sewingLit" patternUnits="userSpaceOnUse" width="${BAND}" height="${SEW.pitch}">` +
    `<path d="${SEWING}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="2.4" stroke-linecap="round"/>` +
    `</pattern>` +
    `<linearGradient id="glintG" x1="0" x2="0" y1="0" y2="1">` +
    `<stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#000"/>` +
    `</linearGradient>` +
    `<mask id="glintMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${BAND}" height="100%">` +
    `<rect class="glint" x="0" y="0" width="${BAND}" height="30%" fill="url(#glintG)"/>` +
    `</mask>` +
    // The sewn margin is pressed flat: a little darker, deepest at the fold.
    `<linearGradient id="fold" x1="0" x2="1" y1="0" y2="0">` +
    `<stop offset="0" stop-color="${r.shadeHex}" stop-opacity="0.09"/>` +
    `<stop offset="0.8" stop-color="${r.shadeHex}" stop-opacity="0.12"/>` +
    `<stop offset="1" stop-color="${r.shadeHex}" stop-opacity="0"/>` +
    `</linearGradient>` +
    // The impression dissolves outward from the eyes, in the drawing's own pixels.
    `<radialGradient id="focusG" gradientUnits="userSpaceOnUse" cx="350" cy="372" r="1" gradientTransform="translate(350 372) scale(455 330) translate(-350 -372)">` +
    `<stop offset="0" stop-color="#fff"/><stop offset="0.5" stop-color="#fff"/><stop offset="0.8" stop-color="#555"/><stop offset="1" stop-color="#000"/>` +
    `</radialGradient>` +
    `<mask id="focus" maskUnits="userSpaceOnUse" x="0" y="0" width="${FIGURE.w}" height="${FIGURE.h}">` +
    `<rect width="${FIGURE.w}" height="${FIGURE.h}" fill="url(#focusG)"/>` +
    `</mask>` +
    (isWetPhase(look.phase) ? [0, 1, 2, 3].map(ringMask).join('') : '') +
    // The hour's light.
    `<linearGradient id="dawn" x1="0" y1="0" x2="0.8" y2="1">` +
    `<stop offset="0" stop-color="${r.dawn}" stop-opacity="0.34"/>` +
    `<stop offset="0.7" stop-color="${r.dawn}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `<linearGradient id="dusk" x1="0" y1="0" x2="0.9" y2="1">` +
    `<stop offset="0" stop-color="${r.dusk}" stop-opacity="0.3"/>` +
    `<stop offset="0.6" stop-color="${r.dusk}" stop-opacity="0.06"/>` +
    `<stop offset="1" stop-color="${r.shadeHex}" stop-opacity="0.1"/>` +
    `</linearGradient>` +
    `<radialGradient id="lamp" cx="0.4" cy="0.3" r="0.9">` +
    `<stop offset="0" stop-color="${r.lamp}" stop-opacity="0.16"/>` +
    `<stop offset="0.42" stop-color="${r.lamp}" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="${r.shadeHex}" stop-opacity="0.3"/>` +
    `</radialGradient>` +
    // The window's light: brighter toward the top, softened at its edges.
    `<linearGradient id="paneG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.65"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></linearGradient>` +
    `<mask id="paneFade" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#paneG)"/></mask>` +
    `<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="4.5"/></filter>` +
    `<path id="fig" d="${FIGURE.hard}"/>` +
    `<path id="figTint" d="${FIGURE.tint}"/>`
  )
}

// The impression: every line a groove. The lit rim lies down and to the
// right of it, the shaded rim up and to the left; the groove itself is bare
// paper, with as much graphite rubbed in as the ink strength asks. Over it,
// while a turn runs, the ink: the same drawing four times, each through one
// ring's mask, each ring coming and going in its turn.
const impression = (look: Look): string => {
  const r = RECIPES[look.paper]
  const left = IMPRESSION.frame - IMPRESSION.eyesFromRight - EYES.x
  const isWet = isWetPhase(look.phase)
  const rings = isWet
    ? `<g opacity="${WET[look.ink]}">` +
      [0, 1, 2, 3]
        .map(i => `<g class="ring r${i}" mask="url(#ring${i})"><use href="#fig" fill="${ROLE.ink}"/></g>`)
        .join('') +
      `</g>`
    : ''
  const glow = isWet
    ? `<g class="iris"><use href="#figTint" fill="${ROLE.error}" opacity="${Math.min(1, 0.95 - IRIS[look.ink] * 0.3).toFixed(2)}"/></g>`
    : ''

  return (
    `<svg x="0" y="${100 - IMPRESSION.share}%" width="100%" height="${IMPRESSION.share}%" viewBox="0 0 ${IMPRESSION.frame} ${FIGURE.h}" preserveAspectRatio="xMaxYMax meet" overflow="visible">` +
    `<g transform="translate(${left} 0)">` +
    `<g mask="url(#focus)" fill-rule="evenodd">` +
    `<use href="#fig" transform="translate(0.95 0.95)" fill="#fff" opacity="0.95"/>` +
    `<use href="#fig" transform="translate(-0.85 -0.85)" fill="${r.shadeHex}" opacity="${r.groove}"/>` +
    `<use href="#fig" fill="${r.paper}"/>` +
    `<use href="#fig" fill="${r.shadeHex}" opacity="0.07"/>` +
    (GRAPHITE[look.ink] > 0 ? `<use href="#fig" fill="${ROLE.ink}" opacity="${GRAPHITE[look.ink]}"/>` : '') +
    rings +
    `<use href="#figTint" fill="${ROLE.error}" opacity="${IRIS[look.ink]}"/>` +
    glow +
    `</g>` +
    `</g>` +
    `</svg>`
  )
}

// The corner piece: cloth wrapped round the spine where it meets the foot,
// pinned to the bottom-left corner. It covers the torn foot there with a
// straight edge of its own, and the stitches pass over it.
const cornerCloth = (r: Recipe): string =>
  `<svg x="0" y="100%" width="1" height="1" overflow="visible">` +
  `<g transform="translate(0 ${-(EDGE + CORNER.h - 5)})">` +
  `<rect x="-6" y="0" width="${CORNER.w + 6}" height="${CORNER.h}" rx="1.5" fill="${r.cloth}" filter="url(#lie)"/>` +
  `<rect x="-6" y="0" width="${CORNER.w + 6}" height="${CORNER.h}" rx="1.5" fill="url(#weave)"/>` +
  // The light along its upper edge, and the fold where it turns under the foot.
  `<rect x="0" y="0.5" width="${CORNER.w - 1}" height="1" fill="#fff" opacity="0.3"/>` +
  `<rect x="0" y="${CORNER.h - 6}" width="${CORNER.w}" height="1" fill="#000" opacity="0.14"/>` +
  `</g>` +
  `</svg>`

const isWetPhase = (phase: Phase): boolean => phase !== 'rest' && phase !== 'drying'

const binding = (look: Look): string =>
  `<rect class="margin" fill="url(#fold)"/>` +
  cornerCloth(RECIPES[look.paper]) +
  `<rect class="sewn" fill="url(#sewing)"/>`

// The window. A shoji stands somewhere to the right of the desk, and its
// light falls across the sheet as a slanted panel crossed by the lattice's
// shadow, with a branch outside throwing its own shadow through the paper.
// It moves with the hour, so the hour can be read off the sheet: in the
// morning it comes in low from the right, cool; at midday it is short and
// high; through the afternoon it slides left and stretches, warming; at
// dusk it is long and gold. At night there is no window light, only the lamp.
// It sits upper left of the column's middle, across the diagonal from the
// impression at the lower right, so the two weigh against each other.
const windowLight = (light: Daylight, hour: number | undefined, r: Recipe): string => {
  if (hour === undefined || light === 'night') {
    return ''
  }

  // 0 at six in the morning, 1 at six in the evening.
  const t = Math.min(1, Math.max(0, (hour - 6) / 12))
  const x = 470 - 300 * t
  const skew = -26 + 52 * t
  const height = 300 + 170 * Math.abs(t - 0.5) * 2
  const width = 260
  const tint = r.windowTint[light === 'dawn' ? 'dawn' : light === 'dusk' ? 'dusk' : 'day']
  const lattice: string[] = []

  for (let i = 1; i < 4; i += 1) {
    lattice.push(`<rect x="${(width * i) / 4 - 1.5}" y="0" width="3" height="${height}"/>`)
  }

  for (let j = 1; j < 6; j += 1) {
    lattice.push(`<rect x="0" y="${((height * j) / 6 - 1.2).toFixed(1)}" width="${width}" height="2.4"/>`)
  }

  const next = seeded(41)
  let leaves = ''

  for (let i = 0; i < 18; i += 1) {
    const u = i / 18
    const bx = width * (1.05 - u * 0.75) + (next() - 0.5) * 30
    const by = height * (0.05 + u * 0.55) + (next() - 0.5) * 40
    const rx = 14 + next() * 12
    const ry = 5 + next() * 4
    const tilt = 150 + (next() - 0.5) * 90
    leaves += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${tilt.toFixed(0)} ${bx.toFixed(1)} ${by.toFixed(1)})"/>`
  }

  const place = `translate(${x.toFixed(1)} 70) skewX(${skew.toFixed(1)})`
  // On white paper the room is shaded and the window left bare, with a warm
  // or cool cast inside it; on cream paper the window's light lifts the paper.
  const glow =
    r.window === 'lift'
      ? `<g style="mix-blend-mode:screen"><rect width="${width}" height="${height}" fill="${tint}" mask="url(#paneFade)" opacity="${light === 'dusk' ? 0.7 : 0.85}"/></g>`
      : `<g style="mix-blend-mode:multiply"><rect width="${width}" height="${height}" fill="${tint}" mask="url(#paneFade)"/></g>`
  const room =
    r.window === 'shade'
      ? `<mask id="room" maskUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="1650">` +
        `<rect x="-500" y="-500" width="2000" height="1650" fill="#fff"/>` +
        `<g transform="${place}" filter="url(#soft)"><rect width="${width}" height="${height}" fill="#000" mask="url(#paneFade)"/></g>` +
        `</mask>` +
        `<rect x="-500" y="-500" width="2000" height="1650" fill="${r.shadeHex}" opacity="${r.room}" mask="url(#room)"/>`
      : ''

  return (
    `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" pointer-events="none">` +
    room +
    `<g transform="${place}" filter="url(#soft)">` +
    `<clipPath id="pane"><rect width="${width}" height="${height}"/></clipPath>` +
    glow +
    `<g clip-path="url(#pane)" fill="${r.shadeHex}" opacity="${f(r.lattice * 0.78)}">` +
    `<path d="M${width + 30} -20Q${width * 0.6} ${height * 0.25} ${width * 0.15} ${height * 0.62}" fill="none" stroke="${r.shadeHex}" stroke-width="4"/>` +
    leaves +
    `</g>` +
    `<g fill="${r.shadeHex}" opacity="${r.lattice}">${lattice.join('')}</g>` +
    `<rect width="${width}" height="${height}" fill="none" stroke="${r.shadeHex}" stroke-opacity="${f(r.lattice * 0.67)}" stroke-width="7"/>` +
    `</g>` +
    `</svg>`
  )
}

// By the binding, the season leaves something lying on the sheet: a few
// maple leaves in autumn, petals in spring. Small, still, and low on the
// left, where the corner cloth is the only weight.
const MAPLE =
  'M0-6.5L1.3-3.2 4.4-4.6 3.3-1.4 6.6-0.9 3.9 1.1 5 3.6 1.6 2.6 0.4 6.5-0.4 6.5-1.6 2.6-5 3.6-3.9 1.1-6.6-0.9-3.3-1.4-4.4-4.6-1.3-3.2Z'
const PETAL = 'M0-5.5C3.2-4.4 3.6 0.6 0 5.5-3.6 0.6-3.2-4.4 0-5.5Z'

const seasonal = (season: Season | undefined, r: Recipe): string => {
  if (season !== 'autumn' && season !== 'spring') {
    return ''
  }

  const spots: readonly [x: number, y: number, rot: number, scale: number][] =
    season === 'autumn'
      ? [
          [118, -58, 24, 1.5],
          [146, -40, -38, 1.15],
          [101, -30, 70, 0.95],
        ]
      : [
          [112, -54, 20, 1],
          [134, -42, -40, 0.9],
          [99, -34, 75, 0.85],
          [150, -64, 110, 0.75],
        ]
  const pieces = spots.map(([x, y, rot, scale], i) => {
    const fill = season === 'autumn' ? (i === 1 ? r.maple[1] : r.maple[0]) : r.petal
    const shape = season === 'autumn' ? MAPLE : PETAL

    return (
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">` +
      `<path d="${shape}" fill="${r.shadeHex}" opacity="0.12" transform="translate(0.8 1.2)"/>` +
      `<path d="${shape}" fill="${fill}" opacity="${season === 'autumn' ? 0.62 : 0.72}"/>` +
      `</g>`
    )
  })

  return `<svg x="0" y="100%" overflow="visible" pointer-events="none">${pieces.join('')}</svg>`
}

const daylight = (light: Daylight): string =>
  light === 'dawn'
    ? `<rect width="100%" height="100%" fill="url(#dawn)" pointer-events="none"/>`
    : light === 'dusk'
      ? `<rect width="100%" height="100%" fill="url(#dusk)" pointer-events="none"/>`
      : light === 'night'
        ? `<rect width="100%" height="100%" fill="url(#lamp)" pointer-events="none"/>`
        : ''

/** The whole backdrop as one SVG document. */
export const backdropSvg = (look: Look): string => {
  const r = RECIPES[look.paper]

  return (
  `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
  STYLE +
  `<defs>${defs(look)}</defs>` +
  // The mount, then the sheet with its torn edge.
  `<rect width="100%" height="100%" fill="${r.mount}"/>` +
  `<rect class="sheet" fill="${r.paper}" filter="url(#torn)"/>` +
  // The impression goes in before the surface, so the tooth runs through it.
  (look.hasFigure ? impression(look) : '') +
  // The surface: pulp, laid lines, fibers dark and light, then the lit tooth.
  `<rect class="sheet" filter="url(#pulp)" opacity="${r.pulpOpacity}"/>` +
  `<rect class="sheet" fill="url(#laid)"/>` +
  `<path d="${fibers(20261114, 150)}" fill="none" stroke="${r.fiber}" stroke-opacity="${r.fiberOpacity}" stroke-width="0.8" stroke-linecap="round"/>` +
  `<path d="${fibers(77, 110)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1" stroke-linecap="round"/>` +
  `<rect class="sheet" filter="url(#tooth)" opacity="${f(TOOTH[look.grain] * r.tooth)}"/>` +
  // The binding lies on top of the sheet.
  binding(look) +
  // What the season left by the binding.
  seasonal(look.season, r) +
  // The window's light, and the branch through it.
  windowLight(look.light, look.hour, r) +
  // The hour's light falls over everything.
  daylight(look.light) +
  `</svg>`
  )
}
