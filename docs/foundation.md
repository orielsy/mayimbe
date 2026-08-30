# Mayimbe Foundation Specification

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Purpose

Mayimbe is the production platform behind AntonySantos.com: an interactive digital museum, cultural archive, and personal tribute to Antony Santos.

It should not behave like a conventional artist website decorated with animations.

The central idea is:

> **You discover Antony Santos through his things.**

Visitors encounter physical-feeling objects — notebook, listening device/cassette player, albums, photographs, instruments, memorabilia, and future artifacts — and use those objects to explore a serious underlying archive.

The experience and archive are two interfaces to the **same body of knowledge**.

Core principle:

> **Experience on top. Archive underneath.**

The experiential layer must never trap information inside an animation or prevent a visitor from reaching what they want.

---

## 2. Product Layers

Mayimbe has four major conceptual layers.

```text
MAYIMBE
│
├── Museum Experience
│
├── Museum Runtime
│
├── Archive / Knowledge Layer
│
└── Platform / Infrastructure
```

### Museum Experience

The visible, tactile world.

Initial and likely experiences:

```text
Desk / Environment
├── Cuaderno / Notebook
├── Listening Device / Cassette / Radio
├── Album Collection
├── Photo Album
├── Musical Instrument
├── Memorabilia / Ephemera
└── Future Objects
```

These are not navigation cards pretending to be objects.

Each should behave according to its physical metaphor where that metaphor improves the experience.

The listening device is intentionally not frozen as separate “cassette” and “radio” exhibits. Those concepts may be two modes, skins, or states of the same physical listening object and may share most transport, playback, and navigation behavior.

---

## 3. The Museum Must Never Become an Obstacle

Physical interaction exists for discovery, orientation, emotion and delight.

It must **not** force repetitive work on a visitor who already knows what they want.

If someone searches for information located on page 14 of the notebook, Mayimbe should be able to:

```text
identify notebook as destination
        ↓
focus/open notebook
        ↓
automatically navigate toward page 14
        ↓
settle on requested content
```

The visitor should not have to manually turn fourteen pages.

Similarly:

```text
search for interview
→ listening device / radio mode

search for photograph
→ photo album

search for album
→ album collection

search for recording
→ cassette mode / album / listening experience
```

Mayimbe therefore distinguishes:

```text
DESTINATION
what the user wants

TRANSITION
how the experience carries them there
```

Destinations are semantic and persistent.

Transitions are presentation.

---

## 4. Museum Navigator

A central runtime service must coordinate navigation between archive entities and experiential exhibits.

Conceptually:

```ts
museum.navigate({
  entity: "album:voy-palla",
  presentation: "best"
});
```

The navigator resolves:

```text
visitor intent
    ↓
archive entity
    ↓
available representations
    ↓
preferred exhibit
    ↓
prepare exhibit
    ↓
focus/open exhibit
    ↓
navigate inside exhibit
    ↓
settled destination
    ↓
update browser history
```

The navigator should be independent of the visual framework whenever practical.

---

## 5. Multiple Representations of the Same Entity

An archive entity can appear in several experiences.

A recording might exist as:

```text
Recording
├── playable cassette track
├── track on physical album
├── notebook story reference
├── radio/listening segment
└── conventional archive record
```

An entity should therefore be able to declare available experiential representations.

Conceptually:

```ts
{
  entity: "recording:example",

  representations: [
    {
      exhibit: "listening",
      target: {
        mode: "cassette",
        cassette: "cassette-03",
        track: 4
      }
    },

    {
      exhibit: "album",
      target: {
        album: "album-07",
        track: 4
      }
    },

    {
      exhibit: "notebook",
      target: {
        section: "breakthrough",
        page: 11
      }
    }
  ]
}
```

This data must not be embedded exclusively inside the exhibit implementation.

---

## 6. Exhibit Contract

Every major interactive object should behave like a museum exhibit that the larger platform can control.

A preliminary interface:

```ts
interface MuseumExhibit<
  TTarget = unknown,
  TState = unknown
> {
  id: string;

  canPresent(target: MuseumTarget): boolean;

  preload(target?: TTarget): Promise<void>;

  activate(target?: TTarget): Promise<void>;

  navigate(
    target: TTarget,
    options?: TransitionOptions
  ): Promise<void>;

  suspend(): Promise<void>;

  getState(): TState;

  restore(state: TState): Promise<void>;

  dispose?(): Promise<void>;
}
```

