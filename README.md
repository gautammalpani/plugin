# Sisense Filter Bar — v1.0.3-hotfix (Linux L2025.4)

This hotfix restores plugin-loader compatibility while keeping the **v1.0.3 behavior**:

- **Large text domains** (e.g., 100k+ values) use **server-side typeahead** in Auto mode
- For large domains, the server-side query uses **startsWith** by default (configurable)

## What was fixed
The original v1.0.3 used **computed object property** syntax for the JAQL filter:

```js
filter = { [op]: term };
```

In some Sisense environments, the plugin loader/transpiler can fail to parse/evaluate this syntax, which can prevent **all custom widgets** from registering.

This hotfix replaces it with explicit filter objects:

```js
if (op === 'startsWith') filter = { startsWith: term };
else filter = { contains: term };
```

## Install
1. Unzip this package.
2. Copy the entire `filterBar/` folder to:

`/opt/sisense/storage/plugins/filterBar/`

3. Restart the Sisense web app (recommended) and hard refresh browser cache.

## Configuration
In the widget Style panel:
- **Server-side Typeahead**: Auto / On / Off
- **Text match mode**: Auto (startsWith for large) / Starts With / Contains
- **Min chars** and **Max results**

## Note about datasource identifier
Server typeahead uses:

`POST /api/datasources/{datasource}/jaql`

The plugin uses the dashboard datasource title by default:

```js
const datasourceTitle = widget.dashboard?.datasource?.title || widget.dashboard?.datasource || null;
```

If your environment needs a different datasource identifier (e.g., fullname), update that line in `main.6.js`.
