import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notebook-lab-g2")({
  head: () => ({
    meta: [
      { title: "G2 Stack Variant — Experimental Notebook Paper Block" },
      {
        name: "description",
        content:
          "Experimental fork of the frozen Lab-Native notebook: individually aged sheets, per-sheet edge profiles, cluster deformation and recession-based paper stacking.",
      },
      { property: "og:title", content: "G2 Stack Variant — Experimental Notebook" },
      {
        property: "og:description",
        content:
          "Every stratum keeps its own deterministic edge profile and containment solution, so the block reads as individually imperfect sheets rather than one repeated silhouette.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabG2,
});

function LabG2() {
  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">G2 stack variant — experimental notebook paper block</h1>
      <iframe
        src="/notebook-lab-g2/index.html"
        title="G2 stack variant — experimental notebook"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
