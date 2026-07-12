# Vezvora

Marketing site for **Vezvora** — a premium software engineering studio. Built
with the Next.js App Router, TypeScript, and CSS Modules, driven by a shared
design-token system (deep-teal / lime brand, Plus Jakarta Sans + Inter).

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** (strict)
- **CSS Modules** + global design tokens (`src/app/globals.css`)
- **next/font** — self-hosted Plus Jakarta Sans & Inter
- **lucide-react** — icon set (no runtime icon font)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (flat config)
```

## Project structure

```
src/
├── app/                     # routes (App Router)
│   ├── layout.tsx           # root layout — Navbar + Footer wrap every page
│   ├── globals.css          # reset + design tokens + shared utilities
│   ├── icon.svg             # favicon
│   ├── page.tsx             # Home
│   ├── services/            # Services
│   ├── work/                # Work (client-side filtering + load more)
│   ├── pricing/             # Pricing
│   ├── about/               # About
│   └── contact/             # Contact (interactive form)
├── components/
│   ├── layout/              # Navbar, Footer, Logo (the shared "template")
│   ├── sections/            # reusable page sections (CtaSection …)
│   └── ui/                  # primitives: Button, Icon, IconBadge, Eyebrow, SectionHeading
├── content/                 # typed page copy/data (one source of truth per page)
└── lib/                     # site config (nav/footer), fonts, helpers
```

The navbar and footer live in the root layout, so the chrome is **identical on
every page** — pages only render their own content between them.

## Branding / logo

The full brand lockup lives at [`public/logo.png`](public/logo.png). The navbar
and footer use just the **"V" mark** — [`public/logo-mark.png`](public/logo-mark.png),
cropped from that lockup — beside the "VEZVORA" wordmark (kept as live text for
crisp rendering and accessibility). Both are wired through the single
[`Logo`](src/components/layout/Logo.tsx) component; swap either file (or point its
`src` elsewhere) to rebrand.

## Design tokens

Colours, radii, gradients, elevation, and typography are defined as CSS custom
properties in `src/app/globals.css` and consumed by every component. Adjust a
token once to re-theme the whole site.
```
