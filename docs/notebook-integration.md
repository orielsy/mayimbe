# Notebook Integration

Status: accepted extraction boundary, renderer migration in progress.

## Canonical source

The production notebook is based on Lovable's `/notebook-lab-native` implementation at commit `7aade6bbede080feaaac40e9a65e288e63c2a092` in project `69b698a6-fd3a-465f-a622-1f0351b5dae7`.

`/notebook` and the React/TanStack route that embeds the lab are not production sources.

## Integration rule

Mayimbe extracts the notebook artifact; it does not promote the Lovable application.

There is no iframe boundary in production. Nuxt/Vue owns the exhibit host and lifecycle. A framework-independent Notebook Engine owns the notebook's DOM, Three.js renderer, physical state machine, and page-turn mechanics.

```text
MuseumNavigator
      |
NotebookAdapter
      |
NotebookEngine contract
      |
Native notebook engine
  DOM at rest
  Three.js in motion
```

Vue must not reimplement page bending, cover motion, paper stacks, texture handoff, or physical state.

## Preserve from the native notebook

The migration preserves the approved physical systems unless a measured regression proves a change is necessary:

- 24 content pages / 12 physical sheets.
- `CLOSED_FRONT`, `OPEN`, and `CLOSED_BACK` physical states.
- Semantic DOM as the resting source of truth.
- Three.js only for moving paper and cover transitions.
- Computed-style clone -> SVG `foreignObject` -> texture handoff.
- Correct front/back texture behavior for each physical sheet.
- F3-03 brick cloth/board cover direction.
- PAPERV2 paper surface/history system.
- Canonical M2 accumulated 26-strata page block, seed 5100.
- Current front-cover, open-cover, back-cover, hinge, reveal, and continuous-shadow behavior.
- Cached layout/mesh geometry and GPU warm-up needed to avoid first-turn stalls.
- WebGL DPR cap of 1.25.
- Pointer drag and forward/backward turns.
- Final-page/back-cover behavior, including the inside back board.

## Do not carry from Lovable

The following are laboratory or host scaffolding and are explicitly not part of the production engine:

- React/TanStack routing.
- The iframe wrapper.
- CDN/import-map loading of Three.js.
- Lab route chrome, HUDs, tuning controls, and comparison UI.
- `?debug`, `?perf`, `pmode`, and other query-string tuning systems.
- Global `window.*` dependency wiring.
- Global `document.body` state classes.
- Debug freeze/hold/measurement APIs such as `window.__protoB` and `window.__nbperf`.
- Legacy material fallbacks that are unreachable once the selected F3/PAPERV2/M2 systems are guaranteed.
- Draft notebook copy as canonical archive truth.

Debugging tools that remain useful may return later as separate development-only modules. They do not belong in the runtime engine.

## Production isolation

The engine mounts into one supplied host element. Notebook DOM queries must be relative to that host. CSS must be scoped/namespaced under the notebook root so opening the exhibit cannot alter the museum shell.

Global browser resources that are unavoidable, such as resize or pointer listeners, are registered by the engine and removed by `dispose()`.

The animation loop must be lifecycle-aware: an unfocused/suspended notebook should not keep doing unnecessary rendering work.

## Three.js

Production pins `three@0.169.0`, matching the native lab while the renderer is migrated. The lab's `unpkg` import map is removed. A Three.js upgrade is a separate visual-regression decision.

## Engine contract

The Museum does not know about `turned`, mesh deformation, cover progress, or texture state. It talks to the notebook through semantic commands:

- `open()`
- `close('front' | 'back')`
- `goToPage(page)`
- `goToSection(section)`
- `next()` / `previous()`
- `suspend()` / `resume()`
- `getState()` / `restore()`
- `dispose()`

`goToSection()` is responsible for translating a stable editorial section into the current physical page and performing whatever cover/page travel is necessary.

## Adapter ownership

A single NotebookAdapter instance belongs to each Nuxt application runtime. The MuseumNavigator and the Vue exhibit host receive that same adapter. This prevents a route command from being delivered to one adapter while the mounted engine is attached to another.

The adapter may receive a destination before the heavy engine has mounted. In that case it stores the semantic target and applies it as soon as the engine attaches.

## Content boundary

The native lab's `content.js` is draft prototype copy and is not imported as archive truth.

The production engine will receive notebook page content from Mayimbe's authored content layer. The renderer may determine physical page layout, but historical facts, stories, sources, and experience mappings remain outside the engine.

## Migration order

1. Establish the engine/adapter/lifecycle contract without changing the native renderer.
2. Convert the native physical support systems from `window.*` scripts into ordinary ES modules.
3. Move the native notebook markup/CSS/state machine behind a host-root mount function.
4. Replace unpkg Three.js with the pinned npm dependency.
5. Remove lab-only diagnostics and unreachable legacy fallbacks.
6. Inject Mayimbe-authored page data and section mappings.
7. Add screenshot/endpoint regression tests before further visual refactoring.

The goal is not fewer lines at any cost. The goal is to remove accidental prototype complexity while retaining complexity that is doing real physical or performance work.