The exact TypeScript API is not frozen yet.

The architectural contract is.

A museum exhibit must be externally navigable.

---

## 7. Notebook as Exhibit #1

The completed notebook becomes the first reference implementation of the exhibit model.

The notebook engine eventually needs commands equivalent to:

```ts
notebook.open();

notebook.goToPage(12);

notebook.goToSection("early-years");

notebook.next();

notebook.previous();

notebook.close();

notebook.getState();

notebook.restore(state);
```

Its internal rendering architecture does not need to be exposed.

The rest of Mayimbe should not care about:

```text
page mesh geometry
Three.js
DOM → texture snapshots
paper wear
stack geometry
cover animation
```

Those belong to the Notebook Engine.

We should **extract and integrate**, not casually rewrite, the notebook that already works.

---

## 8. Navigation Distance Should Affect Motion

Automatic navigation should retain physicality without becoming tedious.

For example:

```text
1–3 page distance
→ ordinary page turns

moderate distance
→ accelerated page sequence

large distance
→ compressed cinematic travel

prefers-reduced-motion
→ immediate or minimal-motion destination
```

The same principle applies to all exhibits.

The visitor should understand that the museum moved them somewhere without being forced to watch unnecessary animation.

---

## 9. Browser Navigation Is Part of Museum Navigation

Mayimbe should cooperate with normal browser behavior.

A journey such as:

```text
Desk
→ Notebook / Early Years
→ Album X
→ Photo Y
```

should make browser Back meaningfully return toward:

```text
Album X
```

rather than arbitrarily resetting the entire museum.

Important destinations should have canonical URLs.

Examples are illustrative, not final:

```text
/albums/voy-palla
/songs/example
/people/example
/photos/example
/stories/early-years

/museum/notebook/early-years
/museum/albums/voy-palla
```

The internal museum state may be richer than what appears in the URL.

---

## 10. Conventional Archive Access

The experiential museum cannot be the only way to use AntonySantos.com.

The site must also expose a straightforward archive.

Likely archive areas:

```text
Antony Santos
Albums
Songs
Recordings
People
Musicians
Performances
Places
Events
Photographs
Interviews
Stories
Artifacts
Sources
Timeline
```

Visitors arriving from Google should receive meaningful HTML content immediately.

They should not be required to enter the desk experience.

The archive should also provide an obvious way to say:

> Experience this in the museum.

---

## 11. Archive Data Must Be Presentation-Independent

Museum objects must not become the canonical storage location for historical facts.

A rough entity model:

```ts
Person
Album
Song
Recording
Performance
Place
Event
Photo
Interview
Story
Artifact
Source
```

Relationships should be explicit.

For example:

```text
Song ─appears_on→ Album

Recording ─performed_by→ Person

Recording ─recorded_at→ Place

Photo ─depicts→ Person

Photo ─documents→ Event

Story ─references→ Recording

Artifact ─documents→ Event
```

This enables the same material to power:

```text
notebook
album collection
search
timeline
photo album
archive pages
guided tours
future interfaces
```

---

## 12. Provenance Is a First-Class Concept

The museum should know **why it believes something**.

Historical assertions should be capable of carrying:

```text
source
source type
publication
original publication date
URL/reference
date accessed
attribution
rights information
confidence
editorial notes
```

Not all provenance needs to be visually prominent inside immersive exhibits.

But it must remain accessible through the archive.

Unknown or uncertain facts should remain uncertain.

For example:

```text
Date:
approximately 1993–1995

Location:
unconfirmed

Source:
...
```

Mayimbe should not silently transform folklore into fact.

---

## 13. Listening Device: Cassette / Radio

Cassette playback and radio/listening are intentionally modeled as potentially overlapping functionality rather than automatically separate systems.

They may ultimately be:

- one physical object with cassette and radio modes,
- two visual objects backed by one listening engine,
- or one primary listening experience with different historical interfaces.

That product decision remains open.

What should **not** happen is duplication of core playback behavior simply because the physical metaphors differ.

Potential cassette behaviors:

```text
insert
eject
play
pause
rewind
fast-forward
seek
switch cassette
select track
mechanical sounds
tape-state visualization
```

