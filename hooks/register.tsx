import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { FileTouch, Sent, Usage, WashiCard, WashiSettings } from '../types'
import { RECIPES, ROLE, RULE, backdropSvg } from './backdrop'
import type { Daylight, Paper, Phase, Season } from './backdrop'
import { REPLY_SIZE, TOOL_SIZE, replyMark, toolMark } from './marks'
import { doneLine, workingLine } from './brushwork'
import type { Tally } from './brushwork'

const PLUGIN = 'washi'
const BACKDROP = 'washi'
const CARD = 'washi-card'
const FILES = 'washi-files'
// Where the settings are kept between sessions.
const STORE_KEY = 'settings'
const DEFAULTS: WashiSettings = {
  isOn: true,
  hasFigure: true,
  ink: 2,
  grain: 2,
  paper: 'washi',
  glass: 2,
  isAlive: true,
  hasMarks: true,
  hasDaylight: true,
}

// Change the tag when WashiSettings' fields change: it declines what an
// earlier version stored, which outlives a reload.
const settings = atom({ plugin: 'washi', key: 'settings' } as const, DEFAULTS, {
  shape: 'washi-6',
})
// The hour the sheet was last drawn for: written when the hour turns, so the
// window's light moves at most once an hour and the sheet is not redrawn between.
const hourState = atom({ plugin: 'washi', key: 'hour' } as const, -1)
// The files Claude wrote or edited this session, for the files pane.
const filesState = atom({ plugin: 'washi', key: 'files' } as const, [] as FileTouch[], { shape: 'files-1' })
// What the model requests took: this turn, and the session.
const usageState = atom({ plugin: 'washi', key: 'usage' } as const, { turn: 0, session: 0 } as Usage, { shape: 'usage-1' })
// When each of the person's prompts was sent, by its text: the transcript's
// rows carry no time of their own.
const sentState = atom({ plugin: 'washi', key: 'sent' } as const, [] as Sent[], { shape: 'sent-1' })
const cardState = atom({ plugin: 'washi', key: 'card' } as const, {
  isOpen: false,
  isInBand: false,
} as WashiCard)

// The app's own panels are sheets of the paper's own panel color laid over
// the backdrop: no blur, so the paper under them stays sharp. The three opacities stay inside
// the range the official theme-examples plugin uses, a little past it at the
// solid end: lower, and text loses its ground; higher, and the panel hides
// the paper.
const GLASS_OPACITY: Record<1 | 2 | 3, number> = { 1: 0.3, 2: 0.46, 3: 0.62 }

// What a set comes to, as far as this mod reads it.
type SetAnswer = { isDrawn: boolean; reason?: string }

// The theme noun changed shape between engine versions, so the set is tried
// the way the official theme-examples plugin tries it: the newest shape first
// (the scene's name under both `scene` and `id`, the window's kind beside the
// backdrop), then the older one. A shape an engine does not know is refused
// by name, and the next is tried.
type AnyEngine = { theme: { set(args: unknown): Promise<SetAnswer> } }

const isOtherShape = (error: unknown): boolean =>
  error instanceof TypeError ||
  (error instanceof Error &&
    (error.message.includes('does not know the attribute') || error.message.includes('overrideColorScheme')))

// Diagnostics, since the load: what the last theme.set answered, and how
// often each surface asked for the backdrop. `/washi status` prints them.
let lastSet: SetAnswer | undefined
let lastError: string | undefined
const draws: Record<string, number> = {}
// The last few draws of the sheet: when (seconds since the first), and in which phase.
const drawLog: string[] = []
let firstDrawAt = 0

