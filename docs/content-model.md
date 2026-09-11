# Content Model

**Status:** active

Mayimbe keeps authored cultural/archive truth separate from presentation. The immersive museum and the conventional archive should consume the same source material rather than maintain parallel copies.

## Current authored content

- `content/people/*.yaml` — people
- `content/sources/*.yaml` — provenance/source records
- `content/stories/*.md` — stories with YAML frontmatter and Markdown body

`scripts/content-utils.ts` validates those records and `scripts/build-archive.ts` generates the archive index consumed by the Nuxt app.

There is no separate experience-index layer. A museum deep link should be represented directly by the route that actually exists.

## Archive entities

The active archive model lives in `core/archive/`.

Stories currently have:

- stable `id` and `slug`
- `draft` or `published` status
- localized `title`
- optional localized `summary`
- one declared body `language`
- one Markdown `body`
- optional entity references and source references

Sources remain first-class records so provenance can be shown independently from presentation copy.

## Localization constraint

The current story body model is transitional: `title` and `summary` can contain both Spanish and English, while `body` is a single string with one `language` value.

That is not sufficient for the intended long-term model where a Spanish-first story may also have a distinct English adaptation. Do **not** duplicate stories or invent a second content pipeline to work around this.

Before substantial bilingual archive content is authored, redesign the story body shape so Spanish and English bodies can coexist under one story identity while sharing references, provenance, dates, and other metadata.

That redesign belongs to the content phase, not to the notebook renderer or museum navigation runtime.

## Principles

1. One cultural fact/story identity, not one record per presentation.
2. Provenance is structured and reusable.
3. Routes point to real implemented experiences; no speculative registry is required.
4. The notebook may present content differently from the archive without becoming a second source of truth.
5. Schema complexity should be earned by real authored content.
