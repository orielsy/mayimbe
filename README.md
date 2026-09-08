# Mayimbe

Mayimbe is the production platform behind AntonySantos.com: an interactive digital museum, cultural archive, and tribute to Antony Santos.

## Product model

The primary interface is the **desk and the objects on it**. The notebook is the first real object; future objects may include a listening device/radio, photo album, records, and other memorabilia.

A conventional web application exists underneath that experience and owns the structured archive, semantic routes, sources, search-friendly pages, and accessibility fallback. Both interfaces consume the same content truth.

```text
Structured archive/content
        |\
        | \__ conventional UI (/archive, /people, /stories, ...)
        |
        \____ desk experience -> notebook / future objects
```

The desk is not a decorative homepage around a traditional site. It is the primary museum shell.

## Current direction

The previous WebGL notebook renderer has been retired from the active development line. Its history remains available in Git branches. The next notebook implementation will be extracted from the approved Lovable **Page Turner Lab** into `app/components/notebook/` and will remain independent from Lovable's application shell/router.

The current repository preparation intentionally keeps:

- Nuxt 4 application shell
- framework-independent archive and museum contracts
- YAML archive content pipeline and generated indexes
- semantic museum deep links
- conventional archive/person/story routes
- persistent museum navigation state
- Playwright/Vitest infrastructure

See `docs/product-direction.md` and `docs/notebook-integration.md` for the active architecture decisions.

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
