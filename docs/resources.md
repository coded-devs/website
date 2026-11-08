# CodedDevs design resources

Owner: Product & Brand Designer. Engineers copy code from here; the designer adds new entries before they are used.

Related: [brand.md](brand.md) for brand rules, [design.md](design.md) for tokens and components (icon rules are in section 7).

## Icons

All icons are inline SVG with `currentColor`, so they take the text colour of their surface. Copy the markup as is. In React, the same markup works in JSX; `apps/web/src/components/icons.tsx` holds the components built from this list.

Usage rules, in short:

- Next to a visible label: `aria-hidden="true"` and `focusable="false"` on the `<svg>`.
- Icon only: put the accessible name on the link or button, for example `aria-label="CodedDevs on LinkedIn"`.
- Icon-only controls get a 44 by 44 px hit area.

### Icon index

| Name             | Use                               | Size  | Source                                                                  | Licence                                                                                 |
| ---------------- | --------------------------------- | ----- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `x`              | Footer social link to X           | 20 px | Simple Icons 13.21.0                                                    | CC0. X is a trademark of X Corp.                                                        |
| `linkedin`       | Footer social link to LinkedIn    | 20 px | Simple Icons 10.4.0 (removed from later versions at LinkedIn's request) | CC0 path. LinkedIn is a trademark of LinkedIn Corporation; follow its brand guidelines. |
| `github`         | Footer social link to GitHub      | 20 px | Simple Icons 13.21.0                                                    | CC0. GitHub is a trademark of GitHub, Inc.                                              |
| `arrow-up-right` | Marks a link that leaves the site | 12 px | Drawn for CodedDevs                                                     | Owned by CodedDevs                                                                      |

### x

```html
<svg
  viewBox="0 0 24 24"
  width="20"
  height="20"
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
  />
</svg>
```

### linkedin

```html
<svg
  viewBox="0 0 24 24"
  width="20"
  height="20"
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
  />
</svg>
```

### github

```html
<svg
  viewBox="0 0 24 24"
  width="20"
  height="20"
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
  />
</svg>
```

### arrow-up-right

A 1.5 px stroke at 12 px. Use it after the link text, with 4 px of space.

```html
<svg
  viewBox="0 0 12 12"
  width="12"
  height="12"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
</svg>
```

### arrow-right

Used inside the arrow circle on primary buttons. 16 by 16, 1.5 px stroke.

```html
<svg
  viewBox="0 0 16 16"
  width="16"
  height="16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M3 8h10M9 4l4 4-4 4" />
</svg>
```

### arrow-left

Used in the "All insights" back link on articles.

```html
<svg
  viewBox="0 0 16 16"
  width="16"
  height="16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M13 8H3M7 4L3 8l4 4" />
</svg>
```

### Hamburger

Not an icon file. Two 18 by 1.5 px CSS lines inside a 44 px Ink circle, 7 px apart, that rotate to 45 and minus 45 degrees to form an X when `aria-expanded="true"`. See `apps/web/src/components/site-navigation.module.css`.

## Photography

Placeholder imagery from Unsplash, free to use under the [Unsplash License](https://unsplash.com/license). No attribution is required, but credit is good practice. Replace with owned photography through the CMS before launch (design.md open decision 18). All URLs are `https://images.unsplash.com/photo-{id}`.

| Where                      | Unsplash photo id                                                                                                                                                                                                | Subject                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Focus area: Commerce       | `1777065851469-71aef898a26f`                                                                                                                                                                                     | Outdoor market under umbrellas         |
| Focus area: Finance        | `1681826291722-70bd7e9e6fc3`                                                                                                                                                                                     | Payment on a phone                     |
| Focus area: Health         | `1536064479547-7ee40b74b807`                                                                                                                                                                                     | Doctor with a young patient            |
| Focus area: AI             | `1739300293504-234817eead52`                                                                                                                                                                                     | Woman with a laptop                    |
| About: city                | `1744907895363-d351aa6019ef`                                                                                                                                                                                     | Aerial view of a coastal city          |
| Product: Merchant platform | `1687422808311-a776f467a468`                                                                                                                                                                                     | Shop owner behind a counter            |
| Product: Payments          | `1599050751795-6cdaafbc2319`                                                                                                                                                                                     | Contactless phone payment              |
| Product: Health access     | `1678695972687-033fa0bdbac9`                                                                                                                                                                                     | Doctor with a stethoscope              |
| Project: retail ordering   | `1585540083814-ea6ee8af9e4f`                                                                                                                                                                                     | Fresh produce stall                    |
| Project: clinic booking    | `1576091160399-112ba8d25d1d`                                                                                                                                                                                     | Doctor using a phone                   |
| Project: document search   | `1714327676544-48dafc3ffa41`                                                                                                                                                                                     |
| Team portraits             | `1573497491765-dccce02b29df`, `1614023342667-6f060e9d1e04`, `1593351799227-75df2026356b`, `1668752741330-8adc5cef7485`                                                                                           |
| Insights covers            | `1726056652582-7c9d202d4018`, `1785094165709-54fef69c2c4d`, `1573164573938-c9a3db2e84ff`, `1644043350898-2f4ff1e17912`, `1648023199223-25d3622bcb13`, `1655720348590-c739c860beed`, `1594538756542-8c88bda491c5` | Phones, markets, offices, city streets |

Hero collage, community strip, vision tile and service images: see the `unsplash()` calls in `apps/web/src/content/placeholder-home.ts`, which hold each photo id beside its alt text.

Photography direction: warm, natural light; real people at work, in markets, clinics and offices; African cities from above. Avoid screens full of code, glowing circuit art and staged stock smiles.

## Other resources

The designer adds further resources here (illustrations, photography sources, templates), each with its code or file path, source and licence.

| Resource          | Path or code                                                           | Source    | Licence                               |
| ----------------- | ---------------------------------------------------------------------- | --------- | ------------------------------------- |
| Logos and favicon | `apps/web/public/assets/logos/`                                        | CodedDevs | Owned by CodedDevs. Rules in brand.md |
| Design tokens     | `docs/prototypes/tokens.css`, implemented in `apps/web/app/tokens.css` | CodedDevs | Owned by CodedDevs                    |
