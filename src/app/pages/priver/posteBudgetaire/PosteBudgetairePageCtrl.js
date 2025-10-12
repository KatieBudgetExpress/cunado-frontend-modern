/**
 * @author S.Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.posteBudgetaire')
    .controller('PosteBudgetairePageCtrl', PosteBudgetairePageCtrl);

  /** @ngInject */
  function PosteBudgetairePageCtrl($scope,
                                   $rootScope,
                                   fileReader,
                                   $filter,
                                   $uibModal,
                                   $location,
                                   toastr,
                                   toastrConfig,
                                   cuServices,
                                   $translate,
                                   editableOptions,
                                   editableThemes,
                                   triAvecAccent,
                                   imageSelectModal,
                                   PosteBudgetaireResource,
                                   transactionDepRevModal,
                                   transactionCompteModal) {

    $scope.modeAssistant = false;

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
    $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    $scope.trierAccent = {
      nom: function (value) { return triAvecAccent($translate.instant(value.nom)) },
      description: function (value) { return triAvecAccent(value.description) }
    };

    $scope.getPosteBudgetaire = function (){
      $scope.categories = $rootScope.arrayCategorie.sort(function(a, b){return a.tri - b.tri});

      if ($scope.categories.length === 0) {
        $scope.categories = { 'code': '',
                              'nom': '',
                              'nomFiltered': '',
                              'tri': '',
                              'image': '',
                              'typeImage': ''
                            };
      } else {
        PosteBudgetaireResource.getAll().$promise
            .then((result) => {
              if (result.posteBudgetaire.length === 0) {
                $scope.posteBudgetaires = { 'systeme': '',
                                            'nom': '',
                                            'nomFiltered': '',
                                            'description': '',
                                            'idCategorie': '',
                                            'image': '',
                                            'typeImage': ''
                                          };
              } else {
                for (var i=0,  tot=result.posteBudgetaire.length; i < tot; i++) {
                  result.posteBudgetaire[i].nomFiltered = $translate.instant(result.posteBudgetaire[i].nom);
                }
                $scope.posteBudgetaires = result.posteBudgetaire;
              }
            }).catch(err => err);

      }
    };

    $scope.ajoutPoste = function(categorie) {

      var idPosteBudgetaire = ($scope.posteBudgetaires.length + 1) * -1;
      $scope.inserted = {
        id: idPosteBudgetaire,
        nom: '',
        description: '',
        image: categorie.image,
        typeImage: categorie.typeImage,
        systeme: 0,
        idCategorie: categorie.id
      };
      $scope.posteBudgetaires.push($scope.inserted);
    };

    $scope.ajoutTransaction = function(categorie) {

      if (categorie.code === 'REV' || categorie.code === 'DEP'){
        transactionDepRevModal(categorie, null, null, $scope.ctrl.budgetCourant,1,1, $scope.ctrl.signe, false).result.then(function(retour) {

        });
      } else {
        transactionCompteModal(categorie, null, null, $scope.ctrl.budgetCourant,1, $scope.ctrl.signe, $scope.ctrl.devise, false).result.then(function(retour) {

        });
      }
    };

    $scope.valideNom = function(data) {
      if (typeof(data) == "undefined" || data == "") {
        return $translate.instant("GLOBALE.AIDE.OBLIGATOIRE");
      }
    };

    $scope.modifierPoste = function(rowform) {
      rowform.$show();
    };

    $scope.modifierImage = function(posteBudgetaire,rowform) {
      var titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERIMAGE");
      var boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
      var boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

      imageSelectModal(boutonOk, boutonAnnuler, titre, posteBudgetaire.image, posteBudgetaire.typeImage).result.then(function(objetImage) {

        var imgEdit = document.getElementById("imgPosteEdit-" + posteBudgetaire.id);
        if (typeof(imgEdit) != "undefined" && imgEdit != null && objetImage.source != ""){
          imgEdit.src = objetImage.source;
        }
        rowform.$data.srcImage    = objetImage.source;
        rowform.$data.image       = objetImage.image;
        rowform.$data.typeImage   = objetImage.typeImage;
        posteBudgetaire.image     = rowform.$data.image;
        posteBudgetaire.typeImage = rowform.$data.typeImage;
        rowform.$dirty = true;
      });
    };

    $scope.supprimePoste = function(index, posteBudgetaire, rowform) {
      PosteBudgetaireResource.remove({"id": posteBudgetaire.id}).$promise
          .then(async () => {
            cuServices.message('delete', false, false);
            $scope.posteBudgetaires.splice($scope.posteBudgetaires.indexOf(posteBudgetaire), 1);
          })
          .catch(err => {
            cuServices.message('delete', err, true);
          });
    };

    $scope.enregistrePoste = function(posteBudgetaire, rowform) {
      return new Promise((resolve, reject) => {
        if (!rowform.$invalid) {
          if (rowform.$dirty) {
            if (rowform.$data.srcImage){
              var imgAff  = document.getElementById("imgPosteAff-"  + posteBudgetaire.id);
              if (typeof(imgAff) != "undefined" && imgAff != null){
                imgAff.src = rowform.$data.srcImage;
              }
            }

            var condition = "";
            if (posteBudgetaire.id < 0) {
              posteBudgetaire.id = undefined;
            } else {
              // On créer la condition pour l'unicité
              condition = ' WHERE t.id <> ' + posteBudgetaire.id;
            }

            let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'posteBudgetaire', condition, 'nom', rowform.$data.nom, "GLOBALE.MESSAGE.UNICITE_POSTE");
            promiseValideUnicite.then(async function(valide) {

              if (valide) {
                posteBudgetaire.nom = rowform.$data.nom;

                if (rowform.$data.description != null){
                  posteBudgetaire.description = rowform.$data.description;
                } else {
                  posteBudgetaire.description = "";
                }

                $scope.$eval((posteBudgetaire.id ? "update" : "create"),PosteBudgetaireResource)(posteBudgetaire).$promise
                    .then((result) => {
                       cuServices.message((posteBudgetaire.id ? "update" : "create"), false, false);
                       posteBudgetaire.id = posteBudgetaire.id ? posteBudgetaire.id : result.posteBudgetaire.id;
                       $scope.inserted = {};
                       rowform.$dirty = false;
                       resolve(true);
                    })
                    .catch(err => {
                       cuServices.message((posteBudgetaire.id ? "update" : "create"), err, true);
                       resolve(false);
                    });

              } else {
                if (typeof(posteBudgetaire.id) == "undefined" || posteBudgetaire.id < 0) {
                  posteBudgetaire.id = -1;
                }
                resolve(false);
              }
            });
          } else {
            // Aucune modification
            var message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
            toastr.info(message);
            resolve(true);
          }
        } else {
          resolve(true);
        }
      });
    };

    $scope.onhide = function(rowform) {
    };

    $scope.oncancel = function(rowform) {
    };

    $scope.onChangeForm = function(rowform) {
      rowform.$dirty = true;
    };

    $scope.onCancelForm = function(posteBudgetaire,rowform) {
      // Si c'est une nouvelle ligne, on la supprime
      if (posteBudgetaire.id < 0){
        $scope.posteBudgetaires.splice($scope.posteBudgetaires.indexOf(posteBudgetaire), 1);
        $scope.inserted = {};
      } else {
        rowform.$cancel();
      }
    };

    editableOptions.theme = 'bs3';
    editableThemes['bs3'].submitTpl = '<button ng-attr-type="submit" class="btn btn-primary btn-with-icon"><i class="ion-checkmark-round"></i></button>';
    editableThemes['bs3'].cancelTpl = '<button ng-attr-type="button" ng-click="$form.$cancel()" class="btn btn-default btn-with-icon"><i class="ion-close-round"></i></button>';
  }
})();
