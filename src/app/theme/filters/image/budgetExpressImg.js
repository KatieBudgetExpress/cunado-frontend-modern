/**
 * @author i2sFinance
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .filter('budgetExpressImg', budgetExpressImg);

  /** @ngInject */
  function budgetExpressImg(layoutPaths) {
    return function(input) {
      return layoutPaths.images.root + 'theme/budgetExpress/' + input;
    };
  }

})();
