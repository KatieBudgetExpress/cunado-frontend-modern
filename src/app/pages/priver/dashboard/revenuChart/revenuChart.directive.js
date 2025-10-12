(function () {
  'use strict';

  angular.module('i2sFinance.priver.dashboard')
      .directive('revenuChart', revenuChart);

  /** @ngInject */
  function revenuChart() {
    return {
      restrict: 'E',
      controller: 'RevenuChartCtrl',
      templateUrl: 'app/pages/priver/dashboard/revenuChart/revenuChart.html'
    };
  }
})();
