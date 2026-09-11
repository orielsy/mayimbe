# Mayimbe

Mayimbe is the production platform behind AntonySantos.com: an interactive digital museum, cultural archive, and tribute to Antony Santos.

## Product model

The primary interface is the **desk and the objects on it**. The notebook is the first real object; future objects may include a listening device/radio, photo album, records, and other memorabilia.

A conventional archive exists alongside that experience and owns structured research pages, provenance, SEO-friendly content, and fallback navigation. Both presentations should consume the same content truth.

```text
Structured content
        |\
        | \__ conventional archive (/archive/...)
        |
        \____ desk experience -> notebook / future objects
```

The desk is not a decorative homepage around a traditional site. It is the primary museum shell.

## Current architecture

The current Vue/Nuxt notebook is the production foundation. The active application intentionally keeps:

- Nuxt 4 application shell
- explicit Spanish and English museum routes
- route-driven desk/notebook state
- the notebook physical renderer and state machine
- deterministic notebook wear/material logic
- structured archive content with provenance
- Playwright/Vitest infrastructure

The active runtime intentionally does **not** keep a generic museum registry, exhibit lifecycle system, parallel museum navigation state, or generated experience-index layer.

See `docs/product-direction.md` and `docs/content-model.md` for the current architecture and content decisions.

## Requirements

- Node.js 24+
- npm 11

## Development

```bash
npm install
npm run dev
```

## Validation and builds

```bash
npm run archive:validate
npm test
npm run generate
npm run test:visual
```

`npm run generate` creates the static site in `.output/public`.
