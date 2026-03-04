# Sisense Filter Bar — Full Guarded Version (v1.0.3-full)

This package is the **full Filter Bar widget** (UI + server typeahead + numeric/date range) with the **editor-safe guards** that prevent errors when switching an existing widget to the Filter Bar type.

## Install (Sisense Linux)
1. Unzip.
2. Copy the entire `filterBar/` folder into:

   `/opt/sisense/storage/plugins/filterBar/`

3. Restart the Sisense web application, then hard refresh browser cache.

## Verify
- In the widget type picker, **Filter Bar** appears.
- Switching a widget's type to **Filter Bar** does not produce console errors.

## Large domains
- For large text domains, server-side typeahead uses **startsWith** by default (Auto mode).
- Users must type at least `minChars` characters.

## Notes
- The plugin is enabled via `isEnabled: true` in plugin.json.
- Registration waits until `window.prism.registerWidget` is available.

If server-side typeahead returns no results, you may need to adjust the datasource identifier in `main.6.js` (`datasourceTitle`).
