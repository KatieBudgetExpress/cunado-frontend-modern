/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.copiebudget', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('priver.copiebudget', {
            url: '/copiebudget',
            title: 'CldToNewBudget',
            views: {
                content: {
                    templateUrl: 'app/pages/priver/copieBudget/copieBudget.html',
                    controller: 'CopieBudgetCtrl',
                    controllerAs: 'vm'
                }
            },
            data: {
                      pageTitle: 'ECRAN.OLD_TO_NEW_BUDGET.TITRE',
                      urlHelp: 'copieBudget'
                  }
        });
    }

})();
