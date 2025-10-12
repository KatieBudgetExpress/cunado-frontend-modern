/**
 * @author Sébastien Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.posteBudgetaire', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.posteBudgetaire', {
          url: '/posteBudgetaire',
          title: 'Poste Budgetaire',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/posteBudgetaire/posteBudgetaireGrille.html',
                  controller: 'PosteBudgetairePageCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.POSTEBUDGETAIRE.TITRE',
              urlHelp: 'posteBudgetaire'
          }
      });
    }

})();
