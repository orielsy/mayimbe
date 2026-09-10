# Notebook Integration

**Status:** Page Turner Lab integration in progress

## Canonical implementation direction

The production notebook is based on the approved Lovable **Page Turner Lab** implementation. Mayimbe extracts the notebook artifact only; it does not embed Lovable's application shell, router, or project scaffolding.

## Product and route model

The desk and the museum are the same primary experience.

Public routes are presentation-oriented rather than implementation-oriented:

```text
/                          Museum / Desk
/notebook                  Focused notebook exhibit
/notebook/<semantic-target> Focused notebook at a meaningful destination
/archive                   Conventional archive
/archive/stories/<slug>    Archive story
/archive/people/<slug>     Archive person record
```

`/museum/...` is not a public routing layer. `Museum*` remains useful internal terminology for the runtime, navigator, state, registry, and shell that coordinate the desk and its focused objects.

The Archive is the conventional, accessible way to browse the same structured knowledge that powers the immersive museum objects. The notebook is a presentation of that knowledge, not the source of truth.

## Integration boundary

The notebook renderer belongs under:

```text
app/components/notebook/
```

The museum shell talks to it through the thin `app/components/museum/NotebookExhibit.vue` boundary. Museum navigation remains semantic and renderer-agnostic.

```text
MuseumNavigator
      |
semantic destination (/notebook/...)
      |
NotebookExhibit.vue
      |
NotebookExperience.vue
      |
Page Turner components/state/materials
```

The museum core must not know about page-turn transforms, stack geometry, wear overlays, or renderer-specific state.

## Preserve from Lovable

The integration should preserve:

- componentized notebook architecture
- dedicated state/reducer logic
- page-surface abstraction
- dynamic left/right stack depth
- wear/material history model
- swipe and button interaction
- edge/fore-edge affordances
- dedication as the authored terminal state
- responsive single-layout strategy

Unreachable back-cover states/handlers from earlier experiments are not part of the production state model.

## Regression discipline

The historical Stage 2 implementation remains only a regression reference. Preserve these invariants:

- complete forward and backward traversal
- rapid-input/transition locking
- no skipped pages during animation
- resize phone -> wider phone -> desktop -> phone without state reset
- reduced-motion behavior
- transient turning-layer cleanup
- left/right stack continuity
- missing-image detection
- horizontal-overflow protection
- no retained obsolete canvas/WebGL renderer

## Content boundary

Notebook historical copy is not canonical archive truth.

Mayimbe's structured content layer owns facts, stories, sources, dates, people, and relationships. The same data can be rendered through the Archive, notebook, photo album, listening objects, or future exhibits without duplicating historical truth inside those renderers.

## Runtime constraints

For the current milestone:

- DOM/CSS/static assets are sufficient.
- No WebGL dependency is required.
- No runtime canvas requirement is introduced.
- Sheet curl/deformation is a stretch goal, not a blocker.
- Mobile can reveal only part of the turned-left side while keeping the same object model ready for wider layouts.

## Integration order

1. Port the approved Page Turner Lab components/state/assets into `app/components/notebook/`.
2. Convert framework-specific React pieces to Vue/Nuxt equivalents without redesigning the winning implementation.
3. Keep the dedication as the terminal state and preserve regression coverage.
4. Connect semantic Mayimbe targets such as `/notebook/early-years` without coupling museum core to page indexes.
5. Replace prototype page copy with Mayimbe content-driven data.
6. Continue desk composition and additional objects only after the notebook/content boundary is stable.

## Historical implementations

Previous notebook renderers remain available through Git history and notebook-specific branches. They are intentionally absent from the active runtime tree so they cannot be mistaken for the production renderer.
