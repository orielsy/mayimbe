# Product Direction

**Status:** active

## Core thesis

Mayimbe is not a conventional website that contains a notebook experience.

The **desk is the primary website interface**. The notebook is the first real object on that desk. Future objects may include a radio/listening device, photo album, records, instruments, and other memorabilia.

A conventional web application remains available underneath the desk experience. It owns structured archive data, source-oriented pages, semantic routes, search/SEO surfaces, and accessibility-friendly navigation.

Both presentations consume the same content truth.

```text
                    Structured archive
                           |
             +-------------+-------------+
             |                           |
             v                           v
     Desk/object experience       Conventional UI
        notebook first          archive / people / stories
```

## Interface hierarchy

1. **Desk environment** — primary entry point and navigation shell.
2. **Physical object experiences** — notebook first; other objects only when genuinely implemented.
3. **Traditional archive UI** — direct research, sources, search-friendly pages, and fallback navigation.
4. **Content/domain layer** — shared structured truth powering both interfaces.

The traditional UI must not visually frame or compete with the desk. It is invoked through its own routes and may later be exposed from the desk through subtle controls.

## Routing

- `/` is the canonical desk.
- `/museum` remains a semantic alias for the desk and supports object deep links.
- `/museum/notebook/...` addresses notebook state semantically.
- `/archive`, `/people/...`, `/stories/...` remain conventional structured pages.

A shared URL should be able to open the museum directly into an object's relevant state without requiring the visitor to traverse a traditional website first.

## Repository boundaries

```text
core/                         framework-independent museum/archive contracts
content/                      authored archive truth
scripts/ + generated/         validation/index pipeline
app/components/museum/        desk and object orchestration
app/components/notebook/      notebook renderer and notebook-specific UI
app/pages/                    route surfaces
```

Renderer experiments and superseded implementations should not remain in the active runtime tree merely as reference material. Git history and dedicated historical branches provide that reference.

## Current implementation decision

Lovable's **Page Turner Lab** won the notebook implementation comparison and becomes the notebook foundation.

Mayimbe will extract that notebook implementation into its Vue/Nuxt architecture rather than embedding/promoting the Lovable application itself. The GitHub Stage 2 branch remains a behavioral/testing reference, especially for transition locking, resize continuity, reduced motion, transient-layer cleanup, and complete forward/backward traversal.

## Stretch goal

Deformable/curling sheet geometry is explicitly a stretch goal. The canonical notebook does not need to solve physical page deformation before the rest of the museum architecture and content are mature.
