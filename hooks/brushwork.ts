// The status line while Claude works, in a few plain words: how long the turn
// has run, how many tool calls, how many failed. When the turn ends it says
// so and keeps the turn's tally until the next prompt.
//
//   working 3:05 · 12 tools · 1 error
//   done 3:12 · 12 tools

export type Tally = { startedAt: number; strokes: number; errors: number }

/** A length of time as m:ss. */
export const lengthOf = (ms: number): string => {
  const seconds = Math.max(0, Math.round(ms / 1000))

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const count = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

const tail = (t: Tally): string => `${count(t.strokes, 'tool')}${t.errors > 0 ? ` · ${count(t.errors, 'error')}` : ''}`

/** The line while the turn runs. */
export const workingLine = (t: Tally, now: number): string => `working ${lengthOf(now - t.startedAt)} · ${tail(t)}`

/** The line once the turn has ended. */
export const doneLine = (t: Tally, now: number): string => `done ${lengthOf(now - t.startedAt)} · ${tail(t)}`
