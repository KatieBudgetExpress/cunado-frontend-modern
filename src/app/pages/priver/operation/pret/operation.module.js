/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.operation.pret', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.operationPret', {
          url: '/pret/:idCategorie',
          title: 'Opération',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/operation/operation.html',
                  controller: 'OperationPretCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.OPERATION.TITRE_PRET',
              urlHelp: 'pret'
          }
      });
    }

})();
