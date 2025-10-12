(function() {
  'use strict';

  angular.module('i2sFinance.theme.components')
    .controller('baWizardCtrl', baWizardCtrl);

  /** @ngInject */
  function baWizardCtrl($scope, $rootScope, $timeout) {
      const vm = this;
      vm.tabs = [];
      vm.tabNum = 0;
      vm.progress = 0;
      vm.action = action;
      vm.actionAnnuler = actionAnnuler;
      vm.nextTab = nextTab;

      vm.addTab = function (tab) {
          tab.setPrev(vm.tabs[vm.tabs.length - 1]);
          vm.tabs.push(tab);
          vm.selectTab(0);
          calcProgress();
      };

      $scope.$watch(angular.bind(vm, function () {
          return vm.tabNum;
      }), calcProgress);

      vm.selectTab = function (tabNum) {
/*
          if(tabNum > vm.tabNum){
            vm.tabs[vm.tabNum].submit();
          }
*/
          if (vm.tabs[tabNum].isAvailiable()) {
              vm.tabNum = tabNum;
              if (vm.tabs[vm.tabNum].getSubmitted()) {
                  vm.tabs[vm.tabNum].setSubmitted(false);
              }
              vm.tabs.forEach(function (t, tIndex) {
                  tIndex === vm.tabNum ? t.select(true) : t.select(false);
              });
              vm.tabs[vm.tabNum].select(true);
          }
      };

      vm.isActif = function (tabNum) {
          return tabNum !== -1 && !(vm.tabNum + tabNum > vm.tabs.length - 1) && !(vm.tabNum + tabNum >= 0 && vm.tabs.length && vm.tabs[vm.tabNum + tabNum].isAvailiable());
      };

      vm.annulerDisabled = function () {
          return $rootScope.$wizAnnulerDisabled;
      };

      vm.isFirstTab = function () {
          return vm.tabNum === 0;
      };

      vm.isNotFirstTab = function () {
          return vm.tabNum !== 0;
      };

      vm.isLastTab = function () {
          return vm.tabNum === vm.tabs.length - 1;
      };

      vm.isNotLastTab = function () {
          return vm.tabNum !== vm.tabs.length - 1;
      };

      vm.valideSubmit = function () {
        if (!vm.isFirstTab() && !vm.isLastTab()) {
          vm.tabs[vm.tabNum].submit();
        } else {
          vm.nextTab();
        }
      };

      vm.nextTab = function () {
          vm.selectTab(vm.tabNum + 1);
      };

      vm.previousTab = function () {
          vm.selectTab(vm.tabNum - 1);
      };

      $scope.$on('submitValide',function(event, data){
         vm.nextTab();
      });

      $scope.$on('validationErreur',function(event, data){
         vm.tabs[vm.tabNum].setSubmitted(false);
         //vm.previousTab();
      });

      $scope.$on('reloadTitle',function(event, data){
        vm.tabs[0].title = data.debut;
        vm.tabs[1].title = data.profil;
        vm.tabs[2].title = data.budget;
        vm.tabs[3].title = data.comptes;
        vm.tabs[4].title = data.credit;
        vm.tabs[5].title = data.revenus;
        vm.tabs[6].title = data.depenses;
        vm.tabs[7].title = data.fin;
      });

      function actionAnnuler() {
        $scope.$emit('AnnuleWizard',{});
      }

      function action() {
          $scope.action();
      }

      function nextTab() {
          $scope.nextTab(vm.tabs, vm.tabNum);
      }

      function calcProgress() {
          vm.progress = ((vm.tabNum + 1) / vm.tabs.length) * 100;
      }
  }
})();
