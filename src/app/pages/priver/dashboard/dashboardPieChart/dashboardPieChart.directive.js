/**
 * @author BlurAdmin
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.dashboard')
      .directive('dashboardPieChart', dashboardPieChart);

  /** @ngInject */
  function dashboardPieChart() {
    return {
      restrict: 'E',
      controller: 'DashboardPieChartCtrl',
      templateUrl: 'app/pages/priver/dashboard/dashboardPieChart/dashboardPieChart.html'
    };
  }
})();
