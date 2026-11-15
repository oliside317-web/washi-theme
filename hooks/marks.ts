// Marks made by hand beside the app's own rows: a reader's vermilion brush.
//
// The colors say who did what (ROLE in backdrop.ts): a reply opens with a
// circle in Claude's clay, as a reader rings the start of a passage; a tool
// call that went through gets a green dot, one that failed a terracotta
// cross.
//
// Each mark is one fixed document, built once: a reply's text never
// chooses it, so a streaming reply, drawn again with every word, shows the
// same image throughout and the surface decodes it once. No filters: the
// hand is in the paths (see ink.ts).

import { bell, brush, ink, roundIn, roundOut, smooth, svg, taperIn, taperOut } from './ink'

import { ROLE } from './backdrop'

// Each document is as tall as the line it sits beside, the mark in its middle.
export const REPLY_SIZE = { w: 16, h: 24 } as const
export const TOOL_SIZE = { w: 14, h: 20 } as const

// ○ lands at the upper right, runs round a little past where it began, lifts dry.
const ring = () => {
  const pts: [number, number][] = []

  for (let i = 0; i <= 18; i += 1) {
    const a = -Math.PI * 0.28 - (i / 18) * Math.PI * 2.1
    const r = 4.9 + 0.22 * Math.sin(i * 1.3)
    pts.push([7.6 + r * Math.cos(a), 7.8 + r * Math.sin(a)])
  }

  return brush({
    pts,
    width: t =>
      (1.2 + 0.8 * (1 - smooth(0, 0.18, t)) + 0.2 * bell(0.3, 0.45, 0.6, t)) * roundIn(t, 0.05) * taperOut(t, 0.22, 0.14),
    dry: t => 0.55 * smooth(0.62, 1, t),
    seed: 6,
    samples: 160,
    streaks: 16,
  })
}

// A dot: enters sharp at the upper left, swells, sits down round at the lower right.
const dot = () =>
  brush({
    pts: [
      [2.2, 2.0],
      [3.6, 3.0],
      [5.0, 4.5],
      [5.9, 6.0],
    ],
    width: t => 3.3 * taperIn(t, 0.75, 0.15) * roundOut(t, 0.3),
    seed: 12,
    samples: 60,
    streaks: 0,
  })

// × two quick strokes, each pointed in and round out; the second runs dry.
const cross = () => [
  brush({
    pts: [
      [3.0, 3.0],
      [6.6, 6.8],
      [10.4, 10.8],
    ],
    width: t => 2.1 * taperIn(t, 0.6, 0.1) * roundOut(t, 0.15),
    seed: 21,
    samples: 60,
    streaks: 0,
  }),
  brush({
    pts: [
      [10.6, 2.6],
      [6.8, 7.0],
      [3.2, 11.0],
    ],
    width: t => 2.2 * taperIn(t, 0.55, 0.1) * roundOut(t, 0.15),
    dry: t => 0.6 * smooth(0.6, 1, t),
    seed: 24,
    samples: 60,
    streaks: 6,
  }),
]

// The strokes do not depend on the color: drawn once, at load.
const RING = ring()
const DOT = dot()
const CROSS = cross()

const cache = new Map<string, string>()
const once = (key: string, make: () => string): string => {
  const hit = cache.get(key)

  if (hit !== undefined) {
    return hit
  }

  const made = make()
  cache.set(key, made)

  return made
}

/** The circle opening a reply, in Claude's clay. */
export const replyMark = (): string =>
  once('reply', () => svg(REPLY_SIZE.w, REPLY_SIZE.h, `<g transform="translate(0.4 4.2)">${ink(RING, ROLE.claude, 'r')}</g>`))

/** Beside a tool call: a green dot where it went through, a terracotta cross where it failed. */
export const toolMark = (isErrored: boolean): string =>
  isErrored
    ? once('fail', () =>
        svg(TOOL_SIZE.w, TOOL_SIZE.h, `<g transform="translate(0.4 3.2)">${CROSS.map((s, i) => ink(s, ROLE.error, `x${i}`)).join('')}</g>`),
      )
    : once('done', () => svg(TOOL_SIZE.w, TOOL_SIZE.h, `<g transform="translate(3 6)">${ink(DOT, ROLE.done, 'd', 0.85)}</g>`))