// Each call on `$` is written out on the spot, in its own try: the engine
// loads a module only where `$` is called directly, never read or passed on
// as a value.
async function applyTheme($: AnyEngine, level: 1 | 2 | 3, paper: Paper): Promise<void> {
  const recipe = RECIPES[paper]
  const glass = { blur: 0, tint: recipe.panel, opacity: Math.min(0.9, GLASS_OPACITY[level] + recipe.panelBoost) }

  try {
    lastSet = await $.theme.set({
      backdrop: { scene: BACKDROP, id: BACKDROP, glass },
      overrideColorScheme: 'light',
    })
    lastError = undefined

    return
  } catch (error) {
    if (!isOtherShape(error)) {
      lastError = String(error)

      return
    }
  }

  try {
    lastSet = await $.theme.set({ backdrop: { id: BACKDROP, glass, colorScheme: 'light' } })
    lastError = undefined
  } catch (error) {
    lastError = String(error)
  }
}

const isLevel = (value: unknown): value is 1 | 2 | 3 => value === 1 || value === 2 || value === 3
const isPaper = (value: unknown): value is Paper => value === 'washi' || value === 'white'

// What the store holds may be from an older version, or not ours at all: each
// field is taken only where it is the kind of value this version means.
const fromStore = (saved: unknown): WashiSettings => {
  if (typeof saved !== 'object' || saved === null) {
    return DEFAULTS
  }

  const s = saved as Record<string, unknown>
  const flag = (key: keyof WashiSettings): boolean => {
    const value = s[key]

    return typeof value === 'boolean' ? value : (DEFAULTS[key] as boolean)
  }

  return {
    isOn: flag('isOn'),
    hasFigure: flag('hasFigure'),
    ink: isLevel(s.ink) ? s.ink : DEFAULTS.ink,
    grain: isLevel(s.grain) ? s.grain : DEFAULTS.grain,
    paper: isPaper(s.paper) ? s.paper : DEFAULTS.paper,
    glass: isLevel(s.glass) ? s.glass : DEFAULTS.glass,
    isAlive: flag('isAlive'),
    hasMarks: flag('hasMarks'),
    hasDaylight: flag('hasDaylight'),
  }
}

/** Changes the settings: shows the change, keeps it for later sessions, and sets or clears the theme. */
async function change($: EngineInterface, patch: Partial<WashiSettings>): Promise<WashiSettings> {
  const was = await read($, settings)
  const now = await update($, settings, s => ({ ...s, ...patch }))

  // Keeping it must not cost the change itself: a full or refused store is a toast.
  try {
    await $.store.set(STORE_KEY, now)
  } catch (error) {
    void $.ui.toast(`washi: settings could not be kept for later sessions (${String(error)})`)
  }

  if (now.isOn) {
    await applyTheme($, now.glass, now.paper)
  } else if (was.isOn) {
    // Only on the person's own ask, and only when this theme is the one up.
    await $.theme.clear()
  }

  return now
}

// The hour's light, by the clock where the app runs.
const lightAt = (ms: number): Daylight => {
  const hour = new Date(ms).getHours()

  return hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 16 ? 'day' : hour >= 16 && hour < 19 ? 'dusk' : 'night'
}

// The season, by the month where the app runs.
const seasonAt = (ms: number): Season => {
  const month = new Date(ms).getMonth() + 1

  return month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter'
}

/** Writes the hour when it has turned; the backdrop reads it, so it is redrawn then and only then. */
async function turnHour($: EngineInterface): Promise<void> {
  const hour = new Date(await $.clock.now()).getHours()

  if ((await read($, hourState)) !== hour) {
    await update($, hourState, () => hour)
  }
}

/** Records one write or edit of a path. */
const touch = (list: FileTouch[], path: string, isWrite: boolean): FileTouch[] =>
  list.some(f => f.path === path)
    ? list.map(f => (f.path === path ? { ...f, times: f.times + 1 } : f))
    : [...list, { path, isNew: isWrite, times: 1 }]

/** A token count, short: 950, 38k, 1.2M. */
const short = (n: number): string =>
  n < 1000 ? String(n) : n < 1_000_000 ? `${Math.round(n / 1000)}k` : `${(n / 1_000_000).toFixed(1)}M`

