# Sisense Filter Bar — Full Guarded (No Angular Controller)

## Why this version
You encountered the error:

`[$controller:ctrlreg] The controller with the name 'plugin-filterBar.controllers.stylerController' is not registered.`

That means the style panel template referenced a controller that Sisense's Angular context did not have registered.

This package removes the need for a custom controller by:
- removing `data-ng-controller` from the style panel template
- using `ng-change="$root.widget.redraw()"` to trigger redraws

## Install
1. Unzip.
2. Copy the `filterBar/` folder to:

`/opt/sisense/storage/plugins/filterBar/`

3. Restart Sisense web application and hard refresh browser cache.

## Features
- Full Filter Bar UI (text list + numeric/date ranges)
- Large text domains: server typeahead with **startsWith** default in Auto mode
- Editor-safe guards to prevent buildQuery/render errors during widget-type switching
