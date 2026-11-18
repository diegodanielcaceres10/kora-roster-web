# UI components

Reference for everything in `web/src/app/ui/`. **Check this list before creating a UI
element.** If a component here almost fits, extend it instead of copying its classes. Add
every new component to this file in the same patch: `catalog.spec.ts` fails when this file
and `index.ts` disagree.

## How to use them

- Import from the barrel: `import { UiButton, UiCard } from '../ui'`. They are standalone,
  `OnPush`, and use the `ui-` selector prefix.
- No text lives inside a component. Pass labels as content or inputs; the texts themselves
  belong in `web/src/app/i18n/`.
- Colors are Tailwind utilities backed by the tokens in `styles.css`.
  - Brand colors never change with the mode: `primary` is amber `#ffb627` (text on it is
    `secondary`; white on amber fails contrast), `secondary` is navy `#1b2a41` and
    `alternative` is green `#0b8457` (white text on it passes).
  - Everything else follows the mode: `bg-canvas` (the page), `bg-surface` (cards, fields),
    `bg-surface-muted` (rows, trays), `border-line`, `text-ink`, `text-ink-muted`,
    `text-ink-faint`. For a tint of any of them use an opacity (`bg-ink/5`).
  - Never use `bg-white`, `text-secondary` or `border-secondary` in a shared component: they
    stay light in dark mode. `tokens.spec.ts` fails when one slips in.
  - The danger red comes from Tailwind's palette, with its own `dark:` shades.
- Dark mode is the `dark` class on `<html>`, set by `Theme` (`theme/theme.ts`). Use `dark:`
  only for colors that have no token, such as the danger red.
- Labels and tags use `font-mono`, titles `font-display`, the rest the default sans (Inter).
- Icons are `UiIcon` (see below): `<ui-icon name="pencil" />`. They are inline SVG, so there is
  no font and no CDN, and they take the size and the color of the text around them.
- Touch targets are at least 44 px and every control shows a `focus-visible` outline.

## Components

### `UiButton` · `<ui-button>`

Any action the person triggers. Wraps a native `<button>`.

- `variant`: `primary` (default), `secondary`, `outline`, `ghost`
- `size`: `md` (default, 44 px), `lg` (52 px)
- `type`: `button` (default) or `submit`; `disabled`; `ariaLabel`
- Content: text and icons. `(click)` works on the `<ui-button>` itself.

```html
<ui-button size="lg" [disabled]="!ready()" (click)="go()">
  <ui-icon name="arrows-shuffle" />
  {{ t().draw }}
</ui-button>
```

### `UiIcon` · `<ui-icon>`

An inline SVG icon. It is decorative (`aria-hidden`), so put the meaning in the label of the
button or the text next to it.

- `name` (required): one of the names below. A wrong name does not compile.
- Size: it is `1em`, so change it with a text-size class on the element (`class="text-xl"`).
  Color: it is `currentColor`, so use a text color class (`class="text-primary"`).
