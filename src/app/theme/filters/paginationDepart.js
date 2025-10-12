/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
    .filter('paginationDepart', paginationDepart);

  /** @ngInject */
  function paginationDepart() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
  }

})();
