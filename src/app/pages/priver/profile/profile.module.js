(function () {
    'use strict';

    angular.module('i2sFinance.priver.profile', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('priver.profile', {
            url: '/profile',
            title: 'Profile',
            views: {
                content: {
                    templateUrl: 'app/pages/priver/profile/profile.html',
                    controller: 'ProfilePageCtrl',
                    controllerAs: 'vm'
                }
            },
            data: {
                      pageTitle: 'ECRAN.PROFIL.TITRE',
                      urlHelp: 'profile'
                  }
        });
    }

})();
