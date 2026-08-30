# Mayimbe Archive Model

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Purpose

Mayimbe's archive is the canonical knowledge layer beneath the interactive museum.

The notebook, listening experience, album collection, photo album, search, conventional archive pages, and future art pieces should all consume the same underlying historical model.

The archive is intentionally presentation-independent.

A fact does not belong to the notebook, cassette UI, album viewer, or any other exhibit. It belongs to the archive. Exhibits are ways of experiencing that knowledge.

The archive should be logically graph-shaped, but this document does **not** select a database, CMS, storage engine, or frontend framework.

---

## 2. Core Principle: Maximum Capable, Minimum Required

Mayimbe's data model describes what the archive is **capable of knowing**, not what it is expected to know.

Historical information will often be incomplete, especially for older recordings, performances, photographs, personnel, locations, dates, and production details.

That is valid archival state.

A record must not require fields simply because they would be interesting to have.

For example, a recording may legitimately contain:

```text
Known
✓ title
✓ associated release
✓ approximate year

Unknown
? exact recording date
? studio
? individual musicians
? producer
? session personnel
```

The archive should still publish and use that recording.

Guiding principles:

> **Unknown historical information is a valid state, not a schema failure.**

> **Mayimbe should become richer as evidence is discovered without requiring completeness before material can be published.**

> **The archive must never invent information merely to satisfy the schema.**

---

## 3. Missing Information

Unknown relationships should normally be absent rather than represented as synthetic placeholder entities.

Preferred:

```text
Song X
  ↓
Recording X
  ↓
Release Y
```

when the personnel are unknown.

Avoid unnecessary structures such as:

```text
Recording X
├── guitarist: UNKNOWN
├── bassist: UNKNOWN
├── bongó: UNKNOWN
├── güira: UNKNOWN
└── studio: UNKNOWN
```

If new evidence later identifies a musician, studio, date, or other relationship, the graph can be enriched without restructuring the existing record.

---

## 4. Core Archive Entities

The model should remain extensible, but Mayimbe can begin with a relatively small set of high-value entities.

Initial core entities:

```text
Person
Place
Song
Recording
Release
Edition
MediaItem
Story
Source
```

Additional entities should be introduced when actual material justifies them:

```text
Organization
Event
Instrument
Artifact
Collection
Claim
```

Not every entity type needs a visible archive section in the first release.

The schema should support growth without requiring Mayimbe to populate a large empty taxonomy.

---

## 5. Stable Identity

Every canonical entity must have a stable identifier independent of its display name and URL.

Example:

```yaml
id: person:antony-santos
slug: antony-santos
```

Guiding rule:

```text
id
= permanent archival identity

slug
= web presentation
```

Slugs and URLs may change.

Entity identifiers should not.

Human-readable stable identifiers are acceptable as long as they are treated as immutable once published.

---

## 6. Person

A `Person` represents an individual relevant to the archive.

Possible roles may include:

```text
artist
musician
composer
producer
photographer
journalist
collaborator
family member
interview subject
historical witness
```

A person may contain only what is genuinely known.

Potential fields:

```text
id
canonical name
aliases / stage names
birth / death information when known
biographical summary
roles
related media
sources
```

Antony Santos should remain structurally a `Person` rather than requiring a special one-off data type.

---

## 7. Place

`Place` represents geographic or physical locations relevant to the archive.

Places may be hierarchical.

Example:

```text
Dominican Republic
    ↓
Monte Cristi
    ↓
Las Matas de Santa Cruz
```

Possible place types include:

```text
country
region
province
city
town
neighborhood
venue
studio
address
```

Exact coordinates should be optional.

A place can exist meaningfully even when only a broad location is known.

---

## 8. Music Model: Song → Recording → Release → Edition

Mayimbe should distinguish between a musical work, a specific recorded performance, the conceptual commercial release, and a particular physical/commercial edition.

```text
Song
   ↓
Recording
   ↓
Release
   ↓
Edition
```

### Song

A `Song` is the musical/compositional work.

