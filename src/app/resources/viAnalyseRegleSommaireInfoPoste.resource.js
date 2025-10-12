(function () {
    'use strict';

    angular.module('i2sFinance.resources.viAnalyseRegleSommaireInfoPoste', [])
        .factory('ViAnalyseRegleSommaireInfoPosteResource', ViAnalyseRegleSommaireInfoPosteFactory);

    /* @ngInject */
    function ViAnalyseRegleSommaireInfoPosteFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParCategorie: {
                method: 'POST',
                url: `${urlBasePriver}/viAnalyseRegleSommaireInfoPoste/getParCategorie`
            }
        };
        return $resource(`${urlBasePriver}/viAnalyseRegleSommaireInfoPoste`, params, actions) ;

    }
})();
