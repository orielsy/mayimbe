# Mayimbe Content Storage Strategy

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Decision

Mayimbe will begin with a **Git-first, file-first content architecture**.

The source repository will hold canonical archive metadata, editorial stories, source records, curatorial experience mappings, validation schemas, and research notes.

Large binary media assets should remain separate from the repository and be served from suitable object storage/CDN infrastructure when needed.

A database or CMS is not required for the initial archive.

The storage model must remain framework-independent.

---

## 2. Why File-First

At Mayimbe's current stage, Git-backed content provides:

```text
version history
reviewable changes
portable source material
simple backups
low infrastructure complexity
auditable research edits
framework independence
```

Historical information often changes as better evidence is found. Git history is useful because it preserves how the archive evolved.

The archive should not depend on a CMS, database vendor, or frontend framework in order to remain readable and portable.

---

## 3. Proposed Repository Layout

A likely initial structure is:

```text
mayimbe/
├── content/
│   ├── people/
│   ├── places/
│   ├── songs/
│   ├── recordings/
│   ├── releases/
│   ├── editions/
│   ├── media/
│   ├── sources/
│   ├── stories/
│   ├── collections/
│   └── experiences/
│
├── research/
│   ├── leads/
│   ├── unresolved/
│   ├── source-notes/
│   └── identifications/
│
├── schemas/
│   └── ...
│
├── docs/
│   └── ...
│
└── src/
```

The exact entity folders may evolve as the archive model matures.

---

## 4. YAML for Structured Archive Records

Most structured archive records should be authored in YAML because it is readable by humans while preserving explicit structure.

Example:

```yaml
id: release:voy-palla
slug: voy-palla

title: "Voy Pa'llá"

type: album

releaseDate:
  kind: year
  value: 1991

summary:
  es: >
    ...
  en: >
    ...

sources:
  - source:original-cassette-001
  - source:interview-example
```

Unknown historical fields should usually be omitted rather than filled with placeholder values.

The archive model is **maximum capable, minimum required**.

A record must not fail validation merely because personnel, exact dates, studios, photographers, or other historical details are unknown.

---

## 5. Markdown for Narrative Stories

Narrative editorial material should be stored separately from structured metadata.

Stories may use Markdown with structured frontmatter.

Example:

```markdown
---
id: story:early-years
slug: early-years

title:
  en: Early Years
  es: Los primeros años

references:
  - person:antony-santos
  - place:las-matas-de-santa-cruz

sources:
  - source:interview-1998
---

Narrative content begins here.
```

The intended split is:

```text
YAML
→ structured archive knowledge

Markdown
→ authored historical narrative
```

MDX or framework-specific embedded components should not be introduced unless an actual authoring requirement justifies them.

Historical writing should not become coupled to React, Vue, or another presentation framework.

---

## 6. JSON Is Primarily Generated

Humans should not maintain large canonical JSON datasets unless there is a specific reason.

Build tooling may generate machine-oriented artifacts such as:

```text
generated/archive.json
generated/graph.json
generated/search-index.json
generated/routes.json
```

These files are derived outputs.

The YAML and Markdown source files remain canonical.

---

## 7. Stable Typed IDs

Every canonical entity should have a stable ID independent of its display name and route slug.

Examples:

```text
person:antony-santos
song:example
recording:example
release:example
media:photo-0001
source:interview-1998
story:early-years
```

The core rule is:

```text
id
= permanent identity

slug
= web presentation
```

An ID should not change merely because spelling, naming, or URL presentation changes.

Human-readable typed IDs are preferred when practical because references remain understandable in raw source files.

---

## 8. Relationships Should Be Easy to Author

The logical archive is graph-shaped, but authoring should not require maintaining a separate file for every graph edge.

Simple relationships can live directly on the entity.

Example:

```yaml
id: recording:example

song: song:example

appearsOn:
  - edition:example-cassette

sources:
  - source:liner-notes-example
```

Relationships containing meaningful metadata can be expressed as richer records.

Example:

```yaml
credits:
  - person: person:someone
    role: performer
    instrument: instrument:requinto
    certainty: verified
    sources:
      - source:liner-notes-example
```

Build tooling may normalize these records into graph edges and reverse relationships.

The archive may be logically graph-shaped without making the authoring experience graph-database-like.

---

## 9. Sources Are Reusable Entities

Sources should be canonical records rather than repeated bibliography blobs.

Example:

```yaml
id: source:antony-interview-1998

type: interview

title: "..."

interviewee:
  - person:antony-santos

publication: "..."

date:
  kind: year
  value: 1998

url: "..."
accessedAt: "2026-08-29"
```

Other records can reference the source by ID:

```yaml
sources:
  - source:antony-interview-1998
```

One source may support many entities, relationships, stories, and claims.

---

## 10. Media Metadata and Binary Assets Are Separate

Mayimbe should distinguish archival media identity from technical media files.

A media record may live in Git:

```yaml
id: media:photo-0001
type: photograph

caption:
  es: "..."
  en: "..."

depicts:
  - person:antony-santos

date:
  kind: circa
  value: 1993

sources:
  - source:collection-example

rights:
  status: research-needed

assets:
  original: media://photo-0001/original
  web: media://photo-0001/web
```

The actual high-resolution scan or large audio/video file should not automatically be stored in Git.

Potential future binary storage may include object storage/CDN services such as S3-compatible storage, Cloudflare R2, Backblaze, or another suitable provider.

The exact provider is not selected by this document.

Mayimbe should prefer stable logical media references over hardcoded CDN hostnames in archive records.

---

## 11. Media Resolution Layer

