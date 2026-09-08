# Fix the flash at the start of closing

## What's wrong

Opening was fixed by holding the old picture underneath until the cover swings past halfway. Closing never got the same treatment — it does the opposite and shows the finished state right away:

- The moment the close is triggered, the notebook's resting layer switches to the closed cover. That closed cover sits underneath the cover that is still swinging shut, so you see the end result instantly.
- At the same moment the left-hand page is removed outright, so the open spread disappears in one frame.

Both are confirmed in the notebook component: the "closed" flag flips as soon as the close begins, which swaps the resting layer to the front cover and drops the left leaf.

## The fix

Make closing the mirror image of opening:

1. Keep the open spread painted underneath while the cover is in flight — the resting inside-cover + page and the left-hand page stay visible.
2. Reveal the closed cover only once the swinging cover has passed the halfway point, using the same step-timed reveal already used for opening (no new animation style, no timing guesswork).
3. Hide the held-open spread at the same crossover frame, so exactly one thing is ever visible at the seam.
4. Reduced motion keeps the instant switch it has today.

Result: pressing close swings the cover shut over the still-visible page, and the closed cover only appears behind it after the cover has swept past — no flash.

## Technical notes

- `src/components/pocket/PocketNotebook.tsx`: distinguish `closing` from `closed-front`. During `state.turn?.kind === "close"`, render the open-spread resting layer and the left leaf (as when open) with a `pn-close-hold` class, and render the closed `CoverFront` resting layer with a `pn-cover-reveal` class instead of showing it immediately. `interactive` / `hintVisible` stay tied to `closed-front` only.
- `src/styles.css`: add `@keyframes pn-close-hold` (visible until ~62%, hidden after) and `@keyframes pn-cover-reveal` (hidden until ~62%, visible after), both `step-end forwards` over the existing 620ms cover duration, matching `pn-cover-hold` / `pn-left-reveal`. Add `prefers-reduced-motion: reduce` overrides.
- No change to the state machine, turn geometry, or asset loading.

## Verification

Screenshot the close at ~30%, ~55% and settled; confirm no closed cover visible before the crossover, and the settled frame identical to today.
