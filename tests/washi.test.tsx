import { expect, test } from 'claude-code/testing'

import { doneLine, workingLine } from '../hooks/brushwork'

// A command as the person's own Enter at the prompt raises it.
const typed = (args: string) =>
  ({
    command: 'washi',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  }) as const

const CARD = {
  plugin: 'washi',
  component: 'Placed',
  requestId: 'washi-card',
  props: { id: 'washi-card', plugin: 'washi' },
} as const

test('/washi opens the settings card, and a press changes a setting', async ($, on) => {
  // Nothing sits beneath the plugin: each hook here stands for the engine.
  // The kit has no theme noun, so a set fails there and the mod carries on: that is what is exercised.
  on('ui.place', () => ({ value: { isPlaced: true, requestId: 'washi-card' } }))
  on('store.set', () => ({ value: undefined }))

  const opened = await $.command.run(typed(''))
  expect(opened.text).toBe('Settings card opened.')

  const ui = await $.ui.mount({ ...CARD, surface: 'desktop' })
  expect((await ui.find({ type: 'Button', key: 'ink-3' }))?.props.label).toBe('Dark')

  await ui.press({ key: 'ink-3' })
  expect((await ui.find({ type: 'Button', key: 'ink-3' }))?.props.label).toBe('✓ Dark')
  await ui.unmount()
})

test('a command changes a setting and says what stands', async ($, on) => {
  on('store.set', () => ({ value: undefined }))

  const answer = await $.command.run(typed('grain 3'))
  expect(answer.text).toBe('Washi is on: drawing shown, ink 2, grain 3, paper Washi, panels Medium, marks on, daylight on.')

  const tinted = await $.command.run(typed('paper white'))
  expect(tinted.text).toBe('Washi is on: drawing shown, ink 2, grain 3, paper White, panels Medium, marks on, daylight on.')

  // The name the plugin's commands folder lists leads to the same place.
  const listed = await $.command.run({ ...typed('glass 1'), command: 'washi:washi' })
  expect(listed.text).toBe('Washi is on: drawing shown, ink 2, grain 3, paper White, panels Clear, marks on, daylight on.')

  const unknown = await $.command.run(typed('nonsense'))
  expect(unknown.text?.startsWith('No such command')).toBe(true)
})

test('a reply opens with a clay circle, and a tool call carries a dot, the app\'s own rows kept', async ($, on) => {
  // The hook beneath stands for the engine: it draws the row as one Text.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>the app's row</Text>
  })

  const reply = await $.ui.mount({
    plugin: 'washi',
    component: 'AssistantMessage',
    requestId: 'reply',
    surface: 'desktop',
    props: { text: 'Hello.', isFirstOfReply: true },
  })
  const ringed = await reply.find({ type: 'Svg' })
  expect(ringed?.props.width).toBe(16)
  expect(ringed?.props.source.includes('feTurbulence')).toBe(false)
  expect((await reply.find({ type: 'Text', text: /row/ }))?.text).toBe("the app's row")
  await reply.unmount()

  // A streaming reply grows word by word: its mark must not change with it.
  const early = await $.ui.mount({ plugin: 'washi', component: 'AssistantMessage', requestId: 's1', surface: 'desktop', props: { text: 'He', isFirstOfReply: true } })
  const late = await $.ui.mount({ plugin: 'washi', component: 'AssistantMessage', requestId: 's2', surface: 'desktop', props: { text: 'Hello, a much longer reply.', isFirstOfReply: true } })
  expect((await early.find({ type: 'Svg' }))?.props.source).toBe((await late.find({ type: 'Svg' }))?.props.source)
  await early.unmount()
  await late.unmount()

  // A later block of the same reply gets no stroke.
  const later = await $.ui.mount({
    plugin: 'washi',
    component: 'AssistantMessage',
    requestId: 'reply-2',
    surface: 'desktop',
    props: { text: 'More.', isFirstOfReply: false },
  })
  expect(await later.find({ type: 'Svg' })).toBe(undefined)
  await later.unmount()

  // The terminal has no Svg: a plain rule stands in.
  const typed = await $.ui.mount({
    plugin: 'washi',
    component: 'AssistantMessage',
    requestId: 'reply-3',
    surface: 'terminal',
    props: { text: 'Hello.', isFirstOfReply: true },
  })
  expect((await typed.find({ type: 'Text', text: /○/ }))?.text).toBe('○')
  await typed.unmount()

  const tool = await $.ui.mount({
    plugin: 'washi',
    component: 'ToolUse',
    requestId: 'call-1',
    surface: 'desktop',
    props: { tool_use_id: 'call-1', tool: 'Bash', input: { command: 'ls' }, isRunning: false, isErrored: false, isInterrupted: false },
  })
  expect((await tool.find({ type: 'Svg' }))?.props.width).toBe(14)
  expect((await tool.find({ type: 'Text', text: /row/ }))?.text).toBe("the app's row")
  await tool.unmount()
})

test('your own message shows when it was sent under it, the app\'s row kept, and nothing without a time on record', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>the app's row</Text>
  })
  on('clock.now', () => ({ value: new Date(2026, 10, 15, 20, 2).getTime() }))
  on('store.set', () => ({ value: undefined }))

  // Nothing sent yet: the row stands alone.
  const before = await $.ui.mount({ plugin: 'washi', component: 'UserMessage', requestId: 'u0', surface: 'desktop', props: { text: 'hi', origin: { kind: 'sdk' } } })
  expect(await before.find({ type: 'Text', text: /:/ })).toBe(undefined)
  await before.unmount()
})

test('the status line counts tool calls and errors, and says done at the turn\'s end', () => {
  const tally = { startedAt: 0, strokes: 12, errors: 1 }
  expect(workingLine(tally, 185_000)).toBe('working 3:05 · 12 tools · 1 error')
  expect(doneLine({ ...tally, errors: 0 }, 192_000)).toBe('done 3:12 · 12 tools')
  expect(doneLine({ startedAt: 0, strokes: 1, errors: 0 }, 40_000)).toBe('done 0:40 · 1 tool')
})

test('the band above the prompt stays empty until something has been used', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>app</Text>
  })

  const band = await $.ui.mount({ plugin: 'washi', component: 'AbovePrompt', requestId: 'band', surface: 'desktop', props: { hasSurvey: false, isCollapsed: false, isWorking: true, maxRows: 10 } })
  expect((await band.find({ type: 'Text' }))?.text).toBe('app')
  await band.unmount()
})

test('the files pane says so when nothing has changed yet', async $ => {
  const pane = await $.ui.mount({ plugin: 'washi', component: 'Pane', requestId: 'washi-files', surface: 'desktop', props: { title: 'Files', isFocused: false } })
  expect((await pane.find({ type: 'Text' }))?.text).toBe('No files changed yet.')
  await pane.unmount()
})

test('a quoted reply and a /washi command are matched to their send times', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>the app's row</Text>
  })
  on('clock.now', () => ({ value: new Date(2026, 10, 15, 20, 2).getTime() }))
  on('store.set', () => ({ value: undefined }))

  // A /washi command records its own time; its row then carries it.
  await $.command.run({ command: 'washi', args: 'help', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  const row = await $.ui.mount({ plugin: 'washi', component: 'UserMessage', requestId: 'c1', surface: 'desktop', props: { text: '/washi help', origin: { kind: 'sdk' } } })
  expect((await row.find({ type: 'Text', text: /^20:02$/ }))?.text).toBe('20:02')
  await row.unmount()
})
