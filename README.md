# Sisense Filter Bar — v1.0.3-hotfix3

## What this fixes
If you see errors when switching an existing widget to **Filter Bar** type, such as:
- `TypeError: Cannot read properties of undefined (reading 'length')` in `buildQuery`
- `TypeError: Cannot set properties of undefined (setting 'innerHTML')` in `render`

…it is because Sisense can call `buildQuery` / `render` while the widget is mid-transition and the panel metadata or DOM element is not ready.

This hotfix adds hard guards so `buildQuery` and `render` **never throw** when `widget`, `query`, `args`, or `args.element` are missing.

## Install
Copy `filterBar/` to:
`/opt/sisense/storage/plugins/filterBar/`
Then restart Sisense and hard refresh.

## Note
This build focuses on stability during type switching in the editor. If you need the full control rendering restored, reply and I will generate a follow-up package that merges these guards into the full UI implementation.
