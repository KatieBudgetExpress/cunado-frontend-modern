(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleSousPosteBudgetaire', [])
        .factory('ViRegleSousPosteBudgetaireResource', ViRegleSousPosteBudgetaireFactory);

    /* @ngInject */
    function ViRegleSousPosteBudgetaireFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParBudgetCateg: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleSousPosteBudgetaire/getParBudgetCateg`
          },
          getParBudgetId: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleSousPosteBudgetaire/getParBudgetId`
          },
          getParLovNullable: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleSousPosteBudgetaire/getParLovNullable`
          },
          getParLovTous: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleSousPosteBudgetaire/getParLovTous`
          },
          getParGroupe: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleSousPosteBudgetaire/getParGroupe`
          }
        };
        return $resource(`${urlBasePriver}/viRegleSousPosteBudgetaire`, params, actions) ;

    }
})();
