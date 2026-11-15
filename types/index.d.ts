export type WashiSettings = {
  /** Whether the theme is applied. */
  isOn: boolean
  /** Whether the line art is pressed into the sheet. */
  hasFigure: boolean
  /** The impression: 1 blind, 2 and 3 with graphite in the grooves. */
  ink: 1 | 2 | 3
  /** How rough the sheet's surface is: 1 fine, 3 coarse. */
  grain: 1 | 2 | 3
  /** The paper: cream washi, or plain white. */
  paper: 'washi' | 'white'
  /** How much of the sheet shows through the app's own panels: 1 most, 3 least. */
  glass: 1 | 2 | 3
  /** Whether the sheet answers the conversation: ink soaks in while a turn runs. */
  isAlive: boolean
  /** Whether replies, tool calls and your messages carry their marks. */
  hasMarks: boolean
  /** Whether the sheet's light follows the hour. */
  hasDaylight: boolean
}

export type FileTouch = {
  /** The file's full path. */
  path: string
  /** True when its first touch this session was a Write: a new file, as far as this session saw. */
  isNew: boolean
  /** How many times it was written or edited. */
  times: number
}

export type Usage = {
  /** Tokens this turn's model requests took, cache reads left out. */
  turn: number
  /** The same, summed over the session. */
  session: number
}

export type Sent = {
  /** The prompt's text, trimmed, as its row carries it. */
  text: string
  /** When it was sent, in epoch milliseconds. */
  at: number
}

export type WashiCard = {
  /** Whether the settings card is showing. */
  isOpen: boolean
  /** True where the window places no row in the transcript: the card goes above the prompt. */
  isInBand: boolean
}

export type WashiTurn = {
  /** True from a main turn's start to its end. */
  isWorking: boolean
  /** When the running turn began, in epoch milliseconds; 0 before any. */
  startedAt: number
  /** When the last turn ended, in epoch milliseconds; 0 before any. */
  endedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    washi: {
      settings: Shaped<WashiSettings>
      card: WashiCard
      hour: number
      files: Shaped<FileTouch[]>
      usage: Shaped<Usage>
      sent: Shaped<Sent[]>
    }
  }
}
