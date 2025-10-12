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

        okButton                   Texte du bouton Ok
        deleteButton               Texte pour le bouton Supprimer
        cancelButton               Texte du bouton Annuler
        title                      Titre de la fenêtre (Tooltip)
        idSousPosteBudgetaireRegle Règle maître sur laquelle on applique le nouveau transfert
        regleTransfert            (Modification) Règle à modifier
        signe                      Le signe de devise,
        creation                   Indicateur de création,
        provenance                 Provenance
        typeTransfert              Recoit le type de transfert
        dateCalendrier             Reçoit la date sélectionnée dans le calendrier
     */
    .service('transfertCompteModal', ['$uibModal', function($uibModal) {
        return function (okButton, deleteButton, cancelButton, title, idBudget, idSousPosteBudgetaireRegle, regleTransfert, signe, creation, provenance, typeTransfert, dateCalendrier) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');
            deleteButton = deleteButton===false ? false : (deleteButton || 'Supprime');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = async function ($scope,
                                                    $rootScope,
                                                    $filter,
                                                    $uibModalInstance,
                                                    settings,
                                                    cuServices,
                                                    $translate,
                                                    toastr,
                                                    toastrConfig,
                                                    formatDate,
                                                    dialogModal,
                                                    BudgetResource,
                                                    RegleResource,
                                                    RegleImpactResource,
                                                    RegleDateResource,
                                                    RegleExceptionResource) {

              $scope.titre = settings.title;
              $scope.idBudget = settings.idBudget;
              $scope.idSousPosteBudgetaireRegle = settings.idSousPosteBudgetaireRegle;
              $scope.regleTransfert = settings.regleTransfert;
              $scope.signe = settings.signe;
              $scope.creation = settings.creation;
              $scope.provenance = settings.provenance;
              $scope.typeTransfert = settings.typeTransfert;
              $scope.dateCalendrier = settings.dateCalendrier;
              $scope.compteOptions = [];
              $scope.compteSelected = [];
              $scope.idSousPosteBudgetaireRegleDe = null;
              $scope.idSousPosteBudgetaireRegleVers = null;
              $scope.modifie = false;
              $scope.isInverse = false;
              $scope.isTransfertCompte = false;
              $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

              $scope.datesModifiees = false;
              $scope.sousPosteBudgetaireSelected = {};
              $scope.periodiciteSelected = {};
              $scope.montantQqfois = {};
              $scope.libTransfertDe = "";
              $scope.libTransfertA = "";
              $scope.budget = null;
              $scope.calendrier = false;
              // On provient du calendrier? Si oui, on met la date du calendrier et la fréquence a "Une seule fois" par défaut.
              if (typeof($scope.dateCalendrier) !== "undefined") {
                $scope.calendrier = true;
              }

              $scope.dateDepartPicker = formatDate(new Date());

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

              // Le confirmClick
              $scope.ccSujet = $translate.instant("GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION");
              $scope.ccMessage = $translate.instant("GLOBALE.MESSAGE.ATTENTION");
              $scope.ccBtnOui = $translate.instant("GLOBALE.SWITCH.OUI");
              $scope.ccBtnNon = $translate.instant("GLOBALE.SWITCH.NON");

              $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
              $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
              $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
              $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

              // Gestion de la langue
              $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
              moment.locale($scope.initialLocaleCode);
              $scope.arrayDeDates = [];

              // Création des switchs
              $scope.switcherRegle = {
                prolonger: false,
                toujours: true,
                solde: false
              };

              if (!$scope.creation) {
                // Gestion des switch
                if ($scope.regleTransfert.prolonger === 0){
                  $scope.switcherRegle.prolonger = false;
                } else {
                  $scope.switcherRegle.prolonger = true;
                }
                if ($scope.regleTransfert.pourToujours === 0){
                  $scope.switcherRegle.toujours = false;
                } else {
                  $scope.switcherRegle.toujours = true;
                }
                if ($scope.regleTransfert.paieSolde === 0){
                  $scope.switcherRegle.solde = false;
                } else {
                  $scope.switcherRegle.solde = true;
                }
              }

              $scope.setModifie = function (valeur) {
                $scope.modifie = valeur;
                $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.FERMER");
              };

              $scope.$watch('switcherRegle.solde', (newVal, oldVal) => {
                  if (newVal && $scope.creation) {
                    $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.code === 'MENSUEL');
                  }
              });

              // La liste de poste est-elle invalide??
              $scope.compteInvalide = function() {
                if (typeof($scope.transfertForm.compte.$viewValue) == "undefined" || $scope.transfertForm.compte.$viewValue==""){
                  return true;
                }
                return false;
              };

              // ON DÉCOUVRE CE QU'ON VEUT FAIRE POUR AJUSTER L'AFFICHAGE
              // || $scope.typeTransfert === "VERS" || $scope.typeTransfert === "PAIE"
              if ($scope.typeTransfert === "REMB") {
                $scope.isInverse = true;
                // Change le titre pour "... remboursement"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_REMBOURSEMENT");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_REMBOURSEMENT");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.REMBOURSER_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.REMBOURSER_A");

              } else if ($scope.typeTransfert === "VERS") {
                $scope.isInverse = true;
                // Change le titre pour "... versement"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_VERSEMENT");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_VERSEMENT");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.VERSEMENT_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.VERSEMENT_A");

              } else if ($scope.typeTransfert === "PAIE") {
                $scope.isInverse = true;
                // Change le titre pour "... paiement"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_REMBOURSEMENT");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_REMBOURSEMENT");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.REMBOURSER_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.REMBOURSER_A");

              } else if ($scope.typeTransfert === "EMPR" || $scope.provenance === "CRE") {
                // Change le titre pour "... emprunt"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_EMPRUNT");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_EMPRUNT");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.EMPRUNTER_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.EMPRUNTER_A");

              } else if ($scope.typeTransfert === "UTIL" || $scope.provenance === "EPA") {
                $scope.isTransfertCompte = true;
                // Change le titre pour "... utilisation"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_UTILISATION");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_UTILISATION");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.UTILISATION_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_A");

              } else {
                $scope.isTransfertCompte = true;
                // Change le titre pour "... transfert"
                if ($scope.creation) {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.CREER_TRANSFERT");
                } else {
                  $scope.titre = $translate.instant("GLOBALE.AIDE.MODIFIER_TRANSFERT");
                }
                $scope.libTransfertDe = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_DE");
                $scope.libTransfertA = $translate.instant("ECRAN.TRANSACTION.TRANSFERER_A");
              }

              // Trouver la description du compte d'origine
              $scope.getCompteOrigine = function (idSousPosteBudgetaireRegle) {
                return new Promise((resolve, reject) => {
                  let promiseSelected = cuServices.viRegleSousPosteBudgetaire("getParBudgetId",$scope.idBudget, null, null, null, null, null, idSousPosteBudgetaireRegle);
                  promiseSelected.then(function(value) {
                    $scope.transfererDe = value.data[0].description ? value.data[0].description : $translate.instant(value.data[0].nomSousPosteBudgetaire);
                    resolve(true);
                  });
                });
              };

              // Trouver les opérations de comptes, crédits
              $scope.getOperations = function (idSousPosteBudgetaireRegle, idCat1, idCat2) {
                return new Promise((resolve, reject) => {

                  let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.idBudget, idCat1, idCat2, null, null, null, idSousPosteBudgetaireRegle);
                  promiseOptions.then(function(value) {
                    $scope.compteOptions = value.data;
                    $scope.compteSelected = value.data[0];
                    resolve(true);
                  });
                });
              };

              // Chargement initial
              $scope.chargementInitial = async function () {

                // Trouver la description du compte d'origine
                await $scope.getCompteOrigine($scope.idSousPosteBudgetaireRegle);

                // Trouver les périodicités
                $scope.periodiciteOptions = $rootScope.arrayValeurElement.filter(vae => vae.type === 'vaePeriodicite')
                                                                         .sort(function(a, b) {return (a.tri - b.tri)});
                $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.code === 'UNEFOIS');

                // Trouver les jours du mois
                $scope.jourMoisOptions = $rootScope.arrayValeurElement.filter(vae => vae.type === 'vaeJourMois')
                                                                      .sort(function(a, b) {return (a.tri - b.tri)});
                $scope.jourUnSelected = $scope.jourMoisOptions[0];
                $scope.jourDeuxSelected = $scope.jourMoisOptions[14];

                // Trouver les opérations de comptes, crédits
                await $scope.getOperations($scope.idSousPosteBudgetaireRegle, 3, ((!$scope.isTransfertCompte) ? 6 : null) );
              };

              // Trouver la description du compte d'origine
              $scope.getRegleTransfertVers = async function () {
                return new Promise((resolve, reject) => {
                  let promiseRegle = cuServices.regle("getParLienType",$scope.regleTransfert.idRegle, 11, null);
                  promiseRegle.then(async function(value) {
                    const data = value.data;
                    if (data.length > 0) {
                      $scope.newRegleTransfertVers = {'id': data[0].id,
                                                      'idSousPosteBudgetaireRegle': data[0].idSousPosteBudgetaireRegle,
                                                      'idTypeOperation': data[0].idTypeOperation,
                                                      'montant': data[0].montant,
                                                      'idValeurElementPeriodicite': data[0].idValeurElementPeriodicite,
                                                      'uniteFrequence' : data[0].uniteFrequence,
                                                      'nombreVersement' : data[0].nombreVersement,
                                                      'dateDebut': data[0].dateDebut,
                                                      'dateFin': data[0].dateFin,
                                                      'jourUn': data[0].jourUn,
                                                      'jourDeux': data[0].jourDeux,
                                                      'pourToujours': data[0].pourToujours,
                                                      'prolonger': data[0].prolonger,
                                                      'idRegleLienTransfert': data[0].idRegleLienTransfert,
                                                      'maitre': data[0].maitre,
                                                      'paieSolde': data[0].paieSolde
                                                     };

                      // Si on est un remboursement, un versement ou un paiement on réalimente le DE
                      if ($scope.isInverse) {
                        // Trouver les Comptes
                        await $scope.getOperations($scope.newRegleTransfertVers.idSousPosteBudgetaireRegle, 3, 6 );
                        // Trouver la description du compte d'origine
                        await $scope.getCompteOrigine($scope.newRegleTransfertVers.idSousPosteBudgetaireRegle);
                        $scope.transfererDeId = $scope.newRegleTransfertVers.idSousPosteBudgetaireRegle;
                      }
                      resolve(true);
                    } else {
                      // Faut pas que ça arrive!!!
                      $scope.newRegleTransfertVers = {'idSousPosteBudgetaireRegle': '',
                                                      'idTypeOperation': 11,
                                                      'montant': 0,
                                                      'idValeurElementPeriodicite': '',
                                                      'uniteFrequence' : '',
                                                      'nombreVersement' : '',
                                                      'dateDebut': '',
                                                      'dateFin': '',
                                                      'jourUn': null,
                                                      'jourDeux': null,
                                                      'pourToujours': '',
                                                      'prolonger': '',
                                                      'idRegleLienTransfert': null,
                                                      'maitre': 0,
                                                      'paiesolde': 0
                                                     };
                      resolve(true);
                    }
                  });
                });
              };

              // Trouver le compte par l'impact
              $scope.getRegleImpact = function (idRegle) {
                return new Promise((resolve, reject) => {
                  let promiseImpact = cuServices.regleImpact("getParRegle",idRegle);
                  promiseImpact.then(function(value) {
                    const data = value.data;
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
                });
              };

              $scope.chargerQuelquesFois = function (idRegle) {
                return new Promise((resolve, reject) => {
                  let promiseDate = cuServices.regleDate("getParRegle",idRegle);
                  promiseDate.then(function(value) {
                    const data = value.data;
                    if (data.length > 0) {
                      for (var i=0,  tot=data.length; i < tot; i++) {
                          $scope.arrayDeDates[i] = moment(data[i].dateFixe);
                          $scope.montantQqfois[data[i].dateFixe] = data[i].montant;
                      }
                      resolve(true);
                    } else {
                      resolve(true);
                    }
                  });
                });
              }

              $scope.chargementRegleTransfert = async function () {
                // Initialisation du transfert
                if ($scope.creation) {
                  let dateJour;
                  if ($scope.calendrier) {
                    dateJour = $scope.dateCalendrier;
                    $scope.dateDepartPicker = dateJour;
                  } else {
                    dateJour = formatDate(new Date());
                    $scope.dateDepartPicker = dateJour;
                  }

                  $scope.transfererDeId = $scope.idSousPosteBudgetaireRegle;
                  $scope.newRegleTransfertDe = {'idSousPosteBudgetaireRegle': $scope.idSousPosteBudgetaireRegle,
                                                'idTypeOperation': 12,
                                                'montant': null,
                                                'idValeurElementPeriodicite': '',
                                                'uniteFrequence' : 1,
                                                'nombreVersement' : 1,
                                                'dateDebut': dateJour,
                                                'dateFin': '',
                                                'jourUn': null,
                                                'jourDeux': null,
                                                'pourToujours': 1,
                                                'prolonger': 0,
                                                'idRegleLienTransfert': null,
                                                'maitre': 0,
                                                'paieSolde' : 0
                                               };
                  $scope.newRegleTransfertVers = {'idSousPosteBudgetaireRegle': '',
                                                  'idTypeOperation': 11,
                                                  'montant': null,
                                                  'idValeurElementPeriodicite': '',
                                                  'uniteFrequence' : 1,
                                                  'nombreVersement' : 1,
                                                  'dateDebut': dateJour,
                                                  'dateFin': '',
                                                  'jourUn': null,
                                                  'jourDeux': null,
                                                  'pourToujours': 1,
                                                  'prolonger': 0,
                                                  'idRegleLienTransfert': null,
                                                  'maitre': 0,
                                                  'paieSolde': 0
                                                 };
                } else {
                  let dateJour;
                  if ($scope.calendrier) {
                    dateJour = $scope.dateCalendrier;
                    $scope.dateDepartPicker = dateJour;
                  } else {
                    dateJour = formatDate(new Date());
                    $scope.dateDepartPicker = dateJour;
                  }
                  $scope.newRegleTransfertDe = {'id': $scope.regleTransfert.idRegle,
                                                'idSousPosteBudgetaireRegle': $scope.regleTransfert.idSousPosteBudgetaireRegleDe,
                                                'idTypeOperation': $scope.regleTransfert.idTypeOperation,
                                                'montant': $scope.regleTransfert.montant,
                                                'idValeurElementPeriodicite': $scope.regleTransfert.idValeurElementPeriodicite,
                                                'uniteFrequence' : $scope.regleTransfert.uniteFrequence,
                                                'nombreVersement' : $scope.regleTransfert.nombreVersement,
                                                'dateDebut': $scope.regleTransfert.dateDebut,
                                                'dateFin': $scope.regleTransfert.dateFin,
                                                'jourUn': $scope.regleTransfert.jourUn,
                                                'jourDeux': $scope.regleTransfert.jourDeux,
                                                'pourToujours': $scope.regleTransfert.pourToujours,
                                                'prolonger': $scope.regleTransfert.prolonger,
                                                'idRegleLienTransfert': $scope.regleTransfert.idRegleLienTransfert,
                                                'maitre': $scope.regleTransfert.maitre,
                                                'paieSolde': $scope.regleTransfert.paieSolde
                                               };

                  $scope.jourUnSelected = $scope.jourMoisOptions.find(jourMois => parseInt(jourMois.code) === $scope.regleTransfert.jourUn);
                  $scope.jourDeuxSelected = $scope.jourMoisOptions.find(jourMois => parseInt(jourMois.code) === $scope.regleTransfert.jourDeux);

                  await $scope.getRegleTransfertVers();
                  await $scope.getRegleImpact((!$scope.isInverse) ? $scope.regleTransfert.idRegle : $scope.newRegleTransfertVers.id);

                  // Gestion de la lov des périodicités
                  $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.id === $scope.regleTransfert.idValeurElementPeriodicite);
                  $scope.$applyAsync();

                  // Si "Quelques Fois" il faut alimenter le array de dates
                  if ($scope.periodiciteSelected.code === "QUELQUESFOIS") {
                    // Parcourir les dates
                    await $scope.chargerQuelquesFois($scope.regleTransfert.idRegle);
                  }
                }
                $scope.oldIdValeurElementPeriodicite = $scope.newRegleTransfertDe.idValeurElementPeriodicite;
                $scope.oldUniteFrequence = $scope.newRegleTransfertDe.uniteFrequence;
                $scope.oldNombreVersement = $scope.newRegleTransfertDe.nombreVersement;
                $scope.oldDateDebut = $scope.newRegleTransfertDe.dateDebut;
                $scope.oldDateFin = $scope.newRegleTransfertDe.dateFin;
                $scope.oldJourUn = $scope.newRegleTransfertDe.jourUn;
                $scope.oldJourDeux = $scope.newRegleTransfertDe.jourDeux;
                $scope.oldPourToujours = $scope.newRegleTransfertDe.pourToujours;
              };

              await $scope.chargementInitial();
              $scope.chargementRegleTransfert();
              $scope.$applyAsync();

              // La liste de sous-poste est-elle invalide??
              $scope.sousPosteBudgetaireInvalide = function() {
                if ($scope.sousPosteBudgetaireSelected.idPosteBudgetaire===""){
                  return true;
                }
                return false;
              };

              // Validation de la périodicité
              $scope.periodiciteInvalide = function() {
                if ($scope.periodiciteSelected.id===""){
                  return true;
                }
                return false;
              };

              // Validation du jour1
              $scope.jourUnInvalide = function() {
                if ((typeof($scope.transfertForm.jourUn) !== "undefined") && ($scope.transfertForm.jourUn.$viewValue.code===null)) {
                  return true;
                }
                return false;
              };

              $scope.jourDeuxInvalide = function() {
                if ((typeof($scope.transfertForm.jourDeux) !== "undefined") && ($scope.transfertForm.jourDeux.$viewValue.code===null)) {
                  return true;
                }
                return false;
              };

              // Retourne le montant de défaut ou le montant du array de montant en modification
              $scope.getMontant = function(montant,index) {
                if ($scope.creation) {
                  return montant;
                } else {
                  if ($scope.montantQqfois[index] != null){
                    return $scope.montantQqfois[index];
                  } else {
                    return montant;
                  }
                }
              };

              // Validation de la sélection multiple de dates
              $scope.arrayDeDatesInvalide = function() {
                if ($scope.arrayDeDates.length < 1){
                  return true;
                }
                return false;
              };

              // Lors d'un click sur le calendrier de dates multiple
              $scope.arrayDeDatesClick = function() {
                $scope.datesModifiees = true;
              };

              // Supprime du array de dates
              $scope.supprimeDateSelection = function(item) {
                $scope.arrayDeDates.splice($scope.arrayDeDates.indexOf(item), 1);
                $scope.datesModifiees = true;
              };

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.ok = function () {
                $uibModalInstance.close(true);
              };

              // cancel button clicked
              $scope.cancel = function () {
                if ($scope.modifie) {
                  $uibModalInstance.close(true);
                } else {
                  $uibModalInstance.close(false);
                }
              };

              // delete button clicked
              $scope.supprime = function () {
                RegleResource.remove({"id": $scope.regleTransfert.idRegle}).$promise
                    .then(async () => {
                      cuServices.message('delete', false, false);
                      $uibModalInstance.close(true);
                    })
                    .catch(err => {
                      cuServices.message('delete', err, true);
                      $uibModalInstance.close(false);
                    });
              };

              // bouton enregistrer
              $scope.submitForm = function(isValid, isPristine, isDirty, isUntouched) {

                // Y-a t'il des modifications???
                if ( (!isDirty && !$scope.creation) &&
                     ( ( $scope.datesModifiees ) ||
                       ( $scope.oldDateDebut !== $scope.transfertForm.dateDebut.$viewValue ) ||
                       ( (typeof($scope.transfertForm.dateFin) !== "undefined") && ($scope.oldDateFin !== $scope.transfertForm.dateFin.$viewValue) ) ||
                       ( $scope.switcherRegle.prolonger && $scope.newRegleTransfertDe.prolonger    === 0) ||
                       (!$scope.switcherRegle.prolonger && $scope.newRegleTransfertDe.prolonger    === 1) ||
                       ( $scope.switcherRegle.toujours  && $scope.newRegleTransfertDe.pourToujours === 0) ||
                       (!$scope.switcherRegle.toujours  && $scope.newRegleTransfertDe.pourToujours === 1) ||
                       ( $scope.switcherRegle.solde     && $scope.newRegleTransfertDe.paieSolde    === 0) ||
                       (!$scope.switcherRegle.solde     && $scope.newRegleTransfertDe.paieSolde    === 1) ||
                       ($scope.compteSelected.id !== $scope.transfertForm.compte.$viewValue.id ) ||
                       ($scope.newRegleTransfertDe.idValeurElementPeriodicite !== $scope.transfertForm.periodicite.$viewValue.id ))) {
                  isDirty = true;
                }

                if ($scope.creation || isDirty){
                  var invalide = false;
                  var invalideExc = false;

                  if ($scope.periodiciteSelected.code === "QUELQUESFOIS" && $scope.arrayDeDatesInvalide()){
                    $scope.transfertForm.arrayDeDates.$setValidity('required', false);
                    invalide = true;
                  } else if ($scope.periodiciteSelected.code === "QUELQUESFOIS" && !$scope.arrayDeDatesInvalide()){
                    $scope.transfertForm.arrayDeDates.$setValidity('required', true);
                    invalide = false;
                  }

                  // Valider la date de début de budget
                  if ($scope.budget.dateDebut !== null && typeof($scope.transfertForm.dateDebut) !== "undefined") {
                    if (moment($scope.transfertForm.dateDebut.$viewValue).isBefore($scope.budget.dateDebut)) {
                      //Erreur
                      $scope.transfertForm.dateDebut.$setValidity('erreurDateBudget', false);
                    } else {
                      //Valide
                      $scope.transfertForm.dateDebut.$setValidity('erreurDateBudget', true);
                    }
                  }

                  // Valide les dates
                  if (typeof($scope.transfertForm.dateFin) !== "undefined" && $scope.transfertForm.dateFin.$viewValue !== "" && $scope.transfertForm.dateFin.$viewValue !== null) {

                    if (!moment($scope.transfertForm.dateDebut.$viewValue).isSameOrBefore($scope.transfertForm.dateFin.$viewValue)) {
                      $scope.transfertForm.dateFin.$setValidity('erreurDate', false);
                    } else {
                      $scope.transfertForm.dateFin.$setValidity('erreurDate', true);
                    }
                  }

                  if ($scope.transfertForm.$valid && !invalide){

                    $scope.newRegleTransfertDe.idValeurElementPeriodicite = $scope.transfertForm.periodicite.$viewValue.id;

                    // Switch prolonger
                    if ($scope.switcherRegle.prolonger) {
                      $scope.newRegleTransfertDe.prolonger = 1;
                    } else {
                      $scope.newRegleTransfertDe.prolonger = 0;
                    }

                    // Switch payer le solde
                    if ($scope.switcherRegle.solde) {
                      $scope.newRegleTransfertDe.paieSolde = 1;
                    } else {
                      $scope.newRegleTransfertDe.paieSolde = 0;
                    }

                    if ($scope.periodiciteSelected.code === "QUELQUESFOIS") {

                      $scope.newRegleTransfertDe.pourToujours = 0;
                      $scope.newRegleTransfertDe.nombreVersement = 0;

                    } else if ($scope.periodiciteSelected.code === "BIMENSUEL") {
                      // Switch toujours
                      if ($scope.switcherRegle.toujours) {
                        $scope.newRegleTransfertDe.pourToujours = 1;
                        $scope.newRegleTransfertDe.nombreVersement = 0;
                      } else {
                        $scope.newRegleTransfertDe.pourToujours = 0;
                      }

                      $scope.newRegleTransfertDe.jourUn = parseInt($scope.transfertForm.jourUn.$viewValue.code);
                      $scope.newRegleTransfertDe.jourDeux = parseInt($scope.transfertForm.jourDeux.$viewValue.code);

                    } else {
                      // Switch toujours
                      if ($scope.switcherRegle.toujours){
                        $scope.newRegleTransfertDe.pourToujours = 1;
                        $scope.newRegleTransfertDe.nombreVersement = 0;
                      } else {
                        $scope.newRegleTransfertDe.pourToujours = 0;
                      }
                    }
                    //

                    // On valide que si la fréquence a été touchée et qu'il y a une ou des exceptions.
                    if ( (!$scope.creation) && (
                         ( $scope.datesModifiees )   ||
                         ( $scope.oldDateDebut       !== $scope.transfertForm.dateDebut.$viewValue ) ||
                         ( (typeof($scope.transfertForm.dateFin)        !== "undefined") && ($scope.oldDateFin !== $scope.transfertForm.dateFin.$viewValue) ) ||
                         ( (typeof($scope.transfertForm.periodicite)    !== "undefined") && ($scope.oldIdValeurElementPeriodicite !== $scope.transfertForm.periodicite.$viewValue.id ) ) ||
                         ( (typeof($scope.transfertForm.uniteFrequence) !== "undefined") && ($scope.oldUniteFrequence  !== parseInt($scope.transfertForm.uniteFrequence.$viewValue) ) ) ||
                         ( $scope.oldNombreVersement !== $scope.newRegleTransfertDe.nombreVersement )                ||
                         ( $scope.oldJourUn          !== $scope.newRegleTransfertDe.jourUn )                         ||
                         ( $scope.oldJourDeux        !== $scope.newRegleTransfertDe.jourDeux )                       ||
                         ( $scope.oldPourToujours    !== $scope.newRegleTransfertDe.pourToujours ) ) ) {

                       let promiseDate = cuServices.regleException("getParRegle",$scope.regleTransfert.idRegle, null);
                       promiseDate.then(function(value) {
                         const data = value.data;
                         if (data.length > 0) {
                           dialogModal($translate.instant('GLOBALE.MESSAGE.EXCEPTION_SUPPRESSION'),
                                       'warning',
                                       $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                                       $translate.instant('GLOBALE.SWITCH.OUI'),
                                       false,
                                       $translate.instant('GLOBALE.SWITCH.NON'),
                                       false).result.then(function(retour) {
                             if (retour === 1) {
                               RegleExceptionResource.removeParRegle({"idRegle":$scope.regleTransfert.idRegle}).$promise
                                   .then(() => {
                                     $scope.enregistrerForm($scope.creation);
                                   })
                                   .catch(err => {
                                     cuServices.message("delete", err, true);
                                     $scope.enregistrerForm($scope.creation);
                                   });
                             } else {
                               $scope.enregistrerForm($scope.creation);
                             }
                           });
                         } else {
                           $scope.enregistrerForm($scope.creation);
                         }
                       });
                    } else {
                       $scope.enregistrerForm($scope.creation);
                    }
                  }
                } else {
                  // Aucune modification
                  var message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
                  toastr.info(message);
                }
              };

              $scope.supprimeRegleDateImpact = function () {
                return new Promise((resolve, reject) => {
                  let promiseSupp = cuServices.supprimeRegleDateImpact($scope.idBudget, $scope.newRegleTransfertDe.id, $scope.newRegleTransfertVers.id);
                  promiseSupp.then(function(value) {
                    resolve(true);
                  }).catch(function(value) {
                    resolve(true);
                  });
                });
              }

              $scope.enregistrerQuelquesFois = function (idRegle) {
                return new Promise((resolve, reject) => {

                  let regleDate = [];

                  for (var i=0,  tot=$scope.arrayDeDates.length; i < tot; i++) {
                    regleDate.push({'idRegle': idRegle,
                                    'dateFixe': $scope.arrayDeDates[i].format('YYYY-MM-DD'),
                                    'montant': $scope.montantQqfois[$scope.arrayDeDates[i].format('YYYY-MM-DD')]
                                  });
                  }

                  if (regleDate.length > 0) {
                    RegleDateResource.bulkCreate(regleDate).$promise
                        .then((result) => {
                           resolve(result);
                        })
                        .catch(err => {
                           cuServices.message("bulkCreate", err, true);
                           resolve(result);
                        });
                  } else {
                    resolve(true);
                  }
                });
              }

              $scope.enregistrerForm = async function(creation) {

                // On fait d'abord le ménage des enregistrements de "regleDate" et "regleImpact" en mode silencieux
                if (!creation){
                  await $scope.supprimeRegleDateImpact();
                }

                if (typeof($scope.newRegleTransfertDe.dateFin) === "undefined" || $scope.newRegleTransfertDe.dateFin === null){
                  $scope.newRegleTransfertDe.dateFin = '';
                }

                // On prépare la règle pour "newRegleTransfertVers"
                $scope.newRegleTransfertVers.idSousPosteBudgetaireRegle = $scope.transfertForm.compte.$viewValue.id;
                $scope.newRegleTransfertVers.montant = $scope.newRegleTransfertDe.montant;
                $scope.newRegleTransfertVers.idValeurElementPeriodicite = $scope.newRegleTransfertDe.idValeurElementPeriodicite;
                $scope.newRegleTransfertVers.uniteFrequence = $scope.newRegleTransfertDe.uniteFrequence;
                $scope.newRegleTransfertVers.nombreVersement = $scope.newRegleTransfertDe.nombreVersement;
                $scope.newRegleTransfertVers.dateDebut = $scope.newRegleTransfertDe.dateDebut;
                $scope.newRegleTransfertVers.dateFin = $scope.newRegleTransfertDe.dateFin;
                $scope.newRegleTransfertVers.jourUn = $scope.newRegleTransfertDe.jourUn;
                $scope.newRegleTransfertVers.jourDeux = $scope.newRegleTransfertDe.jourDeux;
                $scope.newRegleTransfertVers.pourToujours = $scope.newRegleTransfertDe.pourToujours;
                $scope.newRegleTransfertVers.prolonger = $scope.newRegleTransfertDe.prolonger;
                $scope.newRegleTransfertVers.idRegleLienTransfert = $scope.newRegleTransfertDe.idRegleLienTransfert;
                $scope.newRegleTransfertVers.maitre = $scope.newRegleTransfertDe.maitre;
                $scope.newRegleTransfertVers.paieSolde = $scope.newRegleTransfertDe.paieSolde;

                // On inverse le tout et le tour est joué
                if ($scope.isInverse) {
                  let regleTransfertVers = $scope.newRegleTransfertDe;
                  let regleTransfertDe   = $scope.newRegleTransfertVers;

                  $scope.newRegleTransfertDe   = regleTransfertDe;
                  $scope.newRegleTransfertVers = regleTransfertVers;
                  $scope.newRegleTransfertVers.idSousPosteBudgetaireRegle = $scope.transfererDeId;
                  $scope.newRegleTransfertVers.idTypeOperation = 11;
                  $scope.newRegleTransfertDe.idTypeOperation = 12;
                }
                //**********************************************************************************************
                // On s'occupe d'abord de la règle "newRegleTransfertDe"
                //**********************************************************************************************
                $scope.$eval(($scope.newRegleTransfertDe.id ? "update" : "create"),RegleResource)($scope.newRegleTransfertDe).$promise
                  .then(async (result) => {
                    cuServices.message(($scope.newRegleTransfertDe.id ? "update" : "create"), false, false);
                    if ($scope.newRegleTransfertDe.id || result.regle.id != -1) {
                      let retourIdDe = $scope.newRegleTransfertDe.id || result.regle.id;
                      $scope.newRegleTransfertVers.idRegleLienTransfert = retourIdDe;

                      // Gestion de l'impact de la règle "newRegleTransfertDe"
                      var regleImpact = {
                        idRegle: retourIdDe,
                        idSousPosteBudgetaireRegleImpact: $scope.newRegleTransfertVers.idSousPosteBudgetaireRegle
                      };

                      RegleImpactResource.create(regleImpact).$promise
                        .then(async (result) => {
                          regleImpact = {};

                          // Gestion des dates  de la règle "newRegleTransfertDe"
                          if ($scope.periodiciteSelected.code === "QUELQUESFOIS") {
                            //
                            await $scope.enregistrerQuelquesFois(retourIdDe);
                          }
                          //**********************************************************************************************
                          // On s'occupe maintenant de la règle "newRegleTransfertVers"
                          //**********************************************************************************************
                          $scope.$eval(($scope.newRegleTransfertVers.id ? "update" : "create"),RegleResource)($scope.newRegleTransfertVers).$promise
                            .then(async (result) => {
                              if ($scope.newRegleTransfertVers.id || result.regle.id != -1) {
                                let retourIdVers = $scope.newRegleTransfertVers.id || result.regle.id;

                                // Gestion de l'impact de la règle "newRegleTransfertDe"
                                var regleImpactVers = {
                                  idRegle: retourIdVers,
                                  idSousPosteBudgetaireRegleImpact: $scope.newRegleTransfertDe.idSousPosteBudgetaireRegle
                                };

                                RegleImpactResource.create(regleImpactVers).$promise
                                  .then(async (result) => {
                                    regleImpactVers = {};

                                    // Gestion des dates  de la règle "newRegleTransfertDe"
                                    if ($scope.periodiciteSelected.code === "QUELQUESFOIS") {
                                      //
                                      await $scope.enregistrerQuelquesFois(retourIdVers);
                                    }
                                    $scope.newRegleTransfertDe = {};
                                    $scope.newRegleTransfertVers = {};
                                    $uibModalInstance.close(true);
                                  })
                                  .catch((err) => {
                                    cuServices.message("create", err, true);
                                  });
                              }
                            })
                            .catch((err) => {
                              cuServices.message(($scope.newRegleTransfertVers.id ? "update" : "create"), err, true);
                            });
                        })
                        .catch((err) => {
                          cuServices.message("create", err, true);
                        });
                    } else {
                      $scope.newRegleTransfertDe = {};
                      $scope.newRegleTransfertVers = {};
                      $uibModalInstance.close(true);
                    }
                })
                .catch((err) => {
                  cuServices.message(($scope.newRegleTransfertDe.id ? "update" : "create"), err, true);
                });
              };
            };

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                size: 'md', //Grandeur de la fenêtre ('md','lg','sm')
                template: '<div class="modal-content"> \
                    <div class="modal-header"> \
                      <button ng-attr-type="button" class="close" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h3 class="modal-title-with-line">{{titre}}</h3> \
                    </div> \
                    <div class="form-horizontal"> \
                      <div include-with-scope="app/pages/priver/transaction/widgets/transfertCompte.html"></div>\
                    </div> \
                  </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            modalTitle: title,
                            modalBody: "",
                            idBudget: idBudget,
                            idSousPosteBudgetaireRegle: idSousPosteBudgetaireRegle,
                            regleTransfert : regleTransfert,
                            okButton: okButton,
                            deleteButton: deleteButton,
                            cancelButton: cancelButton,
                            signe: signe,
                            creation: creation,
                            provenance: provenance,
                            typeTransfert: typeTransfert,
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
