/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.operation.compte', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.operationCompte', {
          url: '/compte/:idCategorie',
          title: 'Opération',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/operation/operation.html',
                  controller: 'OperationCompteCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.OPERATION.TITRE_COMPTE',
              urlHelp: 'compte'
          }
      });
    }

})();
