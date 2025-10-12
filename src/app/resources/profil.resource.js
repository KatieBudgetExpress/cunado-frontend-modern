(function () {
    'use strict';

    angular.module('i2sFinance.resources.profil', [])
        .factory('ProfilResource', ProfilResourceFactory);

    /* @ngInject */
    function ProfilResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getAll: {
                method: 'GET'
            },
            update: {
                method: 'PUT'
            },
            updateMp: {
                method: 'PUT',
                url: `${urlBasePriver}/profilMp`
            },
            create: {
                method: 'POST'
            },
            remove: {
                method: 'DELETE'
            }
        };
        return $resource(`${urlBasePriver}/profil`, params, actions) ;

    }
})();
