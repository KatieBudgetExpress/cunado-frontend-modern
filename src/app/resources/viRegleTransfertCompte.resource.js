(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleTransfertCompte', [])
        .factory('ViRegleTransfertCompteResource', ViRegleTransfertCompteFactory);

    /* @ngInject */
    function ViRegleTransfertCompteFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParSousPosteRegleRegle: {
                method: 'POST',
                url: `${urlBasePriver}/viRegleTransfertCompte/getParSousPosteRegleRegle`
            },
            getParSousPosteRegleType: {
                method: 'POST',
                url: `${urlBasePriver}/viRegleTransfertCompte/getParSousPosteRegleType`
            }
        };
        return $resource(`${urlBasePriver}/viRegleTransfertCompte`, params, actions) ;

    }
})();
