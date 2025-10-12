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
     Ouvrir la fenêtre modale de sélection d'image. Voici les paramètres d'appel:

        okButton                    Texte du bouton Ok
        cancelButton                Texte du bouton Annuler
        title                       Titre de la fenêtre (Tooltip)
        idRegleException            Exception
        idRegleExceptionVentilation Ventilation
        signe                       Devise
     */
    .service('exceptionVentilationModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, idRegleException, idRegleExceptionVentilation, signe) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope,
                                              $filter,
                                              $uibModalInstance,
                                              settings,
                                              cuServices,
                                              $translate,
                                              RegleExceptionVentilationResource) {

              $scope.idRegleException = settings.idRegleException;
              $scope.idRegleExceptionVentilation = settings.idRegleExceptionVentilation;
              $scope.signe = settings.signe;

              $scope.regleExceptionVentilation = {};

              if (typeof($scope.idRegleExceptionVentilation) != "undefined" && $scope.idRegleExceptionVentilation != null) {

                // Récupère les ventilations
                let promiseVentilation = cuServices.regleExceptionVentilation("getId",$scope.idRegleExceptionVentilation);
                promiseVentilation.then(function(data) {
                    $scope.regleExceptionVentilation = data;
                    $scope.$applyAsync();
                });
              } else {
                $scope.regleExceptionVentilation = { idRegleException: $scope.idRegleException,
                                                     description: '',
                                                     montant: null };
              }

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.ok = function () {
                $scope;
                $uibModalInstance.close($scope.regleExceptionVentilation);
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

              // bouton enregistrer
              $scope.submitForm = function(isValid, isPristine, isDirty, isUntouched) {

                if ($scope.ventilationForm.$valid){

                  // On enregistre
                  $scope.$eval(($scope.regleExceptionVentilation.id ? "update" : "create"),RegleExceptionVentilationResource)($scope.regleExceptionVentilation).$promise
                    .then((result) => {
                      cuServices.message(($scope.regleExceptionVentilation.id ? "update" : "create"), false, false);
                      $scope.regleExceptionVentilation.id = result.regleExceptionVentilation.id;
                      $uibModalInstance.close($scope.regleExceptionVentilation);
                    })
                    .catch((err) => {
                      cuServices.message(($scope.regleExceptionVentilation.id ? "update" : "create"), err, true);
                      $uibModalInstance.close($scope.regleExceptionVentilation);
                    });
                }
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
                      <form name="ventilationForm" novalidate ng-submit="submitForm(ventilationForm.$valid, ventilationForm.$pristine, ventilationForm.$dirty, ventilationForm.$untouched)"> \
                        <div class="modal-body" style="padding: 0px 20px 10px 20px;"> \
                          <div include-with-scope="app/pages/priver/transaction/widgets/exceptionVentilation.html"></div>\
                        </div> \
                        <div class="modal-footer"> \
                          <button class="btn btn-primary" ng-attr-type="submit" ng-show="okButton">{{okButton}}</button> \
                          <button class="btn btn-default" ng-attr-type="button" ng-click="cancel()" ng-show="cancelButton">{{cancelButton}}</button> \
                        </div> \
                      </form> \
                    </div> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            modalTitle: title,
                            modalBody: "",
                            idRegleException: idRegleException,
                            idRegleExceptionVentilation: idRegleExceptionVentilation,
                            signe: signe,
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
