(function () {
    'use strict';

    angular.module('i2sFinance.theme.components')
        .component('cuBudgets', {
            templateUrl: 'app/theme/components/cuBudgets/cuBudgets.html',
            bindings: {
                action: '&',
                budgets: '='
            },
            controllerAs: 'vm',
            controller: 'cuBudgetsCtrl'
        });

})();
