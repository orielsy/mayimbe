# Mayimbe

Mayimbe is the production platform behind AntonySantos.com: an interactive digital museum, cultural archive, and tribute to Antony Santos.

The project is organized around a **desk-first museum experience**. The desk is the primary interface; physical objects on it become authored experiences. The notebook is the first real object. A conventional web/archive UI remains available underneath for structured data, sources, direct navigation, accessibility, and search-friendly pages.

See:

- `docs/product-direction.md` for the active product hierarchy and repository boundaries.
- `docs/notebook-integration.md` for the Page Turner integration contract.

## Requirements

- Node.js 24+
- npm 11 (the repository currently records npm 11.17.0)

## Development

```bash
npm install
npm run dev
```

The first `npm install` should generate `package-lock.json`; commit that lockfile before production deployment so installs remain reproducible.

## Validation and builds

```bash
npm run archive:validate
npm test
npm run generate
```

`npm run generate` creates the static site in `.output/public`, suitable for static hosting.

## Current foundation

- Nuxt 4 application shell
- framework-independent archive and museum contracts
- YAML archive content pipeline
- generated archive index
- conventional archive/person/story routes
- persistent semantic museum navigation
- `/` as the canonical desk entry point
- a renderer-neutral notebook integration boundary under `app/components/notebook/`
- Playwright infrastructure ready for Page Turner regression coverage

The previous native/WebGL notebook has been removed from this active development line. Historical implementations remain available through Git history and notebook-specific branches.
