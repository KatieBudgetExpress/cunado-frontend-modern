(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleAjustement', [])
        .factory('ViRegleAjustementResource', ViRegleAjustementFactory);

    /* @ngInject */
    function ViRegleAjustementFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParId: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleAjustement/getParId`
          }
        };
        return $resource(`${urlBasePriver}/viRegleAjustement`, params, actions) ;

    }
})();
