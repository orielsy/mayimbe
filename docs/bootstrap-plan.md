# Mayimbe Initial Repository Structure and Bootstrap Plan

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Purpose

This document defines the initial production repository structure and the order in which Mayimbe should be bootstrapped.

The goal is to move from architecture documents into a working Nuxt application without prematurely migrating the notebook or coupling Mayimbe's core concepts to Vue.

The bootstrap should establish the boundaries already defined in:

- `docs/foundation.md`
- `docs/museum-shell.md`
- `docs/navigation-state.md`
- `docs/archive-model.md`
- `docs/content-storage.md`
- `docs/framework-decision.md`

The first implementation should prove those boundaries rather than trying to build the finished museum immediately.

---

## 2. Bootstrap Principles

The initial scaffold should follow these rules.

### Nuxt hosts Mayimbe; it does not own Mayimbe's intellectual architecture

Nuxt and Vue should own:

```text
pages
layouts
route integration
Vue components
Nuxt application lifecycle
archive document rendering
framework adapters
```

Framework-independent TypeScript should own concepts such as:

```text
archive entity types
archive normalization
Museum Navigator logic
museum destinations
exhibit contracts
shared audio contracts
validation helpers
```

Specialist exhibits should own their internal physical behavior.

### Do not migrate the notebook during bootstrap

The existing notebook remains a reference implementation and separate working artifact until the production shell and exhibit contract exist.

Bootstrap should create only a placeholder Notebook Exhibit adapter and the interfaces required to integrate the real engine later.

### Do not add infrastructure merely because it may be useful later

Initial Mayimbe does not require:

```text
database
CMS
graph database
Node production server
user accounts
public submissions
large-media CDN integration
runtime API layer
```

Those can be introduced when actual requirements justify them.

### Static generation is the initial deployment target

The first production build should be capable of generating static HTML/CSS/JavaScript suitable for deployment to Hostinger.

Interactive museum behavior runs in the visitor's browser.

---

## 3. Proposed Repository Structure

The initial repository should evolve toward:

```text
mayimbe/
│
├── app/
│   ├── app.vue
│   ├── assets/
│   ├── components/
│   │   ├── archive/
│   │   └── museum/
│   │       ├── MuseumShell.vue
│   │       ├── MuseumDesk.vue
│   │       └── exhibits/
│   │           ├── NotebookExhibit.vue
│   │           ├── ListeningExhibit.vue
│   │           ├── AlbumExhibit.vue
│   │           └── PhotoExhibit.vue
│   │
│   ├── composables/
│   │   ├── useArchive.ts
│   │   ├── useMuseum.ts
│   │   ├── useMuseumNavigator.ts
│   │   └── useAudio.ts
│   │
│   ├── layouts/
│   ├── pages/
│   │   ├── index.vue
│   │   ├── museum/
│   │   ├── albums/
│   │   ├── songs/
│   │   ├── people/
│   │   └── stories/
│   │
│   └── plugins/
│
├── core/
│   ├── archive/
│   │   ├── entities.ts
│   │   ├── relationships.ts
│   │   ├── temporal.ts
│   │   ├── certainty.ts
│   │   └── index.ts
│   │
│   ├── museum/
│   │   ├── destination.ts
│   │   ├── exhibit.ts
│   │   ├── navigator.ts
│   │   ├── registry.ts
│   │   └── state.ts
│   │
│   ├── audio/
│   │   ├── types.ts
│   │   └── manager.ts
│   │
│   └── shared/
│
├── exhibits/
│   ├── notebook/
│   │   ├── README.md
│   │   ├── types.ts
│   │   └── adapter.ts
│   ├── listening/
│   ├── albums/
│   ├── photos/
│   └── instrument/
│
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
│   ├── archive/
│   └── content/
│
├── scripts/
│   ├── validate-content.ts
│   ├── build-archive.ts
│   └── check-references.ts
│
├── generated/
│   └── ...
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── public/
├── docs/
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

This is a target structure, not a requirement to create every empty directory immediately.

Directories should appear when they contain useful code or content.

---

## 4. Directory Responsibilities

### `app/`

Nuxt- and Vue-specific presentation code.

This directory may import from `core/`, `content/` build outputs, and specialist exhibit adapters.

Code in `core/` should not import from `app/`.

### `core/`

Framework-independent Mayimbe domain/runtime code.

This is where the stable architectural vocabulary lives.

Examples:

```text
MuseumDestination
MuseumExhibit
MuseumNavigator
ArchiveEntityRef
TemporalValue
Certainty
AudioState
```

The intent is that these concepts remain usable even if the UI framework changes years later.

### `exhibits/`

Specialist experience implementations and framework-independent adapters.

An exhibit may internally use whatever technology best fits the art piece.

Examples:

```text
Notebook
→ DOM + Three.js

