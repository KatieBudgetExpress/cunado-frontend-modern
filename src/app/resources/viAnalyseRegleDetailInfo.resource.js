(function () {
    'use strict';

    angular.module('i2sFinance.resources.viAnalyseRegleDetailInfo', [])
        .factory('ViAnalyseRegleDetailInfoResource', ViAnalyseRegleDetailInfoFactory);

    /* @ngInject */
    function ViAnalyseRegleDetailInfoFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParBudgetDate: {
                method: 'POST',
                url: `${urlBasePriver}/viAnalyseRegleDetailInfo/getParBudgetDate`
            },
            getParBudget: {
                method: 'POST',
                url: `${urlBasePriver}/viAnalyseRegleDetailInfo/getParBudget`
            }
        };
        return $resource(`${urlBasePriver}/viAnalyseRegleDetailInfo`, params, actions) ;

    }
})();
