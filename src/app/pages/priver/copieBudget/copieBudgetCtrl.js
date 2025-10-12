(function () {
    'use strict';

    angular.module('i2sFinance.priver.copiebudget')
        .controller('CopieBudgetCtrl', CopieBudgetCtrl);

    /** @ngInject */
    function CopieBudgetCtrl($scope,
                             $rootScope,
                             $timeout,
                             $state,
                             gestionBudget,
                             cuServices,
                             $translate,
                             toastr,
                             toastrConfig,
                             BudgetResource,
                             dialogModal) {
        const vm = this;
        vm.setBudget = setBudget;
        vm.submitForm = submitForm;
        vm.getDateNow = getDateNow;
        vm.getDateCurrentYear = getDateCurrentYear;
        vm.getDateNextYear = getDateNextYear;
        vm.action = action;
        vm.choixDateBudget = 1;

        vm.initialLocaleCode = $scope.ctrl.languageSelected.code === "EN" ? 'en' : 'fr-ca';
        moment.locale(vm.initialLocaleCode);

        BudgetResource.getAll().$promise
            .then((result) => {
              if (result.budget.length > 0) {
                vm.budgets = result.budget;
              }
              for (var i=0,  tot=result.budget.length; i < tot; i++) {
                if (result.budget[i].defaut === 1) {
                  setBudget(result.budget[i]);
                }
              }
            })
            .catch(err => err);

        $scope.$on('AnnuleWizard',function(event, data){
            $state.go('priver.profile');
        });

        function action() {
            $state.go('priver.profile');
        }

        function setBudget(budget) {
            vm.budgetSelected = budget;
            initDefautBudget();
        }

        function initDefautBudget() {
            vm.budgets.forEach((ele) => ele.defaut = 0);
            vm.budgetSelected.defaut = 1;
        }

        function submitForm(isValid, isPristine, isDirty, isUntouched) {
            if ( !vm.budgetForm.budgetNom.$invalid  &&
                 !vm.budgetForm.budgetDesc.$invalid ) {

              if (vm.choixDateBudget === 4 && typeof(vm.dateDebut) === 'undefined') {
                const message = $translate.instant("GLOBALE.MESSAGE.SAISIR_DATE_DEBUT");
                toastr.error(message);
              } else {

                if (vm.choixDateBudget === 1) {
                    vm.dateDebut = moment().format('YYYY-MM-DD').toString();
                } else if (vm.choixDateBudget === 2) {
                    vm.dateDebut = moment().format('YYYY')+'-01-01';
                } else if (vm.choixDateBudget === 3) {
                    vm.dateDebut = (Number(moment().format('YYYY'))+1) + '-01-01';
                }

                let newBudget = { nom: vm.budgetForm.budgetNom.$viewValue,
                                  description: vm.budgetForm.budgetDesc.$viewValue,
                                  dateDebut: vm.dateDebut,
                                  protege: 0,
                                  motPasse: null,
                                  defaut: 0 };

                // Valide l'unicité du budget
                let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'budget', ' WHERE 1=1', 'nom', newBudget.nom, "GLOBALE.MESSAGE.UNICITE_BUDGET");
                promiseValideUnicite.then(async function(valide) {

                  if (valide) {
                    dialogModal($translate.instant('GLOBALE.MESSAGE.DUREE_COPIE_BUDGET'), 'info',
                        $translate.instant('GLOBALE.MESSAGE.INFORMATION'),
                        $translate.instant('GLOBALE.BOUTON.OK'), false,
                        false , false).result
                        .then(async (retour) => {
                            if (retour) {
                              $rootScope.$activeLoadingPage = true;

                              // Met à jour les séquences avant
                              await cuServices.majSequence();

                              let promiseCopieBudget = gestionBudget.copieBudget(vm.budgetSelected, newBudget);
                              promiseCopieBudget.then(async function(result) {

                                // Met à jour les séquences après
                                await cuServices.majSequence();

                                $rootScope.$activeLoadingPage = false;
                                $state.go('priver.profile');
                              }).catch(err => {
                                $rootScope.$activeLoadingPage = false;
                              });
                            }
                        });
                  }
                });
              }
            }
        }

        function getDateNow() {
            return moment().format('DD MMMM YYYY ');
        }

        function getDateCurrentYear() {
            return moment(moment().format('YYYY')+'-01-01').format('DD MMMM YYYY');
        }

        function getDateNextYear() {
            return moment((Number(moment().format('YYYY'))+1) + '-01-01').format('DD MMMM YYYY');
        }
    }

})();
