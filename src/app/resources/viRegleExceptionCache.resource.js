(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRegleExceptionCache', [])
        .factory('ViRegleExceptionCacheResource', ViRegleExceptionCacheFactory);

    /* @ngInject */
    function ViRegleExceptionCacheFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParIdRegleDateRegle: {
              method: 'POST',
              url: `${urlBasePriver}/viRegleExceptionCache/getParIdRegleDateRegle`
          }
        };
        return $resource(`${urlBasePriver}/viRegleExceptionCache`, params, actions) ;

    }
})();
