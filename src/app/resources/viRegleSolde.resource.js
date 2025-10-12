(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleSolde', [])
        .factory('ViRegleSoldeResource', ViRegleSoldeFactory);

    /* @ngInject */
    function ViRegleSoldeFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParSousPosteRegleMaitre: {
                method: 'POST',
                url: `${urlBasePriver}/viRegleSolde/getParSousPosteRegleMaitre`
            }
        };
        return $resource(`${urlBasePriver}/viRegleSolde`, params, actions) ;

    }
})();
