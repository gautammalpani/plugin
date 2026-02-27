# Sisense Filter Bar (Custom Widget) — Linux L2025.4

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

3. Restart/reload the Sisense web application (method depends on your deployment). If you prefer not to restart, you can usually clear browser cache + refresh after the plugin is placed, but a service restart is the most reliable.

---

## 3) Using the widget

1. Open a dashboard in **Edit** mode.
2. Add a new widget and select **Filter Bar**.
3. In the widget editor **Data** panel:
   - Add one or more fields to **Filter Fields**.
4. In the widget editor **Style** panel:
   - **Widget Mode**:
     - *Single Filter* = use only the first field in *Filter Fields*
     - *Multi Filter Bar* = render a control per field
   - **Selection Mode** (for list controls): single-select or multi-select
   - **Numeric Mode**: list or range
   - **Date Mode**: list or range
   - **Enable Search/Typeahead**
   - **Server-side Typeahead** (recommended for very large domains)
   - **Apply Behavior**: auto-apply or apply button

---

## 4) Notes / configuration

### A) Server-side Typeahead

When enabled, the widget sends a JAQL request to:

```
POST /api/datasources/{datasource}/jaql
```

- `{datasource}` is taken from the dashboard’s datasource title when available.
- If your environment requires a different datasource identifier (e.g. fullname), update this part of `main.6.js`:

```js
const datasourceTitle = widget.dashboard?.datasource?.title || widget.dashboard?.datasource || null;
```

### B) Date Range behavior

Date range uses HTML `<input type="date">` and applies a JAQL datetime filter with `from`/`to` values.

### C) Multiple widgets / sync

If you place multiple Filter Bar widgets that target the same field, they will stay in sync by listening to dashboard filter change events and re-reading the current filter state.

---

## 5) Troubleshooting

- **Widget doesn’t appear in the widget list**: verify folder path and that `plugin.json` is readable and valid JSON.
- **Style panel doesn’t show**: ensure `styleEditorTemplate` path is correct and Angular is available.
- **Server typeahead returns no results**:
  - confirm `datasourceTitle` matches the datasource name used by `/api/datasources/{datasource}/jaql`
  - open browser dev tools → Network tab → check the request payload/response

---

## 6) Customization ideas

- Add a **Clear (this)** button per control
- Add presets (e.g., *Last 7 days*, *This month*) for date range
- Add numeric slider UI (requires a small JS slider library)

---

### Support

If you want, tell me:
- whether your date filters are **date-only** or **datetime** (with time), and
- whether **Clear All** should clear *all dashboard filters* or only those managed by Filter Bar,

and I can tailor the plugin accordingly.