It may have multiple recordings across time.

### Recording

A `Recording` is a specific recorded performance or master.

Possible examples:

```text
studio recording
live recording
radio performance
alternate take
later re-recording
```

### Release

A `Release` is the conceptual published collection or product.

Examples:

```text
album
single
compilation
EP
```

### Edition

An `Edition` is a specific issued version of a release.

Examples:

```text
cassette edition
LP pressing
CD reissue
Dominican edition
US edition
later remaster/reissue
```

Different editions may have different:

```text
cover artwork
back cover
label artwork
catalog numbers
track order
format
release year
territory
```

This distinction is particularly important because Mayimbe intends to treat album artwork and physical releases as museum material rather than as generic thumbnails.

---

## 9. Credits and Personnel

Personnel and credits should be modeled as relationships when they are actually known.

Avoid storing historically significant credits only as disconnected strings.

Conceptually:

```text
recording:xyz
      │
      ├── performed_by → person:a
      │        role: musician
      │        instrument: requinto
      │
      ├── performed_by → person:b
      │        role: musician
      │        instrument: bongó
      │
      └── written_by → person:c
```

However, personnel must never be required for a recording to exist.

If the names of the musicians on an early recording are unavailable, Mayimbe records only what is known.

---

## 10. Relationships

Relationships are first-class connections between entities.

Examples:

```text
Song ─realized_by→ Recording
Recording ─included_on→ Edition
Edition ─edition_of→ Release
Recording ─performed_by→ Person
Recording ─recorded_at→ Place
Photo ─depicts→ Person
Story ─references→ Recording
```

A conceptual relationship structure may eventually resemble:

```ts
interface Relationship {
  id: string;
  from: EntityRef;
  type: RelationshipType;
  to: EntityRef;

  qualifiers?: Record<string, unknown>;
  date?: TemporalValue;
  certainty?: Certainty;
  sources?: EntityRef[];
}
```

The exact implementation is not frozen.

Relationships should support evidence and uncertainty where useful.

---

## 11. Partial and Uncertain Dates

Historical dates must not be forced into false precision.

Mayimbe should be capable of representing:

```text
exact date
month only
year only
circa year
date range
unknown date
```

Conceptually:

```ts
type TemporalValue =
  | { kind: "exact"; value: "1994-06-12" }
  | { kind: "month"; value: "1994-06" }
  | { kind: "year"; value: 1994 }
  | { kind: "circa"; value: 1994 }
  | { kind: "range"; from: 1993; to: 1995 }
  | { kind: "unknown" };
```

Mayimbe should display the uncertainty honestly rather than converting an approximate year into an invented exact date.

---

## 12. Certainty

The archive should support uncertainty without pretending to mathematical precision.

Avoid values such as:

```text
confidence: 0.83
```

Preferred conceptual vocabulary:

```ts
type Certainty =
  | "verified"
  | "probable"
  | "uncertain"
  | "disputed";
```

`unknown` is generally represented by the absence of a claim or relationship rather than by an assertion with low confidence.

Editorial notes may explain why something is considered probable, uncertain, or disputed.

---

## 13. Source

A `Source` is a canonical archival reference that can support multiple facts, relationships, stories, and claims.

Potential source types include:

```text
book
article
newspaper
magazine
liner notes
record label
interview
audio
video
website
photograph
personal communication
archival document
```

Potential fields:

```text
id
type
title
author
publication
publication date
URL/reference
access date
notes
rights / attribution when applicable
```

Mayimbe should avoid scattering unstructured URLs throughout unrelated records when a reusable source entity would better preserve provenance.

---

## 14. Claims

Mayimbe does not need to turn every field into a formal RDF-like statement.

Simple known information should remain simple.

However, historically significant assertions that are uncertain, disputed, or supported by multiple sources may benefit from a `Claim` structure.

Conceptually:

```ts
{
  id: "claim:example",
  subject: "person:x",
  predicate: "began-performing-in",
  value: { year: 1989 },
  certainty: "probable",
  sources: [
    "source:interview-a",
    "source:newspaper-b"
  ],
  note: "Sources disagree by approximately one year."
}
```

