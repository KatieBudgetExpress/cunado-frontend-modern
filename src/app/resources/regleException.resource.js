(function () {
    'use strict';

    angular.module('i2sFinance.resources.regleException', [])
        .factory('RegleExceptionResource', RegleExceptionResourceFactory);

    /* @ngInject */
    function RegleExceptionResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
                url: `${urlBasePriver}/regleException/bulkCreate`
            },
            remove: {
                method: 'DELETE'
            },
            getParRegle: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/getParRegle`
            },
            getParRegleDate: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/getParRegleDate`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/getParBudget`
            },
            removeParRegle: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/removeParRegle`
            },
            removeParRegleDateException: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/removeParRegleDateException`
            },
            removeParRegleDateRegle: {
                method: 'POST',
                url: `${urlBasePriver}/regleException/removeParRegleDateRegle`
            }
        };
        return $resource(`${urlBasePriver}/regleException`, params, actions) ;

    }
})();
