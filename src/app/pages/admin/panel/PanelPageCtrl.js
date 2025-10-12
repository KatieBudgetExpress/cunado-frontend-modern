(function () {
    'use strict';

    angular.module('i2sFinance.admin.panel')
        .controller('PanelPageCtrl', PanelPageCtrl);

    /** @ngInject */
    function PanelPageCtrl($scope, authService, $location) {

      const vm = this;
      authService.validateSession();

    }

})();
