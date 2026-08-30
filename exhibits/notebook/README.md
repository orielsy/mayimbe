# Notebook Exhibit

This directory is the production integration boundary for the notebook.

The working notebook prototype is **not** copied here during bootstrap. `NotebookAdapter` exists only to prove that the Museum Navigator can target the notebook through a stable semantic contract.

The later migration should extract the existing notebook into a specialist engine while preserving its current DOM-at-rest / WebGL-in-motion behavior. Nuxt/Vue should wrap that engine rather than rewrite its physical mechanics.
