(function () {
    'use strict';

    angular.module('i2sFinance.resources.viAnalyseRegleDetail', [])
        .factory('ViAnalyseRegleDetailResource', ViAnalyseRegleDetailFactory);

    /* @ngInject */
    function ViAnalyseRegleDetailFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getPrecedent: {
              method: 'POST',
              url: `${urlBasePriver}/viAnalyseRegleDetail/getPrecedent`
          },
          getSuivant: {
              method: 'POST',
              url: `${urlBasePriver}/viAnalyseRegleDetail/getSuivant`
          }
        };
        return $resource(`${urlBasePriver}/viAnalyseRegleDetail`, params, actions) ;

    }
})();
