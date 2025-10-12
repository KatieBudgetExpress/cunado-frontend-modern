(function () {
    'use strict';

    angular.module('i2sFinance.priver.dashboard', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('priver.dashboard', {
            url: '/dashboard',
            title: 'Tableau de bord',
            views: {
                content: {
                    templateUrl: 'app/pages/priver/dashboard/dashboard.html',
                    controller: 'DashboardCtrl',
                    controllerAs: 'vm'
                }
            },
            sidebarMeta: {
                    icon: 'ion-android-home',
                    order: 0,
                    menuTitle: 'ECRAN.TABLEAUBORD.TITRE_MENU'
                },
            data: {
                pageTitle: 'ECRAN.TABLEAUBORD.TITRE',
                urlHelp: 'dashboard'
            }
        });
    }

})();
