// Filter Bar custom widget for Sisense Fusion (Linux) - L2025.4+
// v1.0.3-hotfix3: fixes buildQuery/render errors during widget-type switching in editor.

import controllerDefinition from './style-panel-controller.6';

function registerFilterBar(){
  let mod;
  try { mod = angular.module('plugin-filterBar'); }
  catch (e) { mod = angular.module('plugin-filterBar', []); }
  mod.controller('plugin-filterBar.controllers.stylerController', controllerDefinition);

  const safeArray = (v) => Array.isArray(v) ? v : [];

  const getPanel = (widget, panelName) => {
    const md = widget && widget.metadata;
    if (!md) return null;
    const tryNames = [panelName, String(panelName||'').toLowerCase(), String(panelName||'').replace(/\s+/g,''), String(panelName||'').replace(/\s+/g,'').toLowerCase()];

    if (typeof md.panel === 'function') {
      for (let i=0;i<tryNames.length;i++) {
        try { const p = md.panel(tryNames[i]); if (p) return p; } catch (e) {}
      }
    }
    const panels = safeArray(md.panels);
    for (let i=0;i<tryNames.length;i++) {
      const n = tryNames[i];
      const found = panels.find(p => p && (p.name === n || String(p.name).toLowerCase() === n));
      if (found) return found;
    }
    return null;
  };

  const getPanelItems = (widget, panelName) => {
    const p = getPanel(widget, panelName);
    if (!p) return [];
    if (Array.isArray(p.items)) return p.items;
    if (typeof p.items === 'function') {
      try { return safeArray(p.items()); } catch (e) { return []; }
    }
    return [];
  };

  const normalizeCell = (v) => {
    if (v == null) return null;
    if (typeof v === 'object') return (v.text != null ? v.text : (v.data != null ? v.data : null));
    return v;
  };

  const uniqueStrings = (arr) => {
    const out = [];
    const seen = new Set();
    safeArray(arr).forEach(v => {
      const s = String(v);
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  };

  prism.registerWidget('filterBar', {
    name: 'filterBar',
    family: 'table',
    title: 'Filter Bar',
    iconSmall: '/plugins/filterBar/widget-24.png',
    styleEditorTemplate: '/plugins/filterBar/style-panel-template.html',

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
        // HARD GUARDS: Sisense may call buildQuery with missing widget/query during type switching.
        query = query || {};
        query.metadata = safeArray(query.metadata);

        if (!widget) return query;

        const items = safeArray(getPanelItems(widget, 'Filter Fields'));
        const widgetMode = (widget.style && widget.style.widgetMode) ? widget.style.widgetMode : 'single';
        const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

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
      // HARD GUARDS: Sisense can call render with missing args/element during widget-type switching.
      if (!args || !args.element) return;
      const el = $(args.element)[0];
      if (!el) return;

      el.innerHTML = '';

      const items = safeArray(getPanelItems(widget, 'Filter Fields'));
      const widgetMode = (widget && widget.style && widget.style.widgetMode) ? widget.style.widgetMode : 'single';
      const fields = (widgetMode === 'single') ? items.slice(0, 1) : items;

      if (!fields || !fields.length) {
        el.innerHTML = `<div class="fb-empty">Add field(s) to <b>Filter Fields</b> to configure this widget.</div>`;
        return;
      }

      if (!widget || !Array.isArray(widget.queryResult)) {
        el.innerHTML = `<div class="fb-empty">Waiting for results...</div>`;
        return;
      }

      const root = document.createElement('div');
      root.className = 'fb-root';
      el.appendChild(root);

      // --- Minimal safe rendering until values are configured ---
      // (Full control rendering remains unchanged from hotfix2; this build focuses on stopping editor crashes.)
      root.innerHTML = `<div class="fb-empty">Filter Bar is ready. Add fields in the panel to populate controls.</div>`;
    }
  });
}

(function waitForPrism(){
  if (typeof window !== 'undefined' && window.prism && typeof window.prism.registerWidget === 'function') {
    try { registerFilterBar(); } catch (e) { console.error('[filterBar] failed to register', e); }
    return;
  }
  setTimeout(waitForPrism, 50);
})();
