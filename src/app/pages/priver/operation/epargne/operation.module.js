/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.operation.epargne', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.operationEpargne', {
          url: '/epargne/:idCategorie',
          title: 'Opération',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/operation/operation.html',
                  controller: 'OperationEpargneCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.OPERATION.TITRE_EPARGNE',
              urlHelp: 'epargne'
          }
      });
    }
})();
