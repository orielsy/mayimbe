import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/notebook-css")({
  head: () => ({
    meta: [
      { title: "CSS-Only Notebook Flip — Antony Santos Notebook" },
      {
        name: "description",
        content:
          "The WebGL-free escape hatch of the notebook engine: the resting DOM halves swing about the spine on the compositor, for phones and devices without usable WebGL.",
      },
      { property: "og:title", content: "CSS-Only Notebook Flip" },
      {
        property: "og:description",
        content:
          "Zero rasterisation, zero shaders: a pure compositor page turn with lighting, perspective and a board-tracked reveal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotebookCss,
});

function NotebookCss() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<any>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ac = new AbortController();
    let live: any = null;

    (async () => {
      const [{ mountNotebook, NOTEBOOK_ROOT_CLASS }, { SAMPLE_PAGES }] = await Promise.all([
        import("../../extraction/notebook-native/src/index"),
        import("../../extraction/notebook-native/src/fixture/sample-pages"),
      ]);
      host.classList.add(NOTEBOOK_ROOT_CLASS);
      const e = await mountNotebook(host, {
        pages: SAMPLE_PAGES,
        fallback: "css",
        signal: ac.signal,
      });
      if (ac.signal.aborted) { e.dispose(); return; }
      live = e;
      setEngine(e);
    })();

    return () => {
      ac.abort();
      live?.dispose();
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-background">
      <h1 className="sr-only">CSS-only notebook page turn</h1>
      <div ref={hostRef} className="h-screen w-full" />
      <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center gap-3">
        <button
          type="button"
          className="pointer-events-auto rounded-md border border-border/60 bg-card/80 px-4 py-2 text-sm text-card-foreground backdrop-blur"
          onClick={() => engine?.previous()}
        >
          Back
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded-md border border-border/60 bg-card/80 px-4 py-2 text-sm text-card-foreground backdrop-blur"
          onClick={() => engine?.next()}
        >
          Forward
        </button>
      </div>
    </main>
  );
}
