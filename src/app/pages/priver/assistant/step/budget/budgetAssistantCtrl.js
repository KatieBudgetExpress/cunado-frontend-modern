(function () {
    'use strict';

    angular.module('i2sFinance.priver.assistant')
        .controller('AssistantBudgetCtrl', AssistantBudgetCtrl);

    /** @ngInject */
    function AssistantBudgetCtrl($scope) {
        $scope.getDateNow = getDateNow;
        $scope.getDateCurrentYear = getDateCurrentYear;
        $scope.getDateNextYear = getDateNextYear;

        $scope.initialLocaleCode = $scope.ctrl.languageSelected.code === "EN" ? 'en' : 'fr-ca';
        $scope.titreSection = 'ECRAN.ASSISTANT.BUDGET_TITRE_SECTION_1';
        moment.locale($scope.initialLocaleCode);

        function getDateNow() {
            return moment().format('DD MMMM YYYY ');
        }

        function getDateCurrentYear() {
            return moment(moment().format('YYYY') + '-01-01').format('DD MMMM YYYY');
        }

        function getDateNextYear() {
            return moment((Number(moment().format('YYYY')) + 1) + '-01-01').format('DD MMMM YYYY');
        }
    }

})();