// Whether the files pane has opened this session: it opens itself once, at the first change.
let hasOpenedFiles = false

/** Puts a written or edited file on the list, and opens the pane the first time. */
async function noteFile($: EngineInterface, path: string, isWrite: boolean): Promise<void> {
  await update($, filesState, list => touch(list, path, isWrite))

  if (!hasOpenedFiles) {
    hasOpenedFiles = true
    void $.ui.open({ id: FILES, title: 'Files' })
  }
}

// The prompt origins that are the person's own typing: at the terminal, in the
// desktop app (an SDK host), through Remote Control, or with no stamp at all.
const isPersonsOwn = (kind: string): boolean => kind === 'composer' || kind === 'sdk' || kind === 'bridge' || kind === 'unclassified'

/**
 * A prompt's text as both sides can agree on it: hidden comments (a reply's
 * <!-- reply 1 -->) and quoted lines (> ...) taken out, spaces collapsed. The
 * stored prompt keeps them raw while its row may draw them as a quote.
 */
const plainOf = (text: string): string =>
  text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*>.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Whether a row's text and a recorded prompt are the same message. */
const isSameMessage = (row: string, sent: string): boolean =>
  row === sent || (row.length >= 4 && sent.length >= 4 && (row.endsWith(sent) || sent.endsWith(row)))

// Diagnostics for the send time: the last few prompts recorded and rows seen,
// as `/washi status` prints them, so a mismatch shows itself.
const seenRows: string[] = []

/** Records when a prompt was sent. */
async function noteSent($: EngineInterface, text: string): Promise<void> {
  const at = await $.clock.now()
  await update($, sentState, list => [...list, { text: plainOf(text), at }].slice(-300))
}

