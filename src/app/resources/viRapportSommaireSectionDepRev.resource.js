(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRapportSommaireSectionDepRev', [])
        .factory('ViRapportSommaireSectionDepRevResource', ViRapportSommaireSectionDepRevFactory);

    /* @ngInject */
    function ViRapportSommaireSectionDepRevFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
          getParPoste: {
              method: 'POST',
              url: `${urlBasePriver}/viRapportSommaireSectionDepRev/getParPoste`
          },
          getParSousPoste: {
              method: 'POST',
              url: `${urlBasePriver}/viRapportSommaireSectionDepRev/getParSousPoste`
          }
        };
        return $resource(`${urlBasePriver}/viRapportSommaireSectionDepRev`, params, actions) ;

    }
})();
