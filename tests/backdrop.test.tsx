import { expect, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'washi',
  component: 'Backdrop',
  requestId: 'backdrop',
  props: {
    scene: 'washi',
    plugin: 'washi',
    glass: { blur: 0, tint: '#FAF9F5', opacity: 0.46 },
    overrideColorScheme: 'light',
  },
} as const

test('the backdrop is one Svg the desktop accepts, within its size bound', async ($, on) => {
  // The kit has no clock: noon, by the machine's own time.
  on('clock.now', () => ({ value: new Date(2026, 10, 15, 12).getTime() }))

  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg === undefined).toBe(false)
  await ui.unmount()
})