/** A time of day as 20:02, by the clock where the app runs. */
const clockOf = (ms: number): string => {
  const date = new Date(ms)

  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const INK_WORDS: Record<1 | 2 | 3, string> = { 1: 'Blind', 2: 'Light', 3: 'Dark' }
const GRAIN_WORDS: Record<1 | 2 | 3, string> = { 1: 'Fine', 2: 'Medium', 3: 'Coarse' }
const GLASS_WORDS: Record<1 | 2 | 3, string> = { 1: 'Clear', 2: 'Medium', 3: 'Solid' }
const PAPER_WORDS: Record<Paper, string> = { washi: 'Washi', white: 'White' }
const PAPER_ORDER = ['washi', 'white'] as const
const LIGHT_WORDS: Record<Daylight, string> = { dawn: 'dawn', day: 'day', dusk: 'dusk', night: 'lamplight' }

const describe = (s: WashiSettings): string =>
  s.isOn
    ? `Washi is on: drawing ${s.hasFigure ? 'shown' : 'hidden'}, ink ${s.ink}, grain ${s.grain}, paper ${PAPER_WORDS[s.paper]}, panels ${GLASS_WORDS[s.glass]}, marks ${s.hasMarks ? 'on' : 'off'}, daylight ${s.hasDaylight ? 'on' : 'off'}.`
    : 'Washi is off: the app looks as it did.'

const HELP = [
  '/washi                      open the settings card',
  '/washi on | off | toggle    turn the theme on or off',
  '/washi figure on | off      show or hide the pressed line drawing',
  '/washi ink 1 | 2 | 3        the impression: 1 blind, 2 light, 3 dark',
  '/washi grain 1 | 2 | 3      paper grain: 1 fine, 2 medium, 3 coarse',
  '/washi paper washi | white  paper: cream washi or plain white',
  '/washi glass 1 | 2 | 3      how much paper shows through panels: 1 clear, 3 solid',
  '/washi marks on | off       marks: a clay circle on replies, a green dot or terracotta cross on tool calls, send times on your messages',
  '/washi daylight on | off    window light that moves with the hour, lamplight at night, a seasonal touch by the binding',
  '/washi files                open the files pane',
  '/washi reset                restore the defaults',
  '/washi status               settings and diagnostics',
  '/washi help                 this list',
].join('\n')

const report = (): string => {
  const set =
    lastSet === undefined && lastError === undefined
      ? 'the theme has not been set yet'
      : lastError !== undefined || lastSet === undefined
        ? `setting the theme failed: ${lastError}`
        : lastSet.isDrawn
          ? 'a window draws the backdrop'
          : `no window says it draws backdrops (${lastSet.reason ?? 'no reason given'})`
  const asked = Object.entries(draws)
    .map(([surface, n]) => `${surface} ${n}×`)
    .join(', ')

  return `Diagnostics: ${set}; backdrop drawn: ${asked === '' ? 'not yet' : asked}.\nLast redraws: ${drawLog.length === 0 ? 'none' : drawLog.join(' → ')}`
}

/** What the send time last recorded and last saw, for matching them up. */
const sentReport = (sent: Sent[]): string => {
  const cut = (t: string): string => JSON.stringify(t.length > 30 ? `${t.slice(0, 30)}…` : t)
  const recorded = sent.slice(-3).map(one => cut(one.text)).join(', ')
  const rows = seenRows.map(cut).join(', ')

  return `Send times: recorded ${recorded === '' ? 'none' : recorded}; rows seen ${rows === '' ? 'none' : rows}`
}

/** Answers `/washi` and its arguments: the one place both of its names lead. */
async function runCommand($: EngineInterface, args: string): Promise<{ text: string }> {
  // The command's own row gets its send time too: commands do not pass through
  // the prompt. A time that cannot be read must not cost the command.
  try {
    await noteSent($, `/washi ${args}`)
  } catch {
    // No clock: the row goes without a time.
  }
  const [word = '', value = ''] = args.trim().toLowerCase().split(/\s+/)
  const now = await read($, settings)
  const isSwitch = value === 'on' || value === 'off'

  if (word === '') {
    // A window that places no row in the transcript gets the card above the prompt.
    const placed = await $.ui.place({ id: CARD })
    await update($, cardState, () => ({ isOpen: true, isInBand: !placed.isPlaced }))

    return { text: 'Settings card opened.' }
  }

  if (word === 'help') {
    return { text: HELP }
  }

  if (word === 'files') {
    await $.ui.open({ id: FILES, title: 'Files' })

    return { text: 'Files pane opened.' }
  }

  if (word === 'status') {
    const light = now.hasDaylight ? LIGHT_WORDS[lightAt(await $.clock.now())] : 'steady'

    return { text: `${describe(now)}\nLight now: ${light}.\n${report()}\n${sentReport(await read($, sentState))}` }
  }

  let patch: Partial<WashiSettings>

  if (word === 'on' || word === 'off') {
    patch = { isOn: word === 'on' }
  } else if (word === 'toggle') {
    patch = { isOn: !now.isOn }
  } else if (word === 'figure' && isSwitch) {
    patch = { isOn: true, hasFigure: value === 'on' }
  } else if (word === 'ink' && (value === '1' || value === '2' || value === '3')) {
    patch = { isOn: true, hasFigure: true, ink: value === '1' ? 1 : value === '2' ? 2 : 3 }
  } else if (word === 'grain' && (value === '1' || value === '2' || value === '3')) {
    patch = { isOn: true, grain: value === '1' ? 1 : value === '2' ? 2 : 3 }
  } else if (word === 'glass' && (value === '1' || value === '2' || value === '3')) {
    patch = { isOn: true, glass: value === '1' ? 1 : value === '2' ? 2 : 3 }
  } else if (word === 'paper' && isPaper(value)) {
    patch = { isOn: true, paper: value }
  } else if (word === 'marks' && isSwitch) {
    patch = value === 'on' ? { isOn: true, hasMarks: true } : { hasMarks: false }
  } else if ((word === 'daylight' || word === 'light') && isSwitch) {
    patch = value === 'on' ? { isOn: true, hasDaylight: true } : { hasDaylight: false }
  } else if (word === 'reset') {
    patch = DEFAULTS
  } else {
    return { text: `No such command: /washi ${args.trim()}\n${HELP}` }
  }

  return { text: describe(await change($, patch)) }
}

type CardElements = Pick<ReturnType<EngineInterface['ui']['resolve']>, 'Box' | 'Text' | 'Button'>

/** The settings card: one row per setting, the current choice marked. */
function card($: EngineInterface, { Box, Text, Button }: CardElements, s: WashiSettings) {
  const mark = (isCurrent: boolean, label: string): string => (isCurrent ? `✓ ${label}` : label)
  const levels = [1, 2, 3] as const
  const row = (label: string, buttons: RenderNode[]) => (
    <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap="md" rowGap="xs">
      <Text>{label}</Text>
      <Box flexDirection="row" gap={1}>
        {buttons}
      </Box>
    </Box>
  )

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} gap="md">
      <Box flexDirection="row" justifyContent="space-between" gap={1}>
        <Text bold>Washi settings</Text>
        <Button
          key="close"
          label="Close"
          role="dismiss"
          autoFocus
          onPress={() => update($, cardState, c => ({ ...c, isOpen: false }))}
        />
      </Box>
      {row('Theme', [
        <Button key="theme-on" label={mark(s.isOn, 'On')} onPress={() => change($, { isOn: true })} />,
        <Button key="theme-off" label={mark(!s.isOn, 'Off')} onPress={() => change($, { isOn: false })} />,
      ])}
      {row('Line drawing', [
        <Button key="figure-on" label={mark(s.hasFigure, 'Show')} onPress={() => change($, { isOn: true, hasFigure: true })} />,
        <Button key="figure-off" label={mark(!s.hasFigure, 'Hide')} onPress={() => change($, { isOn: true, hasFigure: false })} />,
      ])}
      {row(
        'Impression',
        levels.map(level => (
          <Button
            key={`ink-${level}`}
            label={mark(s.ink === level, INK_WORDS[level])}
            onPress={() => change($, { isOn: true, hasFigure: true, ink: level })}
          />
        )),
      )}
      {row(
        'Grain',
        levels.map(level => (
          <Button
            key={`grain-${level}`}
            label={mark(s.grain === level, GRAIN_WORDS[level])}
            onPress={() => change($, { isOn: true, grain: level })}
          />
        )),
      )}
      {row(
        'Paper',
        PAPER_ORDER.map(name => (
          <Button
            key={`paper-${name}`}
            label={mark(s.paper === name, PAPER_WORDS[name])}
            onPress={() => change($, { isOn: true, paper: name })}
          />
        )),
      )}
      {row(
        'Panels',
        levels.map(level => (
          <Button
            key={`glass-${level}`}
            label={mark(s.glass === level, GLASS_WORDS[level])}
            onPress={() => change($, { isOn: true, glass: level })}
          />
        )),
      )}
      {row('Marks', [
        <Button key="marks-on" label={mark(s.hasMarks, 'On')} onPress={() => change($, { isOn: true, hasMarks: true })} />,
        <Button key="marks-off" label={mark(!s.hasMarks, 'Off')} onPress={() => change($, { hasMarks: false })} />,
      ])}
      {row('Daylight', [
        <Button key="daylight-on" label={mark(s.hasDaylight, 'Follow the hour')} onPress={() => change($, { isOn: true, hasDaylight: true })} />,
        <Button key="daylight-off" label={mark(!s.hasDaylight, 'Steady')} onPress={() => change($, { hasDaylight: false })} />,
      ])}
      <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap="md" rowGap="xs">
        <Text dimColor>Settings are kept for later sessions. Commands: /washi help</Text>
        <Button key="reset" label="Reset" onPress={() => change($, DEFAULTS)} />
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A refused name must not cost the session its backdrop: go on without the command.
    try {
      await $.command.register({
        name: 'washi',
        description: 'Paper theme: alone, opens the settings card; add on / off, paper, ink, grain and more; help lists all',
      })
    } catch (error) {
      void $.ui.toast(`washi: /washi is not available (${String(error)})`)
    }

    try {
      await $.command.register({ name: 'files', description: 'Open the files pane: files Claude created or edited this session' })
    } catch {
      // Without the command the pane still opens itself at the first change, and /washi files opens it.
    }

    // What an earlier session chose stands for this one.
    try {
      const saved = await $.store.get(STORE_KEY)

      if (saved !== undefined) {
        await update($, settings, () => fromStore(saved))
      }
    } catch {
      // Nothing saved that can be read: the defaults, or what this session already holds.
    }

    try {
      await turnHour($)
    } catch {
      // No clock: the sheet is drawn for the hour it reads at its first draw.
    }

    const s = await read($, settings)

    if (s.isOn) {
      await applyTheme($, s.glass, s.paper)
    }

    return next(e)
  })

  // A window that attaches after the set is told again at each turn's start.
  // It always passes the prompt on: a fault here must never cost it.
  // The status line keeps the turn's tally: started at the prompt, counted at
  // every tool call, closed when the main loop's turn ends. A slow tick keeps
  // the time current between calls.
  let tally: Tally = { startedAt: 0, strokes: 0, errors: 0 }
  let isWorking = false
  let tick: { cancel(): void } | undefined

  on('prompt.submit', async ($, e, next) => {
    try {
      await turnHour($)
      const s = await read($, settings)
      tick?.cancel()
      tick = undefined

      await update($, usageState, u => ({ ...u, turn: 0 }))
      await noteSent($, e.text)

      if (s.isOn) {
        await applyTheme($, s.glass, s.paper)
        tally = { startedAt: await $.clock.now(), strokes: 0, errors: 0 }
        isWorking = true
        $.ui.status(workingLine(tally, tally.startedAt))
        tick = $.clock.every(15000, () => {
          void $.clock.now().then(now => {
            if (isWorking) {
              $.ui.status(workingLine(tally, now))
            }
          })
        })
      } else {
        isWorking = false
        $.ui.status(undefined)
      }
    } catch {
      // Nothing to do: the prompt goes on.
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)

    if (isWorking) {
      tally = {
        ...tally,
        strokes: tally.strokes + 1,
        errors: tally.errors + (ran.deny === undefined && ran.isError === true ? 1 : 0),
      }

      try {
        $.ui.status(workingLine(tally, await $.clock.now()))
      } catch {
        // Nothing to do: the call's result stands.
      }
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    // A subagent's turn ending is not this turn ending.
    if (e.agentId === undefined && isWorking) {
      isWorking = false
      tick?.cancel()
      tick = undefined

      try {
        $.ui.status(doneLine(tally, await $.clock.now()))
      } catch {
        // Nothing to do: the turn has ended either way.
      }
    }

    return next(e)
  })

  on('command.run', { command: 'washi' }, ($, e) => runCommand($, e.args))

  // The same command under the name the plugin's own commands folder gives it.
  // The app lists that one before a conversation has started (it reads the
  // folder with hooks off, when `/washi` is not registered yet), so a new
  // conversation can open with it; answered here, it never reaches the model.
  on('command.run', { command: 'washi:washi' }, ($, e) => runCommand($, e.args))

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    // The scene's name comes under `scene` on the newest engines, `id` before.
    const props = e.props as { plugin?: unknown; scene?: unknown; id?: unknown }
    const name = typeof props.scene === 'string' ? props.scene : props.id

    if (props.plugin !== PLUGIN || name !== BACKDROP || e.surface === 'terminal') {
      return next(e)
    }

    draws[e.surface] = (draws[e.surface] ?? 0) + 1
    const { Svg } = $.ui.resolve(e)
    const s = await read($, settings)
    const ms = await $.clock.now()
    // The turn is read only where the sheet answers it: a still sheet is not redrawn by it.
    // The sheet is still: the app showed every motion tried here at its end state at once.
    const phase: Phase = 'rest'

    if (firstDrawAt === 0) {
      firstDrawAt = ms
    }

    drawLog.push(`${((ms - firstDrawAt) / 1000).toFixed(1)}s ${phase}`)

    if (drawLog.length > 14) {
      drawLog.shift()
    }

    return (
      <Svg
        isInteractive
        source={backdropSvg({
          ink: s.ink,
          grain: s.grain,
          hasFigure: s.hasFigure,
          paper: s.paper,
          phase,
          light: s.hasDaylight ? lightAt(ms) : 'day',
          hour: s.hasDaylight ? ((await read($, hourState)) < 0 ? new Date(ms).getHours() : await read($, hourState)) + 0.5 : undefined,
          season: s.hasDaylight ? seasonAt(ms) : undefined,
        })}
        alt={`A sheet of ${s.paper === 'white' ? 'white' : 'warm handmade'} paper, sewn down its left edge in a hemp-leaf pattern, a line drawing of a girl's face pressed faintly into its lower right.`}
      />
    )
  })

  // A reply opens with a circle in Claude's clay beside its first line, as a
  // reader rings the start of a passage; the block itself is the app's,
  // untouched. (Hung in the margin with an absolute Box, the desktop drew
  // nothing.) The mark never depends on the reply's text, so a streaming reply
  // shows one image throughout. The terminal gets a ring glyph instead.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const s = await read($, settings)

    if (!s.isOn || !s.hasMarks || !e.props.isFirstOfReply || e.props.isSummary === true) {
      return next(e)
    }

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" gap={1}>
          <Text color={ROLE.claude}>○</Text>
          <Box flexDirection="column" flexGrow={1}>
            {await next(e)}
          </Box>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap="xs" alignItems="flex-start">
        <Svg source={replyMark()} alt="A small clay circle: a reply begins" width={REPLY_SIZE.w} height={REPLY_SIZE.h} />
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          {await next(e)}
        </Box>
      </Box>
    )
  })

  // A tool call is a note in the margin: a green dot beside the app's own row
  // where it went through, a terracotta cross where it failed.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const s = await read($, settings)

    if (!s.isOn || !s.hasMarks) {
      return next(e)
    }

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" gap={1}>
          <Text color={e.props.isErrored ? ROLE.error : RULE} dimColor={!e.props.isErrored}>
            {e.props.isErrored ? '×' : '·'}
          </Text>
          <Box flexDirection="column" flexGrow={1}>
            {await next(e)}
          </Box>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap="xs" alignItems="flex-start">
        <Svg
          source={toolMark(e.props.isErrored)}
          alt={e.props.isErrored ? 'A terracotta cross: the call failed' : 'A green dot: the call went through'}
          width={TOOL_SIZE.w}
          height={TOOL_SIZE.h}
        />
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          {await next(e)}
        </Box>
      </Box>
    )
  })

  // Over the person's own message, small, in thin ink and even-width figures,
  // its right edge lined up with the text inside the bubble rather than the
  // bubble's corner, with a little air between the two: the
  // time it was sent, as a clock time where the app's own line under the
  // bubble says "Just now". Over, not under, so the two do not stack. A prompt
  // sent before this version loaded has no time on record and is left as it
  // is. The row is the app's, its width untouched: the column stretches it.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.surface === 'terminal' || !isPersonsOwn(e.props.origin.kind) || e.props.task !== undefined || e.props.from !== undefined) {
      return next(e)
    }

    const s = await read($, settings)

    if (!s.isOn || !s.hasMarks) {
      return next(e)
    }

    const text = plainOf(e.props.text)
    const sent = (await read($, sentState)).filter(one => isSameMessage(text, one.text)).pop()

    if (seenRows[seenRows.length - 1] !== text) {
      seenRows.push(text)

      if (seenRows.length > 3) {
        seenRows.shift()
      }
    }

    if (sent === undefined) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="flex-end" paddingRight="lg" paddingBottom="xs">
          <Text size="caption" tabular dimColor>
            {clockOf(sent.at)}
          </Text>
        </Box>
        {await next(e)}
      </Box>
    )
  })

  // The settings card: in the transcript where the window places rows, above the prompt where it does not.
  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.props.id !== CARD) {
      return next(e)
    }

    const state = await read($, cardState)

    // Put away: a placed row whose hook passes draws nothing.
    if (!state.isOpen) {
      return next(e)
    }

    return card($, $.ui.resolve(e), await read($, settings))
  })

  // Above the prompt: the settings card where the window places no rows, and
  // otherwise, in thin ink, what this turn and the session have used.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const state = await read($, cardState)

    if (state.isOpen && state.isInBand) {
      return card($, $.ui.resolve(e), await read($, settings))
    }

    const s = await read($, settings)
    const u = await read($, usageState)

    if (!s.isOn || e.props.hasSurvey || u.session === 0) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)

    return <Text dimColor>{`this turn ${short(u.turn)} tokens · session ${short(u.session)}`}</Text>
  })

  // Every model request reports what it took when it stops: counted for the
  // turn and the session, cache reads left out as the cheap part. The chunks
  // pass through untouched.
  on('turn.step', async function* ($, e, next) {
    const stream = next(e)
    let step = await stream.next()

    while (step.done !== true) {
      const chunk = step.value

      if (chunk.kind === 'stop' && chunk.usage !== null) {
        const used = chunk.usage.input_tokens + chunk.usage.cache_creation_input_tokens + chunk.usage.output_tokens
        await update($, usageState, u => ({ turn: u.turn + used, session: u.session + used }))
      }

      yield chunk
      step = await stream.next()
    }

    return step.value
  })

  // The files pane: each file Claude writes or edits, once the call has gone
  // through. It opens itself at the first change of a session, once.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      await noteFile($, e.file_path, true)
    }

    return ran
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      await noteFile($, e.file_path, false)
    }

    return ran
  })

  on('command.run', { command: 'files' }, async $ => {
    await $.ui.open({ id: FILES, title: 'Files' })
    hasOpenedFiles = true

    return { text: 'Files pane opened.' }
  })

  // Each row: the file's name, its folder in thin ink, and what was done to it:
  // made by Claude in clay, changed in green with how many times.
  on('ui.render', { component: 'Pane', requestId: FILES }, async ($, e) => {
    const list = await read($, filesState)
    const label = (f: FileTouch): string => (f.isNew ? (f.times > 1 ? `new ×${f.times}` : 'new') : `edited ×${f.times}`)
    const nameOf = (path: string): string => path.split('/').pop() ?? path
    const folderOf = (path: string): string => path.split('/').slice(-3, -1).join('/')

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="column">
          {list.length === 0 ? <Text dimColor>No files changed yet.</Text> : null}
          {list.map(f => (
            <Text key={f.path}>
              {label(f)} {f.path}
            </Text>
          ))}
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap="xs">
        <Text dimColor>{list.length === 0 ? 'No files changed yet.' : `${list.length} ${list.length === 1 ? 'file' : 'files'}`}</Text>
        {list.map(f => (
          <Box key={f.path} flexDirection="row" justifyContent="space-between" gap={1}>
            <Box flexDirection="column" flexShrink={1}>
              <Text bold>{nameOf(f.path)}</Text>
              <Text dimColor>{folderOf(f.path)}</Text>
            </Box>
            <Text color={f.isNew ? ROLE.claude : ROLE.done}>{label(f)}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
