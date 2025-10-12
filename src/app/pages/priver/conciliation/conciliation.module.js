/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.conciliation', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.conciliation', {
          url: '/conciliation',
          title: 'Conciliation',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/conciliation/conciliation.html',
                  controller: 'ConciliationCtrl',
                  controllerAs: 'vm'
              }
          },    
          data: {
              pageTitle: 'ECRAN.CONCILIATION.TITRE',
              urlHelp: 'conciliation'
          }
      });
    }

})();
