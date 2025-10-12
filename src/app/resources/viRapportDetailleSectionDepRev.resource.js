(function () {
    'use strict';

    angular.module('i2sFinance.resources.viRapportDetailleSectionDepRev', [])
      .factory('ViRapportDetailleSectionDepRevResource', ViRapportDetailleSectionDepRevFactory);

/* @ngInject */
function ViRapportDetailleSectionDepRevFactory($resource, urlBasePriver, urlBasePublic) {

    var params = {authen: true};

    var actions = {
      getParBudgetCat: {
          method: 'POST',
          url: `${urlBasePriver}/viRapportDetailleSectionDepRev/getParBudgetCat`
      }
    };
    return $resource(`${urlBasePriver}/viRapportDetailleSectionDepRev`, params, actions) ;

}
})();
