(function () {
    'use strict';

    angular.module('i2sFinance.resources.viSousPosteBudgetaire', [])
        .factory('ViSousPosteBudgetaireResource', ViSousPosteBudgetaireFactory);

    /* @ngInject */
    function ViSousPosteBudgetaireFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParCateg: {
              method: 'POST',
              url: `${urlBasePriver}/viSousPosteBudgetaire/getParCateg`
          },
          getParId: {
              method: 'POST',
              url: `${urlBasePriver}/viSousPosteBudgetaire/getParId`
          }
        };
        return $resource(`${urlBasePriver}/viSousPosteBudgetaire`, params, actions) ;

    }
})();
