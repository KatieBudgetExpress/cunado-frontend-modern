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
    Ouvrir la fenêtre modale de transaction. Voici les paramètres d'appel:

       categorie                     Catégorie de l'origine de la transaction
       listeSousPosteBudgetaire      (Création) Liste de sous-poste budgétaire pour créer une ou des transactions (Aucun, 1 ou plusieurs)
       listeSousPosteBudgetaireRegle (Modification) Liste de règle (1 ou plusieurs)
       idBudget                      Le budget sur lequel on veut la transaction
       creation                      Indicateur de 1=création ou 0=modification
       signe
       devise
       assistant                     Indicateur qu'on est en mode assistant, on retourne la regle à la fermeture
       dateCalendrier                Reçoit la date sélectionnée dans le calendrier
    */
        .service('transactionCompteModal', ['$uibModal', function($uibModal) {
            return function (categorie,
                             listeSousPosteBudgetaire,
                             listeSousPosteBudgetaireRegle,
                             idBudget,
                             creation,
                             signe,
                             devise,
                             assistant,
                             dateCalendrier
            ) {

                // setup the Controller to watch the click
                var ModalInstanceCtrl = async function ($scope,
                                                        $rootScope,
                                                        $filter,
                                                        $uibModalInstance,
                                                        settings,
                                                        $translate,
                                                        formatDate,
                                                        cuServices,
                                                        toastr,
                                                        toastrConfig,
                                                        creationSousPosteModal,
                                                        imageSelectModal,
                                                        dialogModal,
                                                        $timeout,
                                                        prepareAnalyse,
                                                        RegleResource,
                                                        BudgetResource,
                                                        SousPosteBudgetaireResource,
                                                        SousPosteBudgetaireRegleResource) {

                    $scope.categorie = settings.categorie;
                    $scope.listeSousPosteBudgetaire = settings.listeSousPosteBudgetaire;
                    $scope.listeSousPosteBudgetaireRegle = settings.listeSousPosteBudgetaireRegle;
                    $scope.idBudget = settings.idBudget;
                    $scope.creation = settings.creation;
                    $scope.signe = settings.signe;
                    $scope.devise = settings.devise;
                    $scope.assistant = settings.assistant;
                    $scope.toast = settings.assistant;
                    $scope.sousPosteBudgetaireSelected = {};
                    $scope.typeGlossy = 'glossy';
                    $scope.sousPosteBudgetaireInactif = false;
                    $scope.ctrlLoaded = false;
                    $scope.idTypeOperation = 4; // Ajustement
                    $scope.nouveauSolde = null;
                    $scope.dateSolde = formatDate(new Date());
                    $scope.modifie = false;
                    $scope.budget = null;
                    $scope.calendrier = false;
                    $scope.dateCalendrier = settings.dateCalendrier;

                    // On provient du calendrier? Si oui, on met la date du calendrier et la fréquence a "Une seule fois" par défaut.
                    if (typeof($scope.dateCalendrier) !== "undefined") {
                      $scope.calendrier = true;
                    }

                    // Le confirmClick
                    $scope.ccSujet = $translate.instant("GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION");
                    $scope.ccMessage = $translate.instant("GLOBALE.MESSAGE.ATTENTION");
                    $scope.ccBtnOui = $translate.instant("GLOBALE.SWITCH.OUI");
                    $scope.ccBtnNon = $translate.instant("GLOBALE.SWITCH.NON");

                    $scope.model = {
                        ajtSldOuvert: false,
                        transfertOuvert: false,
                        remboursementOuvert: false
                    };

                    $scope.dateDepartPicker = formatDate(new Date());

                    $scope.setModifie = function (valeur) {
                      $scope.modifie = valeur;
                      $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.FERMER");
                    }

                    // Gestion de la langue
                    $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
                    moment.locale($scope.initialLocaleCode);

                    // Charger le budget reçu en paramètre
                    $scope.getBudget = function () {
                      return new Promise((resolve, reject) => {
                        BudgetResource.getAll().$promise
                            .then((result) => {
                              $scope.budget = result.budget.find(bdg => bdg.id === $scope.idBudget) || $rootScope.budgetActif;
                              resolve(true);
                            }).catch((err) => {
                              $scope.budget = $rootScope.budgetActif;
                              resolve(false);
                            });
                      });
                    };
                    await $scope.getBudget();

                    // Gestion du titre de la fenêtre
                    if ($scope.categorie.code === 'CPT') {
                      $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_COMPTE");
                      $scope.transfertCompte = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_COMPTE");
                      $scope.transfertAutre = "";
                    } else if ($scope.categorie.code === 'CRE') {
                      $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_CREDIT");
                      $scope.transfertCompte = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_EMPRUNT");
                      $scope.transfertAutre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_REMBOURSEMENT");
                    } else if ($scope.categorie.code === 'EPA') {
                      $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_EPARGNE");
                      $scope.transfertCompte = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_UTILISATION");
                      $scope.transfertAutre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_VERSEMENT");
                    } else if ($scope.categorie.code === 'PRE') {
                      $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_PRET");
                      $scope.transfertCompte = "";
                      $scope.transfertAutre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_REMBOURSEMENT");
                    }

                    // Gestion des boutons
                    $scope.enregistrer = true;
                    $scope.boutonEnregistrer = null;
                    $scope.boutonSuivant = null;
                    $scope.boutonSupprimer = null;

                    if ($scope.listeSousPosteBudgetaire == null || typeof($scope.listeSousPosteBudgetaire.length) == "undefined"){
                        $scope.boutonEnregistrer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
                    } else {
                        $scope.boutonSuivant = $translate.instant("GLOBALE.BOUTON.SUIVANT");
                        $scope.enregistrer = false;
                    }
                    $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                    if ($scope.creation === 0){
                        $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
                    }

                    // Création des switchs
                    $scope.switcherRegle = {
                        comptePrincipal: false
                    };

                    // La liste de sous-poste change
                    $scope.majImage = function () {
                        var typeImage = $scope.sousPosteBudgetaireSelected.typeImage;
                        var image = $scope.sousPosteBudgetaireSelected.image;

                        if (typeImage == "glossy"){
                            $scope.imagePath = $filter('glossyBusinessImg')(image);
                        }
                        $scope.imageSelect = image;
                        $scope.typeImageSelect = typeImage;
                    };

                    $scope.majSousPoste = function () {
                        $scope.majImage();
                        $scope.regle.description = $scope.sousPosteBudgetaireSelected.description;
                    };

                    // Chargement initial
                    $scope.chargementInitial = function () {
                    };

                    // Récupéer les soldes
                    $scope.recupereSoldes = async function () {
                      return new Promise((resolve, reject) => {
                        // Récupère les soldes
                        let promiseSolde = cuServices.viRegleSolde("getParSousPosteRegleMaitre",$scope.listeSousPosteBudgetaireRegle.id, 1);
                        promiseSolde.then(function(value) {
                          const data = value.data;
                          if (data.length > 0) {
                            let montantSolde = Math.round(data[0].montant *100) /100;
                            if ($scope.assistant) {
                              montantSolde = Math.round(data[0].montantOri *100) /100;
                            }

                            $scope.regle = {'id': data[0].id,
                                'idSousPosteBudgetaireRegle': data[0].idSousPosteBudgetaireRegle,
                                'idTypeOperation': data[0].idTypeOperation,
                                'description': data[0].description,
                                'montant': montantSolde,
                                'taux': data[0].taux,
                                'dateDebut': data[0].dateDebut,
                                'dateFin': data[0].dateFin,
                                'uniteFrequence': data[0].uniteFrequence,
                                'maitre': data[0].maitre,
                                'idValeurElementPeriodicite' : data[0].idValeurElementPeriodicite
                            };

                            // Gestion des switch
                            if ($scope.sousPosteBudgetaireRegle.comptePrincipal == 0){
                                $scope.switcherRegle.comptePrincipal = false;
                                $scope.isComptePrincipalDisabled = false;
                            } else {
                                $scope.switcherRegle.comptePrincipal = true;
                                $scope.isComptePrincipalDisabled = true;
                            }

                            // Récupère l'impact de la règle
                            let promiseImpact = cuServices.regleImpact("getParRegle",$scope.regle.id);
                            promiseImpact.then(function(value) {
                              const data = value.data;
                              $scope.regleOri = {'idSousPosteBudgetaireRegle': $scope.regle.idSousPosteBudgetaireRegle,
                                  'idTypeOperation': $scope.regle.idTypeOperation,
                                  'description': $scope.regle.description,
                                  'montant': $scope.regle.montant,
                                  'taux': $scope.regle.taux,
                                  'dateDebut': $scope.regle.dateDebut,
                                  'dateFin': $scope.regle.dateFin,
                                  'uniteFrequence': $scope.regle.uniteFrequence,
                                  'maitre': 0,
                                  'idValeurElementPeriodicite' : $scope.regle.idValeurElementPeriodicite
                              };

                              if (data.length > 0) {
                                // Trouve le compte
                                let promiseSelected = cuServices.viRegleSousPosteBudgetaire("getParBudgetId",$scope.idBudget, null, null, null, null, null, data[0].idSousPosteBudgetaireRegleImpact);
                                promiseSelected.then(function(value) {
                                  $scope.compteSelected = value.data[0];
                                  resolve(true);
                                });
                              } else {
                                resolve(true);
                              }
                            });
                          } else {
                            resolve(true);
                          }
                        });
                      });
                    };

                    // Chargement règle
                    $scope.chargementRegle = async function () {
                        if ($scope.creation == 1){
                            let dateJour;
                            if ($scope.assistant && $scope.budget.dateDebut !== null && $scope.budget.dateDebut !== "") {
                              dateJour = $scope.budget.dateDebut;
                              $scope.dateDepartPicker = dateJour;
                            } else if ($scope.calendrier) {
                              dateJour = $scope.dateCalendrier;
                              $scope.dateDepartPicker = dateJour;
                            } else {
                              dateJour = formatDate(new Date());
                              $scope.dateDepartPicker = dateJour;
                            }

                            $scope.sousPosteBudgetaireRegle = {'idBudget': $scope.idBudget,
                                'idSousPosteBudgetaire': '',
                                'description': '',
                                'comptePrincipal': 0,
                                'genere': 0,
                                'dateDebutGenere': "",
                                'dateFinGenere': "",
                                'taux': null,
                                'limiteEmprunt': null
                            };
                            $scope.regle = {'idSousPosteBudgetaireRegle': '',
                                'idTypeOperation': $scope.idTypeOperation,
                                'description': '',
                                'montant': null,
                                'taux': null,
                                'dateDebut': dateJour,
                                'dateFin': dateJour,
                                'uniteFrequence': 1,
                                'maitre': 1,
                                'idValeurElementPeriodicite' : 15
                            };
                            $scope.isComptePrincipalDisabled = false;
                        } else if (typeof($scope.listeSousPosteBudgetaireRegle.length) == "undefined" && $scope.listeSousPosteBudgetaireRegle.id){
                            let dateJour;
                            if ($scope.assistant && $scope.budget.dateDebut !== null && $scope.budget.dateDebut !== "") {
                              dateJour = $scope.budget.dateDebut;
                              $scope.dateDepartPicker = dateJour;
                            } else if ($scope.calendrier) {
                              dateJour = $scope.dateCalendrier;
                              $scope.dateDepartPicker = dateJour;
                            } else {
                              dateJour = formatDate(new Date());
                              $scope.dateDepartPicker = dateJour;
                            }

                            $scope.sousPosteBudgetaireRegle = {'id': $scope.listeSousPosteBudgetaireRegle.id,
                                'idBudget': $scope.listeSousPosteBudgetaireRegle.idBudget,
                                'idSousPosteBudgetaire': $scope.listeSousPosteBudgetaireRegle.idSousPosteBudgetaire,
                                'description': $scope.listeSousPosteBudgetaireRegle.description,
                                'comptePrincipal': $scope.listeSousPosteBudgetaireRegle.comptePrincipal,
                                'taux': $scope.listeSousPosteBudgetaireRegle.taux,
                                'limiteEmprunt': $scope.listeSousPosteBudgetaireRegle.limiteEmprunt
                            };
                            await $scope.recupereSoldes();
                        }
                        $scope.regleOri = {'idSousPosteBudgetaireRegle': $scope.regle.idSousPosteBudgetaireRegle,
                            'idTypeOperation': $scope.regle.idTypeOperation,
                            'description': $scope.regle.description,
                            'montant': $scope.regle.montant,
                            'taux': $scope.regle.taux,
                            'dateDebut': $scope.regle.dateDebut,
                            'dateFin': $scope.regle.dateFin,
                            'uniteFrequence': $scope.regle.uniteFrequence,
                            'maitre': 0,
                            'idValeurElementPeriodicite' : $scope.regle.idValeurElementPeriodicite
                        };
                    };

                    // Récupéer les sous postes
                    $scope.recupereSousPoste = async function (id, description) {
                      return new Promise((resolve, reject) => {

                        let promiseSousPoste = cuServices.viSousPosteBudgetaire("getParId",id);
                        promiseSousPoste.then(function(value) {
                          let data = value.data;
                          if (data.length > 0) {
                              $scope.sousPosteBudgetaireSelected = data[0];
                              $scope.majImage();
                              $scope.sousPosteBudgetaireInactif = true;
                              if (description) {
                                $scope.regle.description = data[0].description;
                              }
                          } else {
                              $scope.sousPosteBudgetaireSelected = { 'id': '',
                                  'systeme': '',
                                  'idPosteBudgetaire': '',
                                  'nom': '',
                                  'description': '',
                                  'image': '',
                                  'typeImage': '',
                                  'comptePrincipal' : ''
                              };
                          }
                          resolve(true);
                        });
                      });
                    };

                    // Chargement du sous poste
                    $scope.chargementSousPoste = async function () {
                        // Si création
                        if ($scope.creation === 1) {
                            if ($scope.listeSousPosteBudgetaire == null){
                                $scope.sousPosteBudgetaireSelected = { 'id': '',
                                    'systeme': '',
                                    'idPosteBudgetaire': '',
                                    'nom': '',
                                    'description': '',
                                    'image': '',
                                    'typeImage': '',
                                    'comptePrincipal' : ''
                                };
                            } else if ($scope.listeSousPosteBudgetaire != null && typeof($scope.listeSousPosteBudgetaire.length) == "undefined" && $scope.listeSousPosteBudgetaire.id) {

                              await $scope.recupereSousPoste($scope.listeSousPosteBudgetaire.id, true);

                            } else {
                              // À venir, liste multiple de sous poste
                            }
                        // Si modification
                        } else {

                          await $scope.recupereSousPoste($scope.listeSousPosteBudgetaireRegle.idSousPosteBudgetaire, false);
                        }
                    };

                    // Chargement de la LOV sous poste
                    $scope.chargementLovSousPoste = function () {
                      return new Promise((resolve, reject) => {
                        let promiseSousPoste = cuServices.viSousPosteBudgetaire("getParCateg",$scope.categorie.id);
                        promiseSousPoste.then(function(value) {
                          let data = value.data;
                          if (data.length > 0) {
                            $scope.listeLovSousPosteBudgetaire = data;
                          }
                          resolve(true);
                        });
                      });
                    }

                    $scope.chargementInitial();
                    await $scope.chargementRegle();
                    await $scope.chargementSousPoste();
                    await $scope.chargementLovSousPoste();
                    $scope.$applyAsync();
                    $scope.ctrlLoaded = true;

                    $scope.ajoutSousPoste = function () {
                        var titre = $translate.instant("GLOBALE.AIDE.AJOUTERSOUSPOSTE");
                        var boutonOk = $translate.instant("GLOBALE.BOUTON.AJOUTER");
                        var boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                        let promisePoste = cuServices.viPosteBudgetaire("getParCateg",$scope.categorie.id);
                        promisePoste.then(function(value) {
                          let data = value.data;
                          if (data.length === 0) {
                              var message = $translate.instant("GLOBALE.MESSAGE.AUCUN_POSTE_BUDGETAIRE");
                              toastr.error(message);
                          } else {
                              $scope.posteBudgetaires = data;

                              creationSousPosteModal(boutonOk, boutonAnnuler, titre, $scope.categorie, $scope.posteBudgetaires).result.then(async function(objetSousPosteBudgetaire) {
                                  $scope.sousPosteBudgetaireSelected = objetSousPosteBudgetaire;
                                  $scope.majImage();
                                  $scope.regle.description = objetSousPosteBudgetaire.description;
                                  await $scope.chargementLovSousPoste();
                                  $scope.$applyAsync();
                                  $timeout(function () {
                                    $('.selectpicker, select[selectpicker]').selectpicker('refresh');
                                  });
                              });
                          }
                        });
                    };

                    // add settings to scope
                    angular.extend($scope, settings);

                    // La liste de sous-poste est-elle invalide??
                    $scope.sousPosteBudgetaireInvalide = function() {
                      if ($scope.transactionCptForm.sousPosteBudgetaire.$viewValue.idPosteBudgetaire===""){
                        return true;
                      }
                      $scope.sousPosteBudgetaireSelected = $scope.transactionCptForm.sousPosteBudgetaire.$viewValue;
                      return false;
                    };

                    // Modifier l'image
                    $scope.modifierImage = function(sousPosteBudgetaire) {

                        var titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERIMAGE");
                        var boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                        var boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                        imageSelectModal(boutonOk, boutonAnnuler, titre, $scope.imageSelect, $scope.typeImageSelect).result.then(function(objetImage) {

                            var imgEdit = document.getElementById("imgSousPosteTrs");
                            if (typeof(imgEdit) != "undefined" && imgEdit != null && objetImage.source != ""){
                                imgEdit.src = objetImage.source;
                            }
                            $scope.imageSelect = objetImage.image;
                            $scope.typeImageSelect = objetImage.typeImage;

                            // Enregistrer l'image
                            var sousPosteBudgetaireUpdate = {
                                id : $scope.sousPosteBudgetaireSelected.id,
                                image : objetImage.image,
                                typeImage: objetImage.typeImage
                            };

                            // On enregistre
                            $scope.$eval((sousPosteBudgetaireUpdate.id ? "update" : "create"),SousPosteBudgetaireResource)(sousPosteBudgetaireUpdate).$promise
                              .then((result) => { cuServices.message((sousPosteBudgetaireUpdate.id ? "update" : "create"), false,false); })
                              .catch((err) => { cuServices.message((sousPosteBudgetaireUpdate.id ? "update" : "create"), err, true); });
                        });
                    };

                    // bouton enregistrer
                    $scope.submitForm = function(isValid, isPristine, isDirty, isUntouched) {

                        $scope.transactionCptForm.$submitted = true;

                        if ($scope.switcherRegle.comptePrincipal && $scope.sousPosteBudgetaireRegle.comptePrincipal == 0) {

                            dialogModal($translate.instant('GLOBALE.MESSAGE.CONFIRMATION_PRINCIPAL'),
                                'warning',
                                $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                                $translate.instant('GLOBALE.SWITCH.OUI'),
                                false,
                                $translate.instant('GLOBALE.SWITCH.NON'),
                                false).result.then(function(retour) {
                                if (retour == 1) {
                                    $scope.enregistrer(isValid, isPristine, isDirty, isUntouched);
                                }
                            });
                        } else {
                            $scope.enregistrer(isValid, isPristine, isDirty, isUntouched);
                        }
                    };

                    $scope.majApresEnregistrement = function () {
                      return new Promise((resolve, reject) => {
                        let promise = prepareAnalyse.genereOperationsEtSoldes($scope.idBudget, "1900-01-01", $scope.dateSolde, 1);
                        promise.then(async function(value) {
                          $scope.dateFinCompteGen = moment($scope.dateFin, "YYYY-MM-DD");
                          $scope.chargementInitial();
                          await $scope.chargementRegle();
                          await $scope.chargementSousPoste();
                          await $scope.chargementLovSousPoste();
                          $scope.$applyAsync();
                          resolve(value);
                        });
                      });
                    };

                    $scope.enregistreSousPosteBudgetaireRegle = function () {
                      return new Promise((resolve, reject) => {
                        // On enregistre
                        $scope.$eval(($scope.sousPosteBudgetaireRegle.id ? "update" : "create"),SousPosteBudgetaireRegleResource)($scope.sousPosteBudgetaireRegle).$promise
                          .then((result) => {

                             cuServices.message(($scope.sousPosteBudgetaireRegle.id ? "update" : "create"), false, false);
                             let retourIdMaitre = $scope.sousPosteBudgetaireRegle.id || result.sousPosteBudgetaireRegle.id;

                             if (retourIdMaitre != -1) {
                                 $scope.regle.idSousPosteBudgetaireRegle = retourIdMaitre;
                                 $scope.regle.dateFin = $scope.regle.dateDebut;

                                 // On enregistre la règle
                                 $scope.$eval(($scope.regle.id ? "update" : "create"),RegleResource)($scope.regle).$promise
                                   .then(async (result) => {
                                     // Pas de message
                                     let retourId = $scope.regle.id || result.regle.id;
                                     $scope.regle.id = retourId;

                                     // On ne sort pas automatiquement à la création d'un épargne ou d'un prêt!!!
                                     if ($scope.creation === 1 && ($scope.categorie.code === 'EPA' || $scope.categorie.code === 'PRE')) {
                                       $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
                                       $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.FERMER");
                                       $scope.model.remboursementOuvert = true;
                                       $scope.creation = 0;
                                       $scope.listeSousPosteBudgetaireRegle = $scope.sousPosteBudgetaireRegle;
                                       $scope.listeSousPosteBudgetaireRegle.id = retourIdMaitre;

                                       await $scope.majApresEnregistrement();
                                       resolve(true);
                                     } else {
                                       if ($scope.assistant) {
                                         $scope.sousPosteBudgetaireRegle = {};
                                         let objetRetour = {
                                           sousPoste: $scope.sousPosteBudgetaireSelected,
                                           regle: $scope.regle,
                                           image: $scope.imageSelect,
                                           typeImage: $scope.typeImageSelect
                                         }
                                         $uibModalInstance.close(objetRetour);
                                         resolve(true);
                                       } else {
                                         $scope.sousPosteBudgetaireRegle = {};
                                         $scope.regle = {};
                                         $uibModalInstance.close(true);
                                         resolve(true);
                                       }
                                     }
                                   })
                                   .catch((err) => {
                                     cuServices.message(($scope.regle.id ? "update" : "create"), err, true);
                                     resolve(false);
                                   });
                             } else {
                               resolve(false);
                             }
                          })
                          .catch((err) => {
                            cuServices.message(($scope.sousPosteBudgetaireRegle.id ? "update" : "create"), err, true);
                            resolve(false);
                          });
                      });
                    };

                    $scope.enregistrer = async function(isValid, isPristine, isDirty, isUntouched) {
                        // Y-a t'il des modifications???
                        if ( (!isDirty && $scope.creation === 0) &&
                            ( ( $scope.switcherRegle.comptePrincipal && $scope.sousPosteBudgetaireRegle.comptePrincipal == 0) ||
                                (!$scope.switcherRegle.comptePrincipal && $scope.sousPosteBudgetaireRegle.comptePrincipal == 1) )) {
                            isDirty = true;
                        }

                        if ($scope.creation === 1 || isDirty) {

                            // Valider la date de début
                            if ($scope.budget.dateDebut !== null && typeof($scope.transactionCptForm.dateDebut) !== "undefined") {
                              if (moment($scope.transactionCptForm.dateDebut.$viewValue).isBefore($scope.budget.dateDebut)) {
                                //Erreur
                                $scope.transactionCptForm.dateDebut.$setValidity('erreurDateBudget', false);
                              } else {
                                //Valide
                                $scope.transactionCptForm.dateDebut.$setValidity('erreurDateBudget', true);
                              }
                            }
                            if (!$scope.sousPosteBudgetaireInvalide() && $scope.transactionCptForm.$valid) {
                              if ($scope.creation === 0 && !$scope.assistant) {
                                  delete $scope.regle.montant;
                              }
                              $scope.sousPosteBudgetaireRegle.idSousPosteBudgetaire = $scope.transactionCptForm.sousPosteBudgetaire.$viewValue.id;
                              $scope.sousPosteBudgetaireRegle.description = $scope.regle.description;

                              // Switch prolonger
                              if ($scope.switcherRegle.comptePrincipal) {
                                  $scope.sousPosteBudgetaireRegle.comptePrincipal = 1;
                              } else {
                                  $scope.sousPosteBudgetaireRegle.comptePrincipal = 0;
                              }

                              // Gestion des numériques null ou blanc
                              if ($scope.sousPosteBudgetaireRegle.taux == null || $scope.sousPosteBudgetaireRegle.taux == '') {
                                  $scope.sousPosteBudgetaireRegle.taux = null;
                              }
                              if ($scope.sousPosteBudgetaireRegle.limiteEmprunt == null || $scope.sousPosteBudgetaireRegle.limiteEmprunt == '') {
                                  $scope.sousPosteBudgetaireRegle.limiteEmprunt = null;
                              }
                              await $scope.enregistreSousPosteBudgetaireRegle();
                            }
                        } else {
                            // Aucune modification
                            var message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
                            toastr.info(message);
                        }
                    };

                    $scope.supprimer = function(){
                        if ($scope.sousPosteBudgetaireRegle.comptePrincipal == 1) {
                            var message = $translate.instant("GLOBALE.MESSAGE.SUPPRIMER_PRINCPAL");
                            toastr.error(message);
                        } else {
                            if ($scope.creation === 0){
                              // Validation des foreignKey
                              let promiseValidation = cuServices.viSousPosteBudgetaireRegleValidation("getParId",$scope.regle.idSousPosteBudgetaireRegle);
                              promiseValidation.then(function(value) {
                                let data = value.data;
                                if (data.length > 0) {
                                  if (data[0].nbrRegleImpact === "0" && data[0].nbrRegleException === "0") {

                                    let promiseSupp = cuServices.supprimeSousPosteBudgetaireRegle($scope.idBudget, $scope.regle.id, $scope.regle.idSousPosteBudgetaireRegle);
                                    promiseSupp.then(function(value) {
                                      $scope.regle = {};
                                      $uibModalInstance.close(true);
                                    });
                                  } else {
                                    var message = $translate.instant("GLOBALE.MESSAGE.SUPPRESSION_FK");
                                    toastr.error(message);
                                  }
                                }
                              });
                            } else {
                                $scope.regle = {};
                                $uibModalInstance.close(true);
                            }
                        }
                    };

                    // bouton enregistrer "Ajuster le solde"
                    $scope.submitAjtSldForm = function(isValid, isPristine, isDirty, isUntouched) {

                        // Enregistrer ici
                        if (isValid && isDirty) {

                            $scope.regleOri.montant = parseFloat($scope.transactionCptForm.transactionAjtSldForm.nouveauSolde.$viewValue);
                            $scope.regleOri.dateDebut = $scope.transactionCptForm.transactionAjtSldForm.dateSolde.$viewValue;
                            $scope.regleOri.dateFin = $scope.transactionCptForm.transactionAjtSldForm.dateSolde.$viewValue;

                            $scope.$eval(($scope.regleOri.id ? "update" : "create"),RegleResource)($scope.regleOri).$promise
                              .then(async (result) => {
                                cuServices.message(($scope.regleOri.id ? "update" : "create"), false, false);
                                if (result.regle.id != -1) {
                                  $scope.sousPosteBudgetaireRegle = {};
                                  $scope.regle = {};
                                  $uibModalInstance.close(true);
                                }
                              })
                              .catch((err) => {
                                cuServices.message(($scope.regleOri.id ? "update" : "create"), err, true);
                              });
                        } else {
                            $scope.transactionCptForm.transactionAjtSldForm.$submitted = true;
                        }
                    }

                    // bouton enregistrer "Transfert de compte"
                    $scope.submitTransfertForm = function(isValid, isPristine, isDirty, isUntouched) {
                        // Enregistrer ici
                        if (isValid && isDirty) {
                            $scope.sousPosteBudgetaireRegle = {};
                            $scope.regle = {};
                            $uibModalInstance.close(true);
                        } else {
                            $scope.transactionCptForm.transactionTransfertForm.$submitted = true;
                        }
                    }

                    // bouton suivant
                    $scope.suivant = function () {
                        $uibModalInstance.close(true);
                    };

                    // bouton annuler
                    $scope.annuler = function () {
                      $scope.regle = {};
                      if ($scope.assistant) {
                        let objetRetour = {
                          sousPoste: $scope.sousPosteBudgetaireSelected,
                          image: $scope.imageSelect,
                          typeImage: $scope.typeImageSelect
                        }
                        $uibModalInstance.close(objetRetour);
                      } else {
                        $uibModalInstance.close($scope.modifie);
                      }
                    };

                    $scope.localeSensitiveComparator = function(v1, v2) {
                        // If we don't get strings, just compare by index
                        if (v1.type !== 'string' || v2.type !== 'string') {
                            return (v1.index < v2.index) ? -1 : 1;
                        }
                        // Compare strings alphabetically, taking locale into account
                        return v1.value.localeCompare(v2.value);
                    };
                };

                var modalInstance = $uibModal.open({
                    animation: false,
                    backdrop: false,
                    size: 'lg', //Grandeur de la fenêtre ('md','lg','sm')
                    template: '<div class="modal-content"> \
                    <div class="modal-header bg-default"> \
                      <button ng-attr-type="button" class="close" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h1 class="al-title">{{titre}}</h1>\
                    </div> \
                    <div class="form-horizontal"> \
                      <div include-with-scope="app/pages/priver/transaction/widgets/transactionCompte.html"></div>\
                    </div> \
                </div>',
                    controller: ModalInstanceCtrl,
                    resolve: {
                        settings: function() {
                            return {
                                categorie: categorie,
                                listeSousPosteBudgetaire: listeSousPosteBudgetaire,
                                listeSousPosteBudgetaireRegle: listeSousPosteBudgetaireRegle,
                                idBudget: idBudget,
                                creation: creation,
                                signe: signe,
                                devise: devise,
                                assistant: assistant,
                                dateCalendrier: dateCalendrier
                            };
                        }
                    }
                });
                // return the modal instance
                return modalInstance;
            }
        }])
})();
