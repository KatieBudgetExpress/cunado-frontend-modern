(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRapportDetailleSectionCompteCredit', [])
        .factory('ViRapportDetailleSectionCompteCreditResource', ViRapportDetailleSectionCompteCreditFactory);

    /* @ngInject */
    function ViRapportDetailleSectionCompteCreditFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParSousPoste: {
              method: 'POST',
              url: `${urlBasePriver}/viRapportDetailleSectionCompteCredit/getParSousPoste`
          }
        };
        return $resource(`${urlBasePriver}/viRapportDetailleSectionCompteCredit`, params, actions) ;

    }
})();
