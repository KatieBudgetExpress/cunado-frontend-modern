(function () {
    'use strict';
    angular.module('i2sFinance.public.auth', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('public.auth', {
            url: '/auth',
            title: 'Auth',
            views: {
                content: {
                    templateUrl: 'app/pages/public/auth/auth.html',
                    controller: 'authController',
                    controllerAs: 'vm'
                }
            }
        });
    }

})();
