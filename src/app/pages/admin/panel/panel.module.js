(function () {
    'use strict';

    angular.module('i2sFinance.admin.panel', [])
        .config(routeConfig);

    /** @ngInject */

    function routeConfig($stateProvider) {
        $stateProvider.state('admin.panel', {
            url: '/panel',
            title: 'Panel',
            views: {
                content: {
                    templateUrl: 'app/pages/admin/panel/panel.html',
                    controller: 'PanelPageCtrl',
                    controllerAs: 'vm'
                }
            }
/*
            sidebarMeta: {
                    icon: 'ion-android-home',
                    order: 0,
                    menuTitle: 'ECRAN.TABLEAUBORD.TITRE_MENU'
                },
            data: {
                pageTitle: 'ECRAN.TABLEAUBORD.TITRE',
                urlHelp: 'dashboard'
            }
*/
        });
    }

})();
