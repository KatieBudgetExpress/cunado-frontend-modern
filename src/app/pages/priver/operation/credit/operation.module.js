/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.operation.credit', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.operationCredit', {
          url: '/credit/:idCategorie',
          title: 'Opération',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/operation/operation.html',
                  controller: 'OperationCreditCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.OPERATION.TITRE_CREDIT',
              urlHelp: 'credit'
          }
      });
    }
})();
