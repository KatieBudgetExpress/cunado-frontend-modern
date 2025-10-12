(function () {
    'use strict';

    angular.module('i2sFinance.resources.regleExceptionVentilation', [])
        .factory('RegleExceptionVentilationResource', RegleExceptionVentilationResourceFactory);

    /* @ngInject */
    function RegleExceptionVentilationResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
            bulkCreate: {
                method: 'POST',
                url: `${urlBasePriver}/regleExceptionVentilation/bulkCreate`
            },
            remove: {
                method: 'DELETE'
            },
            getId: {
                method: 'POST',
                url: `${urlBasePriver}/regleExceptionVentilation/getId`
            },
            getParRegleException: {
                method: 'POST',
                url: `${urlBasePriver}/regleExceptionVentilation/getParRegleException`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/regleExceptionVentilation/getParBudget`
            }
        };
        return $resource(`${urlBasePriver}/regleExceptionVentilation`, params, actions) ;

    }
})();
