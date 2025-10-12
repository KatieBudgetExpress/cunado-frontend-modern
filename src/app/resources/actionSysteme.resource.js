(function () {
    'use strict';

    angular.module('i2sFinance.resources.actionSystemeResource', [])
        .factory('ActionSystemeResource', ActionSystemeResourceFactory);

    /* @ngInject */
    function ActionSystemeResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            doAction: {
                method: 'POST'
            }
        };
        return $resource(`${urlBasePriver}/actionSysteme`, params, actions) ;

    }
})();
