# Sisense Filter Bar (Custom Widget) — Linux L2025.4+

This plugin adds a **Filter Bar** widget type to Sisense Fusion so dashboard designers can place filter controls **at the top of a dashboard** (or anywhere) the same way they place charts.

It supports:
- Multiple **Filter Bar** widgets on the same dashboard
- **Multi Filter Bar** mode (one widget with multiple filter controls)
- **Text** list filters with search/typeahead
- **Numeric** list filters or **Numeric Range** mode (min/max)
- **Date** list filters (by level) or **Date Range** mode (from/to)
- **Clear All** button

---

## 1) Files in this package
Copy the `filterBar` folder (this entire folder) into your Sisense plugins directory on the Sisense Linux host.

```
filterBar/
  plugin.json
  main.6.js
  filterbar.css
  widget-24.png
  style-panel-template.html
  style-panel-controller.6.js
```

---

## 2) Installation (Sisense Linux)

1. SSH into the Sisense Linux server.
2. Copy the folder to:

```
/opt/sisense/storage/plugins/filterBar/
```

> Sisense on Linux loads plugins from `/opt/sisense/storage/plugins/`.

3. Reload Sisense web application (method depends on your deployment). If you prefer not to restart, you can usually clear browser cache + hard refresh after the plugin is placed, but a service restart is the most reliable.

---

## 3) Using the widget

1. Open a dashboard in **Edit** mode.
2. Add a new widget and select **Filter Bar**.
3. In the widget editor **Data** panel:
   - Add one or more fields to **Filter Fields**.
4. In the widget editor **Style** panel:
   - **Widget Mode**:
     - **Single Filter** = use only the first field in **Filter Fields**
     - **Multi Filter Bar** = render a control per field
   - **Selection Mode** (for list controls): single-select or multi-select
   - **Numeric Mode**: list or range
   - **Date Mode**: list or range
   - **Enable Search/Typeahead**
   - **Server-side Typeahead** (recommended for very large domains)
   - **Apply Behavior**: auto-apply or Apply button

---

## 4) Notes / configuration

### A) Server-side Typeahead
When enabled, the widget sends a JAQL request to:

```
POST /api/datasources/{datasource}/jaql
```

- `{datasource}` is taken from the dashboard’s datasource title when available.
- If your environment requires a different datasource identifier (e.g., fullname), update this part of `main.6.js`:

```js
const datasourceTitle = widget.dashboard?.datasource?.title || widget.dashboard?.datasource || null;
```

### B) Date Range behavior
Date range uses HTML `<input type="date">` and applies a JAQL datetime filter with `from`/`to` values.

> Note: `toISOString()` creates a UTC timestamp. If your backend expects local time boundaries, we can adjust this.

### C) Multiple widgets / sync
If you place multiple Filter Bar widgets that target the same field, they will stay in sync by listening to dashboard filter change events and re-reading the current filter state.

---

## 5) Troubleshooting

### Widget does not appear in the widget list
This is almost always a JavaScript load/parse issue.

- Open the browser dev tools → **Console** and **Network**.
- Verify these load with **200 OK**:
  - `/plugins/filterBar/main.6.js`
  - `/plugins/filterBar/filterbar.css`
  - `/plugins/filterBar/style-panel-template.html`

If `main.6.js` has a syntax error, Sisense may still show the plugin as enabled, but the widget will not be registered.

---

## 6) What was fixed in this package

This version includes compatibility and syntax fixes so the widget reliably registers:

- Fixed invalid JavaScript in `style` defaults (previous stray string literals could prevent the file from parsing).
- Replaced ES module `import` with CommonJS `require` for compatibility with Sisense plugin loaders.
- Added a guard so missing `angular` on non-editor pages will not prevent widget registration.
- Fixed a trailing-comma CSS parsing issue.
- Added a generated `widget-24.png` icon.

---

### Support
If you want, tell me:
- whether your date filters are **date-only** or **datetime** (with time), and
- whether **Clear All** should clear **all dashboard filters** or only those managed by Filter Bar,

and I can tailor the plugin accordingly.
