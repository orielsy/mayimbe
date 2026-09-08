import { createFileRoute } from "@tanstack/react-router";
import { PocketNotebook } from "@/components/pocket/PocketNotebook";

export const Route = createFileRoute("/labs/pocket-notebook")({
  head: () => ({
    meta: [
      { title: "Pocket Notebook — Mayimbe Stage 2" },
      {
        name: "description",
        content:
          "A functional mobile-first pocket notebook for the Antony Santos museum: static paper, wear and cover assets, live text, and a deterministic page-turn state machine.",
      },
      { property: "og:title", content: "Pocket Notebook — Mayimbe Stage 2" },
      {
        property: "og:description",
        content:
          "Open the brick cover and turn through eight archival pages built from reusable paper, wear and edge assets — HTML, CSS and images only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    /* the notebook IS its artwork — the cover boards and the first sheet's
       paper must be in flight with the document, not after hydration */
    links: [
      { rel: "preload", as: "image", href: "/notebook-assets/cover-brick-front.webp" },
      { rel: "preload", as: "image", href: "/notebook-assets/cover-brick-inside.webp" },
      { rel: "preload", as: "image", href: "/notebook-assets/substrate-carried.webp" },
      { rel: "preload", as: "image", href: "/notebook-assets/edge-mask-a.webp" },
      { rel: "preload", as: "image", href: "/notebook-assets/fibre-stock.webp" },
    ],
  }),
  component: PocketNotebookRoute,
});

function PocketNotebookRoute() {
  return (
    <main className="pn-exhibit">
      <div className="pn-exhibit-inner">
        <header className="pn-caption">
          <p className="pn-kicker">Mayimbe · Stage 2</p>
          <h1 className="pn-title">The pocket notebook</h1>
          <p className="pn-lede">
            Eight archival pages, composed at runtime from reusable paper, wear and cover
            artwork. Swipe, tap the arrows, or use the left and right keys.
          </p>
        </header>
        <PocketNotebook />
      </div>
    </main>
  );
}
