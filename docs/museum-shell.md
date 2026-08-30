# Mayimbe Museum Shell

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Decision

Mayimbe uses a **persistent spatial museum environment** as its primary experiential shell.

The museum environment stays alive while exhibits open, focus, animate, and hand control back to the broader space.

The notebook is the first exhibit implementing this model. Future exhibits — listening device, album collection, photo album, musical instrument, memorabilia, and others — should follow the same shared runtime and navigation architecture.

The shell is not merely a decorative homepage, and it is not a giant monolithic 3D scene. It is a persistent stage that coordinates independently implemented art pieces.

---

## 2. Product Priority

The authored interactive art pieces are the primary Mayimbe experience.

The archive exists to support, explain, index, source, search, and route visitors into those experiences.

Mayimbe should not let the archive become the “real site” while the museum becomes an optional visual mode.

Core hierarchy:

```text
                     MAYIMBE

                Persistent Museum
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Notebook       Listening       Albums
        │              │              │
     Photos        Instrument      Future Art
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Archive Graph
                       │
        search / SEO / sources / research
```

The archive and museum use the same underlying knowledge, but Mayimbe should actively guide visitors toward a deliberate experiential representation when one exists.

---

## 3. The Desk Is a Persistent Environment

On desktop, the museum shell is expected to present a spatial desk/home environment containing Antony-related objects.

Conceptually:

```text
Desk
├── Notebook
├── Listening Device
├── Album Collection
├── Photo Album
├── Instrument
├── Memorabilia
└── Future Objects
```

When an exhibit is activated, the shell remains conceptually alive behind it.

The exhibit may enlarge, move toward the viewer, take over most of the viewport, or temporarily obscure the desk. That does not mean the museum runtime is destroyed or replaced.

When the exhibit is closed, the visitor should return naturally to the spatial environment and continue from the same museum state.

---

## 4. Focused Exhibits, Not Conventional Page Replacement

Mayimbe distinguishes the persistent shell from the focused exhibit presentation.

```text
Museum Runtime
├── navigation
├── global audio
├── history
├── search
├── archive coordination
└── exhibit lifecycle
        │
        ▼
Museum Shell / Desk
        │
        ▼
Focused Exhibit
```

The shell knows global context.

An exhibit knows how its own object behaves.

The shell may know:

```text
active exhibit
previous exhibit
current museum destination
global audio state
search state
browser history
loading state
motion preferences
responsive presentation
```

The exhibit may know:

```text
how a notebook turns pages
how a cassette inserts/ejects
how an album flips
how a photo album navigates
how an instrument responds
```

These responsibilities should remain separate.

---

## 5. Focus Is Not Synonymous With Fullscreen

Different exhibits may require different amounts of visual ownership.

The notebook may occupy most of the viewport.

The listening device may remain partially contextualized within the desk.

An album may lift from the desk and float forward while its surrounding environment remains visible.

A musical instrument may require an immersive presentation.

The architecture should support multiple focus styles rather than forcing every exhibit into one fullscreen template.

Conceptual presentation modes may eventually include:

```text
in-place
object-focused
immersive
```

The exact API is not yet frozen.

---

## 6. The Museum Runtime Persists

The following systems should normally outlive individual exhibit activations:

```text
MuseumNavigator
MuseumState
AudioManager
ExhibitRegistry
History / deep-link coordination
Search / discovery state
Accessibility preferences
Motion preferences
```

An exhibit opening should not reset these systems.

This is especially important for audio, navigation continuity, search-driven destinations, and returning to the desk after focused interaction.

---

## 7. Art Pieces Are Preferred Destinations

When archive material has an authored experiential representation, Mayimbe should treat that experience as the preferred destination without hiding conventional access to the information.

Example:

```ts
{
  id: "story:early-years",

  experience: {
    primary: {
      exhibit: "notebook",
      target: {
        section: "early-years"
      }
    },

    alternatives: [
      {
        exhibit: "photo-album",
        target: {
          collection: "early-years"
        }
      }
    ]
  }
}
```

For an album:

```ts
{
  id: "album:example",

  experience: {
    primary: {
      exhibit: "album-collection",
      target: {
        album: "example"
      }
    },

    alternatives: [
      {
        exhibit: "listening",
        target: {
          mode: "cassette",
          album: "example"
        }
      }
    ]
  }
}
```

This is **curatorial intent**, not merely algorithmic ranking.

---

## 8. The Archive Is a Portal Into the Museum

Archive pages must remain useful as conventional web documents.

A visitor landing directly on an album, story, photograph, or person should receive meaningful information immediately.

However, when a strong experiential representation exists, the archive should prominently offer a path into it.

Examples:

```text
Experience this album in the collection

Read this chapter in the Cuaderno

Hear this recording on the listening device

View these photographs in the photo album
```

Activating one of these should enter or restore the persistent museum shell at the appropriate destination.

The archive must not become a dead end separated from the art pieces.

---

## 9. Search Should Prefer Experiences

Search inside Mayimbe should treat experiential destinations as first-class results.

A result may expose several ways of approaching the same entity:

```text
Early Years

Featured experience
→ Open in the Cuaderno

Also available
→ Read archive entry
→ View related photographs
```

For a recording:

```text
Hear it
→ Listening Device

See the album
→ Album Collection

Read the story
→ Notebook

Research it
→ Archive Record
```

Search may use curatorial metadata to determine the preferred artistic representation.

