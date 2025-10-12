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
        message         Le message à afficher à l'usager
        typeMessage     warning, danger, info, success
        titre           (optional) titre de la fenêtre
        btnAction1      texte du bouton d'action #1
        btnAction2      texte du bouton d'action #2
        btnCancel       texte pour le bouton annuler
        dismissAction   Faire un "dismiss" au lieu d'un close(x)

     */
    .service('dialogModal', ['$uibModal', function($uibModal) {
        return function (message, typeMessage, titre, btnAction1, btnAction2, btnCancel, dismissAction) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            btnAction1 = btnAction1===false ? false : (btnAction1 || 'Confirm');
            btnAction2 = btnAction2===false ? false : (btnAction2 || 'Confirm');
            btnCancel = btnCancel===false ? false : (btnCancel || 'Cancel');

            var classIcon = "";
            if (typeMessage == 'warning') {
              classIcon = "ion-android-warning modal-icon";
            } else if (typeMessage == 'danger') {
              classIcon = "ion-flame modal-icon";
            } else if (typeMessage == 'info') {
              classIcon = "ion-information-circled modal-icon";
            } else { // success
              classIcon = "ion-checkmark modal-icon";
            }
            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope, $uibModalInstance, settings) {
                // add settings to scope
                angular.extend($scope, settings);
                // ok button clicked
                $scope.action1 = function () {
                    $uibModalInstance.close(1);
                };
                $scope.action2 = function () {
                    $uibModalInstance.close(2);
                };
                // cancel button clicked
                $scope.cancel = function () {
                  if (dismissAction) {
                    $uibModalInstance.dismiss('cancel');
                  } else {
                    $uibModalInstance.close(0);
                  }
                };
            };

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                template: '<div class="modal-content"> \
                    <div class="{{classModalHeader}}"> \
                      <i class="{{classIcon}}"></i><span>{{modalTitre}}</span> \
                    </div> \
                    <div class="modal-body"> \
                      <div data-ng-bind-html="modalBody | htmlSafe"></div> \
                    </div> \
                    <div class="modal-footer"> \
                        <button class="{{classBoutonOk}}" ng-click="action1()" ng-show="btnAction1">{{btnAction1}}</button> \
                        <button class="{{classBoutonOk}}" ng-click="action2()" ng-show="btnAction2">{{btnAction2}}</button> \
                        <button class="btn btn-default" ng-click="cancel()" ng-show="btnCancel">{{btnCancel}}</button> \
                    </div> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            modalTitre: titre,
                            classModalHeader: "modal-header bg-" + typeMessage,
                            classBoutonOk: "btn btn-" + typeMessage,
                            classIcon: classIcon,
                            modalBody: message,
                            btnAction1: btnAction1,
                            btnAction2: btnAction2,
                            btnCancel: btnCancel
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        }
    }])
})();
