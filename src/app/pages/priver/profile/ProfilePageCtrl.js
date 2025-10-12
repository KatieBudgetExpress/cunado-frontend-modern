/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.profile')
        .controller('ProfilePageCtrl', ProfilePageCtrl);

    /** @ngInject */
    function ProfilePageCtrl($scope,
                             $rootScope,
                             fileReader,
                             $uibModal,
                             $location,
                             toastr,
                             toastrConfig,
                             cuServices,
                             cuOpenWeb,
                             $translate,
                             dialogModal,
                             $state,
                             $timeout,
                             ProfilResource,
                             BudgetResource,
                             inputTextModal) {

        $scope.modeAssistant = false;
        $scope.goToPageAssistant = goToPageAssistant;
        $scope.goToAbonnement = goToAbonnement;
        $scope.goToMotPasse = goToMotPasse;
        $scope.goToConversionCopieBudget = goToConversionCopieBudget;

        $scope.getProfil = function () {

          ProfilResource.getAll().$promise
              .then((result) => {
                if (result.profil.length > 0) {
                  $scope.profil = result.profil[0];

                  BudgetResource.getAll().$promise
                      .then((result) => {
                        if (result.budget.length > 0) {
                          $scope.budgets = result.budget;
                        } else {
                          $scope.budgets = {
                              'nom': '',
                              'description': '',
                              'motPasse': '',
                              'defaut': ''
                          };
                        }
                      })
                      .catch(err => err);

                } else {
                  $scope.profil = {
                      'prenom': '',
                      'nom': '',
                      'courriel': '',
                      'telephone': '',
                      'idValeurElementLangue': '',
                      'idValeurElementDevise': ''
                  };
                }
              })
              .catch(err => err);
        };

        $scope.submitForm = function (isValid, isPristine, isDirty, isUntouched) {

            if (isValid) {
                let langueChange = false;

                if ($scope.profil.idValeurElementLangue != $scope.ctrl.languageSelected.id) {
                    langueChange = true;
                }
                $scope.profil.idValeurElementLangue = $scope.ctrl.languageSelected.id;
                $scope.profil.idValeurElementDevise = $scope.ctrl.deviseSelected.id;

                $scope.$eval(($scope.profil.id ? "update" : "create"), ProfilResource)($scope.profil).$promise
                  .then(async (result) => {
                      cuServices.message(($scope.profil.id ? "update" : "create"), false, false);
                      $scope.budgets = {};
                      $scope.profil = {};
                      $scope.getProfil();
                  })
                  .catch((err) => {
                      cuServices.message(($scope.profil.id ? "update" : "create"), err, true);
                      $scope.budgets = {};
                      $scope.profil = {};
                      $scope.getProfil();
                  });
            }
        };

        $scope.upload = function () {
            $scope.hasPicture = true;
        };

        $scope.unconnect = function (item) {
            budget.defaut = 1;
        };

        $scope.showModal = function (budget) {
            $scope.budgetActif = budget;

            // Convertir les numérique BD en Boolean pour la composante switch
            $scope.switcherBudgetActif = {
                defaut: budget.defaut ? true : false,
                protege: budget.protege ? true : false
            };

            $uibModal.open({
                animation: true,
                backdrop: false,
                controller: 'ProfileModalCtrl',
                templateUrl: 'app/pages/priver/profile/profileModal.html',
                scope: $scope
            }).result.then(function (choix) {
                budget.defaut = choix;
            });
        };

        function goToPageAssistant() {
            dialogModal($translate.instant('GLOBALE.MESSAGE.CONFIRMATION_NOUVEAU_BUDGET'), 'warning',
                $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                $translate.instant('GLOBALE.SWITCH.OUI'), false,
                $translate.instant('GLOBALE.SWITCH.NON'), false).result
                .then((retour) => {
                    if (retour) {
                        $state.go('priver.assistant');
                    }
                });
        }

        function goToAbonnement() {
           cuOpenWeb.open($scope.ctrl.arrayProfil[0].urlClient);
        }

        function goToMotPasse() {
           // ICI
           const titre = $translate.instant("GLOBALE.AIDE.NOUVEAUMOTPASSE");
           const boutonOk = $translate.instant("GLOBALE.BOUTON.APPLIQUER");
           const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

           inputTextModal(boutonOk, boutonAnnuler, titre, true, 8).result.then(function (texteRetourne) {
               if (texteRetourne !== null) {
                 // TODO enregistrer le nouveau mot de passées
                 const data = { "mp": texteRetourne,
                                "email" : $scope.ctrl.arrayProfil[0].courriel };
                 ProfilResource.updateMp(data).$promise
                     .then((result) => {
                       // Veuillez vous connecter avec votre nouveau mot de passe
                       $location.path('/auth');
                       dialogModal($translate.instant('GLOBALE.AIDE.ENTREZNOUVEAUMOTPASSE') + ' (' + texteRetourne + ')' , 'info',
                           $translate.instant('GLOBALE.MESSAGE.INFORMATION'),
                           $translate.instant('GLOBALE.BOUTON.OK'), false,
                           false , false);
                     })
                     .catch(err => {
                        cuServices.message("update", err, true);
                        $location.path('/auth');
                     });
               }
           });
        }

        function goToConversionCopieBudget() {
            $state.go('priver.copiebudget');
        }

    }

})();
