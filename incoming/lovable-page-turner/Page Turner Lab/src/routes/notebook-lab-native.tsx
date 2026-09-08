import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notebook-lab-native")({
  head: () => ({
    meta: [
      { title: "Variant B — Lab-Native Notebook Paper System" },
      {
        name: "description",
        content:
          "A structural clone of the notebook whose paper comes only from the current Paper Lab language: two families, declining exposure and a humidity episode across sheets.",
      },
      { property: "og:title", content: "Variant B — Lab-Native Notebook" },
      {
        property: "og:description",
        content:
          "New stack plus new family and surface system: Handled to Protected, with a damp episode rising, peaking and fading across the block.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabNative,
});

function LabNative() {
  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">Variant B — lab-native notebook paper system</h1>
      <iframe
        src="/notebook-lab-native/index.html"
        title="Variant B — lab-native notebook"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
