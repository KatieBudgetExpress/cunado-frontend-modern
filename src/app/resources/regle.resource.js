(function () {
    'use strict';

    angular.module('i2sFinance.resources.regle', [])
        .factory('RegleResource', RegleResourceFactory);

    /* @ngInject */
    function RegleResourceFactory($resource, urlBasePriver, urlBasePublic) {

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
                url: `${urlBasePriver}/regle/bulkCreate`
            },
            remove: {
                method: 'DELETE'
            },
            getParSousPosteMaitre: {
                method: 'POST',
                url: `${urlBasePriver}/regle/getParSousPosteMaitre`
            },
            getParLienType: {
                method: 'POST',
                url: `${urlBasePriver}/regle/getParLienType`
            },
            getParLienTypeDate: {
                method: 'POST',
                url: `${urlBasePriver}/regle/getParLienTypeDate`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/regle/getParBudget`
            }
        };
        return $resource(`${urlBasePriver}/regle`, params, actions) ;

    }
})();
