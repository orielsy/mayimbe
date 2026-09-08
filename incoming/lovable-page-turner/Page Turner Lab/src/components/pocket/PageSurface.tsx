/* Stage 2 — static-asset page composition.
   Every sheet is: substrate image + irregular edge mask + independent wear
   overlays from the Stage 1 manifest, with live DOM text on top.
   Nothing is flattened, nothing is drawn at runtime. */

import type { ReactNode } from "react";
import manifest from "@/assets/notebook-assets.manifest.json";
import bandPhoto from "@/assets/notebook-photo-band.jpg";

import type { PocketPage } from "./pages";

type Asset = (typeof manifest)["assets"][number];
export type Layer = { asset: string; opacity: number; mirror?: boolean; repeat?: boolean };
export type Recipe = {
  id: string;
  label: string;
  note: string;
  substrate: string;
  edgeMask: string;
  layers: Layer[];
};

export const ASSETS = manifest.assets as Asset[];
export const RECIPES = manifest.recipes as unknown as Record<string, Recipe>;
export const asset = (id: string) => ASSETS.find((a) => a.id === id)!;

function DistressedFoilText({ text }: { text: string }) {
  return (
    <span className="pn-foil-letters" aria-hidden="true">
      {[...text].map((character, index) => (
        <span key={`${character}-${index}`}>{character === " " ? "\u00a0" : character}</span>
      ))}
    </span>
  );
}

export function Sheet({
  recipeId,
  wear,
  masked = true,
  children,
  className = "",
}: {
  recipeId?: string;
  /** resolved per-sheet wear from the shared story (wins over recipeId) */
  wear?: Recipe;
  masked?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const recipe = wear ?? RECIPES[recipeId ?? "carried"] ?? RECIPES["carried"]!;
  const mask = asset(recipe.edgeMask);

  return (
    <div
      className={`pn-sheet relative h-full w-full ${className}`}
      data-recipe={recipe.id}
      style={
        masked
          ? ({
              WebkitMaskImage: `url(${mask.path})`,
              maskImage: `url(${mask.path})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            } as React.CSSProperties)
          : undefined
      }
    >
      <img
        src={asset(recipe.substrate).path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill"
      />
      {recipe.layers.map((l) => {
        const a = asset(l.asset);
        return (
          <span
            key={l.asset}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${a.path})`,
              backgroundRepeat: l.repeat ? "repeat" : "no-repeat",
              backgroundSize: l.repeat ? "120px 120px" : "100% 100%",
              opacity: l.opacity,
              transform: l.mirror ? "scaleX(-1)" : undefined,
            }}
          />
        );
      })}
      {children}
    </div>
  );
}

/* --------------------------------------------------------- page content */
export function PageContent({ page, total }: { page: PocketPage; total: number }) {
  return (
    <article
      className="pn-copy relative z-10 flex h-full flex-col px-[10%] pt-[11%] pb-[8%] text-[#3a2f24]"
      aria-label={`Page ${page.n} of ${total}: ${page.title}`}
    >
      <p className="font-serif text-[3.1cqw] uppercase tracking-[0.32em] opacity-60">
        {page.eyebrow}
      </p>
      <h2 className="mt-[3%] font-serif text-[7.4cqw] leading-[1.08]">{page.title}</h2>
      <div
        aria-hidden="true"
        className="mt-[4%] h-px w-[38%] bg-[#5a4632]/35"
      />

      {page.kind === "photo" && (
        <figure className="mt-[6%]">
          <img
            src={bandPhoto}
            width={768}
            height={576}
            loading="lazy"
            alt="Two guitarists and a güira player on a small outdoor patio stage at night, faded 1990s film print."
            className="w-full rounded-[2px] shadow-[0_2px_6px_rgba(40,26,12,0.35)]"
          />
          <figcaption className="mt-[3%] font-serif text-[3.2cqw] leading-snug opacity-70">
            {page.caption}
          </figcaption>
        </figure>
      )}

      <p className="mt-[5%] font-serif text-[4.3cqw] leading-[1.55] opacity-90">{page.body}</p>

      {page.note && (
        <p className="pn-hand mt-[6%] -rotate-[1.4deg] self-start text-[4.6cqw] leading-none opacity-70">
          {page.note}
        </p>
      )}

      <span
        aria-hidden="true"
        className="mt-auto self-end font-serif text-[3.2cqw] opacity-50"
      >
        {page.n}
      </span>
    </article>
  );
}

/* -------------------------------------------------------- cover surfaces */
export function CoverFront({
  interactive = false,
  hintVisible = false,
}: {
  interactive?: boolean;
  hintVisible?: boolean;
}) {
  return (
    <div className="pn-cover relative h-full w-full overflow-hidden rounded-r-[6px] rounded-l-[3px]">
      <img
        src={asset("cover-brick-front").path}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-fill"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-[14%] text-center">
        <p className="pn-foil pn-foil-small" aria-label="Cuaderno">
          <DistressedFoilText text="CUADERNO" />
        </p>
        <h1 className="pn-foil pn-foil-title mt-[7%]" aria-label="El Mayimbe">
          <DistressedFoilText text="EL MAYIMBE" />
        </h1>
        <p className="pn-foil pn-foil-small pn-foil-artist mt-[8%]" aria-label="Antony Santos">
          <DistressedFoilText text="ANTONY SANTOS" />
        </p>
        {/* the hint belongs to the cover itself — it fades in while the cover
            closes so it never pops in after the leaf lands */}
        <p
          className={`pn-cover-hint pn-foil mt-[14%] font-serif text-[3cqw] uppercase tracking-[0.28em]${hintVisible ? " is-on" : ""}`}
          aria-hidden={!interactive}
        >
          tap to open
        </p>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[9%] bg-gradient-to-r from-black/45 via-black/15 to-transparent"
      />
    </div>
  );
}

export function CoverInside() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-l-[6px] rounded-r-[3px]">
      <img
        src={asset("cover-brick-inside").path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-black/40 to-transparent"
      />
    </div>
  );
}

/* ------------------------------------------------------- back cover boards */
/* The back board hinges at the same spine. Closed, its quiet exterior faces
   up; swung open it carries the gift dedication on its pastedown. */
export function BackCoverOutside() {
  /* rests on the LEFT half of the spread (mirror of the closed front cover):
     the spine is its right edge */
  return (
    <div className="pn-cover relative h-full w-full overflow-hidden rounded-l-[3px] rounded-r-[6px]">
      <img
        src={asset("cover-brick-front").path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill brightness-[0.82] saturate-[0.9]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[9%] bg-gradient-to-l from-black/45 via-black/15 to-transparent"
      />
    </div>
  );
}

export function BackCoverInside() {
  /* the pastedown is the final RIGHT page of the book: spine on its left edge */
  return (
    <div className="relative h-full w-full overflow-hidden rounded-l-[6px] rounded-r-[3px]">
      <img
        src={asset("cover-brick-inside").path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-[12%] text-center">
        <p className="pn-dedication font-serif text-[4.6cqw] leading-[1.9]">
          Para Antony, con mucho cariño.
          <span className="mt-[4%] block text-[3.6cqw]">De parte de Orielsy Díaz</span>
        </p>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/40 to-transparent"
      />
    </div>
  );
}
