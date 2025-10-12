(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRapport', [])
        .factory('ViRapportResource', ViRapportFactory);

    /* @ngInject */
    function ViRapportFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getVentilation: {
              method: 'POST',
              url: `${urlBasePriver}/viRapport/getVentilation`
          }
        };
        return $resource(`${urlBasePriver}/viRapport`, params, actions) ;

    }
})();
