// @ts-nocheck -- mechanically ported from the frozen lab JS; typed at the public API boundary (types.ts) only.
/* Neutral 24-page fixture (12 physical sheets) for local smoke-testing only.
   No historical copy from the lab's content.js is baked into this package —
   the engine renders whatever pages the caller supplies. */
import type { NotebookPage } from '../types';

const KINDS: NotebookPage['kind'][] = ['text', 'sketch', 'text', 'photo', 'text', 'clipping'];

export const SAMPLE_PAGES: NotebookPage[] = Array.from({ length: 24 }, (_, i) => ({
  n: i + 1,
  title: `Page ${i + 1}`,
  body:
    'Placeholder body copy for layout and wear inspection. This fixture exists ' +
    'so the engine can be mounted without real editorial content; replace it ' +
    'with the pages the site actually publishes.',
  kind: KINDS[i % KINDS.length],
}));