Potential radio/listening behaviors:

```text
tune by era
tune by year
tune by theme
select interview
select live performance
select recording
select program
```

Cassettes or listening programs may represent:

```text
albums
eras
live recordings
interviews
curated collections
```

The physical listening UI does not own global audio state.

It controls the shared Mayimbe audio system.

---

## 14. Global Audio Runtime

Because cassette/radio modes, album playback, and musical instruments may coexist, Mayimbe needs one shared audio architecture.

Conceptually:

```text
AudioManager
├── current media
├── playback state
├── position
├── duration
├── volume
├── mute
├── source exhibit / mode
├── transition / crossfade
├── Media Session integration
├── mechanical effects
└── ambient effects
```

A recording should be able to continue while the visitor moves from one exhibit to another where appropriate.

The physical object owns the **presentation of playback**.

Mayimbe owns playback itself.

---

## 15. Album Collection

Album artwork should be treated as museum material, not simple thumbnails.

An album object may eventually expose:

```text
front cover
back cover
disc / label
release information
credits
songs
musicians
recording details
photographs
related stories
sources
```

Possible interactions:

```text
pull album from collection
inspect front
turn over
zoom artwork
inspect credits
select song
play recording
open archive record
```

Album entities should remain connected to the same archive graph.

---

## 16. Photo Album

The Photo Album has a different editorial role from the notebook.

Notebook:

```text
interpretive
narrative
scrapbook
memory
cultural storytelling
```

Photo Album:

```text
archival
documentary
identified people
date
place
photographer
source
rights
certainty
```

The photo album may still feel warm and physical, but its informational discipline should be stronger.

---

## 17. Musical Instrument Exhibit

The instrument should offer something culturally meaningful rather than existing as a novelty.

A guitar-focused experience could teach how bachata arrangements are constructed.

Potential isolated components:

```text
requinto
rhythm guitar
bass
bongó
güira
voice
```

Possible functionality:

```text
select instrument layer
hear isolated/emphasized part
show musical phrase
show fretboard/string relationship
compare arrangement layers
```

This may become an educational exhibit.

---

## 18. Search Is an Experience Resolver

Search should eventually do more than return pages.

A result for a recording might offer:

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

Mayimbe can eventually infer appropriate presentation based on intent.

Examples:

```text
"photos of Antony in New York"
→ Photo Album

"Antony early life"
→ Notebook

"musicians on album X"
→ Album / archive credits

"1995 interview"
→ Listening Device / radio mode
```

Search results should always retain conventional archive access.

---

## 19. Exhibit Lifecycle and Lazy Loading

A future desk may contain many computationally expensive objects.

They must not all initialize at startup.

Desired lifecycle:

```text
DISTANT
metadata / preview only

LIKELY TO BE USED
preload lightweight dependencies

ACTIVE
initialize full exhibit

SUSPENDED
preserve state, reduce work

DISPOSED
release expensive resources if appropriate
```

Possible runtime concepts:

```ts
preload()
activate()
suspend()
resume()
dispose()
```

Three.js, large image collections, instrument samples and large audio assets should load only when justified.

---

## 20. Mobile Is Not Merely a Smaller Desktop

The desktop experience may present an entire desk.

Mobile may instead present one primary artifact at a time.

```text
Desktop
→ spatial museum desk

Mobile
→ focused artifact experience
```

Both use the same archive, navigation destinations and exhibit APIs.

Responsive behavior should be an experience-level concern, not merely CSS scaling.

---

## 21. Accessibility

Every immersive feature must have an accessible route.

Notebook:

```text
keyboard controls
semantic content
direct page/section navigation
reduced-motion travel
```

Audio:

```text
real transport controls
keyboard accessibility
track metadata
transcripts when speech exists
```

Photography:

```text
alt descriptions
captions
identifications
source information
```

Motion:

```text
prefers-reduced-motion
```

WebGL failure must not make archive information disappear.

---

## 22. Localization

The data architecture should be bilingual-ready from the beginning.

At minimum:

```text
Spanish
English
```

Not every piece of material necessarily needs immediate translation.

Some content may appropriately remain Spanish-first.

But the storage model must not make later localization painful.

Potential structure:

```ts
title: {
  es: "...",
  en: "..."
}
```