The archive option should always remain available.

---

## 10. Three Navigation Modes

Mayimbe should support three broad kinds of navigation through the same underlying Museum Navigator.

### Direct Navigation

The visitor explicitly asks for a destination.

```text
Search "X"
→ take me to X
```

### Curated Navigation

The museum intentionally connects one experience to another.

```text
Notebook chapter
→ related album
→ related recording
```

### Exploratory Navigation

The visitor discovers the museum spatially.

```text
open notebook
inspect cassette
pick up album
open photo album
```

These should not become three independent navigation implementations.

---

## 11. Spatial Relationships Can Become Editorial Relationships

The persistent shell allows related content to be suggested spatially rather than only through generic “related content” UI.

For example, after reading a notebook section about a particular album, Mayimbe might subtly make the corresponding album object more visually relevant when the visitor returns toward the desk.

Similarly, a recording mentioned in an exhibit could make the listening object available as the natural next destination.

This should remain restrained and curatorial rather than gamified.

The museum can communicate:

> There is more to this story over here.

The Archive Graph and Museum Navigator should provide the relationships required to support this behavior.

---

## 12. Listening Device and Persistent Audio

The listening device may combine cassette and radio/listening functionality rather than being two separate technical exhibits.

The shell should not assume one physical implementation yet.

Possible models include:

```text
one cassette/radio combination device

two physical objects using one listening engine

one primary listening object with several historical modes
```

Regardless of visual implementation, playback belongs to the persistent audio runtime rather than to a disposable exhibit component.

If audio is playing and the visitor focuses the notebook, the audio may continue where editorially appropriate.

The listening object may visually recede while playback persists.

---

## 13. No Giant Global Scene Graph

A persistent spatial environment does **not** imply that the entire museum should be implemented as one Three.js or WebGL scene.

Mayimbe should avoid architecture such as:

```text
THREE.Scene
├── Notebook
├── Listening Device
├── Albums
├── Guitar
├── Photo Album
└── Everything Else
```

The shell and exhibits should be free to use the most appropriate rendering technology.

Examples:

```text
Desk
→ DOM + SVG + CSS + raster artwork where appropriate

Notebook
→ semantic DOM/CSS at rest + Three.js during page/cover motion

Listening Device
→ DOM/SVG/CSS + Web Audio

Album Collection
→ DOM/CSS 3D or selective specialist rendering

Photo Album
→ DOM/CSS with specialist rendering only if justified

Instrument
→ SVG/DOM + Web Audio, with specialist rendering if needed
```

There is no global rendering-engine requirement.

---

## 14. Exhibit Lifecycle

The persistent shell does not mean all exhibits remain fully initialized at all times.

An exhibit may progress through states such as:

```text
registered
→ lightweight / dormant
→ preloading
→ active
→ suspended
→ disposed
```

The Museum Runtime should preserve meaningful exhibit state without requiring every GPU renderer, audio sample set, image collection, or animation system to remain active.

The shell persists.

Expensive exhibit resources do not necessarily persist.

---

## 15. Mobile Shell

The persistent museum concept also applies on mobile, but the visual spatial metaphor may change significantly.

Desktop may present a broad desk environment.

Mobile may present one artifact or a tightly framed set of artifacts at a time.

```text
Desktop
→ spatial desk

Mobile
→ focused museum-object environment
```

Both should share:

```text
MuseumNavigator
MuseumState
AudioManager
Archive Graph
Exhibit APIs
History / deep links
```

Responsive design here is an experience-level concern, not merely a CSS scale operation.

---

## 16. Browser History and Deep Links

The persistent shell must cooperate with browser navigation.

A journey such as:

```text
Desk
→ Notebook / Early Years
→ Album X
→ Photo Y
```

should produce meaningful navigation history.

Browser Back should move the visitor toward the prior meaningful state rather than arbitrarily destroying the museum or resetting the desk.

Deep links should be capable of entering the persistent environment at a specific exhibit destination.

For example, an archive link may ultimately request:

```text
museum
→ notebook
→ section early-years
```

or:

```text
museum
→ listening device
→ recording X
```

The destination and the cinematic transition used to reach it remain separate concepts.

---

## 17. Architectural Requirement Produced by This Decision

Any production framework considered for Mayimbe must be able to support both:

```text
A long-lived interactive museum runtime
```

and:

```text
excellent conventional archive documents
```

Specifically, framework evaluation should test whether the candidate can support:

```text
persistent museum shell
persistent global state
persistent audio
independently loaded exhibits
imperative exhibit-local DOM/WebGL ownership
URL/history synchronization
archive SSR/SSG
search → exhibit routing
archive → exhibit routing
exhibit → exhibit routing
lazy loading and resource lifecycle
```

This requirement should be used as evidence during framework selection.

It does not itself prescribe React, Vue, Astro, Nuxt, TanStack Start, or any other framework.

---

## 18. Settled Principles

The following decisions are considered part of Mayimbe's current product direction:

> **The museum environment persists while exhibits open.**

> **The notebook is the first exhibit; future art pieces follow the same museum-runtime model.**

> **Interactive art pieces are preferred destinations when an appropriate authored representation exists.**

> **The archive supports discovery, sourcing, search, indexing, research, and direct access without replacing the museum as the primary artistic experience.**

> **The physical metaphor should guide the visitor, never obstruct them.**

> **A fact belongs to the archive. An exhibit is one way of experiencing it.**
