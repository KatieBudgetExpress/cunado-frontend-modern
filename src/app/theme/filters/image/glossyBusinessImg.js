/**
 * @author i2sFinance
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .filter('glossyBusinessImg', glossyBusinessImg);

  /** @ngInject */
  function glossyBusinessImg(layoutPaths) {
    return function(input) {
      return layoutPaths.images.root + 'theme/icon/glossyBusiness/' + input + '.png';
    };
  }

})();
