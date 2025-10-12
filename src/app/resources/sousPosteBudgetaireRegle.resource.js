(function () {
    'use strict';

    angular.module('i2sFinance.resources.sousPosteBudgetaireRegle', [])
        .factory('SousPosteBudgetaireRegleResource', SousPosteBudgetaireRegleFactory);

    /* @ngInject */
    function SousPosteBudgetaireRegleFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getAll: {
              method: 'GET'
          },
          update: {
              method: 'PUT'
          },
          create: {
              method: 'POST'
          },
          bulkCreate: {
              method: 'POST',
              url: `${urlBasePriver}/sousPosteBudgetaireRegle/bulkCreate`
          },
          remove: {
              method: 'DELETE'
          },
          getId: {
              method: 'GET',
              url: `${urlBasePriver}/sousPosteBudgetaireRegle/getId`
          },
          getCptPrinc: {
              method: 'POST',
              url: `${urlBasePriver}/sousPosteBudgetaireRegle/getCptPrinc`
          },
          getParBudget: {
              method: 'POST',
              url: `${urlBasePriver}/sousPosteBudgetaireRegle/getParBudget`
          }
        };
        return $resource(`${urlBasePriver}/sousPosteBudgetaireRegle`, params, actions) ;

    }
})();
