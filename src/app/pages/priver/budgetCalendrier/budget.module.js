(function () {
    'use strict';

    angular.module('i2sFinance.priver.budgetCalendrier', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('priver.budgetCalendrier', {
                url: '/budgetCalendrier',
                title: 'budgetCalendrier',
                views: {
                    content: {
                        templateUrl: 'app/pages/priver/budgetCalendrier/budget.html',
                        controller: 'BudgetCtrl',
                        controllerAs: 'vm'
                    }
                },
                sidebarMeta: {
                    icon: 'fa fa-calendar',
                    order: 1,
                    menuTitle: 'ECRAN.CALENDRIER.TITRE_MENU'
                },
                data: {
                    pageTitle: 'ECRAN.CALENDRIER.TITRE',
                    urlHelp: 'calendrier'
                }
            });
    }

})();
