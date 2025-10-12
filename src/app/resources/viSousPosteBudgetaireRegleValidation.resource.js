(function () {
    'use strict';

    angular.module('i2sFinance.resources.viSousPosteBudgetaireRegleValidation', [])
        .factory('ViSousPosteBudgetaireRegleValidationResource', ViSousPosteBudgetaireRegleValidationFactory);

    /* @ngInject */
    function ViSousPosteBudgetaireRegleValidationFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParId: {
              method: 'POST',
              url: `${urlBasePriver}/viSousPosteBudgetaireRegleValidation/getParId`
          }
        };
        return $resource(`${urlBasePriver}/viSousPosteBudgetaireRegleValidation`, params, actions) ;

    }
})();
