(function () {
    'use strict';

    angular.module('i2sFinance.resources.sousPosteBudgetaire', [])
        .factory('SousPosteBudgetaireResource', SousPosteBudgetaireResourceFactory);

    /* @ngInject */
    function SousPosteBudgetaireResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
            getCptPrinc: {
                method: 'POST',
                url: `${urlBasePriver}/sousPosteBudgetaire/getCptPrinc`
            }
        };
        return $resource(`${urlBasePriver}/sousPosteBudgetaire`, params, actions) ;

    }
})();
