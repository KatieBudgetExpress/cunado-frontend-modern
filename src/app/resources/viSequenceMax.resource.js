(function () {
    'use strict';

    angular.module('i2sFinance.resources.viSequenceMax', [])
        .factory('ViSequenceMaxResource', ViSequenceMaxResourceFactory);

    /* @ngInject */
    function ViSequenceMaxResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getSeq: {
                method: 'GET',
                url: `${urlBasePriver}/viSequenceMax/getSeq`
            }
        };
        return $resource(`${urlBasePriver}/viSequenceMax`, params, actions) ;
    }
})();
