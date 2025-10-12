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
     exception                     Affiche ou non la zône d'exception
     signe                         Signe de la devise
     assistant                     Indicateur qu'on est en mode assistant, on retourne la regle à la fermeture
     dateCalendrier                Reçoit la date sélectionnée dans le calendrier
  */
    .service('transactionDepRevModal', ['$uibModal', function($uibModal) {
        return function (categorie,
                         listeSousPosteBudgetaire,
                         listeSousPosteBudgetaireRegle,
                         idBudget,
                         creation,
                         exception,
                         signe,
                         assistant,
                         dateCalendrier
                        ) {

            // setup the Controller to watch the click
            var ModalInstanceCtrl = async function ($scope,
                                                    $rootScope,
                                                    $timeout,
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
                                                    RegleResource,
                                                    RegleExceptionResource,
                                                    RegleDateResource,
                                                    BudgetResource,
                                                    RegleImpactResource,
                                                    SousPosteBudgetaireResource,
                                                    SousPosteBudgetaireRegleResource) {

              $scope.categorie = settings.categorie;
              $scope.listeSousPosteBudgetaire = settings.listeSousPosteBudgetaire;
              $scope.listeSousPosteBudgetaireRegle = settings.listeSousPosteBudgetaireRegle;
              $scope.idBudget = settings.idBudget;
              $scope.creation = settings.creation;
              $scope.exception = settings.exception;
              $scope.signe = settings.signe;
              $scope.assistant = settings.assistant;
              $scope.toast = settings.assistant;
              $scope.datesModifiees = false;
              $scope.sousPosteBudgetaireSelected = {};
              $scope.periodiciteSelected = {};
              $scope.montantQqfois = {};
              $scope.typeGlossy = 'glossy';
              $scope.sousPosteBudgetaireInactif = false;
              $scope.ctrlLoaded = false;
              $scope.modifie = false;
              $scope.budget = null;
              $scope.calendrier = false;
              $scope.dateCalendrier = settings.dateCalendrier;
              $scope.regle = {};

              // On provient du calendrier? Si oui, on met la date du calendrier et la fréquence a "Une seule fois" par défaut.
              if (typeof($scope.dateCalendrier) !== "undefined") {
                $scope.calendrier = true;
              }

              // Le confirmClick
              $scope.ccSujet = $translate.instant("GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION");
              $scope.ccMessage = $translate.instant("GLOBALE.MESSAGE.ATTENTION");
              $scope.ccBtnOui = $translate.instant("GLOBALE.SWITCH.OUI");
              $scope.ccBtnNon = $translate.instant("GLOBALE.SWITCH.NON");

              // Gestion de la langue
              $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
              moment.locale($scope.initialLocaleCode);
              $scope.arrayDeDates = [];
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

              // Gestion du titre de la fenêtre
              if (categorie.code === 'REV'){
                $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_REVENU");
                $scope.parCompte = $translate.instant("ECRAN.TRANSACTION.PAR_COMPTE_REVENU");
                $scope.idTypeOperation = 13; // Revenu
              } else {
                $scope.titre = $translate.instant("ECRAN.TRANSACTION.TITRE_TRS_DEPENSE");
                $scope.parCompte = $translate.instant("ECRAN.TRANSACTION.PAR_COMPTE_DEPENSE");
                $scope.idTypeOperation = 14; // Dépense
              }

              // Gestion des boutons
              $scope.enregistrer = true;
              $scope.boutonEnregistrer = null;
              $scope.boutonSuivant = null;
              $scope.boutonSupprimer = null;

              if ($scope.listeSousPosteBudgetaire == null || typeof($scope.listeSousPosteBudgetaire.length) === "undefined"){
                $scope.boutonEnregistrer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
              } else {
                $scope.boutonSuivant = $translate.instant("GLOBALE.BOUTON.SUIVANT");
                $scope.enregistrer = false;
              }
              $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

              if (!creation){
                $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
              }

              // Création des switchs
              $scope.switcherRegle = {
                prolonger: false,
                toujours: true
              };

              // La liste de sous-poste change
              $scope.majImage = function () {
                var typeImage = $scope.sousPosteBudgetaireSelected.typeImage;
                var image = $scope.sousPosteBudgetaireSelected.image;

                if (typeImage === "glossy"){
                  $scope.imagePath = $filter('glossyBusinessImg')(image);
                }
                $scope.imageSelect = image;
                $scope.typeImageSelect = typeImage;
              };

              $scope.majSousPoste = function () {
                $scope.majImage();
                $scope.regle.description = $scope.sousPosteBudgetaireSelected.description;
              };

              // Trouver les opérations de comptes, crédits
              $scope.getOperations = function (idCat1, idCat2) {
                return new Promise((resolve, reject) => {

                  let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.idBudget, idCat1, idCat2, null, null, null, null);
                  promiseOptions.then(function(value) {
                    $scope.compteOptions = value.data;
                    $scope.compteSelected = value.data[0];
                    resolve(true);
                  });
                });
              };

              // Chargement initial
              $scope.chargementInitial = async function () {

                // Trouver les périodicités
                $scope.periodiciteOptions = $rootScope.arrayValeurElement.filter(vae => vae.type === 'vaePeriodicite')
                                                                         .sort(function(a, b) {return (a.tri - b.tri)});
                if ($scope.calendrier) {
                  $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.code === 'UNEFOIS');
                } else {
                  $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.code === 'MENSUEL');
                }


                // Trouver les jours du mois
                $scope.jourMoisOptions = $rootScope.arrayValeurElement.filter(vae => vae.type === 'vaeJourMois')
                                                                      .sort(function(a, b) {return (a.tri - b.tri)});
                $scope.jourUnSelected = $scope.jourMoisOptions[0];
                $scope.jourDeuxSelected = $scope.jourMoisOptions[14];

                // Trouver les opérations de comptes, crédits
                await $scope.getOperations(3, 6);
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

              // Trouver la description du compte d'origine
              $scope.getRegleMaitre = async function () {
                return new Promise((resolve, reject) => {
                  let promiseRegle = cuServices.regle("getParSousPosteMaitre",listeSousPosteBudgetaireRegle.id, null, null);
                  promiseRegle.then(async function(value) {
                    const data = value.data;
                    if (data.length > 0) {
                      $scope.regle = data[0];

                      // Gestion des switch
                      if ($scope.regle.prolonger === 0){
                        $scope.switcherRegle.prolonger = false;
                      } else {
                        $scope.switcherRegle.prolonger = true;
                      }
                      if ($scope.regle.pourToujours === 0){
                        $scope.switcherRegle.toujours = false;
                      } else {
                        $scope.switcherRegle.toujours = true;
                      }

                      $scope.jourUnSelected = $scope.jourMoisOptions.find(jourMois => parseInt(jourMois.code) === data[0].jourUn);
                      $scope.jourDeuxSelected = $scope.jourMoisOptions.find(jourMois => parseInt(jourMois.code) === data[0].jourDeux);

                      await $scope.getRegleImpact($scope.regle.id);

                      // Gestion de la lov des périodicités
                      $scope.periodiciteSelected = $rootScope.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.id === $scope.regle.idValeurElementPeriodicite);
                      $scope.$applyAsync();

                      // Si "Quelques Fois" il faut alimenter le array de dates
                      if ($scope.periodiciteSelected.code === "QUELQUESFOIS" ||
                          $scope.transactionForm.periodicite.$viewValue.code === "QUELQUESFOIS") {
                        // Parcourir les dates
                        await $scope.chargerQuelquesFois($scope.regle.id);
                      }
                      resolve(true);
                    } else {
                      resolve(true);
                    }
                  }).catch(async function(value) {
                    resolve(true);
                  });
                });
              };

              // Chargement règle
              $scope.chargementRegle = async function () {
                if ($scope.creation === 1){
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
                                  'idValeurElementPeriodicite': '',
                                  'uniteFrequence': 1,
                                  'nombreVersement': 1,
                                  'dateDebut': dateJour,
                                  'dateFin': '',
                                  'jourUn': null,
                                  'jourDeux': null,
                                  'pourToujours': 1,
                                  'prolonger': 0,
                                  'maitre': 1
                                 };
                } else if (typeof($scope.listeSousPosteBudgetaireRegle.length) === "undefined" && $scope.listeSousPosteBudgetaireRegle.id){

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

                  $scope.sousPosteBudgetaireRegle = $scope.listeSousPosteBudgetaireRegle;

                  await $scope.getRegleMaitre();

                } else {
                  // À venir, liste multiple de règle

                }
                $scope.oldIdValeurElementPeriodicite = $scope.regle.idValeurElementPeriodicite;
                $scope.oldUniteFrequence = $scope.regle.uniteFrequence;
                $scope.oldNombreVersement = $scope.regle.nombreVersement;
                $scope.oldDateDebut = $scope.regle.dateDebut;
                $scope.oldDateFin = $scope.regle.dateFin;
                $scope.oldJourUn = $scope.regle.jourUn;
                $scope.oldJourDeux = $scope.regle.jourDeux;
                $scope.oldPourToujours = $scope.regle.pourToujours;
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

              await $scope.chargementInitial();
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
                  if (data.length == 0) {
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
                if ($scope.transactionForm.sousPosteBudgetaire.$viewValue.idPosteBudgetaire===""){
                  return true;
                }
                $scope.sousPosteBudgetaireSelected = $scope.transactionForm.sousPosteBudgetaire.$viewValue;
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
                if ($scope.transactionForm.jourUn.$viewValue===undefined || $scope.transactionForm.jourUn.$viewValue.code===null || $scope.transactionForm.jourUn.$viewValue.code===""){
                  return true;
                }
                return false;
              };

              $scope.jourDeuxInvalide = function() {
                if ($scope.transactionForm.jourDeux.$viewValue===undefined || $scope.transactionForm.jourDeux.$viewValue.code===null || $scope.transactionForm.jourDeux.$viewValue.code===""){
                  return true;
                }
                return false;
              };

              // Retourne le montant de défaut ou le montant du array de montant en modification
              $scope.getMontant = function(montant,index) {
                if (creation) {
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

              // Modifier l'image
              $scope.modifierImage = function(sousPosteBudgetaire) {

                var titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERIMAGE");
                var boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                var boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                imageSelectModal(boutonOk, boutonAnnuler, titre, $scope.imageSelect, $scope.typeImageSelect).result.then(function(objetImage) {

                  var imgEdit = document.getElementById("imgSousPosteTrs");
                  if (typeof(imgEdit) !== "undefined" && imgEdit !== null && objetImage.source !== ""){
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

                // Y-a t'il des modifications???
                if ( (!isDirty && !creation) &&
                     ( ( $scope.datesModifiees ) ||
                       ( (typeof($scope.transactionForm.dateDebut) !== "undefined") && ($scope.oldDateDebut !== $scope.transactionForm.dateDebut.$viewValue ) ) ||
                       ( (typeof($scope.transactionForm.dateFin)   !== "undefined") && ($scope.oldDateFin   !== $scope.transactionForm.dateFin.$viewValue) )    ||
                       ( $scope.switcherRegle.prolonger && $scope.regle.prolonger    === 0) ||
                       (!$scope.switcherRegle.prolonger && $scope.regle.prolonger    === 1) ||
                       ( $scope.switcherRegle.toujours  && $scope.regle.pourToujours === 0) ||
                       (!$scope.switcherRegle.toujours  && $scope.regle.pourToujours === 1) ||
                       ($scope.compteSelected.id !== $scope.transactionForm.compte.$viewValue.id ) ||
                       ($scope.regle.idValeurElementPeriodicite !== $scope.transactionForm.periodicite.$viewValue.id ))) {
                  isDirty = true;
                }

                if (creation || isDirty){
                  var invalide = false;
                  var invalideExc = false;

                  if ($scope.transactionForm.periodicite.$viewValue.code === "QUELQUESFOIS" && $scope.arrayDeDatesInvalide()){
                    $scope.transactionForm.arrayDeDates.$setValidity('required', false);
                    invalide = true;
                  } else if ($scope.transactionForm.periodicite.$viewValue.code === "QUELQUESFOIS" && !$scope.arrayDeDatesInvalide()){
                    $scope.transactionForm.arrayDeDates.$setValidity('required', true);
                    invalide = false;
                  }
                  // Valider la date de début de budget
                  if ($scope.budget.dateDebut !== null && typeof($scope.transactionForm.dateDebut) !== "undefined") {
                    if (moment($scope.transactionForm.dateDebut.$viewValue).isBefore($scope.budget.dateDebut)) {
                      //Erreur
                      $scope.transactionForm.dateDebut.$setValidity('erreurDateBudget', false);
                    } else {
                      //Valide
                      $scope.transactionForm.dateDebut.$setValidity('erreurDateBudget', true);
                    }
                  }
                  // Valide les dates
                  if (typeof($scope.transactionForm.dateFin) !== "undefined" && $scope.transactionForm.dateFin.$viewValue !== "" && $scope.transactionForm.dateFin.$viewValue !== null) {

                    if (!moment($scope.transactionForm.dateDebut.$viewValue).isSameOrBefore($scope.transactionForm.dateFin.$viewValue)) {
                      $scope.transactionForm.dateFin.$setValidity('erreurDate', false);
                    } else {
                      $scope.transactionForm.dateFin.$setValidity('erreurDate', true);
                    }
                  }

                  if (!$scope.sousPosteBudgetaireInvalide() && $scope.transactionForm.$valid && !invalide){

                    $scope.sousPosteBudgetaireRegle.idSousPosteBudgetaire = $scope.transactionForm.sousPosteBudgetaire.$viewValue.id;
                    $scope.sousPosteBudgetaireRegle.description = $scope.regle.description;
                    $scope.regle.idValeurElementPeriodicite = $scope.transactionForm.periodicite.$viewValue.id;

                    // Switch prolonger
                    if ($scope.switcherRegle.prolonger) {
                      $scope.regle.prolonger = 1;
                    } else {
                      $scope.regle.prolonger = 0;
                    }

                    if ($scope.transactionForm.periodicite.$viewValue.code === "QUELQUESFOIS") {

                      $scope.regle.pourToujours = 0;
                      $scope.regle.nombreVersement = 0;

                    } else if ($scope.transactionForm.periodicite.$viewValue.code === "BIMENSUEL") {
                      // Switch toujours
                      if ($scope.switcherRegle.toujours) {
                        $scope.regle.pourToujours = 1;
                        $scope.regle.nombreVersement = 0;
                      } else {
                        $scope.regle.pourToujours = 0;
                      }

                      $scope.regle.jourUn = parseInt($scope.transactionForm.jourUn.$viewValue.code);
                      $scope.regle.jourDeux = parseInt($scope.transactionForm.jourDeux.$viewValue.code);

                    } else {
                      // Switch toujours
                      if ($scope.switcherRegle.toujours){
                        $scope.regle.pourToujours = 1;
                        $scope.regle.nombreVersement = 0;
                      } else {
                        $scope.regle.pourToujours = 0;
                      }
                    }

                    // On valide que si la fréquence a été touchée et qu'il y a une ou des exceptions.
                    if ( (!creation) && (
                         ( $scope.datesModifiees )   ||
                         ( (typeof($scope.transactionForm.dateDebut)      !== "undefined") && ($scope.oldDateDebut !== $scope.transactionForm.dateDebut.$viewValue ) ) ||
                         ( (typeof($scope.transactionForm.dateFin)        !== "undefined") && ($scope.oldDateFin !== $scope.transactionForm.dateFin.$viewValue) ) ||
                         ( (typeof($scope.transactionForm.periodicite)    !== "undefined") && ($scope.oldIdValeurElementPeriodicite !== $scope.transactionForm.periodicite.$viewValue.id ) ) ||
                         ( (typeof($scope.transactionForm.uniteFrequence) !== "undefined") && ($scope.oldUniteFrequence  !== parseInt($scope.transactionForm.uniteFrequence.$viewValue) ) ) ||
                         ( $scope.oldNombreVersement !== $scope.regle.nombreVersement )                ||
                         ( $scope.oldJourUn          !== $scope.regle.jourUn )                         ||
                         ( $scope.oldJourDeux        !== $scope.regle.jourDeux )                       ||
                         ( $scope.oldPourToujours    !== $scope.regle.pourToujours ) ) ) {

                       let promiseException = cuServices.regleException("getParRegle",$scope.regle.id, null);
                       promiseException.then(function(value) {
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
                               RegleExceptionResource.removeParRegle({"idRegle": $scope.regle.id}).$promise
                                   .then(() => {
                                     $scope.enregistrerForm(creation);
                                   })
                                   .catch(err => {
                                     cuServices.message("delete", err, true);
                                     $scope.enregistrerForm(creation);
                                   });
                             } else {
                               $scope.enregistrerForm(creation);
                             }
                           });
                         } else {
                           $scope.enregistrerForm(creation);
                         }
                       });
                    } else {
                       $scope.enregistrerForm(creation);
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
                  let promiseSupp = cuServices.supprimeRegleDateImpact($scope.idBudget, $scope.regle.id, null);
                  promiseSupp.then(function(value) {
                    resolve(true);
                  }).catch(function(value) {
                    resolve(true);
                  });
                });
              }

              $scope.enregistrerQuelquesFois = function (idRegle) {
                return new Promise((resolve, reject) => {

                  let retourIdDate;
                  let regleDate = [];
                  let erreurValideDate = false;
                  let valideDate = false;
                  if ($scope.budget.dateDebut !== null) {
                    valideDate = true;
                  }

                  for (var i=0,  tot=$scope.arrayDeDates.length; i < tot; i++) {
                    // Valider la date de début du budget
                    if (valideDate && $scope.arrayDeDates[i].isBefore($scope.budget.dateDebut)) {
                      erreurValideDate = true;
                    } else {
                      regleDate.push({'idRegle': idRegle,
                                      'dateFixe': $scope.arrayDeDates[i].format('YYYY-MM-DD'),
                                      'montant': $scope.montantQqfois[$scope.arrayDeDates[i].format('YYYY-MM-DD')]
                                    });
                    }
                  }
                  if (erreurValideDate) {
                    var message = $translate.instant("GLOBALE.AIDE.DATE_QQF_DEBUT_BUDGET");
                    toastr.warning(message);
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

              $scope.enregistreSousPosteBudgetaireRegle = function () {
                return new Promise((resolve, reject) => {
                  // On enregistre
                  $scope.$eval(($scope.sousPosteBudgetaireRegle.id ? "update" : "create"),SousPosteBudgetaireRegleResource)($scope.sousPosteBudgetaireRegle).$promise
                    .then((result) => {

                       cuServices.message(($scope.sousPosteBudgetaireRegle.id || result.sousPosteBudgetaireRegle.id ? "update" : "create"), false, false);
                       let retourIdMaitre = $scope.sousPosteBudgetaireRegle.id || result.sousPosteBudgetaireRegle.id;

                       if (retourIdMaitre != -1) {
                           if (typeof($scope.regle.dateFin) === "undefined" || $scope.regle.dateFin === null){
                             $scope.regle.dateFin = '';
                           }
                           $scope.regle.idSousPosteBudgetaireRegle = retourIdMaitre;

                           // On enregistre la règle
                           $scope.$eval(($scope.regle.id ? "update" : "create"),RegleResource)($scope.regle).$promise
                             .then(async (result) => {
                               // Pas de message
                               let retourId = $scope.regle.id || result.regle.id;
                               $scope.regle.id = retourId;

                               if (retourId !== -1) {
                                 // Gestion de l'impact
                                 var regleImpact = {
                                   idRegle: retourId,
                                   idSousPosteBudgetaireRegleImpact: $scope.transactionForm.compte.$viewValue.id
                                 };

                                 RegleImpactResource.create(regleImpact).$promise
                                   .then(async (result) => {
                                     regleImpact = {};

                                     // Gestion des dates  de la règle "newRegleTransfertDe"
                                     if ($scope.transactionForm.periodicite.$viewValue.code === "QUELQUESFOIS") {
                                       //
                                       await $scope.enregistrerQuelquesFois(retourId);
                                     }
                                     resolve(true);
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

              $scope.enregistrerForm = async function(creation) {

                // On fait d'abord le ménage des enregistrements de "regleDate" et "regleImpact" en mode silencieux
                if (!creation){
                  await $scope.supprimeRegleDateImpact();
                }
                await $scope.enregistreSousPosteBudgetaireRegle();

                if ($scope.assistant) {
                  $scope.sousPosteBudgetaireRegle = {};
                  let objetRetour = {
                    sousPoste: $scope.sousPosteBudgetaireSelected,
                    regle: $scope.regle,
                    image: $scope.imageSelect,
                    typeImage: $scope.typeImageSelect
                  }
                  $uibModalInstance.close(objetRetour);
                } else {
                  $scope.sousPosteBudgetaireRegle = {};
                  $scope.regle = {};
                  $uibModalInstance.close(true);
                }
              };

              $scope.supprimer = function(){

                if (!creation){
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
              };

              // bouton suivant
              $scope.suivant = function () {
//                $uibModalInstance.close($scope.objetChoisi.id);
                 $uibModalInstance.close(true);
              };

              $scope.setModifie = function (valeur) {
                $scope.modifie = valeur;
                $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.FERMER");
              }

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
                      <div include-with-scope="app/pages/priver/transaction/widgets/transactionDepRev.html"></div>\
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
                          exception: exception,
                          signe: signe,
                          assistant: assistant,
                          dateCalendrier: dateCalendrier
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        };
    }]);
})();
