(function () {
    'use strict';

    angular.module('i2sFinance.priver.assistant')
        .controller('AssistantCreditCtrl', AssistantCreditCtrl);

    /** @ngInject */
    async function AssistantCreditCtrl($scope,
                                       $rootScope,
                                       uuid,
                                       $translate,
                                       toastr,
                                       toastrConfig,
                                       transactionCompteModal,
                                       cuServices,
                                       $timeout,
                                       SousPosteBudgetaireResource,
                                       dialogModal) {

        $scope.appliquerSelection = appliquerSelection;
        $scope.toggleData = toggleData;
        $scope.modifierDataImage = modifierDataImage;
        $scope.ajouterDataListe = ajouterDataListe;
        $scope.ajouterData = ajouterData;
        $scope.majData = majData;
        $scope.deleteData = deleteData;
        $scope.liste = {
            temporaire: [],
            selected: []
        };
        $scope.idBudget = -1;
        $scope.showSousPosteBudgetaire = true;

        $scope.remplirData = function () {
          return new Promise((resolve, reject) => {
            let promisePoste = cuServices.viPosteBudgetaire("getParCateg", 6);
            promisePoste.then(function(value) {
              let data = value.data;
              if (data.length > 0) {
                let posteBudgetaire = data;
                SousPosteBudgetaireResource.getAll().$promise
                    .then((result) => {
                      if (result.sousPosteBudgetaire.length > 0) {
                        $scope.categoriesPosteBudgetaire = JSON.parse(JSON.stringify(posteBudgetaire)); //deep copy
                        $scope.posteBudgetaires = initTableCredits(posteBudgetaire, result.sousPosteBudgetaire);
                      }
                      resolve(true);
                    }).catch((err) => {
                      cuServices.message('SousPosteBudgetaireResource', err, true);
                      resolve(false);
                    });
              }
            }).catch((err) => {
              cuServices.message('viPosteBudgetaire', err, true);
              resolve(false);
            });
          });
        };
        await $scope.remplirData();
        $scope.$applyAsync();

        function appliquerSelection() {
            const categorieTmp = $scope.liste.selected || [];
            $scope.liste.temporaire.forEach((eleSousPoste) => {
                if (!categorieTmp.find(elePoste => elePoste.id === eleSousPoste.idPosteBudgetaire)) {
                    const catTmp = $scope.categoriesPosteBudgetaire.find(ele => ele.id === eleSousPoste.idPosteBudgetaire);
                    catTmp.liste = [];
                    categorieTmp.push(catTmp);
                }
                const data = categorieTmp.find(ele => ele.id === eleSousPoste.idPosteBudgetaire);

                eleSousPoste.uuid = uuid.v4();

                //Ceci peut changer, j'ajoute une propriété montant afin d'afficher ce qui sera sélectionné par la modale (reste à le maintenir à jour)
                eleSousPoste.montant = null;
                eleSousPoste.idRegle = null;
                eleSousPoste.idSousPosteBudgetaireRegle = null;

                data.liste.push(JSON.parse(JSON.stringify(eleSousPoste))); //on enleve toute référence à l'objet
            });
            $scope.liste.selected = categorieTmp;
            $scope.liste.temporaire = [];
        }

        function initTableCredits(posteBudgetaire, sousPosteBudgetaire) {
            return posteBudgetaire.map((elePos) => {
                return {
                    nom: elePos.nom,
                    id: elePos.id,
                    image: elePos.image,
                    tri: elePos.tri,
                    liste: sousPosteBudgetaire.filter((eleSouPos) => eleSouPos.idPosteBudgetaire === elePos.id)
                };
            });
        }

        function toggleData(data) {
            const dataIndex = $scope.liste.temporaire.findIndex(ele => ele.id === data.id);
            if (dataIndex !== -1) {
                $scope.liste.temporaire.splice(dataIndex, 1);
            } else {
                $scope.liste.temporaire.push(data);
            }
        }

        function ajouterData() {
          const categorie = $rootScope.arrayCategorie.find(categorie => categorie.id === 6);
          transactionCompteModal(categorie, null, null, $scope.idBudget, 1, $scope.ctrl.signe, $scope.ctrl.devise, true).result.then(function (objetRetour) {
              if (objetRetour && objetRetour.regle) {
                  if (objetRetour.regle) {
                      ajouterDataListe(objetRetour.regle);
                      modifierDataImage(objetRetour.image, objetRetour.typeImage, objetRetour.sousPoste.id);
                  }
              }
          });
        }

        function majData(poste, sousPoste) {
          $scope.categorie = $rootScope.arrayCategorie.find(categorie => categorie.id === 6);

          if (sousPoste.idSousPosteBudgetaireRegle !== null) {

            SousPosteBudgetaireRegleResource.getId({"id" : sousPoste.idSousPosteBudgetaireRegle}).$promise
                .then((result) => {
                  if (result.sousPosteBudgetaireRegle) {
                    transactionCompteModal($scope.categorie, null, result.sousPosteBudgetaireRegle, $scope.idBudget, 0, $scope.ctrl.signe, $scope.ctrl.devise, true).result.then(function(objetRetour) {
                      if (objetRetour) {
                          if (objetRetour.image !== sousPoste.image || objetRetour.typeImage !== sousPoste.typeImage) {
                              modifierDataImage(objetRetour.image, objetRetour.typeImage, sousPoste.id);
                          }
                      }
                    });
                  }
                });
          } else {
              transactionCompteModal($scope.categorie, sousPoste, null, $scope.idBudget, 1, $scope.ctrl.signe, $scope.ctrl.devise, true).result.then(function (objetRetour) {
                  if (objetRetour) {
                      if (objetRetour.regle) {
                          sousPoste.idSousPosteBudgetaireRegle = objetRetour.regle.idSousPosteBudgetaireRegle;
                      }
                      if (objetRetour.image !== sousPoste.image || objetRetour.typeImage !== sousPoste.typeImage) {
                          modifierDataImage(objetRetour.image, objetRetour.typeImage, sousPoste.id);
                      }
                  }
              });
          }
        }

        function deleteData(poste, sousPoste) {
          if (sousPoste.idSousPosteBudgetaireRegle !== null) {
            let promiseSupp = cuServices.supprimeSousPosteBudgetaireRegle($scope.idBudget, sousPoste.idRegle, sousPoste.idSousPosteBudgetaireRegle);
            promiseSupp.then(function(value) {
              const sousPosteIndex = poste.liste.findIndex(ele => ele.uuid === sousPoste.uuid);
              if (sousPosteIndex !== -1) {
                  poste.liste.splice(sousPosteIndex, 1);
              }

              if (!poste.liste.length) {
                  const posteIndex = $scope.liste.selected.findIndex(ele => ele.id === poste.id);
                  $scope.liste.selected.splice(posteIndex, 1);
              }
            });
          }
        }

        function modifierDataImage(image, typeImage, idSousPosteBudgetaire) {
            let idPosteBudgetaires = -1;
            $scope.posteBudgetaires.forEach((ele) => {
                const poste = ele.liste.find((eleSous) => eleSous.id === idSousPosteBudgetaire);
                if (poste) {
                    idPosteBudgetaires = poste.idPosteBudgetaire;
                }
            });
            if (idPosteBudgetaires >= 0) {
                const listeGauche = $scope.posteBudgetaires.find((ele) => ele.id === idPosteBudgetaires);
                const listeDroite = $scope.liste.selected.find((ele) => ele.id === idPosteBudgetaires);

                listeGauche.liste.forEach((eleSousPoste) => {
                    if (eleSousPoste.id === idSousPosteBudgetaire) {
                        eleSousPoste.image = image;
                        eleSousPoste.typeImage = typeImage;
                    }
                });

                listeDroite.liste.forEach((eleSousPoste) => {
                    if (eleSousPoste.id === idSousPosteBudgetaire) {
                        eleSousPoste.image = image;
                        eleSousPoste.typeImage = typeImage;
                    }
                });

                $scope.showSousPosteBudgetaire = false;
                $timeout(() => {
                    $scope.showSousPosteBudgetaire = true;
                });

            }
        }

        function ajouterDataListe(regle) {
          let promiseSelected = cuServices.viRegleSousPosteBudgetaire("getParBudgetId",$scope.idBudget, null, null, null, null, null, regle.idSousPosteBudgetaireRegle);
          promiseSelected.then(function(value) {
            let sousPosteBudgetaireRegle = value.data;
            if (sousPosteBudgetaireRegle.length > 0) {

              SousPosteBudgetaireResource.getAll().$promise
                  .then((result) => {
                      let sousPosteBudgetaire = result.sousPosteBudgetaire;
                      if (sousPosteBudgetaire.length > 0) {
                          const eleSousPoste = sousPosteBudgetaire[0];
                          const posteTmp = $scope.posteBudgetaires.find(ele => ele.id === eleSousPoste.idPosteBudgetaire);
                          const categorieTmp = $scope.liste.selected || [];
                          if (!categorieTmp.find(elePoste => elePoste.id === eleSousPoste.idPosteBudgetaire)) {
                              const catTmp = $scope.categoriesPosteBudgetaire.find(ele => ele.id === eleSousPoste.idPosteBudgetaire);
                              catTmp.liste = [];
                              categorieTmp.push(catTmp);
                          }
                          const data = categorieTmp.find(ele => ele.id === eleSousPoste.idPosteBudgetaire);

                          eleSousPoste.uuid = uuid.v4();
                          //Ceci peut changer, j'ajoute une propriété montant afin d'afficher ce qui sera sélectionné par la modale (reste à le maintenir à jour)
                          eleSousPoste.montant = sousPosteBudgetaireRegle[0].montant;
                          eleSousPoste.idRegle = $scope.idRegle;
                          eleSousPoste.idSousPosteBudgetaireRegle = sousPosteBudgetaireRegle[0].id;
                          eleSousPoste.nom = eleSousPoste.nom;

                          data.liste.push(JSON.parse(JSON.stringify(eleSousPoste))); //on enleve toute référence à l'objet
                          $scope.liste.selected = categorieTmp;
                      }
                  }).catch((err) => {
                    cuServices.message('SousPosteBudgetaireResource', err, true);
                  });
            }
          });
        }

        $scope.$on('valideSelectionCredit', function (event, data) {

          let BreakException = {};
          // On parcours fait ajoute maintenant les lignes de ventilation
          try {
            $scope.liste.selected.forEach((selectionGlobale) => {
              selectionGlobale.liste.forEach((selection) => {
                if (selection.idSousPosteBudgetaireRegle === null) {
                  throw BreakException;
                }
              });
            });
            $scope.$emit('submitValide', {});
          } catch (e) {
            if (e === BreakException && !$rootScope.modeDemo) {
              dialogModal($translate.instant('GLOBALE.MESSAGE.SOUS_POSTE_NON_CONF'), 'warning',
                  $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                  $translate.instant('GLOBALE.SWITCH.OUI'), false,
                  $translate.instant('GLOBALE.SWITCH.NON'), false).result
                  .then((retour) => {
                      if (!retour) {
                          $scope.$emit('validationErreur',{});
                      }
                  });
            }
          }
        });

        $scope.$on('setBudgetCredit', function (event, data) {
            $scope.idBudget = data.budget.id;
        });
    }
})();