Symbolic asset references such as:

```text
media://photo-0001/web
```

may later resolve to actual deployed URLs through a media resolver.

This keeps historical metadata independent from the storage provider.

Changing CDN or image processing infrastructure should not require rewriting archive truth.

---

## 12. Experience Mappings Remain Separate

Historical archive truth and Mayimbe's curatorial presentation should remain separate.

A story might exist as:

```text
content/stories/early-years.md
```

while its museum presentation is described independently:

```yaml
id: experience:notebook-early-years

subject: story:early-years

primary:
  exhibit: notebook
  target: early-years

label:
  en: "Read in the Cuaderno"
  es: "Leer en el Cuaderno"
```

This allows the museum experiences to evolve without rewriting historical content.

The archive records what is known.

The experience mapping records how Mayimbe wants visitors to encounter it.

---

## 13. Validation

All canonical content should pass schema validation before publication.

TypeScript-based validation is appropriate even before the production framework is chosen.

A validation library such as Zod may be used, but the specific library is not yet a binding architectural decision.

Validation should catch genuine structural problems such as:

```text
duplicate IDs
broken references
invalid entity types
malformed temporal values
missing genuinely required identity fields
references to nonexistent sources
invalid experience destinations
```

Validation should **not** reject historically incomplete records simply because optional information cannot be recovered.

Examples of valid absence include:

```text
unknown studio personnel
unknown exact recording date
unknown photographer
unknown venue
unknown instrument credits
```

Data integrity and historical completeness are different concerns.

---

## 14. Global Reference Validation

Build tooling should verify that entity references resolve.

For example:

```yaml
song: song:mi-cancion
```

must reference a known Song record.

Likewise:

```yaml
sources:
  - source:foo
```

must reference a known Source record.

This provides referential integrity while preserving a file-based source-of-truth model.

---

## 15. Build Pipeline

A likely build-time content pipeline is:

```text
YAML + Markdown source
        ↓
parse
        ↓
schema validation
        ↓
reference validation
        ↓
normalization
        ↓
Archive Graph
        ↓
┌──────────────┬──────────────┬──────────────┐
│              │              │              │
search index   route index    graph indexes  experience map
```

The browser should not need to scan or parse hundreds of YAML files at runtime.

The source material is author-friendly.

Generated artifacts are runtime-friendly.

---

## 16. Research Material Is Separate From Published Archive Truth

Mayimbe should have a place for unverified research that does not automatically become public archive truth.

Possible structure:

```text
research/
├── leads/
├── unresolved/
├── source-notes/
└── identifications/
```

Example:

Someone may suggest that an unidentified person in a photograph is a particular musician.

That should initially remain a research lead with information such as:

```text
proposed identity
who suggested it
when it was suggested
evidence
verification status
notes
```

Only after sufficient verification should the relationship be promoted into canonical archive data.

This distinction is especially important because Mayimbe will often work with incomplete historical evidence.

---

## 17. Unknown Information Is Valid State

Mayimbe's data model describes what the archive is capable of knowing, not what it is expected to know.

Missing historical information is legitimate archival state.

Unknown facts must never be invented merely to satisfy a schema.

The archive should become richer as evidence is discovered without requiring completeness before material can be published.

The system should avoid meaningless completion metrics such as “61% complete” for historical records.

The more appropriate framing is:

```text
what we know
what we can document
what remains uncertain
```

---

## 18. Database Is Deferred

A database may become appropriate later if Mayimbe develops requirements such as:

```text
many concurrent editors
runtime content writes
user accounts
public submissions
editorial review queues
complex dynamic queries
remote administration
large-scale operational workflows
```

Those requirements do not currently justify making a database the canonical source of archive truth.

A future database migration should preserve stable entity IDs and relationships so the logical archive model survives the storage change.

The file-first decision is an initial storage strategy, not a permanent prohibition on databases.

---

## 19. CMS Is Deferred

Mayimbe should not choose a CMS before real authoring experience demonstrates the need.

Selecting a CMS too early risks allowing the CMS schema to dictate the archive model.

After enough real material has been entered, Mayimbe can evaluate whether structured-file editing remains comfortable or whether a dedicated editorial interface is warranted.

A future CMS should adapt to Mayimbe's schema rather than redefining it.

---

## 20. Portability Principle

The canonical archive should remain understandable and recoverable without a particular frontend framework, CMS vendor, database service, or CDN.

The guiding architecture is:

```text
                 AUTHORING

        YAML              Markdown
         │                   │
   archive entities        stories
         │                   │
         └─────────┬─────────┘
                   │
             schema validation
                   │
              reference check
                   │
            normalized archive
                   │
        ┌──────────┼──────────┐
        │          │          │
      graph      search     routes
        │          │          │
        └──────────┼──────────┘
                   │
                MAYIMBE
```

Mayimbe should own its historical data model even if every implementation technology around it changes.

---

## 21. Settled Principles

> **Canonical archive content is Git-first and file-first initially.**

> **YAML stores structured archive data; Markdown stores authored narrative.**

> **JSON and indexes are primarily generated build artifacts.**

> **Stable IDs identify entities; slugs are presentation.**

> **The archive may be logically graph-shaped without making authoring graph-database-like.**

> **Media identity and metadata belong to the archive; large binary assets may live elsewhere.**

> **Archive truth and experiential presentation remain separate.**

> **Validation protects data integrity, not artificial completeness.**

> **Unverified research remains separate from published archive truth.**

> **Unknown historical information is a valid archival state.**

> **A database and CMS are deferred until actual workflow requirements justify them.**
