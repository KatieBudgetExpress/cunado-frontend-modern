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
        idSousPosteBudgetaireRegle Règle maître sur laquelle on applique l'ajustement
        regleAjustement            (Modification) Ajustement à modifier
        signe                      Le signe de devise,
        creation                   Indicateur de création
        dateCalendrier             Reçoit la date sélectionnée dans le calendrier
     */
    .service('ajustementSoldeModal', ['$uibModal', function($uibModal) {
        return function (okButton, deleteButton, cancelButton, title, idBudget, idSousPosteBudgetaireRegle, regleAjustement, signe, creation, dateCalendrier) {
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
                                                    prepareAnalyse,
                                                    BudgetResource,
                                                    RegleResource) {

              $scope.idBudget = settings.idBudget;
              $scope.idSousPosteBudgetaireRegle = settings.idSousPosteBudgetaireRegle;
              $scope.regleAjustement = settings.regleAjustement;
              $scope.signe = settings.signe;
              $scope.creation = settings.creation;
              $scope.compteOptions = [];
              $scope.compteSelected = [];

              $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
              $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
              $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
              $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

              $scope.budget = null;
              $scope.dateCalendrier = settings.dateCalendrier;

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

              // On provient du calendrier? Si oui, on met la date du calendrier et la fréquence a "Une seule fois" par défaut.
              let dateJour;
              if (typeof($scope.dateCalendrier) !== "undefined") {
                dateJour = $scope.dateCalendrier;
                $scope.dateDepartPicker = dateJour;
              } else {
                dateJour = '';
                $scope.dateDepartPicker = null;
              }

              // Gestion de la langue
              $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
              moment.locale($scope.initialLocaleCode);

              if ($scope.creation) {
                if ($scope.regleAjustement == null) {

                  $scope.newRegleAjustement = {'idSousPosteBudgetaireRegle': $scope.idSousPosteBudgetaireRegle,
                                               'idTypeOperation': 4,
                                               'dateDebut': dateJour,
                                               'dateFin': dateJour,
                                               'montant': null,
                                               'idValeurElementPeriodicite': 15,
                                               'uniteFrequence': 1,
                                               'maitre': 0
                                              };

                } else {
                  $scope.newRegleAjustement = {'idSousPosteBudgetaireRegle': $scope.idSousPosteBudgetaireRegle,
                                               'idTypeOperation': $scope.regleAjustement.idTypeOperation,
                                               'dateDebut':  $scope.regleAjustement.dateDebut,
                                               'dateFin': $scope.regleAjustement.dateFin,
                                               'montant': null,
                                               'idValeurElementPeriodicite': 15,
                                               'uniteFrequence': 1,
                                               'maitre': 0
                                              };
                }
              } else {
                $scope.newRegleAjustement = {'id': $scope.regleAjustement.idRegle,
                                             'idSousPosteBudgetaireRegle': $scope.regleAjustement.idSousPosteBudgetaireRegle,
                                             'idTypeOperation': $scope.regleAjustement.idTypeOperation,
                                             'dateDebut': $scope.regleAjustement.dateDebut,
                                             'dateFin': $scope.regleAjustement.dateDebut,
                                             'montant': $scope.regleAjustement.montant,
                                             'idValeurElementPeriodicite': 15,
                                             'uniteFrequence' : 1,
                                             'maitre': 0
                                            };
              }

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.ok = function () {
                $scope;
                $uibModalInstance.close(true);
              };

              // cancel button clicked
              $scope.cancel = function () {
                  $uibModalInstance.close(false);
              };

              // delete button clicked
              $scope.supprime = function () {
                RegleResource.remove({"id": $scope.regleAjustement.idRegle}).$promise
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

                //
                $scope.newRegleAjustement.dateDebut = $scope.ajustementForm.dateDebut.$viewValue;
                $scope.newRegleAjustement.dateFin   = $scope.ajustementForm.dateDebut.$viewValue;
                $scope.newRegleAjustement.montant   = parseFloat($scope.ajustementForm.montant.$viewValue);

                // Y-a t'il des modifications???
                if ( (!isDirty && !$scope.creation) &&
                     ( ( $scope.regleAjustement.dateDebut !== $scope.newRegleAjustement.dateDebut ) ||
                       ( parseFloat($scope.regleAjustement.montant).toString() !== parseFloat($scope.newRegleAjustement.montant).toString() )
                     ) ) {
                  isDirty = true;
                }

                if ($scope.creation || isDirty) {
                  var invalide = false;
                  var condition = "";

                  // Valider la date de début
                  if ($scope.budget.dateDebut !== null && typeof($scope.ajustementForm.dateDebut) !== "undefined") {
                    if (moment($scope.ajustementForm.dateDebut.$viewValue).isBefore($scope.budget.dateDebut)) {
                      //Erreur
                      $scope.ajustementForm.dateDebut.$setValidity('erreurDateBudget', false);
                    } else {
                      //Valide
                      $scope.ajustementForm.dateDebut.$setValidity('erreurDateBudget', true);
                    }
                  }

                  if (creation) {
                    condition = ' WHERE t."idSousPosteBudgetaireRegle" = ' + $scope.newRegleAjustement.idSousPosteBudgetaireRegle + ' AND maitre=0 AND "idTypeOperation"=4';
                  } else {
                    condition = ' WHERE t.id <> ' + $scope.newRegleAjustement.id + ' AND t."idSousPosteBudgetaireRegle" = ' + $scope.newRegleAjustement.idSousPosteBudgetaireRegle + ' AND maitre=0 AND "idTypeOperation"=4';
                  }

                  if ($scope.ajustementForm.$valid && !invalide) {
                    let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'regle', condition, 'dateDebut', $scope.newRegleAjustement.dateDebut, "GLOBALE.MESSAGE.UNICITE_AJUSTEMENT");
                    promiseValideUnicite.then(async function(valide) {

                      if (valide) {
                        // On enregistre
                        $scope.$eval(($scope.newRegleAjustement.id ? "update" : "create"),RegleResource)($scope.newRegleAjustement).$promise
                          .then((result) => {
                            cuServices.message(($scope.newRegleAjustement.id ? "update" : "create"), false, false);
                            $scope.newRegleAjustement = [];
                            $uibModalInstance.close(true);
                          })
                          .catch((err) => {
                            cuServices.message(($scope.newRegleAjustement.id ? "update" : "create"), err, true);
                            $uibModalInstance.close(false);
                          });
                      }
                    });
                  }
                } else {
                  // Aucune modification
                  var message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
                  toastr.info(message);
                };
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
                      <h3 class="modal-title-with-line">{{modalTitle}}</h3> \
                    </div> \
                    <div class="form-horizontal"> \
                      <div include-with-scope="app/pages/priver/transaction/widgets/ajustementSolde.html"></div>\
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
                            regleAjustement : regleAjustement,
                            okButton: okButton,
                            deleteButton: deleteButton,
                            cancelButton: cancelButton,
                            signe: signe,
                            creation: creation,
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
