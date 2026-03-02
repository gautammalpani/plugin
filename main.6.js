// Filter Bar custom widget for Sisense Fusion (Linux) - L2025.4+
// Provides top-of-dashboard filter controls as a reusable widget.

/* global prism, angular, $, $$ */

// Controller is exposed by style-panel-controller.6.js
const controllerDefinition = (typeof window !== 'undefined' && window.pluginFilterBarStylerController)
  ? window.pluginFilterBarStylerController
  : null;

// Register Angular controller used by style panel template.
// Guard against environments where Angular is not available on the widget rendering page.
try {
  if (controllerDefinition && typeof angular !== 'undefined' && angular && angular.module) {
    let mod;
    try {
      mod = angular.module('plugin-filterBar');
    } catch (e) {
      mod = angular.module('plugin-filterBar', []);
    }
    mod.controller('plugin-filterBar.controllers.stylerController', controllerDefinition);
  }
} catch (e) {
  // If Angular isn't present, skip style-panel wiring. Widget can still register and render.
}

if (typeof prism === 'undefined' || !prism || !prism.registerWidget) {
  // Fail gracefully if widget framework isn't present
  // eslint-disable-next-line no-console
  console.error('[filterBar] prism.registerWidget not available - widget will not register.');
} else {
  prism.registerWidget('filterBar', {
    name: 'filterBar',
    family: 'table',
    title: 'Filter Bar',
    iconSmall: '/plugins/filterBar/widget-24.png',
    styleEditorTemplate: '/plugins/filterBar/style-panel-template.html',
    sizing: { minHeight: 80, maxHeight: 320, minWidth: 300, maxWidth: 3000 },

    style: {
      widgetMode: 'single',        // 'single' | 'multi'
      selectionMode: 'single',     // list mode: 'single' | 'multi'
      numericMode: 'auto',         // 'auto' | 'list' | 'range'
      dateMode: 'auto',            // 'auto' | 'list' | 'range'
      dateLevel: 'days',           // used when dateMode = list
      enableTypeahead: true,
      serverTypeahead: false,
      minChars: 2,
      maxResults: 200,
      saveToServer: false,
      applyBehavior: 'auto'        // 'auto' | 'button'
    },

    data: {
      panels: [
        {
          name: 'Filter Fields',
          type: 'visible',
          metadata: { types: ['dimensions'], maxitems: -1 }
        },
        {
          name: 'filters',
          type: 'filters',
          metadata: { types: ['dimensions'], maxitems: -1 }
        }
      ],

      buildQuery: (widget, query) => {
        const items = (widget.metadata.panel('Filter Fields').items || []);
        const widgetMode = widget.style.widgetMode || 'single';
        const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

        // Keep the built-in widget query light: query only the first configured field.
        // Additional fields can use server-side typeahead.
        const first = fields[0];
        if (first) {
          const clone = ($$ && $$.object && $$.object.clone)
            ? $$.object.clone(first, true)
            : JSON.parse(JSON.stringify(first));

          // If it's a date field and we are in list mode, apply the chosen date level.
          if ((widget.style.dateMode === 'list' || widget.style.dateMode === 'auto') &&
              widget.style.dateLevel && clone.jaql && clone.jaql.datatype === 'datetime') {
            clone.jaql.level = widget.style.dateLevel;
          }
          query.metadata.push(clone);
        }

        // Append widget-level filters as background (scope) filters.
        (widget.metadata.panel('filters').items || []).forEach((item) => {
          const c = ($$ && $$.object && $$.object.clone)
            ? $$.object.clone(item, true)
            : JSON.parse(JSON.stringify(item));
          c.panel = 'scope';
          query.metadata.push(c);
        });

        return query;
      }
    },

    render: (widget, args) => {
      const el = $(args.element)[0];
      el.innerHTML = '';

      const widgetMode = widget.style.widgetMode || 'single';
      const items = (widget.metadata.panel('Filter Fields').items || []);
      const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

      if (!fields.length) {
        el.innerHTML = `<div class="fb-empty">Add field(s) to <b>Filter Fields</b> to configure this widget.</div>`;
        return;
      }

      const root = document.createElement('div');
      root.className = 'fb-root';

      const controlsByKey = new Map(); // key -> { syncFn, applyFn }
      const saveToServer = !!widget.style.saveToServer;
      const applyBehavior = widget.style.applyBehavior || 'auto';
      const isListMulti = (widget.style.selectionMode === 'multi');

      const keyFor = (dim, level) => `${dim}::${level || ''}`;

      const getExistingFilter = (dim, level) => {
        try {
          return level ? widget.dashboard.filters.item(dim, level) : widget.dashboard.filters.item(dim);
        } catch (e) {
          return null;
        }
      };

      const removeFilter = (dim, level) => {
        try {
          level ? widget.dashboard.filters.remove(dim, level) : widget.dashboard.filters.remove(dim);
        } catch (e) {
          // no-op
        }
        widget.dashboard.refresh();
      };

      const updateFilter = (jaql) => {
        widget.dashboard.filters.update({ jaql }, { refresh: true, save: saveToServer });
      };

      const debounce = (fn, ms) => {
        let t;
        return (...a) => {
          clearTimeout(t);
          t = setTimeout(() => fn(...a), ms);
        };
      };

      // Determine datasource name/title for JAQL endpoint: /api/datasources/{datasource}/jaql
      // In most ElastiCube deployments, datasourceTitle == cube title.
      const datasourceTitle = widget.dashboard?.datasource?.title || widget.dashboard?.datasource || null;

      const parseJaqlResponseToValues = (json) => {
        // JAQL responses can differ by backend. This function attempts common shapes.
        if (!json) return [];
        if (Array.isArray(json.values)) {
          return json.values.map(v => (v && (v.text ?? v.data ?? v))).filter(Boolean);
        }
        if (Array.isArray(json.data)) {
          return json.data.map(r => (Array.isArray(r)
            ? (r[0]?.text ?? r[0]?.data ?? r[0])
            : r)).filter(Boolean);
        }
        if (json.result && Array.isArray(json.result.values)) {
          return json.result.values;
        }
        return [];
      };

      const serverSearchMembers = async ({ dim, datatype, level, term, limit }) => {
        let filter;
        if (datatype === 'text') {
          filter = { contains: term };
        } else if (datatype === 'number') {
          const n = Number(term);
          filter = Number.isNaN(n) ? { contains: term } : { equals: n };
        } else {
          // datetime or unknown: fallback to contains match on formatted value.
          filter = { contains: term };
        }

        const jaqlItem = {
          dim,
          datatype,
          ...(level ? { level } : {}),
          filter
        };

        const payload = {
          datasource: datasourceTitle,
          metadata: [{ jaql: jaqlItem }],
          count: limit
        };

        const res = await fetch(`/api/datasources/${encodeURIComponent(datasourceTitle)}/jaql`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) return [];
        const json = await res.json();
        const values = parseJaqlResponseToValues(json);
        return values.slice(0, limit).map(v => String(v.text ?? v.data ?? v));
      };

      const renderListControl = ({ label, dim, datatype, level }) => {
        const row = document.createElement('div');
        row.className = 'fb-row';

        const labelEl = document.createElement('div');
        labelEl.className = 'fb-label';
        labelEl.textContent = label;

        const search = document.createElement('input');
        search.className = 'fb-input';
        search.placeholder = 'Search...';
        search.style.display = widget.style.enableTypeahead ? 'inline-block' : 'none';

        const select = document.createElement('select');
        select.className = 'fb-select';
        if (isListMulti) select.multiple = true;

        const addOptions = (values) => {
          select.innerHTML = '';
          if (!isListMulti) {
            const optAll = document.createElement('option');
            optAll.value = '__ALL__';
            optAll.textContent = 'All';
            select.appendChild(optAll);
          }
          values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt);
          });
        };

        // Initial domain from widget.queryResult (best-effort; typically only includes first field)
        const initial = (widget.queryResult || [])
          .map(r => (r && r[0] != null) ? String(r[0]) : null)
          .filter(Boolean);

        const dedup = Array.from(new Set(initial)).slice(0, Number(widget.style.maxResults || 200));
        addOptions(dedup);

        const apply = () => {
          const selected = Array.from(select.selectedOptions).map(o => o.value);

          if (!isListMulti && selected[0] === '__ALL__') {
            removeFilter(dim, level);
            return;
          }

          if (isListMulti && selected.length === 0) {
            removeFilter(dim, level);
            return;
          }

          updateFilter({
            dim,
            datatype,
            ...(level ? { level } : {}),
            filter: {
              explicit: true,
              multiSelection: isListMulti,
              members: isListMulti ? selected : [selected[0]]
            }
          });
        };

        if (applyBehavior === 'auto') {
          select.addEventListener('change', apply);
        }

        const doSearch = debounce(async () => {
          const term = search.value.trim();
          const minChars = Number(widget.style.minChars || 2);
          if (term.length < minChars) return;

          if (widget.style.serverTypeahead && datasourceTitle) {
            const values = await serverSearchMembers({
              dim,
              datatype,
              level,
              term,
              limit: Number(widget.style.maxResults || 200)
            });
            addOptions(values);
          } else {
            const options = Array.from(select.options)
              .map(o => o.value)
              .filter(v => v !== '__ALL__');
            const filtered = options.filter(v => v.toLowerCase().includes(term.toLowerCase()));
            addOptions(filtered.slice(0, Number(widget.style.maxResults || 200)));
          }
        }, 250);

        if (widget.style.enableTypeahead) {
          search.addEventListener('input', doSearch);
        }

        const syncFn = () => {
          const f = getExistingFilter(dim, level);
          const members = f?.jaql?.filter?.members || [];
          const all = f?.jaql?.filter?.all;

          Array.from(select.options).forEach(o => (o.selected = false));

          if (!isListMulti) {
            if (all || members.length === 0) {
              select.value = '__ALL__';
            } else {
              select.value = String(members[0]);
            }
          } else {
            const set = new Set(members.map(String));
            Array.from(select.options).forEach(o => {
              if (set.has(o.value)) o.selected = true;
            });
          }
        };

        row.appendChild(labelEl);
        row.appendChild(search);
        row.appendChild(select);
        root.appendChild(row);

        controlsByKey.set(keyFor(dim, level), { syncFn, applyFn: apply });
        syncFn();
      };

      const renderNumericRange = ({ label, dim }) => {
        const row = document.createElement('div');
        row.className = 'fb-row';

        const labelEl = document.createElement('div');
        labelEl.className = 'fb-label';
        labelEl.textContent = label;

        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'fb-input';
        minInput.placeholder = 'Min';

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'fb-input';
        maxInput.placeholder = 'Max';

        const apply = () => {
          const min = minInput.value !== '' ? Number(minInput.value) : null;
          const max = maxInput.value !== '' ? Number(maxInput.value) : null;

          if (min === null && max === null) {
            removeFilter(dim);
            return;
          }

          const filter = {};
          if (min !== null) filter.from = min;
          if (max !== null) filter.to = max;
          updateFilter({ dim, datatype: 'number', filter });
        };

        if (applyBehavior === 'auto') {
          minInput.addEventListener('change', apply);
          maxInput.addEventListener('change', apply);
        }

        const syncFn = () => {
          const f = getExistingFilter(dim);
          const jf = f?.jaql?.filter || {};
          minInput.value = (jf.from != null) ? jf.from : '';
          maxInput.value = (jf.to != null) ? jf.to : '';
        };

        row.appendChild(labelEl);
        row.appendChild(minInput);
        row.appendChild(maxInput);
        root.appendChild(row);

        controlsByKey.set(keyFor(dim, null), { syncFn, applyFn: apply });
        syncFn();
      };

      const renderDateRange = ({ label, dim }) => {
        const row = document.createElement('div');
        row.className = 'fb-row';

        const labelEl = document.createElement('div');
        labelEl.className = 'fb-label';
        labelEl.textContent = label;

        const fromInput = document.createElement('input');
        fromInput.type = 'date';
        fromInput.className = 'fb-input';

        const toInput = document.createElement('input');
        toInput.type = 'date';
        toInput.className = 'fb-input';

        const apply = () => {
          const from = fromInput.value ? new Date(fromInput.value).toISOString() : null;
          const to = toInput.value ? new Date(toInput.value).toISOString() : null;

          if (!from && !to) {
            removeFilter(dim);
            return;
          }

          const filter = {};
          if (from) filter.from = from;
          if (to) filter.to = to;
          updateFilter({ dim, datatype: 'datetime', filter });
        };

        if (applyBehavior === 'auto') {
          fromInput.addEventListener('change', apply);
          toInput.addEventListener('change', apply);
        }

        const syncFn = () => {
          const f = getExistingFilter(dim);
          const jf = f?.jaql?.filter || {};
          fromInput.value = jf.from ? String(jf.from).slice(0, 10) : '';
          toInput.value = jf.to ? String(jf.to).slice(0, 10) : '';
        };

        row.appendChild(labelEl);
        row.appendChild(fromInput);
        row.appendChild(toInput);
        root.appendChild(row);

        controlsByKey.set(keyFor(dim, null), { syncFn, applyFn: apply });
        syncFn();
      };

      // Render all configured fields
      fields.forEach((item) => {
        const dim = item?.jaql?.dim;
        if (!dim) return;

        const label = item.jaql.title || dim;
        const datatype = item.jaql.datatype || 'text';
        const dateLevel = (datatype === 'datetime' && widget.style.dateLevel) ? widget.style.dateLevel : null;

        if (datatype === 'number') {
          const numericMode = widget.style.numericMode || 'auto';
          if (numericMode === 'range') {
            renderNumericRange({ label, dim });
          } else {
            renderListControl({ label, dim, datatype: 'number', level: null });
          }
          return;
        }

        if (datatype === 'datetime') {
          const dateMode = widget.style.dateMode || 'auto';
          if (dateMode === 'range') {
            renderDateRange({ label, dim });
          } else {
            renderListControl({ label, dim, datatype: 'datetime', level: dateLevel });
          }
          return;
        }

        renderListControl({ label, dim, datatype: 'text', level: null });
      });

      // Actions: Apply (optional) + Clear All
      const actions = document.createElement('div');
      actions.className = 'fb-actions';

      const btnApply = document.createElement('button');
      btnApply.className = 'fb-btn primary';
      btnApply.textContent = 'Apply';
      btnApply.style.display = (applyBehavior === 'button') ? 'inline-block' : 'none';
      btnApply.addEventListener('click', () => {
        controlsByKey.forEach(({ applyFn }) => applyFn && applyFn());
      });

      const btnClearAll = document.createElement('button');
      btnClearAll.className = 'fb-btn';
      btnClearAll.textContent = 'Clear All';
      btnClearAll.addEventListener('click', () => {
        widget.dashboard.filters.clear();
        widget.dashboard.refresh();
        controlsByKey.forEach(({ syncFn }) => syncFn && syncFn());
      });

      actions.appendChild(btnApply);
      actions.appendChild(btnClearAll);
      root.appendChild(actions);

      el.appendChild(root);

      // Keep multiple widgets (and duplicates on the same dimension) in sync.
      const syncAll = () => controlsByKey.forEach(({ syncFn }) => syncFn && syncFn());
      try {
        widget.dashboard.on('filterschanged', syncAll);
      } catch (e) {
        // no-op
      }
    }
  });
}
