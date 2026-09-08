import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interactive Notebook — WebGL Page Turn Prototype" },
      {
        name: "description",
        content:
          "A bound notebook whose pages turn on a curling WebGL mesh, handed off pixel-for-pixel from real semantic HTML pages.",
      },
      { property: "og:title", content: "Interactive Notebook — WebGL Page Turn" },
      {
        property: "og:description",
        content:
          "Drag or click the gutter to turn a page: real HTML at rest, a curling three.js mesh mid-turn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">Interactive notebook page-turn prototype</h1>
      <iframe
        src="/notebook/index.html"
        title="Interactive notebook page-turn prototype"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