Claims should be introduced where they add genuine archival value, not as bureaucracy around every trivial fact.

---

## 15. MediaItem and MediaAsset

Mayimbe should distinguish the historical media object from its technical files.

```text
MediaItem
≠
MediaAsset
```

A `MediaItem` represents the archival object.

Examples:

```text
photograph
interview recording
video recording
album scan
document scan
poster image
```

A photograph may know:

```text
date or approximate date
photographer when known
people depicted
place
event/context
caption
source
rights
```

The associated technical assets may include:

```text
original TIFF
archival JPEG
1600px web image
800px derivative
thumbnail
alternate crop
```

Changing a CDN, file format, crop, or derivative must not alter the historical identity of the `MediaItem`.

---

## 16. Artifact vs Exhibit

Mayimbe must distinguish between a real historical artifact and a Mayimbe-authored interactive exhibit.

### Artifact

An `Artifact` is a real historical or physical object documented by the archive.

Examples:

```text
ticket
concert flyer
commercial cassette
poster
record sleeve
letter
newspaper clipping
physical record
```

### Exhibit

An exhibit is an authored Mayimbe experience.

Examples:

```text
Cuaderno / Notebook experience
Listening experience
Album Collection experience
Photo Album experience
Instrument experience
```

The notebook may visually resemble an archival object while remaining interpretive art.

A fictional or editorially assembled cassette may be part of an exhibit presentation without claiming to be an original historical artifact.

This separation is essential to Mayimbe's archival honesty.

---

## 17. Story

A `Story` represents editorial or narrative interpretation built from archive material.

Examples:

```text
story:early-years
story:breakthrough
story:new-york
```

A story may reference:

```text
people
songs
recordings
releases
places
photos
events
sources
```

The notebook can present a Story, but the Story should not be canonically trapped inside a physical notebook page.

Conceptually:

```text
Archive facts
      ↓
Story
      ↓
Notebook representation
```

If the notebook is redesigned later, the Story survives.

---

## 18. Collection

A `Collection` is an intentionally assembled group of archive entities.

Examples:

```text
Early photographs
New York performances
Essential recordings
1990–1995
Studio photographs
Radio interviews
```

Collections may be curatorial rather than historical.

They can power multiple experiences such as:

```text
photo album chapters
listening programs
cassette compilations
album groupings
guided tours
search landing areas
```

This prevents individual exhibits from each hardcoding their own duplicate groupings.

---

## 19. Experience Mapping

The archive and the museum's curatorial routing should remain separate concepts.

Archive data answers:

> What do we know?

Experience Mapping answers:

> How do we want visitors to experience it?

Rather than embedding all museum-routing decisions directly inside canonical archive entities, Mayimbe should maintain an explicit curatorial mapping layer.

Conceptually:

```ts
{
  subject: "story:early-years",
  role: "primary",
  destination: {
    exhibit: "notebook",
    target: "early-years"
  },
  label: {
    en: "Read in the Cuaderno",
    es: "Leer en el Cuaderno"
  }
}
```

For a recording:

```ts
{
  subject: "recording:example",
  role: "primary",
  destination: {
    exhibit: "listening",
    target: "recording:example"
  }
}
```

This layer expresses **curatorial intent** without contaminating historical truth.

It also allows the museum to be redesigned later without rewriting the archive.

---

## 20. Localization

Only human-facing text that benefits from localization should be localized.

Conceptually:

```ts
type LocalizedText = {
  es?: string;
  en?: string;
};
```

Possible localized fields include:

```text
descriptions
captions
editorial titles
story text
experience labels
archive explanations
```

Canonical proper names should not be duplicated merely to satisfy a localization structure.

---

## 21. Information Availability Should Shape the Museum

Mayimbe should emphasize material based on what can actually be documented rather than on an idealized notion of a complete music database.

Likely areas of stronger coverage may include:

