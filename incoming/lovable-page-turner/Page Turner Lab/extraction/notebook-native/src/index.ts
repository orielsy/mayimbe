/* Public entry point for the extracted /notebook-lab-native engine. */
import type { MountOptions, NotebookEngine } from './types';

export type {
  NotebookPage, NotebookEngine, NotebookSnapshot, NotebookStateName,
  MountOptions, CloseSide, BakedTextures,
} from './types';
export { NOTEBOOK_ROOT_CLASS, NOTEBOOK_CSS } from './styles';

/**
 * Mounts the notebook directly inside `host` (no iframe, no nested app) and
 * resolves once its page textures are ready — i.e. once the cover can be
 * grabbed. Browser only: it builds DOM and a WebGL context.
 */
export async function mountNotebook(host: HTMLElement, options: MountOptions): Promise<NotebookEngine> {
  if (typeof window === 'undefined') throw new Error('[notebook] mountNotebook requires a browser');
  if (!options || !options.pages || !options.pages.length) throw new Error('[notebook] pages are required');

  /* PERF (#8): LOAD PATH. `three`, the cover/paper material systems and the
     engine itself are only needed once someone actually mounts a notebook, so
     they live behind a dynamic import: the page's initial bundle carries the
     types and this ~1KB shim, not the renderer. */
  const { createNotebookEngine } = await import('./engine');
  /* Point the paper surfaces at the baked PNG library before any sheet is
     built, so pages paint from a handful of shared, already-decoded images
     instead of ~60 unique canvas data URLs. Silently no-ops (and the live
     canvas path runs) when /notebook-textures is not deployed. */
  const { preloadPaperTextures } = await import('./paper/paper-surface');
  await Promise.race([
    preloadPaperTextures().catch(() => false),
    new Promise(r => setTimeout(r, 1500)),
  ]);
  const engine = createNotebookEngine(host, options);


  /* the engine rasterises its pages over the next few frames; wait for a
     usable first state rather than handing back a notebook that ignores
     open() because textures have not landed yet. */
  await new Promise<void>(resolve => {
    const t0 = performance.now();
    const poll = () => {
      if (options.signal?.aborted || engine.getState() == null || performance.now() - t0 > 8000) return resolve();
      // getState() is cheap; texture readiness shows up as a working open()
      if ((engine as any).getState().state && (host.querySelector('canvas.nb-gl') as HTMLCanvasElement | null)?.width) {
        return resolve();
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });

  return engine;
}

export { loadBakedTextures, preloadFirstFaces, pickBucket, bucketsOf,
         SCALE_MIN, SCALE_MAX, ASPECT_TOLERANCE } from './perf/baked';
export type { BucketQuery } from './perf/baked';
