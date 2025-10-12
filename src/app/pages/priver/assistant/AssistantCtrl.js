(function () {
    'use strict';

    angular.module('i2sFinance.priver.assistant')
        .controller('AssistantCtrl', AssistantCtrl);

    /** @ngInject */
    function AssistantCtrl($scope,
                           $rootScope,
                           fileReader,
                           $filter,
                           $uibModal,
                           toastr,
                           toastrConfig,
                           $location,
                           $state,
                           cuServices,
                           $translate,
                           dialogModal,
                           gestionBudget,
                           cuOpenWeb,
                           ProfilResource,
                           BudgetResource,
                           SousPosteBudgetaireResource,
                           SousPosteBudgetaireRegleResource,
                           RegleResource,
                           fileUpload,
                           urlSaveData,
                           selectModal,
                           $timeout) {

        var vm = this;
        vm.upload = upload;
        $rootScope.$activeLoadingPage = false;
        $scope.assistLoaded = false;
        $scope.modeAssistant = true;
        $scope.idBudget = -1;
        $scope.compteCreer = false;
        $scope.oldDateDebut = null;
        $scope.regle = {};
        $scope.idBudgetCourantBackup = $scope.ctrl.budgetCourant;
        $scope.budgetCourantBackup = $rootScope.budgetActif;
        vm.modeDemo = $rootScope.modeDemo;
        vm.profilExistant = 0;
        vm.debutForm = {};
        vm.profilForm = {};
        vm.choixDateBudget = 1;
        vm.confMP = "";
        vm.database = null;

        vm.personalInfo = {};
        vm.productInfo = {};
        vm.shipment = {};
        vm.action = action;


        $scope.openHelp = function () {
            cuOpenWeb.open($rootScope.urlHelp);
        };

        function upload(files, file) {
            vm.dataImport = null;
            vm.tableData = null;
            if (file) {
                vm.file = file;
                const type = file.name.split('.').pop();
                vm.typeLibUsed = type.toLowerCase();
                const reader = new FileReader();

                switch (type.toLowerCase()) {
                    case 'db':
                      fileUpload.uploadFileToUrl(vm.file, `${urlSaveData}`)
                        .then((value) => {
                           cuServices.importFileResource('getFileDb', value.data.filename)
                             .then((value) => {
                               vm.tableData = value.data;
                               // On peut convertir maintenant
                               if (JSON.parse(vm.tableData.budget).length > 0) {
                                 const budgets = JSON.parse(vm.tableData.budget);

                                 const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERBUDGET");
                                 const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                                 const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
                                 const selectOption = "item as (item.nom + ' (' + item.dateDebut +')') for item in objetListe | orderBy:'nom | translate':false:localeSensitiveComparator";

                                 selectModal(boutonOk, boutonAnnuler, titre, budgets.sort(function(a, b) {return b.id - a.id})[0], budgets, selectOption).result.then(async function (idBudget) {
                                     if (idBudget) {
                                       // Met à jour les séquences avant
                                       await cuServices.majSequence();

                                       let promiseImporte = gestionBudget.importeSqliteBudget(budgets.find(bud => bud.id === idBudget),vm.tableData);
                                       promiseImporte.then(async function(newBudget) {
                                         // Pour s'en assurer
                                         $rootScope.$activeLoadingPage = false;

                                         if (newBudget) {
                                           $rootScope.$wizAnnulerDisabled = false;
                                           $rootScope.$activeLogin = false;
                                           newBudget.defaut = 1;
                                           $rootScope.budgetActif = newBudget;
                                           $rootScope.budgetCourantDescription = newBudget.nom;
                                           $scope.ctrl.budgetCourant = newBudget.id;

                                           // Met à jour les séquences après
                                           await cuServices.majSequence();

                                           // Met à jour le budget de défaut
                                           BudgetResource.update($rootScope.budgetActif).$promise
                                               .then((result) => {
                                                 $rootScope.appLoad = true;
                                                 $state.go('priver.budgetCalendrier');
                                               }).catch((err) => {
                                                 $rootScope.appLoad = true;
                                                 $state.go('priver.budgetCalendrier');
                                               });
                                         }
                                       }).catch(function(err) {
                                         vm.file = null;
                                         vm.tableData = null;
                                       });
                                     } else {
                                       vm.file = null;
                                       vm.tableData = null;
                                     }
                                 });
                               } else {
                                 vm.file = null;
                                 vm.tableData = null;
                                 toastr.error($translate.instant("GLOBALE.MESSAGE.AUCUN_BUDGET_IMP"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                               }
                             })
                             .catch((err) => {
                                vm.file = null;
                                vm.tableData = null;
                                toastr.error($translate.instant("GLOBALE.MESSAGE.IMPORTATION_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                             });
                        }).catch((err) => {
                          toastr.error($translate.instant("GLOBALE.MESSAGE.IMPORTATION_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                          console.log(err);
                        });
                        break;
                    default:
                        console.log('Ce type de fichier n\'est pas pris en compte');
                }
            }
        }

        $scope.$watch('vm.profilForm.$valid', (newObj, oldObj) => {
            if (newObj !== oldObj) {
                if (newObj) {
                    $scope.vm.profilForm.$submitted = false;
                }
            }
        });

        $scope.$watch('vm.budgetForm.$valid', (newObj, oldObj) => {
            if (newObj !== oldObj) {
                if (newObj) {
                    $scope.vm.budgetForm.$submitted = false;
                }
                setvalideForm(vm.compteForm, newObj);
                setvalideForm(vm.creditForm, newObj);
                setvalideForm(vm.depenseForm, newObj);
                setvalideForm(vm.revenuForm, newObj);
                setvalideForm(vm.finForm, newObj);
            }
        });

        function setvalideForm(form, val) {
            if (typeof form !== 'undefined') {
                form.$invalid = !val;
                form.$valid = val;
            }
        }

        vm.arePersonalInfoPasswordsEqual = function () {
            return vm.personalInfo.confirmPassword && vm.personalInfo.password === vm.personalInfo.confirmPassword;
        };

        $scope.getProfil = function () {

          $scope.picture = $filter('appImage')('profil.img');

          ProfilResource.getAll().$promise
              .then((result) => {
                if (result.profil.length > 0) {
                  $scope.profil = result.profil[0];
                  vm.profilExistant = 1;
                  $rootScope.$activeLogin = true;

                  // On valide qu'il y ait un budget, sinon on cache le MENU
                  BudgetResource.getAll().$promise
                      .then((result) => {
                        if (result.budget.length > 0) {
                          $rootScope.$wizAnnulerDisabled = false;
                        } else {
                          $rootScope.$wizAnnulerDisabled = true;
                        }
                      }).catch((err) => {
                          cuServices.message('BudgetResource', err, true);
                      });

                } else {
                  $scope.profil = {
                      'prenom': '',
                      'nom': '',
                      'courriel': '',
                      'telephone': '',
                      'idValeurElementLangue': '',
                      'idValeurElementDevise': '',
                      'cheminImage': ''
                  };
                  vm.profilExistant = 0;
                  $rootScope.$wizAnnulerDisabled = true;
                  $rootScope.$activeLogin = true;
                }
                $scope.assistLoaded = true;
              }).catch((err) => {
                  cuServices.message('ProfilResource', err, true);
              });

        };

        $scope.getProfil();

        $scope.getFile = function (file) {
            fileReader.readAsDataUrl(file, $scope)
                .then(function (result) {
                    $scope.picture = result;
                });
        };

        $scope.gestionBudget = function () {
            let indDefaut = 0;
            // Convertir les numérique BD en Boolean pour la composante switch
            $scope.switchers = {
                protege: false,
                convertir: false
            };

            $scope.budget = {
                'nom': '',
                'description': '',
                'protege': 0,
                'motPasse': '',
                'defaut': 0,
                'dateDebut': ''
            };
        };

        $scope.gestionBudget();

        $scope.$on('AnnuleWizard', async function (event, data) {
            $rootScope.$wizAnnulerDisabled = false;
            $rootScope.$activeLogin = false;
            if ($scope.budget.id) {
              await gestionBudget.supprimerBudget($scope.budget);
            }
            $scope.ctrl.budgetCourant = $scope.idBudgetCourantBackup;
            $rootScope.budgetActif = $scope.budgetCourantBackup;
            $rootScope.budgetCourantDescription = $scope.budgetCourantBackup.nom;
            $state.go('priver.profile');
        });

        function action() {
            $rootScope.$wizAnnulerDisabled = false;
            $rootScope.$activeLogin = false;

            if ($scope.idBudget !== -1) {
                $scope.budget.defaut = 1;
                $rootScope.budgetActif = $scope.budget;
                $rootScope.budgetCourantDescription = $scope.budget.nom;
                $scope.ctrl.budgetCourant = $scope.budget.id;

                // Met à jour le budget de défaut
                BudgetResource.update($rootScope.budgetActif).$promise
                    .then((result) => {
                      $state.go('priver.budgetCalendrier');
                    }).catch((err) => {
                      $state.go('priver.budgetCalendrier');
                    });
            }
        }

        $scope.$watch('ctrl.languageSelected', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                $translate.use($scope.vm.profilForm.langue.$viewValue.code.toLowerCase());
                $scope.$broadcast('reloadTitle', {
                    debut: $translate.instant("ECRAN.ASSISTANT.DEBUT"),
                    profil: $translate.instant("ECRAN.ASSISTANT.PROFIL"),
                    budget: $translate.instant("ECRAN.ASSISTANT.BUDGET"),
                    comptes: $translate.instant("ECRAN.ASSISTANT.COMPTES"),
                    credit: $translate.instant("ECRAN.ASSISTANT.CREDIT"),
                    revenus: $translate.instant("ECRAN.ASSISTANT.REVENUS"),
                    depenses: $translate.instant("ECRAN.ASSISTANT.DEPENSES"),
                    fin: $translate.instant("ECRAN.ASSISTANT.FIN")
                });
            }
        });

        $scope.$watch('vm.profilForm.$submitted', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                //
                if (!$scope.vm.profilForm.$invalid) {

                    $scope.profil.idValeurElementLangue = $scope.ctrl.languageSelected.id;
                    $scope.profil.idValeurElementDevise = $scope.ctrl.deviseSelected.id;
                    $scope.profil.prenom = $scope.vm.profilForm.prenom.$viewValue;
                    $scope.profil.nom = $scope.vm.profilForm.nom.$viewValue;
                    $scope.profil.courriel = $scope.vm.profilForm.courriel.$viewValue;
                    $scope.profil.telephone = $scope.vm.profilForm.telephone.$viewValue;

                    $scope.$eval(($scope.profil.id ? "update" : "create"), ProfilResource)($scope.profil).$promise
                      .then(async (result) => {
                          $scope.profil.id = result.profil.id;
                          $scope.vm.profilForm.$dirty = false;
                          $scope.vm.profilForm.$submitted = false;
                      }).catch((err) => {
                          cuServices.message(($scope.profil.id ? "update" : "create"), err, true);
                      });
                }
            }
        });

        $scope.$watch('vm.budgetForm.$submitted', async (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                //
                if (!$scope.vm.budgetForm.$invalid) {

                    // ************************************************
                    // Création du budget
                    //
                    if ($scope.switchers.protege) {
                        $scope.budget.protege = 1;
                        if (typeof $scope.vm.budgetForm.confMP !== 'undefined') {
                            $scope.budget.motPasse = $scope.vm.budgetForm.motPasse.$viewValue;
                        }
                    } else {
                        $scope.budget.protege = 0;
                        $scope.budget.motPasse = '';
                    }

                    $scope.budget.nom = $scope.vm.budgetForm.budgetNom.$viewValue;
                    $scope.budget.description = $scope.vm.budgetForm.budgetDesc.$viewValue;

                    if (vm.choixDateBudget === 1) {
                        vm.dateDebut = moment().format('YYYY-MM-DD').toString();
                    } else if (vm.choixDateBudget === 2) {
                        vm.dateDebut = moment().format('YYYY') + '-01-01';
                    } else if (vm.choixDateBudget === 3) {
                        vm.dateDebut = (Number(moment().format('YYYY')) + 1) + '-01-01';
                    }
                    $scope.budget.dateDebut = vm.dateDebut;

                    $scope.budgetFormSubmit()
                        .then((result) => {
                          if (result) {
                            $scope.$applyAsync();
                            $scope.$broadcast('submitValide', {});
                          }
                        });
                }
            }
        });

        $scope.budgetFormSubmit = function () {
          return new Promise((resolve, reject) => {
            SousPosteBudgetaireRegleResource.getParBudget({"idBudget": $scope.budget.id || -1}).$promise
                .then((result) => {
                  let valide = true;

                  if ($scope.compteCreer && $scope.oldDateDebut !== null && $scope.oldDateDebut !== $scope.budget.dateDebut) {
                    if (result.data.length > 0 && result.data.find(spb => spb.comptePrincipal !== 1)) {
                      // Erreur, on ne peut pas changer la date
                      $scope.$broadcast('validationErreur', {});
                      const message = $translate.instant("GLOBALE.MESSAGE.IMPOSSIBLE_CHANGE_DATE") + ' (' + $scope.oldDateDebut + ')';
                      toastr.error(message);
                    }
                  }

                  if (valide) {
                    $scope.oldDateDebut = $scope.budget.dateDebut;

                    // Valider le nom du budget
                    let condition = "";
                    if ($scope.idBudget !== -1) {
                        condition = ' WHERE t.id <> ' + $scope.idBudget;
                    } else {
                        condition = ' WHERE 1=1 ';
                    }
                    let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'budget', condition, 'nom', $scope.budget.nom, "GLOBALE.MESSAGE.UNICITE_BUDGET");
                    promiseValideUnicite.then(async function(valide) {
                      if (valide) {

                        $scope.$eval(($scope.budget.id ? "update" : "create"), BudgetResource)($scope.budget).$promise
                          .then(async (result) => {
                            if ($scope.idBudget === -1) {
                              $scope.idBudget = result.budget.id;
                              $scope.budget.id = result.budget.id;
                            }
                            // ************************************************
                            // Création du compte principal
                            //
                            if (!$scope.compteCreer) {

                              SousPosteBudgetaireResource.getCptPrinc().$promise
                                  .then((result) => {
                                    if (result.data.length > 0) {
                                      $scope.sousPosteBudgetaireRegle = {
                                          'idBudget': $scope.budget.id,
                                          'idSousPosteBudgetaire': result.data[0].id,
                                          'description': $translate.instant("ECRAN.TRANSACTION.COMPTE_PRINCIPAL"),
                                          'comptePrincipal': 1
                                      };

                                      SousPosteBudgetaireRegleResource.create($scope.sousPosteBudgetaireRegle).$promise
                                          .then((result) => {
                                            $scope.sousPosteBudgetaireRegle.id = result.sousPosteBudgetaireRegle.id;

                                            $scope.regle = {
                                                'idSousPosteBudgetaireRegle': $scope.sousPosteBudgetaireRegle.id,
                                                'idTypeOperation': 4,
                                                'description': $translate.instant("ECRAN.TRANSACTION.COMPTE_PRINCIPAL"),
                                                'dateDebut': $scope.budget.dateDebut,
                                                'dateFin': $scope.budget.dateDebut,
                                                'montant': 0,
                                                'idValeurElementPeriodicite': 15,
                                                'uniteFrequence': 1,
                                                'maitre': 1
                                            };

                                            RegleResource.create($scope.regle).$promise
                                                .then((result) => {
                                                  let idRegle = result.regle.id;
                                                  $scope.regle.id = idRegle;
                                                  $scope.compteCreer = true;
                                                  $scope.$broadcast('setBudgetCompte', {
                                                      regle: $scope.regle,
                                                      budget: $scope.budget
                                                  });
                                                  $scope.$broadcast('setBudgetCredit', {budget: $scope.budget});
                                                  $scope.$broadcast('setBudgetRevenu', {budget: $scope.budget});
                                                  $scope.$broadcast('setBudgetDepense', {budget: $scope.budget});

                                                  $scope.vm.budgetForm.$dirty = false;
                                                  $scope.vm.budgetForm.$submitted = false;
                                                  resolve(true);
                                                }).catch((err) => {
                                                    cuServices.message("create", err, true);
                                                    resolve(false);
                                                });
                                          }).catch((err) => {
                                              cuServices.message("create", err, true);
                                              resolve(false);
                                          });
                                    }
                                  }).catch((err) => {
                                      cuServices.message("create", err, true);
                                      resolve(false);
                                  });
                            } else {
                                $scope.regle.dateDebut = $scope.budget.dateDebut;
                                $scope.regle.dateFin = $scope.budget.dateDebut;

                                $scope.$eval(($scope.regle.id ? "update" : "create"), RegleResource)($scope.regle).$promise
                                  .then(async (result) => {
                                    $scope.vm.budgetForm.$dirty = false;
                                    $scope.vm.budgetForm.$submitted = false;
                                    resolve(true);
                                  }).catch((err) => {
                                      cuServices.message(($scope.regle.id ? "update" : "create"), err, true);
                                      resolve(false);
                                  });
                            }
                          }).catch((err) => {
                              cuServices.message(($scope.budget.id ? "update" : "create"), err, true);
                              resolve(false);
                          });
                      } else {
                        $scope.$broadcast('validationErreur', {});
                        resolve(false);
                      }
                    });
                  } else {
                    resolve(false);
                  }
                }).catch(err => {
                  cuServices.message('SousPosteBudgetaireRegleResource.getParBudget', err, true);
                  resolve(false);
                });
          });
        };

        $scope.$watch('vm.compteForm.$submitted', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                $scope.$broadcast('valideSelectionCompte', {});
            }
        });

        $scope.$watch('vm.creditForm.$submitted', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                $scope.$broadcast('valideSelectionCredit', {});
            }
        });

        $scope.$watch('vm.revenuForm.$submitted', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                $scope.$broadcast('valideSelectionRevenu', {});
            }
        });

        $scope.$watch('vm.depenseForm.$submitted', (newobj, oldobj) => {
            if (newobj !== oldobj && newobj) {
                $scope.$broadcast('valideSelectionDepense', {});
            }
        });


    }

})();
