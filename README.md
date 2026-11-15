# Washi

A paper theme for the Claude desktop app: the whole window becomes one sheet of handmade paper, bound like a Japanese book.

The sheet has a lit tooth, laid lines and long fibers, with torn edges on the right and at the foot. Down the left edge it is sewn in the hemp-leaf binding (asa-no-ha toji), with a cloth corner at the foot of the spine. A line drawing is pressed blind into the lower right, fading out from the eyes. There are no words on the sheet and nothing placed on it.

Light appearance only.

## Install

In a Claude Code terminal session:

```
/plugin install washi --marketplace oliside317-web/washi-theme
```

Answer `y` to `Add marketplace?`, then press Enter to pick a scope.

Or from a shell:

```bash
claude plugin install washi --marketplace oliside317-web/washi-theme
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `oliside317-web/washi-theme`, then Add plugin.

Quit the desktop app fully and open it again; the theme appears once you send a message.

## Use

Type the commands in the chat's prompt box:

| Command | What it does |
| --- | --- |
| `/washi` | Open the settings card |
| `/washi on` / `off` / `toggle` | Turn the theme on or off |
| `/washi figure on` / `off` | Show or hide the pressed line drawing |
| `/washi ink 1` / `2` / `3` | The impression: 1 blind, 2 light, 3 dark |
| `/washi grain 1` / `2` / `3` | Paper grain: 1 fine, 2 medium, 3 coarse |
| `/washi paper washi` / `white` | Paper: cream washi or plain white; everything on the sheet follows |
| `/washi glass 1` / `2` / `3` | How much paper shows through the app's panels: 1 clear, 3 solid |
| `/washi marks on` / `off` | Marks on replies, tool calls and your messages |
| `/washi daylight on` / `off` | Window light that follows the hour, and a seasonal touch |
| `/washi files` or `/files` | Open the files pane |
| `/washi reset` | Restore the defaults |
| `/washi status` | Current settings and diagnostics |
| `/washi help` | List the commands |

Settings are kept for later sessions.

### In a new conversation

Before a new conversation's first message, the app has not started its session yet: the theme is not drawn, and the command menu lists only `/washi:washi` (the same command as `/washi`). After the first message the theme appears and `/washi` works.

## Paper

`Washi` is cream handmade paper; `White` is plain light paper. Switching changes the whole recipe: fibers, grain, the impression, the binding's shadow, the corner cloth, the window light, the panels and the seasonal touch. On white paper the window's light is shown by shading the rest of the room a little.

## Marks

Colors follow who did what:

- Clay orange is Claude: a small circle opens each reply.
- Green is a tool call that went through: a dot beside its row.
- Terracotta is a tool call that failed: a cross beside its row.
- Above each of your own messages, at the right, its send time in small faint type, such as `20:15`. Only messages sent after this version loaded have one.

The rows themselves are still drawn by the app.

## Daylight

With daylight on, the light of a shoji window falls across the sheet, the lattice and a branch outside casting their shadows through it. It moves with the hour: cool and coming in from the right in the morning, short and high at midday, sliding left and warming through the afternoon, gold at dusk. At night there is no window, only lamplight, bright in the middle and dark at the corners. It moves once an hour, when you send a message.

By the binding the season leaves something lying on the sheet: maple leaves in autumn, petals in spring.

## Usage, files and status

- Above the prompt, in faint type: `this turn 38k tokens · session 412k`, what this turn and the whole conversation used (cache reads not counted).
- The first time Claude creates or edits a file, a files pane opens on the right: new files in orange, edited ones in green with a count. Once closed it does not open again by itself; `/files` opens it.
- While Claude works, the status bar shows the turn: `working 3:05 · 12 tools · 1 error` (the error count only when there is one). When it ends: `done 3:12 · 12 tools`, kept until your next message.

## What it needs

A version of the Claude desktop app that draws mod backdrops. If the theme does not appear, quit the app fully and open it again (updates take effect after a restart), then type `/washi status`: it says whether a window draws the backdrop.

## What it changes, and what it does not

- Changes: the whole backdrop behind the chat, and the tint of the app's own panels (following the paper).
- Changes: the marks beside replies, tool calls and your messages; the line above the prompt; the status bar; the files pane.
- Does not change: text colors, button colors, code highlighting, or the wording of the line shown while Claude works. The mod interface cannot change them.
- What it reads: the text of your own messages, only to match each one to its send time; token counts and the paths of files Claude writes or edits. These stay in the session. It sends nothing over the network, and stores only its settings across sessions.

## Files

- `commands/washi.md`: lists the command in a new conversation's menu.
- `hooks/register.tsx`: commands, the settings card, saving settings, setting the theme, the marks, the usage line, the files pane, send times.
- `hooks/backdrop.ts`: everything drawn on the sheet; the composition is described at the top of the file.
- `hooks/marks.ts`: the circle, dot and cross.
- `hooks/ink.ts`: brush strokes drawn as paths: pressure, landing and lifting, and dry-brush streaks, with no filters.
- `hooks/brushwork.ts`: the status bar line.
- `hooks/figure.ts`: the line drawing as vector data, traced from an image; do not edit by hand.
- `types/index.d.ts`: the types of the settings and state.
- `tests/`: run with `claude plugin test <this folder>`.

## About the line drawing

The line drawing in `hooks/figure.ts` was traced from an image supplied by the author, who holds the right to distribute it. If you fork this theme and swap in your own drawing, make sure you have the right to share it.
