# Mayimbe Navigation and State Model

**Status:** Draft v0.1  
**Project:** AntonySantos.com  
**Repository:** `orielsy/mayimbe`

## 1. Purpose

Mayimbe needs a clear separation between historical truth, meaningful visitor destinations, persistent museum state, and temporary exhibit mechanics.

This document defines that separation and the role of the Museum Navigator.

The goal is to keep the museum understandable as it grows beyond the notebook into listening, albums, photographs, instruments, and future art pieces.

---

## 2. Core Model

Mayimbe uses four broad categories of state:

```text
1. Archive Truth
2. Semantic Destination / URL State
3. Museum Runtime State
4. Exhibit-Local State
```

A useful flow is:

```text
Archive Entity
      ↓
Semantic Destination
      ↓
Museum Navigator
      ↓
Persistent Museum Shell
      ↓
Exhibit
      ↓
Exhibit-Local Mechanics
```

The layers should remain conceptually separate even when one implementation coordinates several of them.

---

## 3. Archive Truth

Archive truth describes the museum's canonical knowledge about Antony Santos and the collection.

Examples include:

```text
albums
songs
recordings
people
places
performances
photos
stories
sources
relationships
captions
dates
provenance
```

Archive truth is not UI state.

It should remain valid across:

```text
page refreshes
new devices
framework changes
visual redesigns
new exhibits
```

A fact belongs to the archive, not to the notebook, album viewer, cassette UI, or any other individual presentation.

---

## 4. Semantic Destination

A semantic destination describes where the visitor meaningfully wants to go.

Examples:

```text
Notebook → Early Years
Album Collection → Album X
Photo Album → Photo Y
Listening Experience → Recording Z
Desk Overview
```

The destination should describe meaning rather than implementation detail.

For example:

```ts
{
  exhibit: "notebook",
  target: "early-years"
}
```

is preferable to encoding internal mechanics such as:

```text
page=12
cover=open
leftStack=6
```

Physical coordinates may still exist internally, but semantic identity should outrank them whenever possible.

If a notebook section moves from one physical page to another later, a semantic deep link to that section should still work.

---

## 5. URL State

The URL should represent meaningful destinations that another visitor could reasonably revisit or share.

Guiding principle:

> **The URL should contain meaning, not machinery.**

Illustrative examples:

```text
/museum/notebook/early-years
/museum/albums/example
/museum/photos/example
```

Exact URL structure is not yet frozen.

A copied URL should ideally reproduce the same meaningful destination, even if the exact animation used to get there changes.

The URL does not need to encode every piece of museum runtime state.

---

## 6. Museum Runtime State

Museum runtime state describes the ongoing visit across exhibits.

Examples may include:

```text
current focused exhibit
previous meaningful destination
desk mode
current audio item
playback state
playback position
volume
search state
navigation trail
accessibility preferences
motion preferences
active transition intent
```

This state belongs above individual exhibits because several parts of the museum may need to understand it.

Some runtime state may be reflected in the URL.

Some may remain in memory or be persisted separately.

The deciding question is whether the state is meaningful to the broader museum rather than only to one object.

---

## 7. Exhibit-Local State

Exhibit-local state describes the internal mechanical realization of one art piece.

Examples:

```text
notebook page-turn progress
page mesh deformation
cassette reel rotation
cassette door animation position
album rotation angle
photo hover state
drag position
transient animation frame
```

The rest of Mayimbe should generally not depend on these values.

If only the object itself needs to understand a value, it should remain inside that exhibit.

Guiding rule:

> **If another exhibit or the browser needs to understand it, promote it upward. If only the object needs it, keep it local.**

---

## 8. The Museum Navigator

The Museum Navigator is Mayimbe's central system for moving a visitor between meaningful museum destinations.

It is not a visible navigation bar and it is not the exhibit animation engine.

It acts as a traffic controller between visitor intent, archive relationships, the persistent shell, and individual exhibits.

Conceptually:

```text
WHAT does the visitor want?
        ↓
WHERE should it be experienced?
        ↓
WHICH exhibit should handle it?
        ↓
WHAT meaningful destination should history record?
        ↓
Tell the exhibit where to go
```

It should not know how the notebook page bends, how cassette reels rotate, or how an album flips.

Those mechanics remain exhibit-local.

---

## 9. Why the Navigator Exists

Without a central navigation layer, individual parts of Mayimbe would begin to know too much about one another.

Undesirable coupling:

```text
Search
→ knows notebook internals

Notebook
→ knows album internals

Album
→ knows listening-device internals

Archive page
→ knows photo-album internals
```

Preferred model:

```text
Search ───────┐
Archive ──────┤
Notebook ─────┤
Album ────────┤
              ▼
       Museum Navigator
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
Notebook    Albums     Listening
```

Every source of navigation asks Mayimbe to reach a meaningful destination.

The Navigator resolves the appropriate exhibit and target.

