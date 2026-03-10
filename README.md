# QuickTextDropdownFilter (v1)

## What it does
- Adds a custom Sisense widget: **Quick Text Dropdown Filter**.
- Widget queries distinct members of a selected dimension from the Elasticube.
- Renders a dropdown (single-select) or multi-select dropdown (native HTML multiple).
- Selecting values updates the **dashboard filter** and refreshes immediately.
- Clearing selection clears the constraint (sets filter to `all:true`) without removing the filter.

## Install (Sisense Linux)
1. Copy folder `QuickTextDropdownFilter` to: `/opt/sisense/storage/plugins/QuickTextDropdownFilter/`
2. Hard refresh the browser (Ctrl+Shift+R). If not loaded, restart Sisense web.

## Configure in dashboard
1. Add widget: **Quick Text Dropdown Filter**
2. In widget editor: drag a *dimension* into the **Field** panel.
3. In style panel:
   - Select Single vs Multi
   - Optional: Persist selection
   - Optional: Enable debug logging

## Debug logging
Enable **Enable console debug logging** in the widget style panel and open DevTools console.
