(function () {
    'use strict';

    angular.module('i2sFinance.resources.importFileResource', [])
        .factory('ImportFileResource', ImportFileResourceFactory);

    /* @ngInject */
    function ImportFileResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getFileOfxQfx: {
                method: 'POST',
                url: `${urlBasePriver}/importFile/getFileOfxQfx`
            },
            getFileCsv: {
                method: 'POST',
                url: `${urlBasePriver}/importFile/getFileCsv`
            },
            getFileDb: {
                method: 'POST',
                url: `${urlBasePriver}/importFile/getFileDb`
            }
        };
        return $resource(`${urlBasePriver}/importFile`, params, actions) ;
    }
})();
