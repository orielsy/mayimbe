# Lovable Page Turner source drop

Drop the exported Lovable Page Turner project/source into this directory **unchanged** first.

Purpose of this folder:

- preserve the exact Lovable snapshot we are migrating from;
- keep raw source separate from Mayimbe runtime code;
- let us inspect graphics, components, state, styles, and assets before refactoring;
- provide a stable reference while we migrate the notebook into `app/components/notebook/`.

Do not adapt the source in place. The raw export belongs here; production Mayimbe code belongs elsewhere.

When you add the export, keep its original file/folder structure intact as much as possible.
