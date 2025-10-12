/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.analyse', [])
        .config(routeConfig);

        /** @ngInject */
        function routeConfig($stateProvider) {
          $stateProvider.state('priver.analyse', {
              url: '/analyse',
              title: 'Analyse',
              views: {
                  content: {
                      templateUrl: 'app/pages/priver/analyse/analyse.html',
                      controller: 'AnalyseCtrl',
                      controllerAs: 'vm'
                  }
              },
              data: {
                  pageTitle: 'ECRAN.ANALYSE.TITRE',
                  urlHelp: 'analyse'
              }
          });
        }

})();