Listening
→ DOM/SVG/Web Audio

Instrument
→ Web Audio + specialist visual layer
```

Vue wrappers in `app/components/museum/exhibits/` connect these engines to the persistent Museum Runtime.

### `content/`

Canonical published archive content.

Structured archive records are primarily YAML.

Narrative stories are primarily Markdown with structured frontmatter.

Missing historical information is valid and must not cause schema failure merely because a possible field is unknown.

### `research/`

Working research that is not yet archive truth.

Nothing under `research/` should automatically become public archive content.

A lead must be intentionally promoted into `content/` after sufficient verification.

### `schemas/`

Validation definitions for content structures and domain types.

The schema validates integrity, not historical completeness.

### `scripts/`

Build-time tooling that:

```text
parses content
validates schemas
checks duplicate IDs
checks references
normalizes archive entities
builds graph indexes
builds search indexes
prepares generated data
```

### `generated/`

Derived machine-readable artifacts.

Possible outputs:

```text
archive.json
graph.json
search-index.json
route-index.json
experience-index.json
```

Generated data is not canonical archive truth and should normally be rebuildable from `content/`.

### `tests/fixtures/`

Synthetic or isolated data used to test schemas, relationships, and navigation behavior.

Test fixtures should be clearly separate from real archive content so invented data is never mistaken for historical fact.

---

## 5. Dependency Direction

Mayimbe should maintain a clear dependency direction.

```text
content / schemas
       ↓
      core
       ↓
specialist exhibits
       ↓
Nuxt / Vue adapters
       ↓
application UI
```

More precisely:

```text
core
must not depend on Vue or Nuxt

content
must not depend on exhibit implementations

archive truth
must not depend on museum presentation

specialist engines
should not depend on Nuxt routing

Vue components
may coordinate all of the above through adapters
```

The repository structure should make accidental violations of these boundaries easy to notice.

---

## 6. Initial Package Philosophy

Bootstrap should begin with the smallest dependable dependency set.

Expected categories:

```text
Nuxt
Vue
TypeScript
YAML parser
schema validation
basic test runner
lint/format tooling
```

Three.js should be added when the real Notebook Engine is integrated, not merely because the prototype uses it.

Likewise, do not add Web Audio helper libraries, animation libraries, state-management packages, search engines, CMS clients, or UI component systems until Mayimbe demonstrates a concrete need.

Vue's built-in reactivity/composables should be sufficient for the first Museum Runtime.

---

## 7. Package Manager and Lockfile

The production repository must commit a lockfile and use one package manager consistently.

The exact package manager is less important than reproducibility.

The scaffold step should choose one and record it in `package.json` so local development, GitHub automation, and Hostinger builds use the same toolchain.

Avoid maintaining multiple lockfiles.

---

## 8. Bootstrap Phase 1 — Nuxt Skeleton

Create the smallest working Nuxt application.

Initial goals:

```text
Nuxt starts locally
TypeScript works
static generation works
one home route renders
one archive route renders
one museum route renders
```

Do not add finished visual design yet.

The first shell can be visually plain.

The purpose is architectural verification.

---

## 9. Bootstrap Phase 2 — Core Types

Implement the smallest useful framework-independent contracts.

Initial types should include concepts equivalent to:

```ts
interface MuseumDestination {
  exhibit?: string;
  target?: unknown;
  entity?: string;
}
```

and:

```ts
interface MuseumExhibit<TTarget = unknown, TState = unknown> {
  id: string;
  canPresent(target: unknown): boolean;
  preload(target?: TTarget): Promise<void>;
  activate(target?: TTarget): Promise<void>;
  navigate(target: TTarget): Promise<void>;
  suspend(): Promise<void>;
  getState(): TState;
  restore(state: TState): Promise<void>;
  dispose?(): Promise<void>;
}
```

These interfaces remain preliminary and should evolve from real implementation pressure.

Do not attempt to design the complete future API before the first vertical slice.

---

## 10. Bootstrap Phase 3 — Minimal Archive Pipeline

Create a tiny but real content pipeline.

It should be able to:

```text
read one or more YAML records
read one Markdown story
validate IDs
validate references
normalize records
make them available to Nuxt
render at least one static archive page
```

The first archive data should use sourced real material or clearly separated test fixtures.

Do not invent production facts merely to make the demo look complete.

The validation system should prove that:

```text
broken references fail
invalid structures fail
duplicate IDs fail
unknown optional historical facts do not fail
```

---

## 11. Bootstrap Phase 4 — Persistent Museum Runtime

Implement a deliberately simple Museum Runtime.

Initial responsibilities:

```text
current semantic destination
active exhibit ID
Exhibit Registry
Museum Navigator
basic transition intent
shared audio state placeholder
```

The first desk does not need final artwork.

It may initially contain simple placeholders representing:

```text
Notebook
Listening Device
Albums
Photo Album
```

The point is to prove that exhibits can activate, suspend, and navigate without becoming tightly coupled.

---

## 12. Bootstrap Phase 5 — Navigator Vertical Slice

Build one end-to-end semantic navigation flow.

Example:

```text
archive/search intent
        ↓
