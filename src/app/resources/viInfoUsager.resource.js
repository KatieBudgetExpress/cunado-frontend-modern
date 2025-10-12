(function () {
    'use strict';

    angular.module('i2sFinance.resources.viInfoBase', [])
        .factory('ViInfoBaseResource', ViInfoBaseResourceFactory);

    /* @ngInject */
    function ViInfoBaseResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getAll: {
                method: 'GET',
                url: `${urlBasePriver}/viInfoBase/getInfoBase`
            }
        };
        return $resource(`${urlBasePriver}/viInfoBase`, params, actions) ;

    }
})();
