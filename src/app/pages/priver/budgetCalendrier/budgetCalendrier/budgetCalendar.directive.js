(function () {
  'use strict';

  angular.module('i2sFinance.priver.budgetCalendrier')
      .directive('budgetCalendar', budgetCalendar);

  /** @ngInject */
  function budgetCalendar() {
    return {
      restrict: 'E',
      controller: 'BudgetCalendarCtrl',
      templateUrl: 'app/pages/priver/budgetCalendrier/budgetCalendrier/budgetCalendar.html'
    };
  }
})();
