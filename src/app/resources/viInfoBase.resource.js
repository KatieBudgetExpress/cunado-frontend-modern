(function () {
    'use strict';

    angular.module('i2sFinance.resources.viInfoUsager', [])
        .factory('ViInfoUsagerResource', ViInfoUsagerResourceFactory);

    /* @ngInject */
    function ViInfoUsagerResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getAll: {
                method: 'GET',
                url: `${urlBasePriver}/viInfoUsager/getInfoUsager`
            }
        };
        return $resource(`${urlBasePriver}/viInfoUsager`, params, actions) ;

    }
})();
