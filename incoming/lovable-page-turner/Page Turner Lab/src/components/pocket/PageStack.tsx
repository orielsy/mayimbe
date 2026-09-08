/* Stage 2 — deterministic page-block edge.
   Purely decorative strata drawn with the Stage 1 edge masks and substrates,
   contained inside the cover footprint. No randomness at runtime. */

import { asset } from "./PageSurface";

const MASKS = ["edge-mask-a", "edge-mask-b", "edge-mask-c"] as const;

/** deterministic 0..1 from an integer */
function h(i: number) {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
}

export function PageStack({ count = 9, depth = 1 }: { count?: number; depth?: number }) {
  const strata = Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1); // 0 = deepest, 1 = closest to the top sheet
    const r = h(i * 7 + 3);
    const r2 = h(i * 13 + 11);
    const x = (1 - t) * 1.9 * depth + r * 0.5 * depth; // fore-edge accumulation, in %
    const y = ((1 - t) * 0.35 + r2 * 0.18) * depth;
    return {
      i,
      mask: MASKS[i % MASKS.length]!,
      substrate: i % 3 === 0 ? "substrate-carried" : "substrate-protected",
      x,
      y,
      shade: 0.1 + (1 - t) * 0.28,
    };
  });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {strata.map((s) => (
        <span
          key={s.i}
          className="absolute inset-0"
          style={{
            transform: `translate(${s.x}%, ${s.y}%)`,
            WebkitMaskImage: `url(${asset(s.mask).path})`,
            maskImage: `url(${asset(s.mask).path})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            zIndex: s.i,
          }}
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${asset(s.substrate).path})`,
              backgroundSize: "100% 100%",
              filter: `brightness(${1 - s.shade * 0.55}) saturate(0.9)`,
            }}
          />
          {/* warm contact seam along the fore edge */}
          <span
            className="absolute inset-y-0 right-0 w-[1.6%]"
            style={{
              background:
                "linear-gradient(to left, rgba(58,38,20,0.55), rgba(58,38,20,0.12) 60%, transparent)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
