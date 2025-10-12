(function() {
  'use strict';

  angular.module('i2sFinance.theme.components')
    .directive('baWizard', baWizard);

  /** @ngInject */
  function baWizard() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
          action: '&?'
      },
      templateUrl: 'app/theme/components/baWizard/baWizard.html',
      controllerAs: 'vm',
      controller: 'baWizardCtrl'
    }
  }
})();
