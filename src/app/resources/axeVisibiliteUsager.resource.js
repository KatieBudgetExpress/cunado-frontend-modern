(function () {
    'use strict';

    angular.module('i2sFinance.resources.axeVisibiliteUsagerResource', [])
        .factory('AxeVisibiliteUsagerResource', AxeVisibiliteUsagerResourceFactory);

    /* @ngInject */
    function AxeVisibiliteUsagerResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
        return $resource(`${urlBasePriver}/axeVisibiliteUsager`, params, actions) ;

    }
})();
