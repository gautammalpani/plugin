// Style panel controller for Filter Bar widget
// Works both as a browser script (Sisense plugin loader) and as a CommonJS module (if bundled).

(function (root) {
  const controller = ['$scope', ($scope) => {
    const redraw = () => {
      try {
        $scope.$root?.widget?.redraw?.();
      } catch (e) {
        // no-op
      }
    };

    $scope.$watchGroup(
      [
        'widget.style.widgetMode',
        'widget.style.selectionMode',
        'widget.style.numericMode',
        'widget.style.dateMode',
        'widget.style.dateLevel',
        'widget.style.enableTypeahead',
        'widget.style.serverTypeahead',
        'widget.style.minChars',
        'widget.style.maxResults',
        'widget.style.saveToServer',
        'widget.style.applyBehavior'
      ],
      redraw
    );
  }];

  // Expose for browser usage
  root.pluginFilterBarStylerController = controller;

  // Also support CommonJS if present
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = controller;
  }
})(typeof window !== 'undefined' ? window : this);