- To add an icon, copy its markup from [Tabler Icons](https://tabler.io/icons) (MIT, outline set)
  into `icon/icons.ts` in alphabetical order, and add its name to the list here.

Names: `adjustments-horizontal`, `alert-circle`, `arrow-back-up`, `arrow-left`, `arrow-right`, `arrows-shuffle`, `ball-football`, `bolt`, `book`, `camera`, `check`, `chevron-right`, `circle-check`, `clipboard`, `clipboard-check`, `copy`, `crown`, `device-mobile`, `download`, `flame`, `glove`, `grip-vertical`, `id`, `info-circle`, `lock`, `logout`, `message`, `moon`, `pencil`, `photo`, `plus`, `refresh`, `share`, `shield`, `skull`, `star`, `sun`, `trash`, `user`, `user-minus`, `user-plus`, `users`, `world`, `x`.

`glove` is drawn for this project (it stands for the goalkeeper); the rest come from Tabler.

```html
<ui-icon name="lock" class="text-xs" />
```

### `UiIconButton` · `<ui-icon-button>`

A 44 × 44 px button with only an icon.

- `label` (required): the accessible name, since there is no visible text
- `variant`: `default` or `danger`
- `pressed`: leave it out for a plain action; give `true` or `false` to make it a toggle
  (it then exposes `aria-pressed` and turns amber when on)
- `expanded`: for a button that opens something (a menu); give `true` or `false` and it exposes
  `aria-expanded`
- `disabled`
- `focus()`: moves the focus to the button, for example when a menu closes

```html
<ui-icon-button [label]="t().remove(name)" variant="danger" (click)="remove()">
  <ui-icon name="x" />
</ui-icon-button>
```

### `UiIconLink` · `<ui-icon-link>`

A link that looks exactly like `UiIconButton`. It renders a real `<a>`, so it opens in a new tab
and is read as a link.

- `link` (required): where it goes, the same as `routerLink` (a path or the list of its parts)
- `label` (required): the accessible name, because the content is only an icon
- `variant`: `default` or `primary` (amber tint, for the one link that should stand out)

```html
<ui-icon-link [link]="['/', lang, 'account']" [label]="t().account.title">
  <ui-icon name="user" />
</ui-icon-link>
```

### `UiTextarea` · `<ui-textarea>`

A labelled multi-line field.

- `label` (required), `placeholder`, `rows` (default 6), `hint` (linked with `aria-describedby`)
- Two-way value: `[(value)]`, or `[value]` with `(valueChange)`

### `UiInput` · `<ui-input>`

A labelled single-line field, for text or for a color.

- `label` (required); `labelHidden` keeps it for screen readers but does not show it
- `type`: `text` (default) or `color` (a native color picker whose value is `#rrggbb`)
- `maxLength`, `placeholder`, `hint` (linked with `aria-describedby`)
- Two-way value: `[(value)]`
- Call `focus()` and `select()` from outside through a `viewChild`

```html
<ui-input [label]="t().header" [maxLength]="200" [(value)]="header" />
```

### `UiSelect` · `<ui-select>`

A labelled native drop-down list.

- `label` (required); `options` (required): `{ value, label }[]`
- Two-way value: `[(value)]`; the value is always a string, so use `''` for "none"

### `UiCard` · `<ui-card>`

A bordered surface. Its `card-header` sits on a muted band with a line below it.

- `accent`: `primary`, `secondary` or `alternative` (a 4 px bar on top); none by default
- Slots: `card-header` (optional) and the default content

```html
<ui-card accent="alternative">
  <h3 card-header>{{ title }}</h3>
  <p>{{ text }}</p>
</ui-card>
```

### `UiBadge` · `<ui-badge>`

A small label.

- `tone`: `neutral` (default), `primary`, `alternative`, `danger`

### `UiListRow` · `<ui-list-row>`

One row of a list, with room for a number, content and actions.

- `highlight`: marks the row (amber background and left border)
- Slots: `row-start`, the default content, and `row-end` (each `row-end` child is a separate action)
- It has `role="listitem"`, so wrap the rows in an element with `role="list"`

### `UiSegmented` · `<ui-segmented>`

A radio group shown as segments, for choosing one of a few options (the language selector uses it).

- `options` (required): `{ value, label }[]`; `label` (required): the group's accessible name
- Two-way value: `[(value)]`
- Arrow keys move and select, with wrap-around; Home and End jump; only the selected option is
  reachable with Tab
- An option can be locked: `locked: 'sign-in' | 'premium'`, plus an optional `lockedLabel` such as
  "Premium". It shows a lock, reads as `aria-disabled`, never becomes the value, and touching it
  emits `(lockedSelect)` with the option so the screen can explain why (see `LockNotice`). The
  arrow keys still reach it without selecting it.

### `ToastService` and `UiToastHost` · `<ui-toast-host>`

A short message at the bottom of the screen.

- `UiToastHost` goes once in `app.html`; it is already there.
- `toast.show(text, durationMs = 2500)` from anywhere; a new message replaces the old one and
  restarts the timer. `toast.dismiss()` hides it at once.

## Known gaps

Do these by extending the catalog, not by copying:

- A link that looks like a button: the landing call to action is an `<a>` with button classes
  (`pages/landing/landing.ts`). If a second one is needed, add a link mode to `UiButton`.
- Not built yet: modal, tabs, color picker.

## Other reusable pieces

Not components, but just as easy to duplicate by accident:

- `plans/`: `Entitlements` is the one place that knows what each plan can do (`plan()`,
  `maxTeams()`, `teamsLock(count)`, `storyImageLock()`; a lock is `'sign-in'`, `'premium'` or
  `null`). Never compare plans in a screen. `LockNotice` shows why a locked control is closed,
  with a link to sign in when an account is what is missing.
- `core/story-layout.ts`, `core/contrast.ts` and `image/`: the story image. `layoutStory` works out
  where everything goes on a 1080 by 1920 page (pure, it needs no browser, and the text measure is
  given to it); `readableTextColor` gives white or near black for a background; `createStoryBlob`
  draws the layout on a canvas and gives back a PNG (`drawStory` and `canvasMeasure` are its parts).
  `STORY_BLOB` and `STORY_DELIVERY` (download and share) are tokens, so a screen or a test can replace
  how the image is made and how it leaves the app. The story has no team icons: the color of the
  block says which team it is.
- `core/`: `parsePastedNames` (cleans a pasted list), `drawTeams` and `checkPlayerCount`
  (2 to 4 teams in use, 5 to 11 players on each, all the same size; `playerRange(teams)` gives the
  limits), `formatTeamsForWhatsApp` and `DEFAULT_TEAM_ICONS`.
- `i18n/`: the `I18n` service (`lang()`, `t()`), the dictionaries (`en.ts` defines the type,
  `es.ts` and `pt.ts` must match), `PageMeta` (title, description, canonical and hreflang),
  `SITE_URL`, `LanguageMenu` (the globe button in the header) and `switchLanguageUrl`.
- `theme/`: `Theme` (`mode()`, `set()`, `toggle()`; saves the choice and puts the `dark` class on
  `<html>`) and `ThemeToggle`, the moon and sun button of the header.
- `auth/`: `Auth` (`user()`, `enabled`, `renderButton`, `signOut`) knows who signed in with
  Google; `GOOGLE_CLIENT_ID` turns sign in on (empty means off); `UserAvatar` shows a person's
  photo or initial; `browserStorage` reads the page storage safely. Talk to Google only through
  `Auth`, never directly.
- `environments/` (next to `app/`): the settings that change per environment, `googleClientId` and
  `siteUrl`, in `environment.ts` (production) and `environment.development.ts` (local). They
  are public values, never secrets. `provideEnvironment` hands them to the app.
- `preferences/`: `PreferencesService` (`active()` for the person who is signed in, `save()`),
  `sanitizePreferences` and `DEFAULT_PREFERENCES`. They hold the number of teams in use and an
  icon and a color for each of the six possible teams. The quick match reads them through
  `FriendlyStore` (`teamIcons`, `whatsappText`, `sizeMismatch`): use those instead of asking the
  service again.
- `state/`: `FriendlyStore`, the NgRx Signals store of the quick match flow. `teamCount()` is the number of teams in use, never above what the plan allows; change it with `setTeamCount()`. `swapPlayers(idA, idB)` swaps two players of different teams.
- `layout/shell.ts`: the header (logo, account link or photo, language selector) and footer
  shared by every language route.
