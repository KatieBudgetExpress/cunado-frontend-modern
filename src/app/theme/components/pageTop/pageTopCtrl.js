/**
 * @author i2sFinance
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.theme.components')
        .controller('pageTopCtrl', pageTopCtrl);

    /** @ngInject */
    function pageTopCtrl($rootScope, $scope, $translate) {
        const vm = this;

        $scope.affQuitter   = $translate.instant('GLOBALE.MESSAGE.QUITTER');
        $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
        $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
        $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

        $scope.budgetActif = $rootScope.budgetCourantDescription;

        $scope.$watch(() => $rootScope.budgetCourantDescription, (newValue, oldValue) => {
            if (newValue !== oldValue) {
                $scope.budgetActif = newValue;
            }
        });

    }
})();