story:early-years
        ↓
experience mapping
        ↓
notebook:early-years
        ↓
Museum Navigator
        ↓
Notebook placeholder adapter
        ↓
settled destination
        ↓
meaningful browser history
```

The placeholder Notebook Exhibit can simply display the requested semantic target.

It does not need physical page-turn behavior yet.

This proves the architecture before the expensive art piece is integrated.

---

## 13. Bootstrap Phase 6 — Static Build and Hostinger Deployment

Before notebook migration, prove the deployment path.

The repository should be able to:

```text
install dependencies
validate archive content
run tests
build/generate static site
produce deployable static output
```

The output should be suitable for Hostinger static hosting.

GitHub should remain the source of truth.

A later CI/deployment workflow can automate:

```text
push to main
→ validate
→ test
→ generate
→ deploy
```

Do not introduce a permanent Node server unless a real feature eventually requires request-time backend work.

---

## 14. Bootstrap Phase 7 — Notebook Integration

Only after the shell, Navigator, exhibit lifecycle, and static build work should the production notebook migration begin.

The integration approach should be:

```text
working notebook implementation
        ↓
extract stable Notebook Engine boundary
        ↓
production dependencies become local/pinned
        ↓
connect Notebook Engine to Notebook Exhibit adapter
        ↓
Museum Navigator calls semantic commands
```

Mayimbe should call operations such as:

```text
open
goToSection
goToPage
next
previous
close
getState
restore
```

It should not reach into:

```text
page meshes
cover geometry
DOM-to-texture snapshots
stack geometry
animation progress
```

No rewrite should be undertaken merely to make the notebook more "Vue-like."

---

## 15. First Vertical Slice Definition of Done

The first production vertical slice is successful when all of the following are true:

```text
Nuxt static build succeeds

archive content is validated from source files

at least one conventional archive page is generated as useful HTML

persistent museum shell exists

Museum Navigator accepts semantic destinations

placeholder exhibits register through a shared exhibit contract

archive → museum navigation works

browser Back returns through meaningful destinations

museum state survives normal client navigation where intended

no database or production SSR server is required

notebook has not yet been rewritten
```

This is the point at which integrating the real notebook becomes justified.

---

## 16. Explicit Bootstrap Non-Goals

The bootstrap should not attempt to solve:

```text
finished desk art direction
complete Antony Santos archive
full search UX
final cassette/radio design
album interaction physics
photo album visual design
instrument exhibit
public contribution workflows
CMS selection
user authentication
full localization UI
large-media storage migration
analytics strategy
advanced animation system
```

These are later product work.

The bootstrap exists to prove Mayimbe's skeleton.

---

## 17. Architectural Guardrails

The following should be treated as review questions during implementation.

### Is this historical information being stored inside a Vue component?

If yes, move it toward `content/` or the archive layer.

### Is a specialist engine calling the Nuxt router directly?

If yes, route the intent through the Museum Navigator or an adapter.

### Does the Museum Navigator know animation internals?

If yes, move those mechanics back into the exhibit.

### Does a Vue component directly manipulate another exhibit's internals?

If yes, use the shared runtime/Navigator instead.

### Are we adding a backend because the framework makes it easy rather than because Mayimbe needs one?

If yes, do not add it yet.

### Are we rewriting working exhibit code simply to match the host framework?

If yes, stop and define a better adapter boundary.

---

## 18. Recommended Initial Implementation Order

```text
1. Nuxt + TypeScript scaffold
2. static-generation smoke test
3. root repository structure
4. archive/domain type primitives
5. schema validation
6. tiny content pipeline
7. conventional archive page
8. Museum Runtime skeleton
9. Exhibit Registry
10. Museum Navigator
11. placeholder exhibits
12. semantic archive → museum navigation
13. history/deep-link verification
14. Hostinger deployment proof
15. real Notebook Engine integration
```

The order is intentional.

It reduces the chance that the notebook becomes the accidental architecture of the entire site.

---

## 19. Settled Bootstrap Principles

> **Build the platform boundary before migrating the art piece.**

> **Nuxt hosts Mayimbe; it does not own Mayimbe's domain model.**

> **Framework-independent concepts belong outside Vue components.**

> **Archive content remains canonical outside the presentation layer.**

> **Generated indexes are disposable; source content is not.**

> **Validate integrity, not historical completeness.**

> **Use adapters rather than rewrites when integrating specialist exhibits.**

> **Static generation is the initial production deployment model.**

> **Do not add a database, CMS, SSR server, or heavy infrastructure until a real requirement demands it.**
