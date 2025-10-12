(function () {
    'use strict';

    angular.module('i2sFinance.resources.banque', [])
        .factory('BanqueResource', BanqueResourceFactory);

    /* @ngInject */
    function BanqueResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
        return $resource(`${urlBasePriver}/banque`, params, actions) ;

    }
})();
