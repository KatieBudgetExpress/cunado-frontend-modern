(function () {
    'use strict';

    angular.module('i2sFinance.resources.regleDate', [])
        .factory('RegleDateResource', RegleDateResourceFactory);

    /* @ngInject */
    function RegleDateResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
                url: `${urlBasePriver}/regleDate/bulkCreate`
            },
            remove: {
                method: 'DELETE'
            },
            getParRegle: {
                method: 'POST',
                url: `${urlBasePriver}/regleDate/getParRegle`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/regleDate/getParBudget`
            }
        };
        return $resource(`${urlBasePriver}/regleDate`, params, actions) ;

    }
})();
