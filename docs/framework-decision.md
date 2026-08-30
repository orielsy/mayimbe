# Mayimbe Framework Decision

**Status:** Accepted v1.0  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Decision

Mayimbe will use **Nuxt** as the production application framework.

The decision is based on the current architecture of Mayimbe rather than prototype precedent, framework popularity, or familiarity alone.

Mayimbe needs to support two equally important modes:

```text
ARCHIVE
semantic
searchable
linkable
pre-rendered
SEO-friendly
accessible

MUSEUM
persistent client runtime
interactive exhibits
global audio
cross-exhibit navigation
cinematic transitions
specialist rendering engines
```

Nuxt provides a strong fit for both without requiring the archive and museum to become separate applications.

---

## 2. Deployment Model

Mayimbe does **not** require request-time server-side rendering for the initial production architecture.

The expected first deployment model is:

```text
GitHub repository
      ↓
content validation
      ↓
archive normalization / indexes
      ↓
Nuxt static generation
      ↓
prebuilt HTML + CSS + JavaScript
      ↓
Hostinger static hosting
```

Large media assets may be served through a supplemental CDN or object-storage provider when needed.

Request-time SSR may be introduced later only if product requirements justify it.

Examples that could justify a server runtime include:

```text
public submissions
editorial/admin tools
accounts
private research workflows
dynamic APIs
personalized experiences
runtime AI/search services
large mutable datasets
```

The architecture should not assume those features exist today.

---

## 3. Why Nuxt Fits Mayimbe

### 3.1 One Platform for Archive and Museum

Mayimbe should remain one coherent system.

The desired relationship is:

```text
Nuxt Application
│
├── Conventional Archive
│   ├── albums
│   ├── songs
│   ├── people
│   ├── stories
│   ├── photographs
│   └── sources
│
└── Persistent Museum Experience
    ├── Museum Navigator
    ├── Audio Runtime
    ├── Exhibit Registry
    ├── Museum State
    └── Exhibits
```

The archive and museum consume the same canonical data and share entity identities, navigation concepts, and experience mappings.

They should not evolve into two independent products.

### 3.2 Static Generation Works for the Archive

Archive content is expected to be authored primarily from Git-backed YAML and Markdown files.

Most of that content changes when the project is rebuilt, not on every request.

Therefore routes such as:

```text
/albums/...
/songs/...
/people/...
/stories/...
```

can be generated ahead of time as meaningful HTML.

This gives Mayimbe:

```text
fast initial delivery
SEO-friendly documents
accessible content
simple hosting
low runtime infrastructure
```

without requiring a production Node process for every visitor request.

### 3.3 Persistent Client Museum Runtime

The museum is not merely a collection of independent pages.

During an in-museum visit, shared systems should remain alive in the browser while exhibits change.

Examples include:

```text
Museum Navigator
AudioManager
MuseumState
ExhibitRegistry
search/discovery state
accessibility preferences
```

A visit may flow:

```text
Desk
→ Notebook
→ Album Collection
→ Listening
→ Photo Album
→ Desk
```

without repeatedly destroying and reconstructing the entire museum runtime.

This persistence is client-side application behavior. It does not imply a server session.

### 3.4 Vue Coordinates Exhibits Well

Vue provides a practical component and reactivity model for shared semantic museum state, while allowing specialist imperative engines to remain independent.

Nuxt/Vue should coordinate:

```text
where an exhibit lives
when an exhibit is activated
what semantic target it receives
how it participates in museum navigation
how it participates in application lifecycle
```

Nuxt/Vue should **not** automatically own an exhibit's internal rendering mechanics.

---

## 4. Critical Architectural Boundary

Choosing Nuxt does **not** mean converting every Mayimbe subsystem into Vue.

Guiding principle:

> **Vue coordinates exhibits. Vue does not automatically implement exhibits.**

The framework is the application host, not the owner of Mayimbe's entire architecture.

The following systems should remain framework-independent or framework-light wherever practical:

```text
Archive model
content files
content validation
archive graph / normalized indexes
Museum Navigator core concepts
semantic destinations
Audio runtime / playback engine
Exhibit contracts
specialist exhibit engines
media resolution
```

This protects the museum from unnecessary framework lock-in.

---

## 5. Notebook Integration

The existing notebook should be integrated by extraction and adaptation rather than rewritten simply because Nuxt uses Vue.

Desired relationship:

```text
NotebookExhibit.vue
        ↓
Notebook Adapter
        ↓
Notebook Engine
        ↓
DOM + CSS + Three.js + internal mechanics
```

The Notebook Engine should expose commands conceptually equivalent to:

```ts
open()
close()
goToPage(page)
goToSection(section)
next()
previous()
getState()
restore(state)
dispose()
```

The rest of Mayimbe should not need to know about:

```text
page mesh geometry
DOM-to-texture snapshots
paper deformation
cover mechanics
stack geometry
Three.js implementation details
```

Those remain inside the Notebook Engine.

---

## 6. Exhibit Architecture

Other exhibits should follow the same principle.

Possible implementations may include:

