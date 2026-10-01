# theme-sync — one light/dark choice shared by main, history and power

**These files are already installed in the project folder.** Open
`main.html` in the project folder (the one next to `css/` and `photo/`) and it
works. This folder is only a reference copy plus a backup.

> Do **not** open the pages inside this `theme-sync` folder. There is no `css/`
> or `photo/` folder next to them here, so the stylesheets 404 and the page
> renders as bare unstyled HTML. That is what went wrong the first time — the
> code was fine, it was just sitting in the wrong folder.

## What is where

```
projectt/
  main.html  history.html  power.html      <- live pages, theme.js added to <head>
  main.js    history.js    power.js        <- live scripts, theme code rewired
  main2.js                                 <- updated too (no page loads it today)
  theme.js                                 <- NEW, the shared theme state
  css/  photo/                             <- untouched

  theme-sync/
    README.md                              <- this file
    original-pages/                        <- the seven files exactly as they were
    (copies of the eight installed files)
```

To undo everything, copy the seven files from `theme-sync/original-pages/` back
over the ones in the project folder and delete `theme.js`.

## Why the theme did not stick before

Each page decided its own theme on load and had no idea what the others were
doing:

- `main.js` ended its startup with `setTheme('dark')`
- `history.js` did the same
- `power.js` had no theme function at all — it just trusted the
  `class="dark"` sitting in the markup and flipped the class in place

So the choice lived only in that one page's DOM. Navigating threw it away.

## What changed

`theme.js` holds the theme in `localStorage` — the one place every page in the
browser can read. Each page keeps its own buttons and its own class names; all
it lost was the job of deciding the theme itself.

| File | Change |
|---|---|
| `theme.js` | New. Reads and writes the saved choice, puts the `dark` class on `<html>`, notifies pages when it changes. |
| `main.html`, `history.html`, `power.html` | One `<script src="./theme.js">` added in `<head>`, above the stylesheet. |
| `main.js` | `setTheme()` delegates to `Theme.set()` and only paints the two pills. `setTheme('dark')` removed from startup. |
| `history.js` | Same, with its own `is-light-active` / `is-dark-active` class names kept as they were. |
| `power.js` | The inline class-flipping in the click handler became `Theme.toggle()`; the icon is set from the saved theme instead of guessed from the current class. |
| `main2.js` | Updated the same way as `main.js`. No page loads this file today, but leaving it behind would have made it a trap later. |

One unrelated fix went in at the same time: `main.html` pointed its logo at
`./website/photo/freezy.svg`, a folder that does not exist, so the logo was a
broken image. It now points at `./photo/freezy.svg`, which is what `login.html`
already used. Revert that one line if it was deliberate.

`setTheme('light')` and `setTheme('dark')` are still global functions taking the
same argument, because `main.html` and `history.html` call them from `onclick`
attributes in the markup. Those attributes did not have to change.

## Two details worth knowing

**Why the script tag is in `<head>` and not at the bottom with the others.**
The page scripts load after the browser has already painted. If the theme were
applied from there, a saved light theme would show a dark flash first. Running
in `<head>`, above the stylesheet, means the class is correct before anything
is drawn. The `class="dark"` in the markup is left in place as the
no-JavaScript fallback.

**First visit opens dark**, exactly as every page did before. It deliberately
does *not* follow the computer's own light/dark setting — that would change how
the app looks on a machine that has never been asked, which is not what this
change was for. From the first click onwards, the saved choice wins.

Two tabs open at once stay in step as well: `theme.js` listens for the
browser's `storage` event, so changing the theme in one repaints the other.

If `localStorage` is unavailable — Safari private browsing, some `file://`
sandboxes — every access is wrapped in `try`/`catch`, so the toggle still works
within the page; it just cannot remember across pages.

## How it was checked

A headless harness runs all four scripts against a stub DOM with a shared
`localStorage`, simulating real navigation (theme.js in `<head>`, page script at
the end of `<body>`, then `DOMContentLoaded`). 64 checks against the installed
files, all passing:

- light and dark each survive a full `main → history → power → main → history` loop
- a first visit opens dark even on a machine set to light
- the correct class is on `<html>` *before* first paint on every page
- each page's own active-class names and the power icon (`light_mode` /
  `dark_mode`) track the saved theme
- a second tab follows a change made in the first, and ignores unrelated
  storage keys
- a corrupt stored value, a bad argument to `setTheme`, and a `localStorage`
  that throws all degrade to working-but-not-remembered rather than breaking
- if `theme.js` goes missing, every page still loads and behaves exactly as it
  did before, with a warning in the console
- the untouched parts still run: the sensor readings, the mode banner, the
  15-row activity table and its counters, and `toggleMenu` on all three pages

Separately, every local `src` and `href` in the four pages was resolved against
the project folder — all present — and the light-mode token block in each of
the three stylesheets was confirmed to override the background, text, card and
border colours, so neither theme renders unstyled.
