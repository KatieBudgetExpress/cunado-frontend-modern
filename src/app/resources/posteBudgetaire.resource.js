(function () {
    'use strict';

    angular.module('i2sFinance.resources.posteBudgetaire', [])
        .factory('PosteBudgetaireResource', PosteBudgetaireResourceFactory);

    /* @ngInject */
    function PosteBudgetaireResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
            }
        };
        return $resource(`${urlBasePriver}/posteBudgetaire`, params, actions) ;

    }
})();
