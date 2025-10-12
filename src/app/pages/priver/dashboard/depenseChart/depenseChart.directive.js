(function () {
  'use strict';

  angular.module('i2sFinance.priver.dashboard')
      .directive('depenseChart', depenseChart);

  /** @ngInject */
  function depenseChart() {
    return {
      restrict: 'E',
      controller: 'DepenseChartCtrl',
      templateUrl: 'app/pages/priver/dashboard/depenseChart/depenseChart.html'
    };
  }
})();
