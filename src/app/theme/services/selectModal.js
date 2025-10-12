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
     objetActuel     L'objet actuel de la LOV
     objetListe      Les données pour alimenter la LOV
     selectOption    Les options de la LOV
  */
    .service('selectModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, objetActuel, objetListe, selectOption) {

            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope, $uibModalInstance, settings) {
              $scope.objetChoisi = settings.objetActuel;
              $scope.objetListe = settings.objetListe;
              $scope.selectOption = settings.selectOption;

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.submitForm = function (isValid, isPristine, isDirty, isUntouched) {
                if (!$scope.choixInvalide() && isValid) {
                  $uibModalInstance.close($scope.objetChoisi.id);
                }
              };

              // cancel button clicked
              $scope.cancel = function () {
                  $uibModalInstance.dismiss('cancel');
              };

              $scope.localeSensitiveComparator = function(v1, v2) {
                // If we don't get strings, just compare by index
                if (v1.type !== 'string' || v2.type !== 'string') {
                  return (v1.index < v2.index) ? -1 : 1;
                }

                // Compare strings alphabetically, taking locale into account
                return v1.value.localeCompare(v2.value);
              };

              // La liste de sous-poste est-elle invalide??
              $scope.choixInvalide = function() {
                if (typeof($scope.objetChoisi.id) == "undefined"){
                  return true;
                }
                return false;
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
                      <h4 class="modal-title">{{modalTitle}}</h4> \
                    </div> \
                    <form name="selectForm" novalidate ng-submit="submitForm(selectForm.$valid, selectForm.$pristine, selectForm.$dirty, selectForm.$untouched)"> \
                      <div class="modal-body" style="margin: 0px 15px 0px 15px;"> \
                        <div class="form-group row clearfix has-feedback" \
                             ng-class="{\'has-error\': choixInvalide() && (selectForm.choix.$touched || selectForm.$submitted)}"> \
                          <select class="form-control" title="" name="choix" ng-model="objetChoisi" ng-options="' + selectOption + '" selectpicker required>\
                          </select>\
                          <span class="help-block error-block basic-block" ng-messages="selectForm.choix.$error" ng-if="choixInvalide() && (selectForm.choix.$touched || selectForm.$submitted)"> \
                            <p ng-message="required">{{ \'GLOBALE.AIDE.OBLIGATOIRE\' | translate }}</p> \
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
                          objetActuel: objetActuel,
                          objetListe: objetListe,
                          selectOption: selectOption,
                          okButton: okButton,
                          cancelButton: cancelButton
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        }
    }])
})();
