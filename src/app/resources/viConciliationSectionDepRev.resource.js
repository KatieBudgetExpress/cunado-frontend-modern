(function () {
    'use strict';

    angular.module('i2sFinance.resources.viConciliationSectionDepRev', [])
        .factory('ViConciliationSectionDepRevResource', ViConciliationSectionDepRevFactory);

    /* @ngInject */
    function ViConciliationSectionDepRevFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParDate: {
              method: 'POST',
              url: `${urlBasePriver}/viConciliationSectionDepRev/getParDate`
          }
        };
        return $resource(`${urlBasePriver}/viConciliationSectionDepRev`, params, actions) ;

    }
})();
