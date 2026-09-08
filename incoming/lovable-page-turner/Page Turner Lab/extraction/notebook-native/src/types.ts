/* Public types for the extracted notebook engine. */

/** One printed page face. `kind` selects the placeholder furniture the lab
 *  markup drew (sketch / photo / clipping); anything else renders title+body
 *  only. Two consecutive pages form one physical sheet. */
export interface NotebookPage {
  n?: number;
  title: string;
  body: string;
  kind?: 'text' | 'sketch' | 'photo' | 'clipping' | (string & {});
}

export type NotebookStateName = 'CLOSED_FRONT' | 'OPEN' | 'CLOSED_BACK';
export type CloseSide = 'front' | 'back';

export interface NotebookSnapshot {
  state: NotebookStateName;
  /** sheets flipped to the left; the spread shows pages [2t-1, 2t] (0-based) */
  turned: number;
  /** 1-based page number currently on the right half */
  page: number;
}

import type { PerfProfileInput } from './perf/profile';

/** Pre-rendered textures produced offline by `tools/bake-textures.mjs`.
 *  Every entry is an image URL (or data URL); missing entries fall back to
 *  live rasterisation, so a partial manifest is always safe. */
export interface BakedTextures {
  w: number; h: number; coverW: number; coverH: number; dpr: number;
  /** one per page face, indexed exactly like `pages` */
  pages: string[];
  /** [0] front outer, [1] pastedown, [2] back board outer, [3] dedication */
  covers: string[];
  /** bucket identity, present on bucketed manifests ("430x932") */
  id?: string;
  /** viewport this bucket was baked at, used for runtime bucket selection */
  viewportW?: number;
  viewportH?: number;
  /** all baked size buckets; the top level repeats the widest one so older
   *  loaders keep working. Dynamic/mobile layouts pick the nearest bucket. */
  buckets?: BakedTextures[];
}

export interface MountOptions {
  pages: NotebookPage[];
  /** skip on-device foreignObject rasterisation and use baked images */
  baked?: BakedTextures;
  /** 'css' forces the WebGL-free flip; by default it is only used when a
   *  WebGL context cannot be created at all */
  fallback?: 'auto' | 'css';
  /** performance budget: 'auto' (default), a preset name, or overrides.
   *  'desktop' reproduces the frozen lab values exactly. */
  perf?: PerfProfileInput;
  /** named anchors -> 1-based page number, for goToSection() */
  sectionToPage?: Record<string, number>;
  /** aborting the signal disposes the engine */
  signal?: AbortSignal;
  /** fired after every settled state change */
  onStateChange?: (s: NotebookSnapshot) => void;
}

export interface NotebookEngine {
  /** open the front cover (from CLOSED_BACK, lifts the back board first) */
  open(): Promise<void>;
  /** shut the notebook onto the front board, or onto the back board */
  close(side?: CloseSide): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  /** 1-based page number */
  goToPage(page: number): Promise<void>;
  goToSection(section: string): Promise<void>;
  /** stop the render loop (offscreen / background tab) */
  suspend(): void;
  resume(): void;
  getState(): NotebookSnapshot;
  /** jump to a state with no animation */
  restore(state: NotebookSnapshot): void;
  /** offline use only: rasterise every face and return a baked manifest */
  bake?(opts?: { type?: string; quality?: number; dpr?: number }): Promise<BakedTextures>;
  dispose(): void;
}
