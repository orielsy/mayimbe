import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/material-lab")({
  head: () => ({
    meta: [
      { title: "Material Lab — Notebook Wear & Aging Studies" },
      {
        name: "description",
        content:
          "Side-by-side R&D comparison of cover and paper aging treatments for the interactive notebook: procedural leather, cloth, foxing, creases and edge wear.",
      },
      { property: "og:title", content: "Material Lab — Notebook Wear & Aging Studies" },
      {
        property: "og:description",
        content:
          "Eight exterior wear concepts and twelve paper concepts, all deterministic and production-feasible, plus a composition sandbox.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaterialLab,
});

function MaterialLab() {
  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">Notebook material lab — wear and aging concepts</h1>
      <iframe
        src="/material-lab/index.html"
        title="Notebook material lab — wear and aging concepts"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
