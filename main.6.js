// Filter Bar custom widget for Sisense Fusion (Linux) - L2025.4+
// Full unique build: 2026-03-05
// - No Angular style controller (prevents ctrlreg)
// - Editor-safe guards (prevents buildQuery/render errors during type switching)
// - Large domains: server-side typeahead; startsWith default in Auto mode

(function(){
  function registerFilterBar(){
    const safeArray = (v) => Array.isArray(v) ? v : [];
    const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

    const getPanel = (widget, panelName) => {
      const md = widget && widget.metadata;
      if (!md) return null;
      const tryNames = [panelName, String(panelName||'').toLowerCase(), String(panelName||'').replace(/\s+/g,''), String(panelName||'').replace(/\s+/g,'').toLowerCase()];
      if (typeof md.panel === 'function') {
        for (let i=0;i<tryNames.length;i++) { try { const p=md.panel(tryNames[i]); if (p) return p; } catch(e){} }
      }
      const panels = safeArray(md.panels);
      for (let i=0;i<tryNames.length;i++) {
        const n = tryNames[i];
        const found = panels.find(p=>p && (p.name===n || String(p.name).toLowerCase()===n));
        if (found) return found;
      }
      return null;
    };

    const getPanelItems = (widget, panelName) => {
      const p = getPanel(widget, panelName);
      if (!p) return [];
      if (Array.isArray(p.items)) return p.items;
      if (typeof p.items === 'function') { try { return safeArray(p.items()); } catch(e) { return []; } }
      return [];
    };

    const normalizeCell = (v) => {
      if (v == null) return null;
      if (typeof v === 'object') return (v.text != null ? v.text : (v.data != null ? v.data : null));
      return v;
    };

    const uniqueStrings = (arr) => {
      const out = []; const seen = new Set();
      safeArray(arr).forEach(v=>{ const s=String(v); if(!s) return; if(seen.has(s)) return; seen.add(s); out.push(s); });
      return out;
    };

    console.log('[filterBar] registering full-unique-20260305');

    prism.registerWidget('filterBar', {
      name: 'filterBar',
      family: 'table',
      title: 'Filter Bar',
      iconSmall: '/plugins/filterBar/widget-24.png',
      styleEditorTemplate: '/plugins/filterBar/style-panel-template-v2.html',

      sizing: { minHeight: 80, maxHeight: 360, minWidth: 300, maxWidth: 3000 },

      style: {
        widgetMode: 'single',
        selectionMode: 'single',
        numericMode: 'auto',
        dateMode: 'auto',
        dateLevel: 'days',
        enableTypeahead: true,
        serverTypeaheadMode: 'auto',
        textMatchMode: 'auto',
        autoLargeWhenTruncated: true,
        minChars: 2,
        maxResults: 200,
        queryAllFieldsInMultiMode: false,
        saveToServer: false,
        applyBehavior: 'auto'
      },

      data: {
        panels: [
          { name: 'Filter Fields', type: 'visible', metadata: { types: ['dimensions'], maxitems: -1 } },
          { name: 'filters', type: 'filters', metadata: { types: ['dimensions'], maxitems: -1 } }
        ],

        buildQuery: (widget, query) => {
          query = query || {}; query.metadata = safeArray(query.metadata);
          if (!widget) return query;

          const items = safeArray(getPanelItems(widget, 'Filter Fields'));
          const widgetMode = (widget.style && widget.style.widgetMode) ? widget.style.widgetMode : 'single';
          const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

          // Allow query to run even without fields; render will show a configuration message
          if (!fields || !fields.length) return query;

          const queryAll = (widgetMode === 'multi') && !!(widget.style && widget.style.queryAllFieldsInMultiMode);
          const toQuery = queryAll ? fields : fields.slice(0, 1);

          const dateMode = (widget.style && widget.style.dateMode) ? widget.style.dateMode : 'auto';
          const dateLevel = widget.style ? widget.style.dateLevel : null;

          toQuery.forEach((f) => {
            if (!f) return;
            const clone = $$.object.clone(f, true);
            if ((dateMode === 'list' || dateMode === 'auto') && dateLevel && clone.jaql && clone.jaql.datatype === 'datetime') {
              clone.jaql.level = dateLevel;
            }
            query.metadata.push(clone);
          });

          safeArray(getPanelItems(widget, 'filters')).forEach((item) => {
            if (!item) return;
            const c = $$.object.clone(item, true);
            c.panel = 'scope';
            query.metadata.push(c);
          });

          const maxResults = Number(widget.style && widget.style.maxResults ? widget.style.maxResults : 200);
          query.count = isFinite(maxResults) ? maxResults : 200;

          return query;
        }
      },

      render: (widget, args) => {
        if (!args || !args.element) return;
        const el = $(args.element)[0];
        if (!el) return;

        el.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'fb-root';
        el.appendChild(root);

        // Always show a banner so you can confirm rendering
        const banner = document.createElement('div');
        banner.className = 'fb-banner';
        banner.textContent = 'Filter Bar (full-unique-20260305)';
        root.appendChild(banner);

        const items = safeArray(getPanelItems(widget, 'Filter Fields'));
        const widgetMode = (widget && widget.style && widget.style.widgetMode) ? widget.style.widgetMode : 'single';
        const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

        if (!fields || !fields.length) {
          const msg = document.createElement('div');
          msg.className = 'fb-empty';
          msg.innerHTML = 'Add field(s) to <b>Filter Fields</b> to configure this widget.';
          root.appendChild(msg);
          return;
        }

        // If query results are not ready, still show UI scaffolding
        const queryRows = Array.isArray(widget.queryResult) ? widget.queryResult : [];

        const controlsByKey = new Map();
        const saveToServer = !!(widget.style && widget.style.saveToServer);
        const applyBehavior = (widget.style && widget.style.applyBehavior) ? widget.style.applyBehavior : 'auto';
        const isListMulti = (widget.style && widget.style.selectionMode === 'multi');
        const datasourceTitle = widget.dashboard && widget.dashboard.datasource ? (widget.dashboard.datasource.title || widget.dashboard.datasource) : null;
        const maxResults = Number(widget.style && widget.style.maxResults ? widget.style.maxResults : 200);
        const minChars = Number(widget.style && widget.style.minChars ? widget.style.minChars : 2);

        const initialDomain = uniqueStrings(
          safeArray(queryRows)
            .map(r => Array.isArray(r) ? normalizeCell(r[0]) : normalizeCell(r))
            .filter(v => v != null)
            .map(v => String(v))
        );

        const isPossiblyTruncated = !!(widget.style && widget.style.autoLargeWhenTruncated) && (initialDomain.length >= maxResults);

        const resolveServerTypeahead = () => {
          const mode = widget.style && widget.style.serverTypeaheadMode ? widget.style.serverTypeaheadMode : 'auto';
          if (mode === 'on') return true;
          if (mode === 'off') return false;
          return isPossiblyTruncated;
        };

        const resolveTextFilterOp = () => {
          const m = widget.style && widget.style.textMatchMode ? widget.style.textMatchMode : 'auto';
          if (m === 'startsWith') return 'startsWith';
          if (m === 'contains') return 'contains';
          return isPossiblyTruncated ? 'startsWith' : 'contains';
        };

        const getExistingFilter = (dim, level) => {
          try { return level ? widget.dashboard.filters.item(dim, level) : widget.dashboard.filters.item(dim); }
          catch (e) { return null; }
        };

        const removeFilter = (dim, level) => {
          try { level ? widget.dashboard.filters.remove(dim, level) : widget.dashboard.filters.remove(dim); }
          catch (e) {}
          widget.dashboard.refresh();
        };

        const updateFilter = (jaql) => {
          widget.dashboard.filters.update({ jaql }, { refresh: true, save: saveToServer });
        };

        const parseJaqlResponseToValues = (json) => {
          if (!json) return [];
          if (Array.isArray(json.values)) return json.values;
          if (Array.isArray(json.data)) return json.data;
          if (json.result && Array.isArray(json.result.values)) return json.result.values;
          return [];
        };

        const serverSearchMembers = async ({ dim, datatype, level, term, limit }) => {
          if (!datasourceTitle) return [];

          let filter;
          if (datatype === 'text') {
            const op = resolveTextFilterOp();
            if (op === 'startsWith') filter = { startsWith: term };
            else filter = { contains: term };
          } else if (datatype === 'number') {
            const n = Number(term);
            filter = isNaN(n) ? { equals: null } : { equals: n };
          } else {
            filter = { contains: term };
          }

          const payload = {
            datasource: datasourceTitle,
            metadata: [ { jaql: { dim, datatype, ...(level ? { level } : {}), filter } } ],
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

          const out = [];
          safeArray(values).forEach(r => {
            if (Array.isArray(r)) {
              const c = normalizeCell(r[0]);
              if (c != null) out.push(String(c));
            } else {
              const c = normalizeCell(r);
              if (c != null) out.push(String(c));
            }
          });

          return uniqueStrings(out).slice(0, limit);
        };

        const renderListControl = ({ label, dim, datatype, level }) => {
          const row = document.createElement('div');
          row.className = 'fb-row';

          const labelEl = document.createElement('div');
          labelEl.className = 'fb-label';
          labelEl.textContent = label;

          const search = document.createElement('input');
          search.className = 'fb-input';
          search.placeholder = 'Type to search...';

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

          const doApply = () => {
            const selected = Array.from(select.selectedOptions).map(o => o.value);
            if (!isListMulti && selected[0] === '__ALL__') return removeFilter(dim, level);
            if (isListMulti && selected.length === 0) return removeFilter(dim, level);

            updateFilter({
              dim,
              datatype,
              ...(level ? { level } : {}),
              filter: { explicit: true, multiSelection: isListMulti, members: isListMulti ? selected : [selected[0]] }
            });
          };

          if (applyBehavior === 'auto') select.addEventListener('change', doApply);

          const wantsTypeahead = !!(widget.style && widget.style.enableTypeahead);
          const useServer = (datatype === 'text') ? resolveServerTypeahead() : ((widget.style && widget.style.serverTypeaheadMode) === 'on');

          if (!useServer && initialDomain.length) {
            addOptions(initialDomain.slice(0, maxResults));
          } else {
            addOptions([]);
          }

          search.style.display = wantsTypeahead ? 'inline-block' : 'none';

          const doSearch = debounce(async () => {
            const term = search.value.trim();
            if (term.length < minChars) return;

            if (wantsTypeahead && useServer) {
              const values = await serverSearchMembers({ dim, datatype, level, term, limit: maxResults });
              addOptions(values);
            } else {
              const filtered = initialDomain.filter(v => v.toLowerCase().includes(term.toLowerCase()));
              addOptions(filtered.slice(0, maxResults));
            }
          }, 250);

          if (wantsTypeahead) search.addEventListener('input', doSearch);

          const syncFn = () => {
            const f = getExistingFilter(dim, level);
            const members = safeArray(f && f.jaql && f.jaql.filter ? f.jaql.filter.members : []).map(String);
            const all = f && f.jaql && f.jaql.filter ? f.jaql.filter.all : false;

            Array.from(select.options).forEach(o => (o.selected = false));

            if (!isListMulti) {
              select.value = (all || members.length === 0) ? '__ALL__' : String(members[0]);
            } else {
              const set = new Set(members);
              Array.from(select.options).forEach(o => { if (set.has(o.value)) o.selected = true; });
            }
          };

          row.appendChild(labelEl);
          row.appendChild(search);
          row.appendChild(select);
          root.appendChild(row);

          controlsByKey.set(`${dim}::${level||''}`, { syncFn, applyFn: doApply });
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
            if (min === null && max === null) return removeFilter(dim);

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
            const jf = f && f.jaql ? (f.jaql.filter || {}) : {};
            minInput.value = (jf.from != null) ? jf.from : '';
            maxInput.value = (jf.to != null) ? jf.to : '';
          };

          row.appendChild(labelEl);
          row.appendChild(minInput);
          row.appendChild(maxInput);
          root.appendChild(row);

          controlsByKey.set(`${dim}::`, { syncFn, applyFn: apply });
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
            if (!from && !to) return removeFilter(dim);

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
            const jf = f && f.jaql ? (f.jaql.filter || {}) : {};
            fromInput.value = jf.from ? String(jf.from).slice(0, 10) : '';
            toInput.value = jf.to ? String(jf.to).slice(0, 10) : '';
          };

          row.appendChild(labelEl);
          row.appendChild(fromInput);
          row.appendChild(toInput);
          root.appendChild(row);

          controlsByKey.set(`${dim}::`, { syncFn, applyFn: apply });
          syncFn();
        };

        fields.forEach((item) => {
          const dim = item && item.jaql ? item.jaql.dim : null;
          if (!dim) return;

          const label = item.jaql.title || dim;
          const datatype = item.jaql.datatype || 'text';
          const dateLevel = (datatype === 'datetime' && widget.style && widget.style.dateLevel) ? widget.style.dateLevel : null;

          if (datatype === 'number') {
            const nm = widget.style && widget.style.numericMode ? widget.style.numericMode : 'auto';
            if (nm === 'list') renderListControl({ label, dim, datatype: 'number', level: null });
            else renderNumericRange({ label, dim });
            return;
          }

          if (datatype === 'datetime') {
            const dm = widget.style && widget.style.dateMode ? widget.style.dateMode : 'auto';
            if (dm === 'list') renderListControl({ label, dim, datatype: 'datetime', level: dateLevel });
            else renderDateRange({ label, dim });
            return;
          }

          renderListControl({ label, dim, datatype: 'text', level: null });
        });

        const actions = document.createElement('div');
        actions.className = 'fb-actions';

        const btnApply = document.createElement('button');
        btnApply.className = 'fb-btn primary';
        btnApply.textContent = 'Apply';
        btnApply.style.display = (applyBehavior === 'button') ? 'inline-block' : 'none';
        btnApply.addEventListener('click', () => controlsByKey.forEach(({ applyFn }) => applyFn && applyFn()));

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

        const syncAll = () => controlsByKey.forEach(({ syncFn }) => syncFn && syncFn());
        try { widget.dashboard.on('filterschanged', syncAll); } catch (e) {}
        try { widget.dashboard.on('filterschanged', syncAll); } catch (e) {}
      }
    });
  }

  function waitForPrism(){
    if (window.prism && typeof window.prism.registerWidget === 'function') {
      try { registerFilterBar(); } catch (e) { console.error('[filterBar] failed to register', e); }
      return;
    }
    setTimeout(waitForPrism, 50);
  }

  waitForPrism();
})();
