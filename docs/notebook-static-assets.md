# Notebook static assets

The shared Stage 1 specification is recorded in [Pocket Notebook Rebuild — Stage 1 Competition Brief](./notebook-stage-1-competition-brief.md).

Stage 1 of the CSS-first notebook rebuild separates the approved physical
materials from the notebook interaction engine. The visual review route is
`/labs/notebook-assets`.

## Boundary

- Canvas may be used by the offline baker.
- The committed outputs are ordinary WebP files.
- The asset-lab route uses CSS, images, and live DOM content only.
- Text, photographs, page numbers, and authored content are not flattened into
  page images.
- Cover opening, page turns, pagination, and other notebook behavior remain
  Stage 2 work.

## Generate the library

```sh
npm run bake:notebook:assets
```

The baker imports the current F3-03 cover and PaperV2 recipes, captures them at
840 × 1120, and writes the deterministic output to `public/notebook-assets/`.
It replaces that generated directory on every run.

## Manifest

`public/notebook-assets/manifest.json` is the runtime contract. Each asset has
a stable ID, label, path, group, dimensions, format, and opacity classification.
Each paper-history recipe names:

1. one base substrate;
2. one page-edge alpha mask;
3. an ordered collection of independent wear overlays.

The initial recipes are Carried / Handled, Humidity Affected, and Protected
Interior. They share assets intentionally. A future page recipe can choose a
different subset, order, opacity, position, or mirrored face without generating
a completed-page bitmap.

## Validation

`tests/visual/notebook-assets.spec.ts` runs in the desktop and mobile Playwright
projects. It checks the asset count, recipe switching, layer toggles, missing
images, horizontal overflow, runtime errors, and the absence of canvas/WebGL.
