(function () {
    'use strict';

    angular.module('i2sFinance.resources.regleImpact', [])
        .factory('RegleImpactResource', RegleImpactResourceFactory);

    /* @ngInject */
    function RegleImpactResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
                url: `${urlBasePriver}/regleImpact/bulkCreate`
            },
            remove: {
                method: 'DELETE'
            },
            getParRegle: {
                method: 'POST',
                url: `${urlBasePriver}/regleImpact/getParRegle`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/regleImpact/getParBudget`
            }
        };
        return $resource(`${urlBasePriver}/regleImpact`, params, actions) ;

    }
})();
