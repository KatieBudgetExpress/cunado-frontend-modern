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

        okButton        Texte du bouton Ok
        cancelButton    Texte du bouton Annuler
        title           Titre de la fenêtre (Tooltip)
        banqueCompte    Compte de banque à modifier
        compteOptions   Listes des comptes
        compteSelected  Compte sélectionné
     */
    .service('banqueCompteModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, banqueCompte, compteOptions) {
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
                                              BanqueCompteResource) {

              $scope.banqueCompte = settings.banqueCompte;
              $scope.compteOptions = settings.compteOptions;

              // add settings to scope
              angular.extend($scope, settings);

              // 
              $scope.compteSelected = $scope.compteOptions.find(ele => ele.id === ($scope.banqueCompte.idSousPosteBudgetaireRegle === null ? -1 : $scope.banqueCompte.idSousPosteBudgetaireRegle));

              // ok button clicked
              $scope.ok = function () {
                $uibModalInstance.close($scope.banqueCompte);
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

                if ($scope.banqueCompteForm.$valid){               

                  // On créer la condition pour l'unicité
                  var condition = ' WHERE t.id <> ' + $scope.banqueCompte.id +
                                  ' AND t."idSousPosteBudgetaireRegle" is not null' +
                                  ' AND t."idSousPosteBudgetaireRegle" <> -1';

                  let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'banqueCompte', condition, 'idSousPosteBudgetaireRegle', ((typeof $scope.compteSelected.id === 'undefined') ? -1 : $scope.compteSelected.id), "GLOBALE.MESSAGE.UNICITE_BANQUECOMPTE");
                  promiseValideUnicite.then(async function(valide) {

                    if (valide) {
                      $scope.banqueCompte.idSousPosteBudgetaireRegle = $scope.compteSelected.id;

                      // On enregistre
                      BanqueCompteResource.update(banqueCompte).$promise
                        .then((result) => {
                          cuServices.message("update", false, false);
                          $uibModalInstance.close($scope.banqueCompte);
                        })
                        .catch((err) => {
                          cuServices.message("update", err, true);
                          $uibModalInstance.close($scope.banqueCompte);
                        });
                    }
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
                      <form name="banqueCompteForm" novalidate ng-submit="submitForm(banqueCompteForm.$valid, banqueCompteForm.$pristine, sbanqueCompteForm.$dirty, sousPosteForm.$untouched)"> \
                        <div class="modal-body" style="padding: 0px 20px 30px 20px;"> \
                          <div include-with-scope="app/pages/priver/transaction/widgets/banqueCompte.html"></div>\
                          <span style="padding-bottom:20px;"></span>\
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
                            banqueCompte: banqueCompte,
                            compteOptions: compteOptions,
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
