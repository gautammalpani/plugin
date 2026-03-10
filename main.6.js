/* global prism, $$, $ */

import controllerDefinition from './style-panel-controller.6';

const mod = prism.registerModule('plugin-QuickTextDropdownFilter');
mod.controller('stylerController', controllerDefinition);

function getDimItem(widget) {
  const panel = widget.metadata && widget.metadata.panel && widget.metadata.panel('Field');
  if (!panel) return null;
  const items = panel.items || [];
  return items.length ? items[0] : null;
}

function normalizeBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return !!val;
}

function debugLog(widget, ...args) {
  const dbg = widget && widget.style ? normalizeBoolean(widget.style.qtdf_debug) : false;
  if (dbg && typeof console !== 'undefined' && console.log) {
    console.log('[QuickTextDropdownFilter]', ...args);
  }
}

function applyDashboardFilter(widget, dashboard, dim, members, { multi, persist }) {
  const jaql = {
    datatype: 'text',
    dim: dim,
    filter: {}
  };

  if (!members || members.length === 0) {
    // Clear constraint but keep filter present
    jaql.filter = { all: true };
  } else {
    jaql.filter = {
      multiSelection: !!multi,
      members: members,
      explicit: true
    };
  }

  debugLog(widget, 'Applying filter', { dim, multi, persist, jaql });

  // Update/insert filter and refresh immediately
  dashboard.filters.update({ jaql }, { refresh: true, save: !!persist });
}

function readCurrentMembers(widget, dashboard, dim) {
  try {
    const f = dashboard.filters.item(dim);
    const jf = f && f.jaql && f.jaql.filter ? f.jaql.filter : null;
    if (!jf || jf.all) return [];
    if (Array.isArray(jf.members)) return jf.members.slice();
    return [];
  } catch (e) {
    debugLog(widget, 'readCurrentMembers error', e);
    return [];
  }
}

prism.registerWidget('QuickTextDropdownFilter', {
  name: 'QuickTextDropdownFilter',
  family: 'filters',
  title: 'Quick Text Dropdown Filter',
  styleEditorTemplate: '/plugins/QuickTextDropdownFilter/style-panel-template.html',

  sizing: { minHeight: 70, minWidth: 140, maxHeight: 200, maxWidth: 1200 },

  style: {
    qtdf_multi: false,
    qtdf_persist: false,
    qtdf_debug: false
  },

  data: {
    panels: [
      {
        name: 'Field',
        type: 'visible',
        metadata: { types: ['dimensions'], maxitems: 1 }
      },
      {
        name: 'filters',
        type: 'filters',
        metadata: { types: ['dimensions'], maxitems: -1 }
      }
    ],

    // Query distinct values for the selected dimension by including it in query.metadata
    buildQuery: (widget, query) => {
      const dimItem = getDimItem(widget);
      if (!dimItem) return query;

      debugLog(widget, 'buildQuery dimItem', dimItem);

      query.metadata.push($$.object.clone(dimItem, true));
      return query;
    },

    processResult: (widget, queryResult) => {
      debugLog(widget, 'processResult raw', queryResult);
      return queryResult;
    }
  },

  render: (widget, args) => {
    const el = $(args.element)[0];
    el.innerHTML = '';

    const dashboard = widget.dashboard;
    const dimItem = getDimItem(widget);

    if (!dashboard || !dimItem) {
      el.innerHTML = '<div class="qtdf-wrap">Select a Field (dimension) in the widget editor.</div>';
      return;
    }

    const dim = (dimItem.jaql && dimItem.jaql.dim) ? dimItem.jaql.dim : dimItem.dim;
    const titleText = (dimItem.jaql && dimItem.jaql.title) ? dimItem.jaql.title : 'Filter';

    const multi = normalizeBoolean(widget.style.qtdf_multi);
    const persist = normalizeBoolean(widget.style.qtdf_persist);

    // Extract members from query result
    const qr = widget.queryResult || [];
    let values = qr
      .map(r => (r && (r[0] != null ? r[0] : r.value)))
      .filter(v => v != null)
      .map(v => String(v));

    // De-duplicate
    values = Array.from(new Set(values));

    // Sort alphabetically (case-insensitive, numeric-friendly)
    values.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));

    debugLog(widget, 'render', { dim, titleText, multi, persist, valuesCount: values.length, valuesSample: values.slice(0, 10) });

    // Current selection for sync (reflect sidebar changes too)
    const currentMembers = readCurrentMembers(widget, dashboard, dim);
    const currentSet = new Set(currentMembers);

    // UI
    const wrap = document.createElement('div');
    wrap.className = 'qtdf-wrap';

    const title = document.createElement('div');
    title.className = 'qtdf-title';
    title.textContent = titleText; // Dimension title (requested)
    wrap.appendChild(title);

    const select = document.createElement('select');
    select.className = 'qtdf-select';

    if (multi) {
      select.multiple = true;
    } else {
      // Provide a “clear” state without an “All” option
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '—';
      if (!currentMembers.length) blank.selected = true;
      select.appendChild(blank);
    }

    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (currentSet.has(v)) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const selectedValues = Array.from(select.selectedOptions)
        .map(o => o.value)
        .filter(v => v !== '');

      debugLog(widget, 'dropdown change', { selectedValues });
      applyDashboardFilter(widget, dashboard, dim, selectedValues, { multi, persist });
    });

    wrap.appendChild(select);

    const hint = document.createElement('div');
    hint.className = 'qtdf-hint';
    hint.textContent = multi
      ? 'Hold Ctrl/Cmd to select multiple. Deselect all to clear.'
      : 'Choose a value. Select — to clear.';
    wrap.appendChild(hint);

    el.appendChild(wrap);

    // Keep widget synced if sidebar filters change
    if (!widget._qtdfBound) {
      widget._qtdfBound = true;
      dashboard.on('filterschanged', () => {
        debugLog(widget, 'dashboard filterschanged -> redraw');
        widget.redraw && widget.redraw();
      });
    }
  }
});
