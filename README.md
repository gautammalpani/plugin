# Sisense Filter Bar — v1.0.3-hotfix2 (Linux L2025.4)

This build is intended for cases where the Filter Bar widget does not appear even though other custom widgets load.

## Fixes included
- Adds `isEnabled: true` in plugin.json (recommended in Sisense plugin manifest examples). citeturn15search2turn15search3
- Defers `prism.registerWidget(...)` until `window.prism` is available (avoids timing issues). citeturn15search8turn15search9

## Install
1. Unzip.
2. Copy folder to: `/opt/sisense/storage/plugins/filterBar/` (Linux plugins directory). citeturn15search3turn15search4
3. Restart Sisense web app and hard refresh.

## Verify
- Open DevTools → Network and ensure `/plugins/filterBar/main.6.js` returns 200.
- Open DevTools → Console and confirm `[filterBar] failed to register` does NOT appear.

## Notes
Server typeahead uses `POST /api/datasources/{datasource}/jaql`. Adjust datasource identifier in main.6.js if needed.
