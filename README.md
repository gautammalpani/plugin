# Sisense Filter Bar (Widget)

Target: **Sisense Fusion Linux L2025.4**.

## Purpose
Place a filter control **directly on the dashboard canvas** so key filters are obvious to users.

## Behavior
- Updates **dashboard-level filters** (same as the right-hand filter panel).
- Default **Clear** behavior: **Clear this widget only**.

## Icons
This build provides:
- `widget-24.png`
- `widget-48.png`
- `widget.svg`

Widget registration sets: `icon`, `iconSmall`, `iconLarge`, and `iconSvg`.

## Install (Linux)
1. Copy folder to `/opt/sisense/storage/plugins/filterBar/`
2. Restart Sisense web/services and hard refresh browser.

## Build
- 2026-03-06 (iconSvg)
