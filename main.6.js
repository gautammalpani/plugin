// Filter Bar loader stub for download verification v1.0.3-noctrl-v2-unique
// NOTE: This is a stub to verify correct file delivery. Replace with full implementation after download issue resolved.
(function(){
  function reg(){
    console.log('[filterBar] registering v1.0.3-noctrl-v2-unique');
    prism.registerWidget('filterBar', {
      name:'filterBar', family:'table', title:'Filter Bar',
      iconSmall:'/plugins/filterBar/widget-24.png',
      styleEditorTemplate:'/plugins/filterBar/style-panel-template-v2.html',
      sizing:{minHeight:80,maxHeight:360,minWidth:300,maxWidth:3000},
      style:{ widgetMode:'single' },
      data:{ panels:[{name:'Filter Fields',type:'visible',metadata:{types:['dimensions'],maxitems:-1}}],
            buildQuery:(widget,q)=> (q||{}) },
      render:(widget,args)=>{ if(!args||!args.element) return; const el=$(args.element)[0]; if(!el) return; el.innerHTML='<div class="fb-empty">FilterBar v2 unique loaded</div>'; }
    });
  }
  function wait(){
    if(window.prism && typeof window.prism.registerWidget==='function'){ try{reg();}catch(e){console.error(e);} return; }
    setTimeout(wait,50);
  }
  wait();
})();
