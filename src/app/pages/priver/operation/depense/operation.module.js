/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.operation.depense', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.operationDepense', {
          url: '/depense/:idCategorie',
          title: 'Opération',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/operation/operation.html',
                  controller: 'OperationDepenseCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.OPERATION.TITRE_DEPENSE',
              urlHelp: 'depense'
          }
      });
    }

})();
