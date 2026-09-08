/* Stage 2 — wear story, ported from the /notebook-lab-native model.
   The lab's rules, kept intact, expressed over the Stage 1 static layers:

   1. One global notebook age shared by every sheet.
   2. Two families — Carried/Handled at the front, Protected Interior deep in
      the block — reached by a monotonic exposure decline, never per-page taste.
   3. A humidity episode owned by a run of neighbouring sheets, rising, peaking
      and fading, not a page property.
   4. Shared edge history: the whole block was cut and thumbed together, so the
      edge masks band by exposure instead of alternating per sheet.
   5. Rare trauma: sparse, deterministic, never on every page. */

import type { Layer, Recipe } from "./PageSurface";

export const NOTEBOOK_AGE = 0.88;

/** humidity episode: which sheet took the damp, and how far it spread */
const HUMID_CENTER = 3.6;
const HUMID_SIGMA = 1.35;
const HUMID_AMP = 0.95;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** deterministic 0..1 from an integer — no runtime randomness */
function hash(i: number) {
  const x = Math.sin(i * 91.7331 + 17.13) * 43758.5453;
  return x - Math.floor(x);
}

/** monotonic decline: page 1 lived on the outside, the last pages were protected */
export function exposureOf(n: number, total: number) {
  const t = total > 1 ? (n - 1) / (total - 1) : 0;
  return clamp01(1 - Math.pow(t, 0.82) * 0.86);
}

/** the damp episode, shared across neighbours */
export function humidityOf(n: number) {
  const d = (n - HUMID_CENTER) / HUMID_SIGMA;
  return clamp01(HUMID_AMP * Math.exp(-0.5 * d * d));
}

/** sparse, deterministic accidents */
export function traumaOf(n: number) {
  return hash(n * 31 + 7) < 0.22 ? 0.55 + hash(n * 13) * 0.35 : 0;
}

/* The front-of-block event: page 1 took a spill, a hand smear and the worst of
   the thumbing. It is one accident, not a page property, so it echoes onto the
   two sheets behind it at a decaying strength — the front of the book reads as
   a damaged REGION rather than one odd page. */
const FRONT_TRAUMA = [1, 0.52, 0.24];
export function frontTraumaOf(n: number) {
  return FRONT_TRAUMA[n - 1] ?? 0;
}

function push(out: Layer[], asset: string, opacity: number, extra?: Partial<Layer>) {
  if (opacity > 0.04) out.push({ asset, opacity: Math.min(1, opacity), ...extra });
}

/** Resolve one sheet's full layer stack from the shared story. */
export function sheetWear(n: number, total: number): Recipe {
  const age = NOTEBOOK_AGE;
  const exposure = exposureOf(n, total);
  const humid = humidityOf(n);
  const trauma = traumaOf(n);
  const front = frontTraumaOf(n);
  const mirror = n % 2 === 0;

  // family: carried at the front, protected deep in the block
  const substrate =
    humid > 0.55
      ? "substrate-humidity"
      : exposure > 0.5
        ? "substrate-carried"
        : "substrate-protected";

  // shared edge history — banded, so neighbouring sheets were cut and thumbed
  // together (original silhouettes; trauma is staining only)
  const edgeMask =
    exposure > 0.62
      ? "edge-mask-a"
      : exposure > 0.3
        ? "edge-mask-b"
        : "edge-mask-c";

  const layers: Layer[] = [];
  push(layers, "fibre-stock", 0.68 + 0.2 * exposure, { repeat: true });
  push(layers, "tonal-drift", age * (0.34 + 0.5 * exposure + 0.45 * humid));
  push(layers, "humidity-bloom", humid);
  push(layers, "water-stain", humid * 0.82, { mirror });
  push(layers, "foxing-heavy", age * humid * 0.9);
  push(layers, "foxing-light", age * (0.2 + 0.38 * exposure) * (1 - 0.5 * humid), { mirror });
  push(layers, "grime-handling", age * (0.12 + 0.82 * exposure) + humid * 0.2);
  push(layers, "smudge-abrasion", age * (0.15 + 0.5 * exposure));
  push(layers, "edge-oxidation", 0.35 + 0.62 * exposure);
  push(layers, "crease", Math.max(trauma, exposure > 0.72 ? 0.55 * exposure : 0), { mirror });

  // the front-of-block accident, decaying onto the sheets behind it
  if (front) {
    push(layers, "trauma-tide-lines", 0.9 * front, { mirror });
    push(layers, "trauma-ring-stain", front, { mirror: n % 3 === 0 });
    push(layers, "trauma-thumb-grime", 0.95 * front);
    push(layers, "trauma-hand-smear", 0.85 * front, { mirror });
    push(layers, "trauma-corner-fold", 0.8 * front);
  }

  return {
    id: `sheet-${n}`,
    label:
      front === 1
        ? "Front of block — trauma"
        : humid > 0.5
        ? "Humidity affected"
        : exposure > 0.5
          ? "Carried / handled"
          : "Protected interior",
    note: `exposure ${exposure.toFixed(2)} · humidity ${humid.toFixed(2)}${trauma ? " · trauma" : ""}`,
    substrate,
    edgeMask,
    layers,
  };
}
