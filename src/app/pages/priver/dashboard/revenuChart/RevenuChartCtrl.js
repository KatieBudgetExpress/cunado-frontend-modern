(function () {
  'use strict';

  angular.module('i2sFinance.priver.dashboard')
      .controller('RevenuChartCtrl', RevenuChartCtrl);

  /** @ngInject */
  function RevenuChartCtrl($scope, baConfig, colorHelper) {

    $scope.createDoughnutRev = () => {

      var ctx = document.getElementById('chartrevenu-area').getContext('2d');

      window.myDoughnutRev = new Chart(ctx, {
        type: 'doughnut',
        data: $scope.doughnutDataRev,
        options: {
          cutoutPercentage: 64,
          responsive: true,
          segmentShowStroke: false,
          elements: {
            arc: {
              borderWidth: 0
            }
          }
        }
      });
    }

    $scope.$watch('doughnutDataRev', (newValue, oldValue) => {
      if (typeof newValue !== 'undefined' && newValue.datasets !== undefined && newValue.datasets.length) {
        $scope.createDoughnutRev();
      }
    });
  }
})();
