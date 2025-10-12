(function () {
    'use strict';

    angular.module('i2sFinance.resources.viLienBancaire', [])
        .factory('ViLienBancaireResource', ViLienBancaireFactory);

    /* @ngInject */
    function ViLienBancaireFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            getLovLienBancaireActif: {
              method: 'POST',
              url: `${urlBasePriver}/viLienBancaire/getLovLienBancaireActif`
          },
          getLovLienBancaireTous: {
              method: 'POST',
              url: `${urlBasePriver}/viLienBancaire/getLovLienBancaireTous`
          },         
        };
        return $resource(`${urlBasePriver}/viRegleSousPosteBudgetaire`, params, actions) ;

    }
})();
