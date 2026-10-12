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
- Colors are Tailwind utilities backed by the tokens in `styles.css`: `bg-primary`,
  `text-secondary`, `border-alternative`, and so on.
  - `primary` is amber `#ffb627`. Text on it is `secondary`; white on amber fails contrast.
  - `secondary` is navy `#1b2a41`.
  - `alternative` is green `#0b8457`. White text on it passes.
  - Neutrals and the danger red come from Tailwind's default palette.
- Icons are Font Awesome Free, solid only, loaded from the CDN in `index.html`:
  `<i class="fa-solid fa-pencil" aria-hidden="true"></i>`. Check the icon exists in the free set
  first (there is no goalkeeper glove, so `fa-mitten` stands in for it).
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
  <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
  {{ t().draw }}
</ui-button>
```

### `UiIconButton` · `<ui-icon-button>`

A 44 × 44 px button with only an icon.

- `label` (required): the accessible name, since there is no visible text
- `variant`: `default` or `danger`
- `pressed`: leave it out for a plain action; give `true` or `false` to make it a toggle
  (it then exposes `aria-pressed` and turns amber when on)
- `disabled`

```html
<ui-icon-button [label]="t().remove(name)" variant="danger" (click)="remove()">
  <i class="fa-solid fa-xmark" aria-hidden="true"></i>
</ui-icon-button>
```

### `UiTextarea` · `<ui-textarea>`

A labelled multi-line field.

- `label` (required), `placeholder`, `rows` (default 6), `hint` (linked with `aria-describedby`)
- Two-way value: `[(value)]`, or `[value]` with `(valueChange)`

### `UiCard` · `<ui-card>`

A bordered surface.

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

### `ToastService` and `UiToastHost` · `<ui-toast-host>`

A short message at the bottom of the screen.

- `UiToastHost` goes once in `app.html`; it is already there.
- `toast.show(text, durationMs = 2500)` from anywhere; a new message replaces the old one and
  restarts the timer. `toast.dismiss()` hides it at once.

## Known gaps

Do these by extending the catalog, not by copying:

- A link that looks like a button: the landing call to action is an `<a>` with button classes
  (`pages/landing/landing.ts`). If a second one is needed, add a link mode to `UiButton`.
- A single-line text field: the name editor in `pages/tool/preview-step.ts` uses a styled
  `<input>`. Extract a component when a second one appears.
- Not built yet: modal, tabs, color picker, dark mode.

## Other reusable pieces

Not components, but just as easy to duplicate by accident:

- `core/`: `parsePastedNames` (cleans a pasted list), `drawTeams` and `checkPlayerCount`
  (2 teams, 10 to 22 players, even), `formatTeamsForWhatsApp` and `DEFAULT_TEAM_ICONS`.
- `i18n/`: the `I18n` service (`lang()`, `t()`), the dictionaries (`en.ts` defines the type,
  `es.ts` and `pt.ts` must match), `PageMeta` (title, description, canonical and hreflang),
  `SITE_URL`, `LanguageSelector` and `switchLanguageUrl`.
- `state/`: `AmistosoStore`, the NgRx Signals store of the quick match flow.
- `layout/shell.ts`: the header, language selector and footer shared by every language route.
