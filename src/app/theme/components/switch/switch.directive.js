/**
 * @author S. Lizotte
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme.components')
      .directive('switch', switchDirective);

  /** @ngInject */
  function switchDirective($timeout) {
    return {
      restrict: 'EA',
      replace: true,
      scope: {
        ngModel: '='
      },
      template: function(el, attrs) {
        return '<div class="switch-container ' + (attrs.color || '') + '"><input ng-attr-type="checkbox" ng-model="ngModel"></div>';
      },
      link: function (scope, elem, attr) {
        $timeout(function(){
          var input = $(elem).find('input');

          input.bootstrapSwitch({
            size: 'small',
            onColor: attr.color,
            onText: attr.checktext,
            offText: attr.unchecktext,
            disabled: attr.disabled
          });
          input.on('switchChange.bootstrapSwitch', function(event, state) {
            scope.ngModel = state;
            scope.$apply();
          });

        });
      }
    };
  }
})();
