(function () {
    'use strict';

    angular.module('i2sFinance.resources.viPosteBudgetaire', [])
        .factory('ViPosteBudgetaireResource', ViPosteBudgetaireFactory);

    /* @ngInject */
    function ViPosteBudgetaireFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getAll: {
              method: 'POST',
              url: `${urlBasePriver}/viPosteBudgetaire/getAll`
          },
          getParCateg: {
              method: 'POST',
              url: `${urlBasePriver}/viPosteBudgetaire/getParCateg`
          }
        };
        return $resource(`${urlBasePriver}/viPosteBudgetaire`, params, actions) ;

    }
})();
