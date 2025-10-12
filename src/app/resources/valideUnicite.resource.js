(function () {
    'use strict';

    angular.module('i2sFinance.resources.valideUnicite', [])
        .factory('ValideUniciteResource', ValideUniciteResourceResourceFactory);

    /* @ngInject */
    function ValideUniciteResourceResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParCondition: {
                method: 'POST',
                url: `${urlBasePriver}/valideUnicite/getParCondition`
            }
        };
        return $resource(`${urlBasePriver}/valideUnicite`, params, actions) ;

    }
})();
