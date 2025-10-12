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
        categorie       Catégorie de création
     */
    .service('creationSousPosteModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, categorie, posteBudgetaires) {
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
                                              imageSelectModal,
                                              SousPosteBudgetaireResource) {

              $scope.categorie = settings.categorie;
              $scope.posteBudgetaires = settings.posteBudgetaires;
              $scope.sousPosteBudgetaire = { 'systeme': 0,
                                              'idPosteBudgetaire': null,
                                              'nom': '',
                                              'description': '',
                                              'image': categorie.image,
                                              'typeImage': categorie.typeImage,
                                              'comptePrincipal' : 0
                                            };
              $scope.posteBudgetaire = { 'systeme': '',
                                          'nom': '',
                                          'description': '',
                                          'idCategorie': null,
                                          'image': '',
                                          'typeImage': ''
                                        };

              // add settings to scope
              angular.extend($scope, settings);

              // ok button clicked
              $scope.ok = function () {
                $uibModalInstance.close($scope.sousPosteBudgetaire);
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

              // La liste de poste est-elle invalide??
              $scope.posteBudgetaireInvalide = function() {
                if (typeof($scope.sousPosteForm.posteBudgetaire.$viewValue.id) === "undefined" || $scope.sousPosteForm.posteBudgetaire.$viewValue.id===null){
                  return true;
                }
                return false;
              };

              // Modifier l'image
              $scope.modifierImage = function(posteBudgetaire) {
                var titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERIMAGE");
                var boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                var boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                imageSelectModal(boutonOk, boutonAnnuler, titre, posteBudgetaire.image, posteBudgetaire.typeImage).result.then(function(objetImage) {

                  var imgEdit = document.getElementById("imgSousPosteCreation");
                  if (typeof(imgEdit) != "undefined" && imgEdit != null && objetImage.source != ""){
                    imgEdit.src = objetImage.source;
                  }
                  posteBudgetaire.image     = objetImage.image;
                  posteBudgetaire.typeImage = objetImage.typeImage;
                });
              };

              // bouton enregistrer
              $scope.submitForm = function(isValid, isPristine, isDirty, isUntouched) {

                if (!$scope.posteBudgetaireInvalide() && $scope.sousPosteForm.$valid){

                  $scope.sousPosteBudgetaire.idPosteBudgetaire = $scope.posteBudgetaire.id;

                  // On créer la condition pour l'unicité
                  var condition = "";
                  if (typeof($scope.sousPosteBudgetaire.id) != "undefined" && $scope.sousPosteBudgetaire.id != null){
                    condition = ' WHERE t.id <> ' + $scope.sousPosteBudgetaire.id;
                  }

                  let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'sousPosteBudgetaire', condition, 'nom', $scope.sousPosteBudgetaire.nom, "GLOBALE.MESSAGE.UNICITE_SOUS_POSTE");
                  promiseValideUnicite.then(async function(valide) {

                    if (valide) {
                      // On enregistre
                      $scope.$eval(($scope.sousPosteBudgetaire.id ? "update" : "create"),SousPosteBudgetaireResource)($scope.sousPosteBudgetaire).$promise
                        .then((result) => {
                          cuServices.message(($scope.sousPosteBudgetaire.id ? "update" : "create"), false, false);
                          $scope.sousPosteBudgetaire.id = $scope.sousPosteBudgetaire.id || result.sousPosteBudgetaire.id;
                          $uibModalInstance.close($scope.sousPosteBudgetaire);
                        })
                        .catch((err) => {
                          cuServices.message(($scope.sousPosteBudgetaire.id ? "update" : "create"), err, true);
                          $uibModalInstance.close($scope.sousPosteBudgetaire);
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
                      <form name="sousPosteForm" novalidate ng-submit="submitForm(sousPosteForm.$valid, sousPosteForm.$pristine, sousPosteForm.$dirty, sousPosteForm.$untouched)"> \
                        <div class="modal-body" style="padding: 0px 20px 30px 20px;"> \
                          <div include-with-scope="app/pages/priver/transaction/widgets/creationSousPoste.html"></div>\
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
                            categorie: categorie,
                            posteBudgetaires : posteBudgetaires,
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
