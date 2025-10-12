(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleException', [])
        .factory('ViRegleExceptionResource', ViRegleExceptionFactory);

    /* @ngInject */
    function ViRegleExceptionFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParIdRegle: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleException/getParIdRegle`
          }
        };
        return $resource(`${urlBasePriver}/viRegleException`, params, actions) ;

    }
})();
