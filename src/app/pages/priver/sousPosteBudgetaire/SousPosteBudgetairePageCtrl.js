/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.sousPosteBudgetaire')
        .controller('SousPosteBudgetairePageCtrl', SousPosteBudgetairePageCtrl);

    /** @ngInject */
    function SousPosteBudgetairePageCtrl($scope,
                                         $rootScope,
                                         toastr,
                                         cuServices,
                                         $translate,
                                         editableOptions,
                                         editableThemes,
                                         triAvecAccent,
                                         imageSelectModal,
                                         selectModal,
                                         SousPosteBudgetaireResource,
                                         transactionDepRevModal,
                                         transactionCompteModal) {

        $scope.modeAssistant = false;

        $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
        $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
        $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
        $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

        $scope.trierAccent = {
            nom: function (value) {
                return triAvecAccent($translate.instant(value.nom));
            },
            description: function (value) {
                return triAvecAccent(value.description);
            }
        };

        $scope.getSousPosteBudgetaire = function () {
            $scope.categories = $rootScope.arrayCategorie.sort(function(a, b){return a.tri - b.tri});

            let promisePoste = cuServices.viPosteBudgetaire("getAll",null);
            promisePoste.then(function(value) {
              let data = value.data;
              if (data.length > 0) {
                $scope.posteBudgetaires = data;

                SousPosteBudgetaireResource.getAll().$promise
                    .then((result) => {
                      if (result.sousPosteBudgetaire.length > 0) {
                        for (var i=0,  tot=result.sousPosteBudgetaire.length; i < tot; i++) {
                          result.sousPosteBudgetaire[i].nomFiltered = $translate.instant(result.sousPosteBudgetaire[i].nom);
                        }
                        $scope.sousPosteBudgetaires = result.sousPosteBudgetaire;
                      }
                    }).catch(err => err);
              }
            });
        };

        $scope.ajoutSousPoste = function (categorie, posteBudgetaire) {

            const idSousPosteBudgetaire = ($scope.sousPosteBudgetaires.length + 1) * -1;
            $scope.inserted = {
                id: idSousPosteBudgetaire,
                nom: '',
                description: '',
                image: categorie.image,
                typeImage: categorie.typeImage,
                systeme: 0,
                idPosteBudgetaire: posteBudgetaire.id,
                comptePrincipal: 0
            };
            $scope.sousPosteBudgetaires.push($scope.inserted);
        };

        $scope.ajoutTransaction = function (categorie, sousPosteBudgetaire, rowform) {
            let sousPoste = null;

            if (typeof(sousPosteBudgetaire) !== "undefined") {
                sousPoste = sousPosteBudgetaire;
            }

            if (categorie.code === 'REV' || categorie.code === 'DEP') {
                transactionDepRevModal(categorie, sousPoste, null, $scope.ctrl.budgetCourant, 1, 1, $scope.ctrl.signe, false).result.then(function (retour) {

                });
            } else {
                transactionCompteModal(categorie, sousPoste, null, $scope.ctrl.budgetCourant, 1, $scope.ctrl.signe, $scope.ctrl.devise, false).result.then(function (retour) {

                });
            }
        };

        $scope.valideNom = function (data) {
            if (typeof(data) === "undefined" || data === "") {
                return $translate.instant("GLOBALE.AIDE.OBLIGATOIRE");
            }
        };

        $scope.modifierSousPoste = function (rowform) {
            rowform.$show();
        };

        $scope.modifierImage = function (sousPosteBudgetaire, rowform) {
            const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERIMAGE");
            const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
            const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

            imageSelectModal(boutonOk, boutonAnnuler, titre, sousPosteBudgetaire.image, sousPosteBudgetaire.typeImage).result.then(function (objetImage) {

                const imgEdit = document.getElementById("imgPosteEdit-" + sousPosteBudgetaire.id);
                if (typeof(imgEdit) !== "undefined" && imgEdit !== null) {
                    imgEdit.src = objetImage.source;
                }
                rowform.$data.srcImage = objetImage.source;
                rowform.$data.image = objetImage.image;
                rowform.$data.typeImage = objetImage.typeImage;
                sousPosteBudgetaire.image = rowform.$data.image;
                sousPosteBudgetaire.typeImage = rowform.$data.typeImage;
                rowform.$dirty = true;
            });
        };

        $scope.supprimeSousPoste = function (index, sousPosteBudgetaire, rowform) {
          SousPosteBudgetaireResource.remove({"id": sousPosteBudgetaire.id}).$promise
              .then(async () => {
                cuServices.message('delete', false, false);
                $scope.sousPosteBudgetaires.splice($scope.sousPosteBudgetaires.indexOf(sousPosteBudgetaire), 1);
              })
              .catch(err => {
                cuServices.message('delete', err, true);
              });
        };

        $scope.enregistreSousPoste = function (sousPosteBudgetaire, rowform) {
          return new Promise((resolve, reject) => {
            if (!rowform.$invalid) {
                if (rowform.$dirty) {
                    if (rowform.$data.srcImage) {
                        const imgAff = document.getElementById("imgPosteAff-" + sousPosteBudgetaire.id);
                        if (typeof(imgAff) !== "undefined" && imgAff !== null) {
                            imgAff.src = rowform.$data.srcImage;
                        }
                    }

                    let condition = "";
                    if (sousPosteBudgetaire.id < 0) {
                        sousPosteBudgetaire.id = undefined;
                    } else {
                        // On créer la condition pour l'unicité
                        condition = ' WHERE t.id <> ' + sousPosteBudgetaire.id;
                    }

                    let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'sousPosteBudgetaire', condition, 'nom', rowform.$data.nom, "GLOBALE.MESSAGE.UNICITE_SOUS_POSTE");
                    promiseValideUnicite.then(async function(valide) {

                      if (valide) {
                        sousPosteBudgetaire.nom = rowform.$data.nom;

                        if (rowform.$data.description !== null) {
                            sousPosteBudgetaire.description = rowform.$data.description;
                        } else {
                            sousPosteBudgetaire.description = "";
                        }

                        $scope.$eval((sousPosteBudgetaire.id ? "update" : "create"),SousPosteBudgetaireResource)(sousPosteBudgetaire).$promise
                            .then((result) => {
                               cuServices.message((sousPosteBudgetaire.id ? "update" : "create"), false, false);
                               sousPosteBudgetaire.id = sousPosteBudgetaire.id ? sousPosteBudgetaire.id : result.sousPosteBudgetaire.id;
                               $scope.inserted = {};
                               rowform.$dirty = false;
                               resolve(true);
                            })
                            .catch(err => {
                               cuServices.message((sousPosteBudgetaire.id ? "update" : "create"), err, true);
                               resolve(false);
                            });

                      } else {
                        if (typeof(sousPosteBudgetaire.id) === "undefined" || sousPosteBudgetaire.id < 0) {
                            sousPosteBudgetaire.id = -1;
                        }
                        resolve(false);
                      }
                    });
                } else {
                    // Aucune modification
                    const message = $translate.instant("GLOBALE.MESSAGE.AUCUNE_MODIFICATION");
                    toastr.info(message);
                    resolve(true);
                }
            } else {
              resolve(true);
            }

          });
        };

        $scope.modifierPoste = function (sousPosteBudgetaire, posteBudgetaire, rowform) {
            const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERPOSTE");
            const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
            const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
            const selectOption = "item as item.nom | translate group by item.nomCategorie | translate for item in objetListe | orderBy:'nom | translate':false:localeSensitiveComparator | orderBy:'tri'";

            selectModal(boutonOk, boutonAnnuler, titre, posteBudgetaire, $scope.posteBudgetaires, selectOption).result.then(async function (idPosteBudgetaire) {
                if (idPosteBudgetaire) {
                    rowform.$dirty = true;
                    sousPosteBudgetaire.idPosteBudgetaire = idPosteBudgetaire;
                    await $scope.enregistreSousPoste(sousPosteBudgetaire, rowform);
                }
            });
        };

        $scope.onhide = function (rowform) {
        };

        $scope.oncancel = function (rowform) {
        };

        $scope.onChangeForm = function (rowform) {
            rowform.$dirty = true;
        };

        $scope.onCancelForm = function (sousPosteBudgetaire, rowform) {
            // Si c'est une nouvelle ligne, on la supprime
            if (sousPosteBudgetaire.id < 0) {
                $scope.sousPosteBudgetaires.splice($scope.sousPosteBudgetaires.indexOf(sousPosteBudgetaire), 1);
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
