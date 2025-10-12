(function () {
  'use strict';

  angular.module('i2sFinance.priver.dashboard')
      .controller('DepenseChartCtrl', DepenseChartCtrl);

  /** @ngInject */
  function DepenseChartCtrl($scope, baConfig, colorHelper) {

    $scope.createDoughnutDep = () => {

      var ctx = document.getElementById('chartdepense-area').getContext('2d');

      window.myDoughnutDep = new Chart(ctx, {
        type: 'doughnut',
        data: $scope.doughnutDataDep,
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

    $scope.$watch('doughnutDataDep', (newValue, oldValue) => {
      if (typeof newValue !== 'undefined' && newValue.datasets !== undefined && newValue.datasets.length) {
        $scope.createDoughnutDep();
      }
    });
  }
})();
