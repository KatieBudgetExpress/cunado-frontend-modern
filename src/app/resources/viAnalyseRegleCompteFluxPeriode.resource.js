(function () {
    'use strict';

    angular.module('i2sFinance.resources.viAnalyseRegleCompteFluxPeriode', [])
        .factory('ViAnalyseRegleCompteFluxPeriodeResource', ViAnalyseRegleCompteFluxPeriodeFactory);

    /* @ngInject */
    function ViAnalyseRegleCompteFluxPeriodeFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getFlux: {
                method: 'POST',
                url: `${urlBasePriver}/viAnalyseRegleCompteFluxPeriode/getFlux`
            }
        };
        return $resource(`${urlBasePriver}/viAnalyseRegleCompteFluxPeriode`, params, actions) ;

    }
})();
