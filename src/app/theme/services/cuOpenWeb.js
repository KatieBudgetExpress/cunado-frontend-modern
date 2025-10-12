/**
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.theme')
        .service('cuOpenWeb', openWebService);

    /** @ngInject */
    function openWebService() {

        return {
            open: open
        };
    }

    function open(url) {
      var win = window.open(url, '_blank');
      win.focus();
    }
})();
