# Mayimbe Spatial Presentation

**Status:** Working design constraint  
**Scope:** Museum experience presentation only; not archive/search/interface UI

## Why this exists

The original `santos` prototype explored a spatial museum before Mayimbe had a formal Museum Navigator or exhibit lifecycle. Its implementation was unfinished, but several ideas were intentional and remain useful design evidence.

The production project should preserve the intent without copying the old implementation literally.

## Historical design evidence

The prototype used five large vertical regions inside a roughly `420vh` scene. Each active region was approximately `80vh` tall.

That sizing was intentional:

- the current physical object could dominate roughly 80% of the viewport;
- the remaining viewport could reveal portions of neighboring objects above/below;
- a persistent navigation area could remain visible near the bottom;
- touching/clicking a partially visible neighboring object could move the visitor into that object's experience.

The small bottom navigation boxes were placeholders for miniature reproductions of the larger museum objects — for example a tiny notebook, photo album, radio/cassette player, album object, or guitar. They were not intended to become generic pagination dots or conventional text navigation.

Conceptually, the miniatures form a map of the larger physical environment.

## Current principle

> The viewport is a window onto a larger museum environment, not a webpage slot containing one widget.

A focused physical exhibit should therefore normally occupy most, but not automatically all, of the available viewport.

The current notebook uses an approximately `80dvh` focus envelope as a production checkpoint. This preserves the useful historical composition while the broader museum layout is still being explored.

This value is a presentation constraint, not a permanent universal law for every exhibit.

## Navigation hierarchy

The same semantic destination may be reached through several visitor behaviors:

```text
partially visible neighboring object
        |
miniature object navigator
        |
natural spatial scroll / movement
        |
archive / search / story intent
        |
        v
MuseumNavigator
        |
semantic museum destination
        |
exhibit activation / focus
```

These are multiple inputs into one navigation architecture, not separate navigation systems.

## Mobile

Mobile is expected to rely more heavily on the miniature-object navigator because the viewport exposes less of the surrounding physical environment.

The active artifact should still dominate the view, and neighboring artifacts may still peek into the composition where useful, but direct miniature navigation provides a reliable way to move around the museum without forcing long spatial travel.

The miniature navigator should remain visually object-based while still exposing proper semantic buttons, accessible names, keyboard/focus behavior, and other required accessibility affordances.

## Desktop

The final desktop spatial composition is intentionally unresolved.

Larger screens provide lateral and compositional space that the original vertical prototype did not fully explore. Mayimbe should not prematurely encode desktop as merely a wider vertical rail, a fixed grid, or a specific 2D map.

Desktop is expected to lean more heavily on spatial discovery than mobile, but the exact layout should be explored separately.

Possible future layouts may expose several neighboring artifacts at once, arrange objects around a desk-like environment, or use other spatial relationships. These are presentation experiments, not changes to exhibit identity or navigation semantics.

## Architecture boundary

An exhibit must not know its permanent coordinates in the museum.

The following remain independent:

```text
Exhibit identity and behavior
MuseumNavigator / semantic destination
Museum spatial layout
Responsive presentation
```

Therefore a future desktop layout can rearrange the same notebook, listening device, album collection, photo album, guitar, and other exhibits without rewriting their engines or archive mappings.

## Website chrome boundary

Mayimbe deliberately has two broad presentation modes:

- **Interface mode:** archive, search, research, stories, people, releases, the museum desk/entry, and other conventional information-oriented UI retain normal website chrome.
- **Experience mode:** focused authored physical exhibits such as the notebook, guitar, radio/cassette player, photo album, and related art pieces may suppress conventional site chrome and let the museum environment dominate the viewport.

The persistent application runtime exists in both cases. Hiding chrome does not mean destroying or replacing the museum runtime.

## Current implementation rule

For the notebook checkpoint:

1. preserve the canonical native notebook renderer and its physical behavior;
2. keep the complete object visible inside an approximately `80dvh` focus envelope;
3. keep temporary Back/Forward controls out of the object's sizing math;
4. do not implement the final miniature navigator yet;
5. do not lock desktop into a final spatial arrangement yet;
6. leave the remaining viewport available for future spatial context and navigation.
