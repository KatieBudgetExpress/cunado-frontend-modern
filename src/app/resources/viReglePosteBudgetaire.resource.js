(function () {
    'use strict';

    angular.module('i2sFinance.resources.viReglePosteBudgetaire', [])
        .factory('ViReglePosteBudgetaireResource', ViReglePosteBudgetaireFactory);

    /* @ngInject */
    function ViReglePosteBudgetaireFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getParBudgetCateg: {
                method: 'POST',
                url: `${urlBasePriver}/viReglePosteBudgetaire/getParBudgetCateg`
            }
        };
        return $resource(`${urlBasePriver}/viReglePosteBudgetaire`, params, actions) ;

    }
})();
