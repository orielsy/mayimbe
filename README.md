# Mayimbe

Mayimbe is the production platform behind AntonySantos.com: an interactive digital museum, cultural archive, and tribute to Antony Santos.

The architectural foundation lives in `docs/`. The implementation is intentionally beginning with a small Nuxt shell that proves the archive, museum runtime, navigation, and static-generation boundaries before the real notebook is integrated.

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

## Current bootstrap scope

- Nuxt 4 application shell
- framework-independent archive and museum contracts
- YAML archive content pipeline
- generated archive index
- one real minimal archive entity (`person:antony-santos`)
- conventional archive page
- persistent client-side museum runtime state
- semantic museum deep links
- placeholder Notebook, Listening, Album, and Photo exhibits
- GitHub Actions verification for archive validation, tests, and static generation

The existing notebook prototype has **not** been migrated. The production notebook will be integrated only after these boundaries are proven.