```text
release titles
album artwork
track lists
songs
commercial recordings
approximate release years
later performances
interviews
some photographs
major career events
public stories
press coverage
```

Likely areas of weaker or permanently incomplete coverage may include:

```text
exact personnel on early recordings
exact session dates
studio locations
early touring personnel
photographer identities
exact dates of old photographs
minor performance dates
technical production details
```

The product should remain valuable even when many of these details are unknown.

Mayimbe's credibility comes from documenting what survives, preserving provenance, and distinguishing known facts from uncertainty — not from pretending the archive is complete.

---

## 22. Community Leads and Future Research

Mayimbe may eventually provide ways for knowledgeable visitors, musicians, collectors, family members, or historical witnesses to surface leads.

Examples might include:

```text
identify a person in a photograph
suggest a date or venue
identify a release edition
provide an original physical source
clarify personnel credits
```

Such contributions should be treated as research leads until verified.

The archive should not automatically convert visitor submissions into historical truth.

---

## 23. No Completion Percentage

Historical archives do not have a meaningful universal completion percentage.

Mayimbe should avoid concepts such as:

```text
Album record: 61% complete
```

That implies a known complete dataset merely waiting to be filled in.

Prefer the archival framing:

```text
What we know
What we can document
What remains uncertain
```

---

## 24. Logical Graph, Storage Neutral

The archive is logically graph-shaped because its value comes from relationships between entities.

That does **not** imply that Mayimbe needs a graph database.

Possible initial storage could be structured files such as:

```text
archive/
├── people/
├── places/
├── songs/
├── recordings/
├── releases/
├── editions/
├── media/
├── stories/
├── sources/
├── relationships/
├── experiences/
└── optional-later/
    ├── organizations/
    ├── events/
    ├── instruments/
    ├── artifacts/
    ├── collections/
    └── claims/
```

Those files could be validated at build time.

Future storage options may include:

```text
JSON / YAML / Markdown
SQLite
PostgreSQL
CMS
other structured storage
```

The logical model should remain portable across storage implementations.

---

## 25. Initial Implementation Scope

Mayimbe should not begin by implementing every possible entity and relationship.

A practical initial archive can focus on:

```text
People
Places
Songs
Recordings
Releases
Editions
Media
Stories
Sources
Relationships
Experience Mappings
```

Additional concepts should be introduced when real archive material or exhibit requirements justify them.

This keeps the archive extensible without building a large empty schema.

---

## 26. Conceptual Architecture

```text
                        ARCHIVE

        ┌─────────────────────────────────┐
        │                                 │
      People                            Places
        │                                 │
        └──────────── Relationships ──────┘
                         │
      ┌──────────────────┼───────────────────┐
      │                  │                   │
    Songs            Recordings           Media
      │                  │                   │
      │                  │                   │
      └──────────── Relationships ───────────┘
                         │
                    Releases
                         │
                      Editions
                         │
                 Sources / Evidence
                         │
                      Stories
                         │
                Optional Collections


                  CURATORIAL LAYER

               Experience Mappings
                         │
                         ▼

                  MUSEUM NAVIGATOR
                         │
           ┌─────────────┼──────────────┐
           ▼             ▼              ▼
       Notebook       Listening       Albums
                                      Photos
                                   Instrument
```

---

## 27. Settled Principles

> **The archive is canonical; exhibits are presentations of it.**

> **Mayimbe's data model describes what the archive is capable of knowing, not what it is expected to know.**

> **Unknown historical information is valid archival state.**

> **Missing information must never be invented to satisfy the schema.**

> **The archive should become richer as evidence is discovered without requiring completeness before publication.**

> **Song, Recording, Release, and Edition are distinct concepts.**

> **Relationships should be first-class when they carry historical meaning.**

> **Provenance and uncertainty should be representable without overengineering every simple fact.**

> **A real Artifact and a Mayimbe Exhibit are different things.**

> **Experience Mapping expresses curatorial intent and should remain separate from archive truth.**

> **The archive is logically graph-shaped but storage-technology neutral.**
