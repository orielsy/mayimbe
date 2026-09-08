import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/paper-lab")({
  head: () => ({
    meta: [
      { title: "Paper Lab — Paper Families & Geometric Wear Studies" },
      {
        name: "description",
        content:
          "Isolated R&D lab for the notebook's paper: culling the damage vocabulary, converging on 2-4 paper families, and studying geometric edge wear and stack silhouette.",
      },
      { property: "og:title", content: "Paper Lab — Paper Families & Geometric Wear Studies" },
      {
        property: "og:description",
        content:
          "One notebook, one history: global age plus family, neighbourhood and rare sheet events, with deterministic geometric wear and stack silhouette studies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaperLab,
});

function PaperLab() {
  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">Paper lab — paper families, culling and geometric wear</h1>
      <iframe
        src="/paper-lab/index.html"
        title="Paper lab — paper families, culling and geometric wear"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
