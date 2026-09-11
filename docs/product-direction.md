# Product Direction

**Status:** active

## Core thesis

Mayimbe is an interactive digital museum and cultural archive for Antony Santos.

The **desk is the primary website interface**. The notebook is the first real object on that desk. Future objects may include a radio/listening device, photo album, records, instruments, and other memorabilia, but they should only enter the runtime when they are genuinely implemented.

A conventional archive remains available alongside the immersive museum. It owns source-oriented pages, structured research surfaces, SEO-friendly content, and accessible conventional navigation. Both presentations should consume the same content truth.

```text
                    Structured content
                           |
             +-------------+-------------+
             |                           |
             v                           v
     Desk/object experience       Conventional archive
        notebook first          people / stories / sources
```

## Interface hierarchy

1. **Desk environment** — primary entry point and navigation shell.
2. **Physical object experiences** — notebook first.
3. **Traditional archive UI** — research, provenance, and fallback navigation.
4. **Content/domain layer** — shared structured truth powering both presentations.

The traditional archive must not visually frame or compete with the desk.

## Current routing

Spanish is the default site locale and has no URL prefix.

- `/` — museum desk
- `/notebook` — notebook cover
- `/notebook/<target>` — notebook deep link
- `/en` — English museum desk
- `/en/notebook` — English notebook cover
- `/en/notebook/<target>` — English notebook deep link
- `/archive` and `/archive/...` — conventional archive surfaces

Do not add speculative museum aliases or generic exhibit routes. Add a route when a real surface exists.

## Runtime boundaries

```text
core/archive/                  archive domain types
core/museum/destination.ts     small semantic destination helper
content/                       authored archive truth
scripts/ + generated/          archive validation/build pipeline
app/components/museum/         desk and object orchestration
app/components/notebook/       notebook renderer and notebook-specific UI
app/pages/                     explicit route surfaces
```

The route is the source of truth for whether the desk or notebook is active. There is no generic museum registry, exhibit lifecycle, or parallel navigation state.

## Notebook decision

The current Vue/Nuxt notebook is the production foundation. Its physical renderer, state machine, page stack, deterministic wear/material system, and transition behavior have earned their complexity and should not be rewritten casually.

Renderer experiments and superseded implementations belong in Git history or dedicated historical branches, not the active runtime tree.

## Near-term focus

Infrastructure work should stop once it supports real museum content. New effort should favor authored content, provenance, localization, and additional desk objects only when those experiences are ready to be built.
