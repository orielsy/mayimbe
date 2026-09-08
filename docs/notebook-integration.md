# Notebook Integration

**Status:** reset for Page Turner Lab integration

## Canonical implementation direction

The next production notebook is based on the approved Lovable **Page Turner Lab** implementation.

The exact Lovable source snapshot/commit should be recorded when the code is imported. Mayimbe will extract the notebook artifact; it will not embed the Lovable application shell, router, or project scaffolding.

## Integration boundary

The notebook renderer belongs under:

```text
app/components/notebook/
```

The museum shell talks to it through the thin `app/components/museum/NotebookExhibit.vue` boundary. Museum navigation remains semantic and renderer-agnostic.

The active shape is intentionally simple:

```text
MuseumNavigator
      |
semantic destination (/museum/notebook/...)
      |
NotebookExhibit.vue
      |
NotebookExperience.vue
      |
Page Turner components/state/materials
```

The museum core must not know about page-turn transforms, stack geometry, wear overlays, or renderer-specific state.

## Preserve from Lovable

The integration should preserve the strengths that won the comparison:

- componentized notebook architecture
- dedicated state/reducer logic
- page-surface abstraction
- dynamic left/right stack depth
- wear/material history model
- swipe and button interaction
- edge/fore-edge affordances that improve discoverability
- dedication as the authored terminal state
- responsive single-layout strategy

Before integration is considered complete, remove any unreachable back-cover states/handlers left over from earlier experiments and align unit tests with the dedication endpoint.

## Bring over from the GitHub Stage 2 experiment

Do not bring its renderer architecture into production. Bring its **regression discipline**:

- complete forward traversal
- complete backward traversal
- rapid-input/transition locking
- no skipped pages during animation
- resize phone -> wider phone -> desktop -> phone without state reset
- reduced-motion behavior
- transient turning-layer cleanup
- left/right stack continuity
- missing-image detection
- horizontal-overflow protection
- no retained obsolete canvas/WebGL renderer

The historical Stage 2 implementation remains on `experiment/pocket-notebook-stage-2-codex` as a reference for these invariants.

## Content boundary

Notebook historical copy is not canonical archive truth.

Mayimbe's structured content layer owns facts, stories, sources, dates, and relationships. The notebook is a presentation of that data. The integration should move toward page data/configuration rather than hard-coded historical facts inside rendering components.

## Runtime constraints

For the current milestone:

- DOM/CSS/static assets are sufficient.
- No WebGL dependency is required.
- No runtime canvas requirement is introduced.
- Sheet curl/deformation is a stretch goal, not a blocker.
- Mobile can reveal only part of the turned-left side while keeping the same object model ready for wider tablet/desktop layouts.

## Integration order

1. Import the approved Page Turner Lab components/state/assets into `app/components/notebook/`.
2. Remove Lovable app/router scaffolding and convert framework-specific pieces to Vue/Nuxt equivalents.
3. Delete unreachable back-cover states and update reducer tests for the dedication endpoint.
4. Connect semantic Mayimbe notebook targets without coupling museum core to notebook internals.
5. Port the GitHub Stage 2 regression suite philosophy to the new DOM/component structure.
6. Replace prototype page copy with Mayimbe content-driven data.
7. Only after that, continue desk composition and additional objects.

## Historical implementations

The previous native/WebGL notebook remains available through Git history and notebook-specific branches. It is intentionally removed from the active runtime tree so it cannot be mistaken for the production renderer.
