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
     isMotPasse      Type mot de passe
     longueurMin     Longueur minimum du champ (0=Non valider >0=On valide la longueur)
  */
    .service('inputTextModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, isMotPasse, longueurMin) {

            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope, $uibModalInstance, settings) {
              $scope.champTexte = null;
              $scope.typeChamp = "text";

              if (settings.isMotPasse) {
                $scope.typeChamp = "password";
              }

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.submitForm = function (isValid, isPristine, isDirty, isUntouched) {
                if (isValid) {
                  $uibModalInstance.close($scope.champTexte);
                }
              };

              // cancel button clicked
              $scope.cancel = function () {
                if (cancelButton) {
                  $uibModalInstance.dismiss('cancel');
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

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                size: 'sm', //Grandeur de la fenêtre ('md','lg','sm')
                template: '<div class="modal-content"> \
                    <div class="modal-header"> \
                      <button ng-attr-type="button" class="close" ng-if="cancelButton" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h4 class="modal-title">{{modalTitle}}</h4> \
                    </div> \
                    <form name="inputTextForm" novalidate ng-submit="submitForm(inputTextForm.$valid, inputTextForm.$pristine, inputTextForm.$dirty, inputTextForm.$untouched)"> \
                      <div class="modal-body" style="margin: 0px 15px 0px 15px;"> \
                        <div class="form-group row clearfix has-feedback" \
                             ng-class="{\'has-error\': inputTextForm.inputText && (inputTextForm.inputText.$touched || inputTextForm.$submitted)}"> \
                          <input ng-attr-type="{{typeChamp}}" autoFocus="true" class="form-control" ng-minlength="{{longueurMin}}" name="inputText" ng-model="champTexte" required>\
                          <span class="help-block error-block basic-block" ng-messages="inputTextForm.inputText.$error" ng-if="inputTextForm.inputText.$invalid  && (inputTextForm.inputText.$touched || inputTextForm.$submitted)"> \
                            <p ng-message="required">{{ \'GLOBALE.AIDE.OBLIGATOIRE\' | translate }}</p> \
                            <p ng-message="minlength" ng-if="longueurMin>0">{{ \'GLOBALE.AIDE.LONGUEURMOTPASSE\' | translate }}{{longueurMin}}{{ \'GLOBALE.AIDE.CARACTERE\' | translate }}</p> \
                          </span> \
                        </div> \
                        <span style="padding-bottom:20px;"></span>\
                      </div> \
                      <div class="modal-footer"> \
                        <button class="btn btn-primary" ng-attr-type="submit" ng-show="okButton">{{okButton}}</button> \
                        <button class="btn btn-default" ng-attr-type="button" ng-click="cancel()" ng-show="cancelButton">{{cancelButton}}</button> \
                      </div> \
                    </form> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                          modalTitle: title,
                          modalBody: "",
                          isMotPasse: isMotPasse,
                          okButton: okButton,
                          cancelButton: cancelButton,
                          longueurMin: longueurMin
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        }
    }])
})();