---

## 10. Example: Search to Notebook

A visitor searches for “Early Years.”

Search resolves an archive entity:

```ts
{
  entity: "story:early-years"
}
```

Curatorial metadata identifies the preferred experience:

```ts
{
  exhibit: "notebook",
  target: "early-years"
}
```

The Museum Navigator coordinates:

```text
focus notebook
→ activate notebook
→ request Early Years
→ update meaningful history state
```

The Notebook Exhibit then decides how to realize the request physically:

```text
open cover
→ normal page turns
→ accelerated travel
→ compressed transition
→ instant reduced-motion settle
```

The Navigator cares about the destination.

The Notebook owns the journey inside itself.

---

## 11. Example: Listening State

A recording may exist in several layers simultaneously.

Archive truth:

```text
recording:example
```

Museum runtime:

```ts
{
  recording: "recording:example",
  playing: true,
  position: 83.2,
  volume: 0.7
}
```

Listening exhibit-local state:

```ts
{
  cassetteInserted: true,
  reelRotation: 127.4,
  doorPosition: "closed"
}
```

If the visitor leaves the listening object and opens the notebook:

```text
listening visual mechanics
→ may suspend

audio runtime
→ may continue

recording identity
→ remains tied to archive truth
```

This separation is intentional.

---

## 12. Refresh Semantics

Meaningful state should be recoverable after refresh when practical.

For example, if the visitor is at:

```text
Museum
→ Notebook
→ Early Years
```

refresh should be able to reconstruct that meaningful destination.

Mayimbe may perform a shortened or altered entrance transition before settling there.

It does not need to restore a page halfway through a bend or an album halfway through a 3D rotation.

Guiding principle:

> **Meaningful state survives. Transitional state does not.**

---

## 13. Browser History

Browser history should represent meaningful visitor decisions rather than animation steps.

A visit may look like:

```text
Desk
→ Notebook / Early Years
→ Notebook / Breakthrough
→ Album X
→ Photo Y
```

Browser Back should move through meaningful destinations:

```text
Photo Y
→ Album X
→ Notebook / Breakthrough
→ Notebook / Early Years
→ Desk
```

Mayimbe should not create history entries for:

```text
animation frames
page curl progress
camera interpolation
hover states
mechanical button depression
```

Guiding principle:

> **History records visitor decisions, not animation steps.**

Whether every manual page turn becomes a distinct history entry should be decided based on whether the page represents a meaningful navigable content unit, not merely because a physical sheet moved.

---

## 14. Deep Links

A deep link should resolve directly to a semantic destination.

For example:

```text
museum → notebook → early-years
```

The Museum Navigator then coordinates restoration of the persistent shell and target exhibit.

The transition used to enter that destination can vary based on:

```text
current museum state
navigation distance
performance constraints
reduced-motion preference
whether this is a fresh load or in-session transition
```

Destination and transition remain separate concepts.

---

## 15. Search and Curatorial Routing

Search should return semantic destinations rather than implementation commands.

Conceptually:

```ts
{
  entity: "story:early-years",
  preferredExperience: {
    exhibit: "notebook",
    target: "early-years"
  }
}
```

Search should not issue commands such as:

```ts
turnPage();
turnPage();
turnPage();
```

Instead it requests:

```ts
navigateTo("notebook:early-years");
```

The exhibit decides how to physically reach that target.

---

## 16. State Promotion Rule

Mayimbe should avoid prematurely promoting every internal value into global application state.

When evaluating a new piece of state, ask:

```text
Does the archive need to know this?
Does another exhibit need to know this?
Does the Museum Navigator need it?
Should the browser URL/history reproduce it?
Should it survive a refresh?
```

If the answer is no to all of those, the state should probably remain exhibit-local.

This rule is intended to keep the persistent runtime small and understandable.

---

## 17. Framework Implications

This state model creates concrete requirements for eventual framework selection.

The production architecture must comfortably support:

```text
semantic routing
persistent museum runtime state
long-lived audio state
browser history integration
independently loaded exhibits
exhibit-owned imperative mechanics
SSR/SSG archive documents
deep-link restoration
minimal coupling between exhibits
```

The framework should help implement these boundaries rather than forcing archive truth, URL state, museum runtime state, and exhibit mechanics into one undifferentiated client store.

No framework is selected by this document.

---

## 18. Settled Principles

> **Archive truth describes what the museum knows.**

> **A semantic destination describes where the visitor meaningfully wants to go.**

> **The Museum Navigator coordinates movement between meaningful destinations.**

> **The persistent Museum Runtime holds cross-exhibit visit state.**

> **Exhibit-local state belongs to the art piece that needs it.**

> **The URL should contain meaning, not machinery.**

> **Meaningful state survives; transitional state does not need to.**

> **History records visitor decisions, not animation steps.**

> **If another exhibit or the browser needs to understand a state value, promote it upward. Otherwise keep it local.**
