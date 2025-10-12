(function () {
    'use strict';

    angular.module('i2sFinance.resources.banqueCompte', [])
        .factory('BanqueCompteResource', BanqueCompteResourceFactory);

    /* @ngInject */
    function BanqueCompteResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getAll: {
                method: 'GET'
            },
            update: {
                method: 'PUT'
            },
            create: {
                method: 'POST'
            },
            remove: {
                method: 'DELETE'
            },
            getParBanque: {
                method: 'POST',
                url: `${urlBasePriver}/banqueCompte/getParBanque`
            },
        };
        return $resource(`${urlBasePriver}/banqueCompte`, params, actions) ;

    }
})();
