import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import manifest from "@/assets/notebook-assets.manifest.json";

export const Route = createFileRoute("/labs/notebook-assets")({
  head: () => ({
    meta: [
      { title: "Notebook Asset System — Mayimbe Stage 1" },
      {
        name: "description",
        content:
          "Stage 1 inspection of the Mayimbe pocket notebook static asset system: paper substrates, reusable wear overlays, edge masks and cover boards, composed with CSS and images only.",
      },
      { property: "og:title", content: "Notebook Asset System — Mayimbe Stage 1" },
      {
        property: "og:description",
        content:
          "Reusable paper, wear, mask and cover assets combined into convincing notebook surfaces — no canvas, no WebGL.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetLab,
});

/* ---------------------------------------------------------------- types */
type Asset = (typeof manifest)["assets"][number];
type Layer = { asset: string; opacity: number; mirror?: boolean; repeat?: boolean };
type Recipe = {
  id: string;
  label: string;
  note: string;
  substrate: string;
  edgeMask: string;
  layers: Layer[];
};

const ASSETS = manifest.assets as Asset[];
const RECIPES = manifest.recipes as unknown as Record<string, Recipe>;
const RECIPE_IDS = Object.keys(RECIPES);
const byId = (id: string) => ASSETS.find((a) => a.id === id)!;
const kb = (n: number) => `${Math.round(n / 102.4) / 10} KB`;

const GROUP_LABEL: Record<string, string> = {
  substrate: "Paper substrate",
  wear: "Wear overlay",
  trauma: "Front-of-block trauma",
  mask: "Edge silhouette mask",
  cover: "Cover material",
};

/* ------------------------------------------------- composed paper sheet */
function Sheet({
  recipe,
  intensity,
  off,
  masked = true,
  children,
}: {
  recipe: Recipe;
  intensity: number;
  off?: Set<string>;
  masked?: boolean;
  children?: React.ReactNode;
}) {
  const mask = byId(recipe.edgeMask);
  return (
    <div
      className="nbs relative aspect-[3/4] w-full"
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
        src={byId(recipe.substrate).path}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-fill"
      />
      {recipe.layers.map((l) => {
        if (off?.has(l.asset)) return null;
        const a = byId(l.asset);
        return (
          <span
            key={l.asset}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${a.path})`,
              backgroundRepeat: l.repeat ? "repeat" : "no-repeat",
              backgroundSize: l.repeat ? "150px 150px" : "100% 100%",
              opacity: l.opacity * intensity,
              transform: l.mirror ? "scaleX(-1)" : undefined,
            }}
          />
        );
      })}
      {children}
    </div>
  );
}

function SheetText() {
  return (
    <div className="relative z-10 flex h-full flex-col px-[9%] py-[10%] text-[#3b3026]">
      <p className="font-serif text-[clamp(0.62rem,2.1cqw,0.95rem)] uppercase tracking-[0.34em] opacity-70">
        Mayimbe
      </p>
      <h3 className="mt-[4%] font-serif text-[clamp(1rem,4.2cqw,1.7rem)] leading-tight">
        El Mayimbe de la bachata
      </h3>
      <p className="mt-[5%] font-serif text-[clamp(0.7rem,2.6cqw,1.02rem)] leading-relaxed opacity-90">
        Antony Santos took the guitar out of the colmado and put it on a stage. What was
        once background music for a Sunday afternoon became a language people could carry
        with them.
      </p>
      <p className="mt-[4%] font-serif text-[clamp(0.7rem,2.6cqw,1.02rem)] leading-relaxed opacity-80">
        Every sheet in this notebook is a page of that record — handled, folded and kept.
      </p>
      <span className="mt-auto self-end font-serif text-[clamp(0.6rem,2cqw,0.85rem)] opacity-55">
        7
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ the page */
function AssetLab() {
  const [recipeId, setRecipeId] = useState<string>(RECIPE_IDS[0]!);
  const [intensity, setIntensity] = useState(1);
  const [off, setOff] = useState<Set<string>>(new Set());
  const recipe = RECIPES[recipeId]!;

  const active = useMemo(
    () =>
      [byId(recipe.substrate), byId(recipe.edgeMask)].concat(
        recipe.layers.filter((l) => !off.has(l.asset)).map((l) => byId(l.asset)),
      ),
    [recipe, off],
  );

  const toggle = (id: string) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const total = ASSETS.reduce((s, a) => s + a.bytes, 0);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#121110] text-[#e6ded1]">
      <style>{`
        .nbs { container-type: inline-size; }
        .checker {
          background-color:#1b1a18;
          background-image:
            linear-gradient(45deg,#26241f 25%,transparent 25%,transparent 75%,#26241f 75%),
            linear-gradient(45deg,#26241f 25%,transparent 25%,transparent 75%,#26241f 75%);
          background-size:16px 16px; background-position:0 0,8px 8px;
        }
        .lab :is(button,input,a):focus-visible {
          outline:2px solid #d98b5f; outline-offset:3px; border-radius:2px;
        }
        @media (prefers-reduced-motion: reduce) { .lab * { transition:none !important; animation:none !important; } }
      `}</style>

      <div className="lab mx-auto w-full max-w-6xl px-5 pb-24 pt-12 sm:px-8">
        {/* ---------------------------------------------------- overview */}
        <header className="border-b border-[#33302b] pb-10">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-[#d98b5f]">
            Notebook rebuild · Stage 1
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
            Mayimbe pocket notebook — static asset system
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a79c8c]">
            Flattened ingredients, not finished pages. Every surface below is assembled
            from ordinary image files layered with CSS; all text stays live, selectable
            DOM.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              ["Exported assets", String(ASSETS.length)],
              ["Master size", `${manifest.master.w} × ${manifest.master.h} · 3:4`],
              ["Runtime", "CSS + images"],
              ["Canvas / WebGL", "0 / 0"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#7d7263]">
                  {k}
                </dt>
                <dd className="mt-1 font-serif text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 font-mono text-[0.68rem] text-[#7d7263]">
            Library weight {kb(total)} across {ASSETS.length} files.
          </p>
        </header>

        {/* ------------------------------------------------- workbench */}
        <Section
          n="01"
          title="Composition workbench"
          note="One pocket page, composed live from the recipe's substrate, mask and ordered wear layers."
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
              {/* subtle static paper block behind the sheet */}
              {[4, 3, 2, 1].map((i) => (
                <div
                  key={i}
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${i * 5}px, ${i * 3}px)`,
                    filter: `brightness(${1 - i * 0.07}) saturate(0.95)`,
                  }}
                >
                  <Sheet recipe={recipe} intensity={intensity} masked />
                </div>
              ))}
              <div className="relative">
                <Sheet recipe={recipe} intensity={intensity} off={off}>
                  <SheetText />
                </Sheet>
              </div>
            </div>


            <div className="space-y-7">
              <fieldset>
                <legend className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#7d7263]">
                  Paper history
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RECIPE_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRecipeId(id)}
                      aria-pressed={recipeId === id}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        recipeId === id
                          ? "border-[#d98b5f] bg-[#d98b5f] text-[#1a1512]"
                          : "border-[#3b3730] text-[#bdb3a3] hover:border-[#6d6558]"
                      }`}
                    >
                      {RECIPES[id]!.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#8d8375]">{recipe.note}</p>
              </fieldset>

              <div>
                <label
                  htmlFor="intensity"
                  className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#7d7263]"
                >
                  Wear intensity — {Math.round(intensity * 100)}%
                </label>
                <input
                  id="intensity"
                  type="range"
                  min={0}
                  max={1.4}
                  step={0.05}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="mt-3 w-full accent-[#d98b5f]"
                />
              </div>

              <fieldset>
                <legend className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#7d7263]">
                  Wear layers
                </legend>
                <ul className="mt-3 space-y-2">
                  {recipe.layers.map((l) => (
                    <li key={l.asset}>
                      <label className="flex cursor-pointer items-center gap-3 text-xs text-[#bdb3a3]">
                        <input
                          type="checkbox"
                          checked={!off.has(l.asset)}
                          onChange={() => toggle(l.asset)}
                          className="accent-[#d98b5f]"
                        />
                        <span className="flex-1">{byId(l.asset).label}</span>
                        <span className="font-mono text-[0.6rem] text-[#6f6558]">
                          {Math.round(l.opacity * 100)}%{l.mirror ? " ⇄" : ""}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>

              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#7d7263]">
                  Active files
                </p>
                <ul className="mt-3 space-y-1 font-mono text-[0.65rem] leading-relaxed text-[#8d8375]">
                  {active.map((a) => (
                    <li key={a.id} className="truncate">
                      {a.path.replace("/notebook-assets/", "")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------- recipe comparison */}
        <Section
          n="02"
          title="Recipe comparison"
          note="Three histories, one system: the same reusable overlays, differently ordered, weighted and mirrored."
        >
          <div className="grid gap-8 sm:grid-cols-3">
            {RECIPE_IDS.map((id) => {
              const r = RECIPES[id]!;
              return (
                <article key={id}>
                  <Sheet recipe={r} intensity={1} />
                  <h3 className="mt-4 font-serif text-lg">{r.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#8d8375]">{r.note}</p>
                  <ul className="mt-3 space-y-1 font-mono text-[0.62rem] text-[#7d7263]">
                    <li>substrate · {r.substrate}</li>
                    <li>mask · {r.edgeMask}</li>
                    {r.layers.map((l) => (
                      <li key={l.asset}>
                        {l.asset} · {Math.round(l.opacity * 100)}%
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </Section>

        {/* ----------------------------------------------- cover assembly */}
        <Section
          n="03"
          title="Cover assembly"
          note="The approved brick board, its quieter inside face, and the two assembled around a static paper block."
        >
          <div className="grid gap-8 sm:grid-cols-3">
            <figure>
              <img
                src={byId("cover-brick-front").path}
                alt="Brick front cover board"
                className="aspect-[3/4] w-full rounded-[3px] object-cover"
              />
              <figcaption className="mt-3 font-mono text-[0.62rem] text-[#7d7263]">
                cover-brick-front.webp
              </figcaption>
            </figure>
            <figure>
              <img
                src={byId("cover-brick-inside").path}
                alt="Brick inside board"
                className="aspect-[3/4] w-full rounded-[3px] object-cover"
              />
              <figcaption className="mt-3 font-mono text-[0.62rem] text-[#7d7263]">
                cover-brick-inside.webp
              </figcaption>
            </figure>
            <figure className="relative">
              <div className="relative aspect-[3/4] w-full">
                <div className="absolute inset-y-[1.5%] left-[2.5%] right-[1%]">
                  {[3, 2, 1, 0].map((i) => (
                    <div
                      key={i}
                      className="absolute inset-0"
                      style={{ transform: `translateX(${i * 2.5}px)`, filter: `brightness(${1 - i * 0.1})` }}
                    >
                      <Sheet recipe={RECIPES["protected"]!} intensity={0.9} />
                    </div>
                  ))}
                </div>
                <img
                  src={byId("cover-brick-front").path}
                  alt="Assembled notebook cover over its paper block"
                  className="absolute inset-0 h-full w-full rounded-[3px_5px_5px_3px] object-cover shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]"
                />
                <p className="absolute inset-x-0 top-[26%] z-10 text-center font-serif text-[clamp(0.9rem,3vw,1.5rem)] uppercase tracking-[0.3em] text-[#e8cdae] opacity-85 mix-blend-screen">
                  Mayimbe
                </p>
              </div>
              <figcaption className="mt-3 font-mono text-[0.62rem] text-[#7d7263]">
                assembled · title is live DOM text
              </figcaption>
            </figure>
          </div>
        </Section>

        {/* --------------------------------------------- asset inventory */}
        <Section
          n="04"
          title="Asset inventory"
          note="Every exported file, transparent ones over a checkerboard so their alpha is inspectable."
        >
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {ASSETS.map((a) => (
              <figure key={a.id} className="min-w-0">
                <div
                  className={`aspect-[3/4] w-full overflow-hidden rounded-[3px] border border-[#2c2a26] ${
                    a.transparent ? "checker" : ""
                  }`}
                >
                  {a.id === "fibre-stock" ? (
                    <div
                      role="img"
                      aria-label={a.label}
                      className="h-full w-full"
                      style={{ backgroundImage: `url(${a.path})`, backgroundSize: "100px 100px" }}
                    />
                  ) : (
                    <img
                      src={a.path}
                      alt={a.label}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}

                </div>
                <figcaption className="mt-2 min-w-0">
                  <p className="truncate text-xs text-[#cdc3b3]">{a.label}</p>
                  <p className="truncate font-mono text-[0.6rem] text-[#7d7263]">
                    {a.path.replace("/notebook-assets/", "")}
                  </p>
                  <p className="font-mono text-[0.6rem] text-[#6f6558]">
                    {a.w}×{a.h} · {a.format} · {a.transparent ? "alpha" : "opaque"} ·{" "}
                    {kb(a.bytes)}
                  </p>
                  <p className="font-mono text-[0.6rem] text-[#6f6558]">
                    {GROUP_LABEL[a.group] ?? a.group}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#26241f] py-12">
      <header className="mb-8">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[#d98b5f]">
          {n}
        </p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-[#8d8375]">{note}</p>
      </header>
      {children}
    </section>
  );
}
