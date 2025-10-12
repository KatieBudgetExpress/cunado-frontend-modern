/**
 * @author Sébastien Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.sousPosteBudgetaire', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.sousPosteBudgetaire', {
          url: '/sousPosteBudgetaire',
          title: 'Sous Poste Budgetaire',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/sousPosteBudgetaire/sousPosteBudgetaireGrille.html',
                  controller: 'SousPosteBudgetairePageCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.SOUSPOSTEBUDGETAIRE.TITRE',
              urlHelp: 'sousPosteBudgetaire'
          }
      });
    }

})();
