const controller = ['$scope', ($scope) => {
  $scope.$watchGroup([
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
  ], () => $scope.$root.widget.redraw());
}];

module.exports = controller;
