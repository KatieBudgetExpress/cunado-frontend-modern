/**
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
    .filter('htmlSafe', htmlSafeFilter);

  /** @ngInject */
  function htmlSafeFilter($sce) {
      return function(htmlCode){
          return $sce.trustAsHtml(htmlCode);
      };
  }
})();
