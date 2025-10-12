(function () {
    'use strict';

    angular.module('i2sFinance.resources.budgetResource', [])
        .factory('BudgetResource', BudgetResourceFactory);

    /* @ngInject */
    function BudgetResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
            }
        };
        return $resource(`${urlBasePriver}/budget`, params, actions) ;

    }
})();