```text
Desk
→ DOM + SVG + CSS + raster artwork

Notebook
→ semantic DOM/CSS at rest + specialist Three.js motion

Listening Device
→ DOM/SVG/CSS + Web Audio

Album Collection
→ DOM/CSS 3D or specialist renderer where justified

Photo Album
→ DOM/CSS + selective specialist rendering

Instrument Exhibit
→ DOM/SVG + Web Audio / specialist educational rendering
```

There is no requirement for a single global rendering engine.

Nuxt should not push the project toward a giant Vue-controlled Three.js scene graph.

---

## 7. Why Astro Was Not Selected

Astro remains technically capable and is particularly strong for content-heavy static sites.

It was not selected because the center of Mayimbe has evolved from:

```text
mostly archive
+ one interactive notebook
```

into:

```text
persistent interactive museum
+ serious archive underneath
```

Using Astro would likely make the museum behave as one large persistent interactive island inside a framework optimized around mostly document-oriented pages and selective islands.

That can work, but Nuxt more naturally treats the persistent museum runtime as a first-class application concern while still supporting pre-generated archive documents.

Astro should be reconsidered only if Mayimbe's product direction changes substantially toward a primarily document-oriented archive with relatively isolated interactive exhibits.

---

## 8. Why React / TanStack Start Was Not Selected

TanStack Start is architecturally interesting and could support Mayimbe well.

React itself is also fully capable of implementing the museum.

However, no current requirement gives React a specific advantage large enough to justify selecting it over Nuxt/Vue.

Potential React strengths include:

```text
larger ecosystem
larger hiring pool
strong React-specific 3D ecosystem
broad third-party component availability
```

Those are real strengths, but they are not currently Mayimbe's primary architectural problems.

Mayimbe also does not intend to become a React Three Fiber-driven 3D world, which reduces one of React's strongest project-specific advantages.

TanStack Start should be reconsidered if future requirements reveal a React-specific ecosystem need or a router/application capability that materially improves the museum.

---

## 9. Why Next.js Was Not Selected

Next.js can support static archive pages and a persistent client-side museum.

It was not selected because its current architecture introduces concepts and runtime conventions that Mayimbe does not presently need in exchange for no identified project-specific advantage.

Mayimbe does not currently require its Server Component model, request-time rendering architecture, or Next-specific caching model.

Next remains technically viable but is not the preferred fit.

---

## 10. Why Custom Vite Was Not Selected

A custom Vite application would provide maximum control over the museum runtime.

However, Mayimbe would then need to assemble or implement substantial platform functionality itself, including areas such as:

```text
static generation
archive route generation
metadata handling
SEO conventions
localization architecture
content rendering
routing infrastructure
server capabilities if later required
```

The control gained does not currently justify rebuilding framework infrastructure.

Vite will still exist underneath Nuxt's development/build tooling where appropriate, while Nuxt supplies the application platform.

---

## 11. Hosting Implications

The initial infrastructure target is intentionally simple:

```text
GitHub
├── source code
├── archive content
├── documentation
└── version history

Build process
├── validate content
├── resolve references
├── build archive indexes
├── generate routes
└── produce static site

Hostinger
├── HTML
├── CSS
├── JavaScript
└── lightweight application assets

Supplemental CDN / Object Storage
├── high-resolution photography
├── album scans
├── audio
├── video
├── instrument samples
└── large archival assets
```

A production Node server is not a requirement for V1.

---

## 12. Framework Independence Rules

To prevent Nuxt from becoming an accidental permanent dependency of Mayimbe's intellectual architecture:

```text
Archive truth ≠ Vue components

Museum destination ≠ Nuxt route object

Museum Navigator ≠ Nuxt router

Audio playback ≠ Vue store

Exhibit engine ≠ Vue component

Content schema ≠ Nuxt Content schema

Media identity ≠ hosting-provider URL
```

Adapters may connect these systems to Nuxt.

Their canonical concepts should remain separable.

---

## 13. Revisit Triggers

The framework decision should be revisited only if evidence emerges that Nuxt materially obstructs the product.

Possible revisit triggers include:

```text
persistent museum state becomes difficult to preserve correctly
specialist exhibit engines fight Vue lifecycle in fundamental ways
static generation becomes impractical for archive scale
a critical ecosystem capability exists only elsewhere
hosting requirements change substantially
Nuxt's platform direction becomes incompatible with long-term preservation goals
museum architecture changes from persistent application to mostly isolated pages
```

Preference, novelty, or framework trends alone are not sufficient reasons to revisit the choice.

---

## 14. Settled Principles

> **Nuxt is Mayimbe's production application host.**

> **The initial site should be statically generated where practical and served through simple hosting.**

> **The museum's persistence lives in the browser, not in a required server session.**

> **Vue coordinates exhibits; it does not automatically implement them.**

> **Specialist exhibit engines own their physical and rendering mechanics.**

> **The archive, navigation concepts, audio runtime, content model, and exhibit contracts should remain portable.**

> **Mayimbe should use infrastructure only when the product actually requires it.**
