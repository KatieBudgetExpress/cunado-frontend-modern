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

  angular.module('i2sFinance.theme')
  /*
  Ouvrir la fenêtre modale de sélection d'image. Voici les paramètres d'appel:

     okButton        Texte du bouton Ok
     cancelButton    Texte du bouton Annuler
     title           Titre de la fenêtre (Tooltip)
     listeAConcilier Liste des montants à concilier
     signe           Devise
  */
    .service('conciliationMontantModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, listeAConcilier, signe) {

            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope,
                                              $uibModalInstance, 
                                              settings,
                                              $translate,
                                              triAvecAccent,
                                              editableOptions,
                                              editableThemes,
                                              dialogModal) {
              $scope.listeAConcilier = [];
              $scope.listeFinale = [];
              $scope.signe = settings.signe;
              $scope.count = 0;
              $scope.btnAppliquerDisable = false;

              settings.listeAConcilier.forEach((listeTmp) => {
                listeTmp.descTmp = (listeTmp.descTmp) ? listeTmp.descTmp : listeTmp.NAME;
                listeTmp.montantTmp = parseFloat(listeTmp.TRNAMT);
                listeTmp.montantHisto = parseFloat(listeTmp.TRNAMT);
                $scope.listeAConcilier.push(listeTmp);
              });
    
              // add settings to scope
              angular.extend($scope, settings);

              $scope.trierAccent = {
                nom: function (value) {
                    return triAvecAccent($translate.instant(value.nom));
                },
                description: function (value) {
                    return triAvecAccent(value.description);
               }
              };

              $scope.modifierLigne = function (rowform) {
                rowform.$show();
                $scope.btnAppliquerDisable = true;
                $scope.count = $scope.count + 1;
              };

              $scope.onhide = function (rowform) {
                $scope.count = $scope.count - 1;

                if ($scope.count == 0) {
                  $scope.btnAppliquerDisable = false;
                }
              };
      
              $scope.oncancel = function (rowform) {
              };

              $scope.onChangeForm = function (rowform) {
                rowform.$dirty = true;
              };

              $scope.onCancelForm = function (ligne, rowform) {
                rowform.$cancel();
              };

              $scope.valideNom = function (data) {
                if (typeof(data) === "undefined" || data === "") {
                    return $translate.instant("GLOBALE.AIDE.OBLIGATOIRE");
                }
              };

              $scope.valideMontant = function (ligne, data) {
                if (typeof(data) === "undefined" || data === "") {
                    return $translate.instant("GLOBALE.AIDE.OBLIGATOIRE");
                }
              };

              $scope.enregistreLigne = function (ligne, rowform) {

                let depassement = false;
                if (ligne.montantHisto < 0) {
                  if (rowform.$data.montant < ligne.montantHisto) {
                    depassement = true;
                  } else if (rowform.$data.montant > 0) {
                    depassement = true;
                  }  
                } else {
                  if (rowform.$data.montant > ligne.montantHisto) {
                    depassement = true;
                  } else if (rowform.$data.montant < 0) {
                    depassement = true;
                  }                    
                }

                if (depassement) {
                  dialogModal($translate.instant('ECRAN.CONCILIATION.WARNING_MONTANT'), 'warning',
                  $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                  $translate.instant('GLOBALE.SWITCH.OUI'), false,
                  $translate.instant('GLOBALE.SWITCH.NON'), false).result
                  .then((retour) => {
                      if (!retour) {
                        ligne.montantTmp = ligne.montantHisto;
                      }
                  });
                }        
              }

              // ok button clicked
              $scope.appliquer = function () {

                // Affecte la balance à concilier
                $scope.listeAConcilier.forEach((liste) => {
                  liste.TRNAMT =  (liste.montantHisto + (liste.montantTmp *-1)).toFixed(2) + $scope.signe;
                  $scope.listeFinale.push(liste);
                });
                $uibModalInstance.close($scope.listeFinale);
              };

              // cancel button clicked
              $scope.cancel = function () {
                if (cancelButton) {
                  $uibModalInstance.close(null);
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

              editableOptions.theme = 'bs3';
              editableThemes['bs3'].submitTpl = '<button ng-attr-type="submit" class="btn btn-primary btn-with-icon"><i class="ion-checkmark-round"></i></button>';
              editableThemes['bs3'].cancelTpl = '<button ng-attr-type="button" ng-click="$form.$cancel()" class="btn btn-default btn-with-icon"><i class="ion-close-round"></i></button>';
      

            };

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                size: 'lg', //Grandeur de la fenêtre ('md','lg','sm')
                template: '<div class="modal-content"> \
                    <div class="modal-header"> \
                      <button ng-attr-type="button" class="close" ng-if="cancelButton" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h4 class="modal-title">{{modalTitle}}</h4> \
                    </div> \
                    <div class="modal-body add-row-editable-table" style="margin: 0px 15px 0px 15px;"> \
                      <table style="width: 100%; table-layout: fixed;" width=100% st-table="affListeAConcilier" st-safe-src="listeAConcilier" class="table table-bordered table-hover table-condensed"> \
                      <thead> \
                          <tr class="sortable" style="font-weight: bold"> \
                            <th style="width:60%; text-align: left;" st-sort="trierAccent.description" st-sort-default="true">{{ \'ECRAN.CONCILIATION.DESCRIPTION\' | translate }}</th> \
                            <th style="text-align: right;">{{ \'ECRAN.CONCILIATION.MONTANT\' | translate }}</th> \
                            <th style="width:170px"></th> \
                          </tr> \
                      </thead> \
                      <tbody> \
                        <tr ng-repeat="ligne in affListeAConcilier" class="editable-row"> \
                          <td style="word-wrap:break-word; text-align: left;"> \
                            <span editable-text="ligne.descTmp" e-name="description" e-form="rowform" e-ng-change="onChangeForm(rowform, $data)" onbeforesave="valideNom($data)" e-required> \
                            {{ ligne.descTmp | translate }} \
                            </span> \
                          </td> \
                          <td style="word-wrap:break-word; text-align: right;"> \
                            <span editable-text="ligne.montantTmp" e-ng-attr-type="number" e-name="montant" e-form="rowform" e-ng-change="onChangeForm(rowform, $data)" onbeforesave="valideMontant(ligne, $data)" e-required> \
                            {{ligne.montantTmp | number:2}}{{signe}} \
                            </span> \
                          </td> \
                          <td> \
                          <form editable-form name="rowform" ng-show="rowform.$visible" class="form-buttons form-inline" onbeforesave="enregistreLigne(ligne, rowform)" onhide="onhide(rowform)" oncancel="oncancel(rowform)" shown="inserted == ligne"> \
                            <button ng-attr-type="submit" ng-disabled="rowform.$waiting" class="btn btn-primary editable-table-button btn-xs"> \
                              {{ \'GLOBALE.BOUTON.ENREGISTRER\' | translate }} \
                            </button> \
                            <button ng-attr-type="button" ng-disabled="rowform.$waiting" ng-click="onCancelForm(ligne,rowform)" class="btn btn-default editable-table-button btn-xs"> \
                              {{ \'GLOBALE.BOUTON.ANNULER\' | translate }} \
                            </button> \
                          </form> \
                          <div class="buttons" ng-show="!rowform.$visible" uib-dropdown> \
                            <button class="btn btn-primary editable-table-button btn-xs" ng-click="modifierLigne(rowform)">{{ \'GLOBALE.BOUTON.MODIFIER\' | translate }}</button> \
                          </div> \
                          </td> \
                        </tr> \
                    </tbody> \
                    </table> \
                   </div> \
                   <span style="padding-bottom:20px;"></span>\
                   <div class="modal-footer"> \
                     <button class="btn btn-primary" ng-disabled="btnAppliquerDisable" ng-attr-type="button" ng-click="appliquer()" ng-show="okButton">{{okButton}}</button> \
                     <button class="btn btn-default" ng-attr-type="button" ng-click="cancel()" ng-show="cancelButton">{{cancelButton}}</button> \
                   </div> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                          modalTitle: title,
                          modalBody: "",
                          listeAConcilier: listeAConcilier,
                          okButton: okButton,
                          cancelButton: cancelButton,
                          signe: signe
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        }
    }])
})();
