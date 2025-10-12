(function () {
    'use strict';

    angular.module('i2sFinance.resources.solde', [])
        .factory('SoldeResource', SoldeFactory);

    /* @ngInject */
    function SoldeFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParIdDate: {
                method: 'POST',
                url: `${urlBasePriver}/solde/getParIdDate`
            }
        };
        return $resource(`${urlBasePriver}/solde`, params, actions) ;

    }
})();
