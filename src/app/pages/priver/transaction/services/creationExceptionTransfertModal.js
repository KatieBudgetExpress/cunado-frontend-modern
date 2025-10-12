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

        okButton          Texte du bouton Ok
        deleteButton      Texte pour le bouton Supprimer
        cancelButton      Texte du bouton Annuler
        title             Titre de la fenêtre (Tooltip)
        idRegle           Règle d'origine sur laquelle on applique l'exception
        idRegleVers       Règle de destination sur laquelle on applique l'exception
        regleException    (Modification) Exception à modifier
        signe             Le signe de devise,
        creation          Indicateur de création
        typeTransfert     Type de transfert
     */
    .service('creationExceptionTransfertModal', ['$uibModal', function($uibModal) {
        return function (okButton, deleteButton, cancelButton, title, idBudget, idRegle, idRegleVers, regleException, signe, creation, typeTransfert) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');
            deleteButton = deleteButton===false ? false : (deleteButton || 'Supprime');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope,
                                              $rootScope,
                                              $filter,
                                              $uibModalInstance,
                                              settings,
                                              cuServices,
                                              $translate,
                                              toastr,
                                              toastrConfig,
                                              prepareAnalyse,
                                              RegleExceptionResource) {

              $scope.idBudget = settings.idBudget;
              $scope.idRegle = settings.idRegle;
              $scope.idRegleVers = settings.idRegleVers;
              $scope.regleException = settings.regleException;
              $scope.signe = settings.signe;
              $scope.creation = settings.creation;
              $scope.typeTransfert = settings.typeTransfert;
              $scope.newRegleException = [];
              $scope.newRegleExceptionVers = [];

              $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
              $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
              $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
              $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

              // Gestion de la langue
              $scope.initialLocaleCode = $rootScope.appLocaleCode === "EN" ? 'en' : 'fr-ca';
              moment.locale($scope.initialLocaleCode);

              // Création des switchs
              $scope.switcherException = {
                aucunVersement: false,
                solde: false
              };

              if ($scope.creation) {
                $scope.newRegleException = { 'idRegle': $scope.idRegle,
                                             'dateRegle': '',
                                             'dateException': '',
                                             'montantException': null,
                                             'aucunVersement': 0,
                                             'concilie' : 0,
                                             'paieSolde' : 0
                                           };
                 // Date de défaut
                 prepareAnalyse.getDateEvenementSuivant($scope.idBudget, $scope.idRegle, moment().format('YYYY-MM-DD'))
                 .then((value) => {
                   $scope.newRegleException.dateRegle = value;
                   $scope.$applyAsync();
                 });
              } else {
                $scope.newRegleException = { 'id': $scope.regleException.id,
                                             'idRegle': $scope.regleException.idRegle,
                                             'dateRegle': $scope.regleException.dateRegle,
                                             'dateException': $scope.regleException.dateException,
                                             'montantException': $scope.regleException.montantException,
                                             'aucunVersement': $scope.regleException.aucunVersement,
                                             'concilie' : $scope.regleException.concilie,
                                             'paieSolde' : $scope.regleException.paieSolde
                                           };

                // Gestion des switch
                if ($scope.regleException.aucunVersement === 1){
                  $scope.switcherException.aucunVersement = true;
                } else {
                  $scope.switcherException.aucunVersement = false;
                }
                if ($scope.regleException.paieSolde === 1){
                  $scope.switcherException.solde = true;
                } else {
                  $scope.switcherException.solde = false;
                }
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

                let promiseRegleExc = new Promise( (resolve, reject) => {
                  RegleExceptionResource.remove({"id": $scope.regleException.id}).$promise
                      .then(() => {
                        // Silencieux
                        if ($scope.idRegleVers !== null) {
                          RegleExceptionResource.removeParRegleDateRegle({"idRegle": $scope.idRegleVers,
                                                                          "dateRegle": $scope.regleException.dateRegle}).$promise
                              .then(() => {
                                 $uibModalInstance.close(true);
                              })
                              .catch(err => {
                                 cuServices.message("delete", err, true);
                                 // Le maitre s'est détruit, donc on a un changement quand même
                                 $uibModalInstance.close(true);
                              });
                        } else {
                          $uibModalInstance.close(true);
                        }
                      })
                      .catch(err => {
                        cuServices.message("delete", err, true);
                        $uibModalInstance.close(false);
                      });
                });
              };

              $scope.localeSensitiveComparator = function(v1, v2) {
                // If we don't get strings, just compare by index
                if (v1.type !== 'string' || v2.type !== 'string') {
                  return (v1.index < v2.index) ? -1 : 1;
                }

                // Compare strings alphabetically, taking locale into account
                return v1.value.localeCompare(v2.value);
              };

              // La liste de est-elle invalide??
              $scope.exceptionInvalide = function() {
                return false;
              };

              $scope.datePrecedente = function(dateRef) {
                if (dateRef === null || dateRef === undefined) {
                  dateRef = moment().format('YYYY-MM-DD');
                }
                prepareAnalyse.getDateEvenementPrecedent($scope.idBudget, $scope.idRegle, dateRef)
                .then((value) => {
                  $scope.newRegleException.dateRegle = value;
                  $scope.$applyAsync();
                });
              };

              $scope.dateSuivante = function(dateRef) {
                if (dateRef === null || dateRef === undefined) {
                  dateRef = moment().format('YYYY-MM-DD');
                }
                prepareAnalyse.getDateEvenementSuivant($scope.idBudget, $scope.idRegle, dateRef)
                .then((value) => {
                  $scope.newRegleException.dateRegle = value;
                  $scope.$applyAsync();
                });
              };

              // bouton enregistrer
              $scope.submitForm = function(isValid, isPristine, isDirty, isUntouched) {

                // Switch aucunVersement
                if ($scope.switcherException.aucunVersement) {
                  $scope.newRegleException.aucunVersement = 1;
                  $scope.newRegleException.dateException = "";
                  $scope.newRegleException.montantException = null;
                  $scope.newRegleException.idSousPosteBudgetaireRegleImpactException = null;
                  $scope.newRegleException.concilie = 0;
                } else {
                  $scope.newRegleException.aucunVersement = 0;

                  if ($scope.exceptionForm.dateException.$viewValue !== undefined) {
                    $scope.newRegleException.dateException = $scope.exceptionForm.dateException.$viewValue;
                  } else {
                    $scope.newRegleException.dateException = "";
                  }

                  if (!$scope.switcherException.solde && $scope.exceptionForm.montantException.$viewValue !== undefined && $scope.exceptionForm.montantException.$viewValue !== null) {
                    $scope.newRegleException.montantException = parseFloat($scope.exceptionForm.montantException.$viewValue);
                  } else {
                    $scope.newRegleException.montantException = null;
                  }
                }

                // Switch payer le solde
                if ($scope.switcherException.solde) {
                  $scope.newRegleException.paieSolde = 1;
                } else {
                  $scope.newRegleException.paieSolde = 0;
                }

                $scope.newRegleException.dateRegle = $scope.exceptionForm.dateRegle.$viewValue;

                if ( !$scope.switcherException.aucunVersement          &&
                     !$scope.switcherException.solde                   &&
                     ($scope.newRegleException.montantException === null || $scope.newRegleException.montantException.toString() === "NaN" ) &&
                     ($scope.newRegleException.dateException    === "" || $scope.newRegleException.dateException === null) ) {

                   var message = $translate.instant("GLOBALE.MESSAGE.EXCEPTION");
                   toastr.error(message);
                } else {
                  // Y-a t'il des modifications???
                  if ( (!isDirty && !$scope.creation) &&
                       ( ( $scope.regleException.dateRegle      !== $scope.newRegleException.dateRegle )         ||
                         ( $scope.regleException.aucunVersement !== $scope.newRegleException.aucunVersement )    ||
                         ( $scope.regleException.paieSolde      !== $scope.newRegleException.paieSolde )         ||
                         ( $scope.regleException.dateException  !== $scope.newRegleException.dateException )     ||
                         ( parseFloat($scope.regleException.montantException).toString() !== parseFloat($scope.newRegleException.montantException).toString() )
                       ) ) {
                    isDirty = true;
                  }

                  if ($scope.creation || isDirty) {
                    let invalide = false;

                    if ($scope.exceptionForm.$valid && !invalide){

                      if (creation) {
                        let condition = ' WHERE t."idRegle" = ' + $scope.newRegleException.idRegle;

                        // On va chercher s'il y a une exception cachée (juste conciliée) qui existe pour cette date et on l'utilise.
                        let promise = cuServices.viRegleExceptionCache("getParIdRegleDateRegle", $scope.newRegleException.idRegle, $scope.newRegleException.dateRegle);
                        promise.then(function(value) {
                          let data = value.data;
                          let appel = "getParCondition";

                          if (data.length > 0) {
                            $scope.newRegleException.id = data[0].id;
                            $scope.newRegleException.concilie = data[0].concilie;
                            appel = "aucuneValidation";
                          }

                          let promiseValideUnicite = cuServices.valideUnicite(appel, 'regleException', condition, 'dateRegle', $scope.newRegleException.dateRegle, "GLOBALE.MESSAGE.UNICITE_EXCEPTION");
                          promiseValideUnicite.then(async function(valide) {

                            if (data.length > 0 || valide) {
                              // On enregistre une exception sur l'origine et sur la destination
                              $scope.$eval(($scope.newRegleException.id ? "update" : "create"),RegleExceptionResource)($scope.newRegleException).$promise
                                  .then((result) => {
                                     cuServices.message(($scope.newRegleException.id ? "update" : "create"), false, false);

                                     // On enregistre une exception sur la destination
                                     $scope.newRegleExceptionVers = { 'idRegle': $scope.idRegleVers,
                                                                      'dateRegle': $scope.newRegleException.dateRegle,
                                                                      'dateException': $scope.newRegleException.dateException,
                                                                      'montantException': $scope.newRegleException.montantException,
                                                                      'aucunVersement': $scope.newRegleException.aucunVersement,
                                                                      'concilie' : $scope.newRegleException.concilie,
                                                                      'paieSolde' : $scope.newRegleException.paieSolde
                                                                };

                                    RegleExceptionResource.removeParRegleDateRegle({"idRegle": $scope.idRegleVers,
                                                                                    "dateRegle": $scope.newRegleExceptionVers.dateRegle}).$promise
                                        .then(() => {
                                          RegleExceptionResource.create($scope.newRegleExceptionVers).$promise
                                              .then((result) => {
                                                $scope.newRegleException = [];
                                                $scope.newRegleExceptionVers = [];
                                                $uibModalInstance.close(true);
                                              })
                                              .catch(err => {
                                                cuServices.message("delete", err, true);
                                              });
                                        })
                                        .catch(err => {
                                           cuServices.message("delete", err, true);
                                        });
                                  })
                                  .catch(err => {
                                     cuServices.message(($scope.newRegleException.id ? "update" : "create"), err, true);
                                  });
                            }
                          }).catch(async function(valide) {
                            cuServices.message('valide', err, true);
                          });
                        })
                        .catch(err => {
                          cuServices.message('get', err, true);
                        });
                      } else {
                        // On enregistre une exception sur l'origine et sur la destination
                        RegleExceptionResource.update($scope.newRegleException).$promise
                            .then((result) => {
                               cuServices.message("update", false, false);

                               // On enregistre une exception sur la destination
                               $scope.newRegleExceptionVers = { 'idRegle': $scope.idRegleVers,
                                                                'dateRegle': $scope.newRegleException.dateRegle,
                                                                'dateException': $scope.newRegleException.dateException,
                                                                'montantException': $scope.newRegleException.montantException,
                                                                'aucunVersement': $scope.newRegleException.aucunVersement,
                                                                'concilie' : $scope.newRegleException.concilie,
                                                                'paieSolde' : $scope.newRegleException.paieSolde
                                                          };
                                RegleExceptionResource.removeParRegleDateRegle({"idRegle": $scope.idRegleVers,
                                                                                "dateRegle": $scope.newRegleExceptionVers.dateRegle}).$promise
                                    .then(() => {
                                      RegleExceptionResource.create($scope.newRegleExceptionVers).$promise
                                          .then((result) => {
                                            $scope.newRegleException = [];
                                            $scope.newRegleExceptionVers = [];
                                            $uibModalInstance.close(true);
                                          })
                                          .catch(err => {
                                            cuServices.message("delete", err, true);
                                          });
                                    })
                                    .catch(err => {
                                       cuServices.message("delete", err, true);
                                    });
                            })
                            .catch(err => {
                               cuServices.message('update', err, true);
                            });
                      }
                    }
                  } else {
                    // Aucune modification
                    var message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
                    toastr.info(message);
                  }
                };
              }

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
                      <div include-with-scope="app/pages/priver/transaction/widgets/creationExceptionTransfert.html"></div>\
                    </div> \
                  </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            modalTitle: title,
                            modalBody: "",
                            idBudget: idBudget,
                            idRegle: idRegle,
                            idRegleVers: idRegleVers,
                            regleException : regleException,
                            okButton: okButton,
                            deleteButton: deleteButton,
                            cancelButton: cancelButton,
                            signe: signe,
                            creation: creation,
                            typeTransfert: typeTransfert
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
          }
        }])
    })();
