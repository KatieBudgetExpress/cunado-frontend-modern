/**
 * @author Sébastien Lizotte
 *
 * toastr.success('Your information has been saved successfully!');
 * toastr.info("You've got a new email!", 'Information');
 * toastr.error("Your information hasn't been saved!", 'Error');
 * toastr.warning('Your computer is about to explode!', 'Warning');
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.transaction')
    /*
     Ouvrir la fenêtre modale de création / modificaiton d'exception. Voici les paramètres d'appel:

        okButton                         Texte du bouton Ok
        deleteButton                     Texte pour le bouton Supprimer
        cancelButton                     Texte du bouton Annuler
        title                            Titre de la fenêtre (Tooltip)
        parametres                       Liste des paramètres
        signe                            Le signe de devise
        devise                           La devise

        Paramètres
        ----------
        codeCategorie                    Code de la catégorie d'opération
        dateOperation                    Date de l'opération d'origine
        dateEvenement                    Date où l'on veut faire l'opération journalière
        idBudget                         Budget actif
        idRegle                          Règle sur laquelle on applique l'exception
        idRegleException                 Exception à modifier
        idTypeOperation                  Type d'opération
        idSousPosteBudgetaireRegle       Sous poste budgétaire règle
        idSousPosteBudgetaireRegleImpact Regle d'impact
        montant                          Montant
        image                            Image du sous poste
        typeImage                        Type d'image
        nom                              Nom du sous poste
        isException                      Est une exception
        concilie                         Est concilié

     */
    .service('operationJournaliereModal', ['$uibModal', function($uibModal) {
        return function (okButton, deleteButton, cancelButton, title, parametres, signe, devise) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');
            deleteButton = deleteButton===false ? false : (deleteButton || 'Supprime');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = async function ($scope,
                                                    $rootScope,
                                                    $filter,
                                                    $timeout,
                                                    $uibModalInstance,
                                                    settings,
                                                    cuServices,
                                                    $translate,
                                                    toastr,
                                                    toastrConfig,
                                                    prepareAnalyse,
                                                    cuCurrency,
                                                    editableOptions,
                                                    editableThemes,
                                                    triAvecAccent,
                                                    dialogModal,
                                                    exceptionVentilationModal,
                                                    RegleExceptionResource,
                                                    RegleExceptionVentilationResource,
                                                    SousPosteBudgetaireRegleResource,
                                                    ViRegleTransfertCompteResource,
                                                    transactionCompteModal,
                                                    transactionDepRevModal,
                                                    transfertCompteModal
                                                  ) {
              $scope.codeCategorie = settings.parametres.codeCategorie;
              $scope.dateOperation = settings.parametres.dateOperation;
              $scope.dateEvenement = settings.parametres.dateEvenement;
              $scope.idBudget = settings.parametres.idBudget;
              $scope.idRegle = settings.parametres.idRegle;
              $scope.idRegleException = settings.parametres.idRegleException;
              $scope.idTypeOperation = settings.parametres.idTypeOperation;
              $scope.idSousPosteBudgetaireRegle = settings.parametres.idSousPosteBudgetaireRegle;
              $scope.idSousPosteBudgetaireRegleImpact = settings.parametres.idSousPosteBudgetaireRegleImpact;
              $scope.montant = settings.parametres.montant;
              $scope.image = settings.parametres.image;
              $scope.typeImage = settings.parametres.typeImage;
              $scope.imageImpact = settings.parametres.imageImpact;
              $scope.typeImageImpact = settings.parametres.typeImageImpact;
              $scope.nom = settings.parametres.nom;
              $scope.nomImpact = settings.parametres.nomImpact;
              $scope.isException = settings.parametres.isException;
              $scope.concilie = settings.parametres.concilie;
              $scope.creation = !$scope.isException;
              $scope.signe = settings.signe;
              $scope.devise = settings.devise;
              $scope.transfert = settings.parametres.transfert;
              $scope.idRegleLien = settings.parametres.idRegleLien;
              $scope.maitre =  settings.parametres.maitre;
              $scope.compteOptions = [];
              $scope.compteSelected = [];
              $scope.total = 0;
              $scope.affTotal = false;
              $scope.exceptionCreer = false;
              $scope.ctrlLoaded = false;
              //
              $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
              $scope.affSuppOpe   = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION_OPE');
              $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
              $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
              $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

              $scope.idRetour = -1;
              $scope.newRegleException = {};
              $scope.newRegleExceptionLien = {};
              //
              if ($scope.idTypeOperation === 4) {
                $scope.ajustement = true;
              } else {
                $scope.ajustement = false;
              }
              //
              if ($scope.transfert || $scope.ajustement) {
                $scope.afficheImpact = false;
              } else {
                $scope.afficheImpact = true;
              }

              if ($scope.codeCategorie === 'DEP') {
                $scope.titre = $translate.instant("ECRAN.TRANSACTION.OPEJRN_DEP_REEL");
              } else if ($scope.codeCategorie === 'REV') {
                $scope.titre = $translate.instant("ECRAN.TRANSACTION.OPEJRN_REV_REEL");
              }
              $scope.boutonOk = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
              $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

              // Gestion des libellés
              $scope.libOperation = $translate.instant("ECRAN.TRANSACTION.OPEJRN_OPERATION");
              $scope.libImpact = $translate.instant("ECRAN.TRANSACTION.PAR_COMPTE_DEPENSE");
              $scope.libDate = $translate.instant("ECRAN.TRANSACTION.OPEJRN_DATE");
              $scope.libMontant = $translate.instant("ECRAN.TRANSACTION.OPEJRN_MONTANT");

              if ($scope.codeCategorie === 'REV') {
                $scope.libImpact = $translate.instant("ECRAN.TRANSACTION.PAR_COMPTE_REVENU");
              } else if ($scope.codeCategorie === 'DEP') {
                $scope.libImpact = $translate.instant("ECRAN.TRANSACTION.PAR_COMPTE_DEPENSE");
              } else if ($scope.idTypeOperation === 11) {
                $scope.libOperation = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_VERS");
                $scope.libImpact = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_PAR");
              } else if ($scope.idTypeOperation === 12) {
                $scope.libOperation = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_PAR");
                $scope.libImpact = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_VERS");
              } else if ($scope.idTypeOperation === 4 && $scope.maitre === 1) {
                $scope.libDate = $translate.instant("ECRAN.TRANSACTION.OPEJRN_DATE_OUV");
                $scope.libMontant = $translate.instant("ECRAN.TRANSACTION.OPEJRN_MONTANT_OUV");
              } else if ($scope.idTypeOperation === 4 && $scope.maitre === 0) {
                $scope.libDate = $translate.instant("ECRAN.TRANSACTION.OPEJRN_DATE_AJU");
                $scope.libMontant = $translate.instant("ECRAN.TRANSACTION.OPEJRN_MONTANT_AJU");
              }

              editableOptions.theme = 'bs3';
              // Enlever le form-group de la class (margin -15)
              editableThemes['bs3'].controlsTpl = '<div class="editable-controls" ng-class="{\'has-error\': $error}"></div>';

              $scope.regleExceptionVentilations = [];

              $scope.trierAccent = {
                description: function (value) { return triAvecAccent(value.description) }
              };

              // Gestion de la langue
              $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
              moment.locale($scope.initialLocaleCode);

              $scope.chargementPromiseOptions = function () {
                return new Promise((resolve, reject) => {
                  let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.idBudget, 3, 6, null, null, null, null);
                  promiseOptions.then(function(value) {
                    $scope.compteOptions = value.data;
                    resolve(true);
                  });
                });
              };
              await $scope.chargementPromiseOptions();

              $scope.chargementPromiseSelected = function () {
                return new Promise((resolve, reject) => {
                  let promiseSelected = cuServices.viRegleSousPosteBudgetaire("getParBudgetId",$scope.idBudget, null, null, null, null, null, $scope.idSousPosteBudgetaireRegleImpact);
                  promiseSelected.then(function(value) {
                    $scope.compteSelected = value.data[0];
                    resolve(true);
                  });
                });
              };
              await $scope.chargementPromiseSelected();

              // Création des switchs
              $scope.switcherException = {
                aucunVersement: false,
                operationEffectuee: false
              };

              if ($scope.concilie === 1) {
                $scope.switcherException.operationEffectuee = true;
              }

              $scope.chargementVentilation = async function () {
                  // Récupère les ventilations
                  let promiseVentilation = cuServices.regleExceptionVentilation("getParRegleException",$scope.idRegleException);
                  promiseVentilation.then(function(value) {
                    const data = value.data;
                    if (data.length > 0) {
                      $scope.total = 0;

                      for (let i = 0, tot = data.length; i < tot; i++) {
                          $scope.total = $scope.total + data[i].montant;
                      }
                      $scope.affTotal = true;
                      $scope.regleExceptionVentilations = data;
                    } else {
                      $scope.affTotal = false;
                      $scope.regleExceptionVentilations = [];
                    }
                    $scope.$applyAsync();
                  });
              }

              $scope.chargementException = async function () {
                return new Promise((resolve, reject) => {

                  if ($scope.creation || $scope.idRegleException == null) {
                    if ($scope.idTypeOperation === 11 || $scope.idTypeOperation === 12) {
                      $scope.newRegleException = { 'idRegle': $scope.idRegle,
                                                   'dateRegle': $scope.dateOperation,
                                                   'dateException': $scope.dateEvenement,
                                                   'montantException': $scope.montant,
                                                   'aucunVersement': 0,
                                                   'concilie': $scope.concilie
                                                 };
                      // Trouve la règle en lien
                      if ($scope.idTypeOperation === 11) {
                        // Je suis 11 et j'ai 12 dans "idRegleLien"
                        $scope.newRegleExceptionLien = { 'idRegle': $scope.idRegleLien,
                                                         'dateRegle': $scope.dateOperation,
                                                         'dateException': $scope.dateEvenement,
                                                         'montantException': $scope.montant,
                                                         'aucunVersement': 0,
                                                         'concilie': $scope.concilie
                                                       };
                        $scope.affTotal = false;
                        resolve(true);
                      } else {
                        let promiseRegle = cuServices.regle("getParLienType",$scope.idRegle, 11, null);
                        promiseRegle.then(function(value) {
                          const data = value.data;
                          if (data.length > 0) {
                            $scope.newRegleExceptionLien = { 'idRegle': data[0].id,
                                                             'dateRegle': $scope.dateOperation,
                                                             'dateException': $scope.dateEvenement,
                                                             'montantException': $scope.montant,
                                                             'aucunVersement': 0,
                                                             'concilie': $scope.concilie
                                                           };
                          } else {
                            // Ça se peut pas mais...
                            $scope.newRegleExceptionLien = {};
                          }
                          $scope.affTotal = false;
                          resolve(true);
                        });
                      }
                    } else {
                      $scope.newRegleException = { 'idRegle': $scope.idRegle,
                                                   'dateRegle': $scope.dateOperation,
                                                   'dateException': $scope.dateEvenement,
                                                   'montantException': $scope.montant,
                                                   'idSousPosteBudgetaireRegleImpactException': $scope.idSousPosteBudgetaireRegleImpact,
                                                   'aucunVersement': 0,
                                                   'concilie': $scope.concilie
                                                 };
                      $scope.affTotal = false;
                      resolve(true);
                    }
                  } else {
                    if (!$scope.exceptionCreer) {
                      if ($scope.idTypeOperation === 11 || $scope.idTypeOperation === 12) {
                        $scope.newRegleException = { 'id': $scope.idRegleException,
                                                     'idRegle': $scope.idRegle,
                                                     'dateRegle': $scope.dateOperation,
                                                     'dateException': $scope.dateEvenement,
                                                     'montantException': $scope.montant,
                                                     'aucunVersement': 0,
                                                     'concilie': $scope.concilie
                                                   };
                        // Trouve la règle en lien
                        if ($scope.idTypeOperation === 11) {

                          // Je suis 11 j'ai le 12 dans "idRegleLien"
                          let promiseRegle = cuServices.regle("getParLienTypeDate",$scope.idRegleLien, 12, $scope.dateEvenement);
                          promiseRegle.then(function(value) {
                            const data = value.data;
                            if (data.length > 0) {
                              $scope.newRegleExceptionLien = { 'id': data[0].idRegleException,
                                                               'idRegle': $scope.idRegleLien,
                                                               'dateRegle': $scope.dateOperation,
                                                               'dateException': $scope.dateEvenement,
                                                               'montantException': $scope.montant,
                                                               'aucunVersement': 0,
                                                               'concilie': $scope.concilie
                                                             };
                            } else {
                              // Ça se peut pas mais...
                              $scope.newRegleExceptionLien = {};
                            }
                            $scope.chargementVentilation();
                            resolve(true);
                          });
                        } else {
                          // Je suis 12 et je cherche 11 par "idRegleLien"
                          let promiseRegle = cuServices.regle("getParLienTypeDate",$scope.idRegle, 11, $scope.dateEvenement);
                          promiseRegle.then(function(value) {
                            const data = value.data;
                            if (data.length > 0) {
                              $scope.newRegleExceptionLien = { 'id': data[0].idRegleException,
                                                               'idRegle': data[0].id,
                                                               'dateRegle': $scope.dateOperation,
                                                               'dateException': $scope.dateEvenement,
                                                               'montantException': $scope.montant,
                                                               'aucunVersement': 0,
                                                               'concilie': $scope.concilie
                                                             };
                            } else {
                              // Ça se peut pas mais...
                              $scope.newRegleExceptionLien = {};
                            }
                            $scope.chargementVentilation();
                            resolve(true);
                          });
                        }
                      } else {
                        $scope.newRegleException = { 'id': $scope.idRegleException,
                                                     'idRegle': $scope.idRegle,
                                                     'dateRegle': $scope.dateOperation,
                                                     'dateException': $scope.dateEvenement,
                                                     'montantException': $scope.montant,
                                                     'idSousPosteBudgetaireRegleImpactException': $scope.idSousPosteBudgetaireRegleImpact,
                                                     'aucunVersement': 0,
                                                     'concilie': $scope.concilie
                                                   };
                        $scope.chargementVentilation();
                        resolve(true);
                      }
                    } else {
                      $scope.chargementVentilation();
                      resolve(true);
                    }
                  }
                });
              };
              await $scope.chargementException();

              // add settings to scope
              angular.extend($scope, settings);
              $scope.$applyAsync();
              $scope.ctrlLoaded = true;

              $scope.localeSensitiveComparator = function(v1, v2) {
                // If we don't get strings, just compare by index
                if (v1.type !== 'string' || v2.type !== 'string') {
                  return (v1.index < v2.index) ? -1 : 1;
                }

                // Compare strings alphabetically, taking locale into account
                return v1.value.localeCompare(v2.value);
              };

              // La liste est-elle invalide??
              $scope.exceptionInvalide = function() {
                return false;
              };

              $scope.modifierVentilation = function(regleExceptionVentilation) {
                // Modifier la ventilation
                exceptionVentilationModal($scope.boutonOk, $scope.boutonAnnuler, $scope.titre, $scope.idRegleException, regleExceptionVentilation.id, $scope.signe).result.then(function(objet) {
                  $scope.chargementException();
                });

              };

              $scope.supprimeVentilation = function(regleExceptionVentilation) {
                // Supprimer la ventilation
                RegleExceptionVentilationResource.remove({"id": regleExceptionVentilation.id}).$promise
                    .then(() => {
                      toastr.success($translate.instant("GLOBALE.MESSAGE.SUPP_SUCCES"));
                      $scope.chargementVentilation();
                    })
                    .catch(err => {
                      toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR") + " : " + $translate.instant("GLOBALE.MESSAGE." +  err ));
                      reject(err);
                    });
              };

              $scope.ajoutVentilation = function() {
                return new Promise((resolve, reject) => {
                  // Si le parent "regleException" n'existe pas, on enregistre
                  if ($scope.creation) {

                    // Vous devez enregistrer cette opération journalière pour continuer
                    dialogModal($translate.instant('GLOBALE.MESSAGE.AJOUTER_VENTILATION'),
                                'warning',
                                $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                                $translate.instant('GLOBALE.BOUTON.OUI'),
                                false,
                                $translate.instant('GLOBALE.BOUTON.NON'),
                                false).result.then(function (retour) {
                        // Si oui, on enregistre et appel la modale
                        if (retour === 1) {

                          // On enregistre
                          let promiseEnregistrer = $scope.enregistrerRegleException();
                          promiseEnregistrer.then(function(retour) {
                            if (retour !== -1) {
                              $scope.exceptionCreer = true;
                              $scope.idRegleException = retour;
                              $scope.newRegleException.id = retour;

                              // On ouvre la modale
                              exceptionVentilationModal($scope.boutonOk, $scope.boutonAnnuler, $scope.titre, $scope.idRegleException, null, $scope.signe).result.then(function(objet) {
                                // En revenant on recharge les ventilations
                                $scope.chargementException();
                              });
                            }
                            resolve(true);
                          });
                        } else {
                          resolve(true);
                        }
                    });
                  } else {
                    // Sinon, on ouvre la modale sans rien demander à l'usager
                    exceptionVentilationModal($scope.boutonOk, $scope.boutonAnnuler, $scope.titre, $scope.idRegleException, null, $scope.signe).result.then(function(objet) {
                      // En revenant on recharge les ventilations
                      $scope.chargementException();
                      resolve(true);
                    });
                  }
                });
              };
              $scope.ouvrirOperation = function() {
                $scope.categorie = $rootScope.arrayCategorie.find(categorie => categorie.code === $scope.codeCategorie);

                if ($scope.codeCategorie === 'REV' || $scope.codeCategorie === 'DEP') {
                  SousPosteBudgetaireRegleResource.getId({"id" : $scope.idSousPosteBudgetaireRegle}).$promise
                      .then((result) => {
                        if (result.sousPosteBudgetaireRegle) {
                          transactionDepRevModal($scope.categorie, null, result.sousPosteBudgetaireRegle, $scope.idBudget, 0, 1, $scope.signe, false).result.then(function(retour) {
                            if (retour) {
                              $scope.newRegleException = [];
                              $uibModalInstance.close(true);
                            }
                          });
                        }
                      });
                } else if ($scope.idTypeOperation === 4) {
                  SousPosteBudgetaireRegleResource.getId({"id" : $scope.idSousPosteBudgetaireRegle}).$promise
                      .then((result) => {
                        if (result.sousPosteBudgetaireRegle) {
                          transactionCompteModal($scope.categorie, null, result.sousPosteBudgetaireRegle, $scope.idBudget,0, $scope.signe, $scope.devise, false).result.then(function(retour) {
                            if (retour) {
                              $scope.newRegleException = [];
                              $uibModalInstance.close(true);
                            }
                          });
                        }
                      });
                } else if ($scope.idTypeOperation === 11 || $scope.idTypeOperation === 12) {

                  let idSousPosteBudgetaireRegleDe = null;
                  let idSousPosteBudgetaireRegleVers = null;
                  let idRegleDe = null;

                  if ($scope.idTypeOperation === 11) {
                    idSousPosteBudgetaireRegleDe = $scope.idSousPosteBudgetaireRegleImpact;
                    idSousPosteBudgetaireRegleVers = $scope.idSousPosteBudgetaireRegle;
                    idRegleDe = $scope.idRegleLien;
                  } else {
                    idSousPosteBudgetaireRegleDe = $scope.idSousPosteBudgetaireRegle;
                    idSousPosteBudgetaireRegleVers = $scope.idSousPosteBudgetaireRegleImpact;
                    idRegleDe = $scope.idRegle;
                  }

                  let titreModif = $translate.instant("GLOBALE.AIDE.MODIFIER_TRANSFERT");
                  let boutonModif = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
                  let boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
                  let boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                  ViRegleTransfertCompteResource.getParSousPosteRegleRegle({"idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegleDe,
                                                                            "idRegle" : idRegleDe}).$promise
                      .then((result) => {
                        if (result.data.length > 0) {
                          transfertCompteModal(boutonModif, boutonSupprimer, boutonAnnuler, titreModif, $scope.idBudget, idSousPosteBudgetaireRegleDe, result.data[0], $scope.signe, false, $scope.codeCategorie, result.data[0].typeTransfert).result.then(function(retour) {
                            if (retour) {
                              $scope.newRegleException = [];
                              $uibModalInstance.close(true);
                             }
                          });
                        }
                      });
                }
              };

              $scope.removeParRegleDateRegle = function (objet) {
                return new Promise((resolve, reject) => {
                  // Supprimer la ventilation
                  RegleExceptionResource.removeParRegleDateRegle(objet).$promise
                      .then(() => {
                        // Silencieux
                        resolve(true);
                      })
                      .catch(err => {
                        cuServices.message("delete", err, true);
                        reject(err);
                      });
                });
              };

              $scope.enregistreNewRegleException = function (regleException, lien) {
                return new Promise((resolve, reject) => {
                  // On enregistre
                  $scope.$eval((regleException.id ? "update" : "create"),RegleExceptionResource)(regleException).$promise
                    .then((result) => {
                       if (!lien) {
                         cuServices.message((regleException.id ? "update" : "create"), false, false);
                         $scope.idRetour = regleException.id || result.regleException.id;
                       }
                       resolve(true);
                    })
                    .catch((err) => {
                      cuServices.message((regleException.id ? "update" : "create"), err, true);
                      reject(err);
                    });
                });
              };

              $scope.enregistrerRegleException = async function () {
                return new Promise((resolve, reject) => {

                  $scope.idRetour = -1;
                  let condition = "";

                  // Switch aucunVersement
                  if ($scope.switcherException.aucunVersement) {
                    $scope.newRegleException.aucunVersement = 1;
                    $scope.newRegleException.dateException = null;
                    $scope.newRegleException.montantException = null;
                    $scope.newRegleException.concilie = 0;
                    if ($scope.transfert === 0) {
                      $scope.newRegleException.idSousPosteBudgetaireRegleImpactException = null;
                    }
                  } else {
                    $scope.newRegleException.aucunVersement = 0;

                    if ($scope.exceptionForm.dateException.$viewValue !== undefined) {
                      $scope.newRegleException.dateException = $scope.exceptionForm.dateException.$viewValue;
                    } else {
                      $scope.newRegleException.dateException = "";
                    }

                    if ($scope.exceptionForm.montantException.$viewValue !== undefined && $scope.exceptionForm.montantException.$viewValue !== null) {
                      $scope.newRegleException.montantException = parseFloat($scope.exceptionForm.montantException.$viewValue);
                    } else {
                      $scope.newRegleException.montantException = null;
                    }

                    if ($scope.transfert === 0 && !$scope.ajustement) {
                      if ($scope.exceptionForm.compte.$viewValue    !== undefined &&
                          $scope.exceptionForm.compte.$viewValue.id !== undefined &&
                          $scope.exceptionForm.compte.$viewValue.id !== -1) {
                        $scope.newRegleException.idSousPosteBudgetaireRegleImpactException = $scope.exceptionForm.compte.$viewValue.id;
                      } else {
                        $scope.newRegleException.idSousPosteBudgetaireRegleImpactException = "";
                      }
                    }

                    if ($scope.switcherException.operationEffectuee) {
                      $scope.newRegleException.concilie = 1;
                    } else {
                      $scope.newRegleException.concilie = 0;
                    }
                  }

                  // Ici pas besoin de gérer l'exception cachée ou non... on est toujours en création pour une exception qui n'existe pas...
                  // on est dans le calendrier
                  if ($scope.creation) {
                    condition = ' WHERE t."idRegle" = ' + $scope.newRegleException.idRegle;
                  } else {
                    condition = ' WHERE t.id <> ' + $scope.newRegleException.id + ' AND t."idRegle" = ' + $scope.newRegleException.idRegle;
                  }

                  if ($scope.exceptionForm.$valid) {

                    let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'regleException', condition, 'dateRegle', $scope.newRegleException.dateRegle, "GLOBALE.MESSAGE.UNICITE_EXCEPTION");
                    promiseValideUnicite.then(async function(valide) {

                      if (valide) {
                        // Pour les ajustements, on altère par trigger la date d'origine, donc on met la bonne date tout de suite dans l'exception
                        if ($scope.ajustement) {
                          $scope.newRegleException.dateRegle = $scope.newRegleException.dateException;
                        }

                        // Si on est un transfert, on gère le lien
                        if ($scope.transfert === 1) {
                          await $scope.removeParRegleDateRegle({"idRegle": $scope.newRegleExceptionLien.idRegle,
                                                                "dateRegle": $scope.newRegleExceptionLien.dateRegle});
                          $scope.newRegleException.id = null;
                          $scope.newRegleExceptionLien.id = null;
                        }

                        await $scope.enregistreNewRegleException($scope.newRegleException, false);

                        if ($scope.transfert === 1) {
                          $scope.newRegleExceptionLien.aucunVersement = $scope.newRegleException.aucunVersement;
                          $scope.newRegleExceptionLien.dateException = $scope.newRegleException.dateException;
                          $scope.newRegleExceptionLien.montantException = $scope.newRegleException.montantException;
                          $scope.newRegleExceptionLien.concilie = $scope.newRegleException.concilie;
                          await $scope.enregistreNewRegleException($scope.newRegleExceptionLien, true);
                        }
                        $scope.creation = false;
                        resolve($scope.idRetour);
                      } else {
                        resolve($scope.idRetour);
                      }
                    });
                  } else {
                    resolve($scope.idRetour);
                  }
                });

              };

              // bouton enregistrer
              $scope.submitForm = async function(isValid, isPristine, isDirty, isUntouched) {

                let promiseSubmitForm = $scope.enregistrerRegleException();
                promiseSubmitForm.then(function(retour) {
                  if (retour !== -1) {
                    $scope.newRegleException = [];
                    $uibModalInstance.close(true);
                  }
                });
              };

              // bouton supprimer
              $scope.supprime = function () {

                ViRegleTransfertCompteResource.getParSousPosteRegleRegle({"idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegleDe,
                                                                          "idRegle" : idRegleDe}).$promise
                    .then((result) => {
                      if (result.data.length > 0) {
                        // On ne supprime pas, on met Aucun versement
                        $scope.switcherException.aucunVersement = true;

                        let promiseSupprimeForm = $scope.enregistrerRegleException();
                        promiseSupprimeForm.then(function(retour) {
                          if (retour !== -1) {
                            $scope.newRegleException = [];
                            $uibModalInstance.close(true);
                          }
                        });
                      } else {





                        

                      }
                    });



              };

              // ok button clicked
              $scope.ok = function () {
                $uibModalInstance.close(true);
              };

              // cancel button clicked
              $scope.cancel = function () {
                  $uibModalInstance.close(false);
              };
            };

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                size: 'md', //Grandeur de la fenêtre ('md','lg','sm')
                template: '<div class="modal-content"> \
                    <div class="modal-header bg-default"> \
                      <button ng-attr-type="button" class="close" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h1 class="al-title">{{modalTitle}}</h1>\
                    </div> \
                    <div class="form-horizontal"> \
                      <div include-with-scope="app/pages/priver/transaction/widgets/operationJournaliere.html"></div>\
                    </div> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            okButton: okButton,
                            deleteButton: deleteButton,
                            cancelButton: cancelButton,
                            modalTitle: title,
                            modalBody: "",
                            parametres: parametres,
                            signe: signe,
                            devise: devise
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
          }
        }])
    })();
