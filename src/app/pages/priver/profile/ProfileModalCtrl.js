/**
 * @author Sébastien Lizotte
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.profile')
        .controller('ProfileModalCtrl', ProfileModalCtrl);

    /** @ngInject */
    function ProfileModalCtrl($scope,
                              $rootScope,
                              $timeout,
                              toastr,
                              $uibModalInstance,
                              cuServices,
                              $translate,
                              dialogModal,
                              BudgetResource,
                              gestionBudget) {

        $scope.modifMP = false;
        $scope.titreSection = 'ECRAN.PROFIL.PARAMBUDGET';

        $scope.supprimeBudget = async function () {
          dialogModal($translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION_BUDGET'), 'warning',
              $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
              $translate.instant('GLOBALE.SWITCH.OUI'), false,
              $translate.instant('GLOBALE.SWITCH.NON'), false).result
              .then(async (retour) => {
                  if (retour) {

                      await gestionBudget.supprimerBudget($scope.budgetActif);
                      $scope.budgetActif = {};
                      $scope.budgets = {};
                      $scope.profil = {};
                      $scope.getProfil();
                      $scope.ctrl.budgetCourant = $rootScope.budgetActif.id;

                      $uibModalInstance.close();
                  }
              });
        }

        $scope.upload = function (file, errFiles) {
            if (file) {
                $scope.file = file;
                const type = file.name.split('.').pop();
                $scope.typeLibUsed = type.toLowerCase();
                const reader = new FileReader();

                switch (type.toLowerCase()) {
                    case 'bud':
                        reader.onload = function (e) {
                          try {
                            let objetImport = JSON.parse(e.target.result.trim());
                            $scope.actionImporter(objetImport);
                          } catch (e) {
                            toastr.error($translate.instant("GLOBALE.MESSAGE.BUDGET_DIFFERENT"));
                          }
                        };
                        reader.readAsText(file);
                        break;
                    default:
                        console.log('Ce type de fichier n\'est pas pris en compte');
                }
            }
        }

        $scope.actionImporter = function (objetImport) {
          //
          dialogModal($translate.instant('GLOBALE.MESSAGE.CONFIRMATION_RESTAURATION'), 'warning',
              $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
              $translate.instant('GLOBALE.SWITCH.OUI'), false,
              $translate.instant('GLOBALE.SWITCH.NON'), false).result
              .then((retour) => {
                  if (retour) {
                      $rootScope.$activeLoadingPage = true;

                      let promiseImporteBudget = gestionBudget.importeBudget($scope.budgetActif, objetImport);
                      promiseImporteBudget.then(function(result) {
                        $rootScope.$activeLoadingPage = false;
                        if (result) {
                          $scope.getProfil();
                          $uibModalInstance.close();
                        }
                      }).catch(err => {
                        $rootScope.$activeLoadingPage = false;
                      });
                  }
              });
        }

        $scope.actionExporter = async function () {
          //
          $rootScope.$activeLoadingPage = true;
          $timeout(async () => {
            await gestionBudget.exporteBudget($scope.budgetActif, true);
            $rootScope.$activeLoadingPage = false;
          },500);
        }

        $scope.annuler = function () {
          $scope.budgetActif = {};
          $scope.budgets = {};
          $scope.profil = {};
          $scope.getProfil();

          $uibModalInstance.close();
        }

        $scope.submitForm = function (isValid, isPristine, isDirty, isUntouched) {

            if (isValid) {
                $scope.budgetActif.protege = 0;
                $scope.budgetActif.motPasse = '';

                if ($scope.switcherBudgetActif.defaut) {
                    $scope.budgetActif.defaut = 1;
                    $scope.$parent.ctrl.budgetCourant = $scope.budgetActif.id;
                    $rootScope.budgetActif = $scope.budgetActif;
                    $rootScope.budgetCourantDescription = $scope.budgetActif.nom;
                } else {
                    if ($scope.budgetActif.defaut === 1) {
                      $scope.budgetActif.defaut = 0;
                    }
                }

                $scope.$eval(($scope.budgetActif.id ? "update" : "create"), BudgetResource)($scope.budgetActif).$promise
                  .then(async (result) => {
                      cuServices.message(($scope.budgetActif.id ? "update" : "create"), false, false);
                      $scope.budgetActif = {};
                      $scope.budgets = {};
                      $scope.profil = {};
                      $scope.getProfil();
                      $uibModalInstance.close();
                  })
                  .catch((err) => {
                      cuServices.message(($scope.budgetActif.id ? "update" : "create"), err, true);
                      $scope.budgetActif = {};
                      $scope.budgets = {};
                      $scope.profil = {};
                      $scope.getProfil();
                      $uibModalInstance.close();
                  });
            }

        };
    }

})();
