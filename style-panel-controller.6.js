const controller = ['$scope', ($scope) => {
  if ($scope.widget.style.qtdf_multi == null) $scope.widget.style.qtdf_multi = false;
  if ($scope.widget.style.qtdf_persist == null) $scope.widget.style.qtdf_persist = false;
  if ($scope.widget.style.qtdf_debug == null) $scope.widget.style.qtdf_debug = false;

  $scope.$watch('widget.style', () => {
    $scope.$root.widget.redraw();
  }, true);
}];

module.exports = controller;
