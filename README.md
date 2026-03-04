# Sisense Filter Bar (Custom Widget) — Linux L2025.4

## What’s New (v1.0.3)
- **Starts-with is now the default** match behavior for **large text domains** when using **server-side typeahead (Auto)**.
- Still configurable per widget via **Text match mode (server typeahead)**.

## Large-domain behavior (100k+ members)
- Large domains require typing (min chars) and use server-side typeahead.
- In Auto mode, the widget uses **startsWith** for large domains (faster and more "typeahead"-like).

## Install
Copy the entire `filterBar/` folder into:

`/opt/sisense/storage/plugins/filterBar/`

Then restart Sisense web app (recommended) or hard refresh.

## Configuration (Style panel)
- Server-side Typeahead: Auto / On / Off
- Text match mode: Auto (Starts-with for large) / Starts With / Contains
- Auto: treat list as large when it hits max results
- Min chars, Max results

## Notes
If your `/api/datasources/{datasource}/jaql` endpoint expects a different datasource identifier than the dashboard datasource title, update:

```js
const datasourceTitle = widget.dashboard?.datasource?.title || widget.dashboard?.datasource || null;
```