The exact implementation is not yet decided.

---

## 23. Media Architecture

Large media assets should be treated separately from archive metadata.

Mayimbe will eventually handle:

```text
photographs
album scans
artwork
audio
interviews
possibly video
textures
instrument samples
```

A media entity should eventually support information such as:

```text
original asset
web derivative
dimensions
duration
caption
alt text
rights
source
focal point
technical format
```

Heavy binary assets should ultimately be served through appropriate object storage/CDN infrastructure rather than turning the source repository into an uncontrolled media dump.

---

## 24. Performance Requirements

The museum should prioritize:

```text
fast first meaningful render
progressive enhancement
lazy exhibit loading
media preloading based on intent
resource disposal
responsive images
audio streaming where appropriate
minimal unnecessary hydration
reduced GPU work while idle
```

A visitor reading a story should not pay the runtime cost of a guitar simulator they never opened.

---

## 25. Preservation / Progressive Enhancement

The archive must remain durable even if the immersive layer changes years from now.

Core historical information should preferably exist as:

```text
HTML
structured metadata
stable URLs
portable media
```

rather than being recoverable only by executing a proprietary interaction runtime.

The museum experience can evolve.

The archive should endure.

---

## 26. Framework Requirements

Only after the above requirements are accepted do we choose the application framework.

Candidates currently worth evaluating include:

```text
Astro
Nuxt
TanStack Start
Next.js
custom Vite architecture
```

They should be evaluated against actual Mayimbe requirements rather than popularity.

Questions include:

```text
Can archive pages render excellent HTML?

Can a museum runtime persist across navigation?

Can global audio persist?

Can exhibits own imperative DOM/WebGL safely?

Can exhibits hydrate/load independently?

Can expensive engines be lazy-loaded?

Can museum state cooperate with browser history?

Can we deep-link into exhibits?

Can we statically generate large parts of the archive?

Can we add server behavior later?

Can we support localization cleanly?

Can we avoid forcing all archive content through client JS?

Can we control caching and asset loading?

Can the framework stay out of specialist rendering engines?
```

No framework has yet been selected.

---

## 27. Explicit Non-Goals

Mayimbe should **not** become:

```text
a giant Three.js website

a game engine pretending to be a website

a React/Vue application merely because a prototype used one

a collection of disconnected visual demos

an iframe-per-exhibit platform

a CMS whose schema dictates the museum

a conventional discography site with fancy animation

an experience that hides information from search/accessibility

a site that downloads every exhibit on startup
```

---

## 28. Initial Technical Boundaries

Even before framework selection, we can establish these boundaries:

```text
Archive data
≠ exhibit implementation

Museum destination
≠ animation

Audio playback
≠ listening-device UI

Notebook API
≠ notebook renderer

Media metadata
≠ media binary

Museum navigation
≠ framework router

Exhibit lifecycle
≠ component mount lifecycle
```

A framework may help implement some of these.

It should not erase the boundaries.

---

## 29. First Production Vertical Slice

Before building the listening device visually, Mayimbe should prove the platform concept.

The first vertical slice should contain:

```text
simple museum shell

Notebook
→ real exhibit

Listening Device
→ placeholder exhibit

Albums
→ placeholder exhibit

Photo Album
→ placeholder exhibit

MuseumNavigator

small test archive

basic search / dev navigator
```

Then demonstrate:

```text
Search "Early Years"
→ resolves to Notebook
→ notebook activates
→ automatically navigates to target section

Search "Album X"
→ resolves to Album exhibit
→ museum focuses placeholder

Search "Recording Y"
→ resolves to Listening Device placeholder

Open conventional archive entity
→ choose "Experience in museum"
→ MuseumNavigator reaches appropriate exhibit

Browser Back
→ restores previous meaningful museum state
```

If the architecture handles that cleanly, we will have strong evidence about which framework fits.

---

## 30. Guiding Principles

These principles should govern Mayimbe:

> **The museum is the structure. The love letter is the reason it exists.**

> **Don’t start with webpages. Start with objects.**

> **You don’t browse AntonySantos.com. You discover Antony Santos through his things.**

> **Experience on top. Archive underneath.**

> **The physical metaphor should guide the visitor, never obstruct them.**

> **A fact belongs to the archive. An exhibit is one way of experiencing it.**
