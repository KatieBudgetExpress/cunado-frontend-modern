/**
 * @author Sébastien Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.banque', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
      $stateProvider.state('priver.banque', {
          url: '/banque',
          title: 'Banque',
          views: {
              content: {
                  templateUrl: 'app/pages/priver/banque/banqueGrille.html',
                  controller: 'BanquePageCtrl',
                  controllerAs: 'vm'
              }
          },
          data: {
              pageTitle: 'ECRAN.BANQUE.TITRE',
              urlHelp: 'banque'
          }
      });
    }

})();
