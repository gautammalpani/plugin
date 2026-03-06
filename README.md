# Sisense Filter Bar — Full Unique Build (2026-03-05)

This is the **full functional** Filter Bar plugin with:
- No Angular style controller (prevents ctrlreg)
- Editor-safe guards (prevents buildQuery/render errors)
- Large domains: server typeahead, startsWith default in Auto mode

## Install (Sisense Linux)
1. Unzip.
2. Copy folder to: `/opt/sisense/storage/plugins/filterBar/`
3. Restart Sisense web app and hard refresh browser.

## Verify
- Console shows: `[filterBar] registering full-unique-20260305`
- Widget always shows a small banner: `Filter Bar (full-unique-20260305)`

If you do not see the banner, the widget render function is not being called (typically due to editor transition). Try leaving widget editor and viewing on the dashboard, or forcing a refresh.
