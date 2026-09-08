/* Stage 2 — asset readiness.
   The notebook is nothing but images, so the cover must not become grabbable
   (and no leaf may fly) until the artwork it needs is decoded. Critical set =
   the two cover boards + everything the first spread paints. Everything else
   in the library is warmed in the background right after. */

import { useEffect, useState } from "react";
import { ASSETS } from "./PageSurface";
import { sheetWear } from "./wear";
import { PAGES } from "./pages";


const decoded = new Set<string>();

function warm(path: string): Promise<void> {
  if (decoded.has(path)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new Image();
    const done = () => {
      decoded.add(path);
      resolve();
    };
    img.onload = () => (img.decode ? img.decode().then(done, done) : done());
    img.onerror = done;
    img.src = path;
  });
}

/** paths the first painted frames need, in priority order */
export function criticalPaths(total = PAGES.length): string[] {
  const first = sheetWear(1, total);
  const ids = [
    "cover-brick-front",
    "cover-brick-inside",
    first.substrate,
    first.edgeMask,
    ...first.layers.map((l) => l.asset),
  ];
  return [...new Set(ids)]
    .map((id) => ASSETS.find((a) => a.id === id)?.path)
    .filter((p): p is string => !!p);
}

/* The gate only needs what the very first frame of the opening turn paints:
   the two cover boards. Everything else is fetched in parallel immediately —
   it lands long before a leaf ever needs it, but it no longer holds the lock. */
function gatePaths(): string[] {
  return ["cover-brick-front", "cover-brick-inside"]
    .map((id) => ASSETS.find((a) => a.id === id)?.path)
    .filter((p): p is string => !!p);
}

/** kick every fetch off at import time, before React even mounts */
function warmAll() {
  const gate = gatePaths();
  const promise = Promise.all(gate.map(warm));
  criticalPaths().forEach((p) => void warm(p));
  ASSETS.forEach((a) => void warm(a.path));
  return promise;
}
const gatePromise = typeof window === "undefined" ? null : warmAll();

export function useAssetsReady() {
  /* always start unready: the server render has no decoded cache, and a
     client that starts ready would hydration-mismatch against it */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    let alive = true;
    void (gatePromise ?? warmAll()).then(() => alive && setReady(true));
    // a stuck network must never lock the notebook shut
    const bail = window.setTimeout(() => alive && setReady(true), 2000);
    return () => {
      alive = false;
      window.clearTimeout(bail);
    };
  }, [ready]);

  return ready;
}
