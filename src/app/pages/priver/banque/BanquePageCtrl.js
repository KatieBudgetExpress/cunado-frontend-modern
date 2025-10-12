/**
 * @author S.Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.banque')
    .controller('BanquePageCtrl', BanquePageCtrl);

  /** @ngInject */
  function BanquePageCtrl($scope,
                          $rootScope,
                          toastr,
                          cuServices,
                          $translate,
                          editableOptions,
                          editableThemes,
                          triAvecAccent,
                          plaidServices,
                          banqueCompteModal,
                          BanqueResource,
                          BanqueCompteResource) {

    $scope.modeAssistant = false;
    // Variables du contrôleur
    $scope.isLoading = false;
    $scope.error = null;
    $scope.handler = null;
    $scope.banqueComptes = [];
    $scope.accordionArray = [];

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    $scope.trierAccent = {
      nomCompte: function (value) { return triAvecAccent($translate.instant(value.nomCompte)) },
      solde: function (value) { return triAvecAccent(value.solde) }
    };
/*
    // Trouver les Comptes pour la liste de valeur
    let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParLovNullable",$scope.ctrl.budgetCourant, 3, 6, null, null, null, null);
    promiseOptions.then(function(value) {
      $scope.compteOptions = value.data;
      $scope.$apply();
    });
*/
    // Initialisation
    function init() {
      setupPlaidHandler();
    }  

    $scope.getBanque = function (){
        BanqueResource.getAll().$promise
            .then((result) => {
              if (result.banque.length === 0) {
                $scope.banques = {};
              } else {   
                $scope.banques = result.banque;            
              }
            }).catch(err => err);

        // Trouver les Comptes pour la liste de valeur
        let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParLovNullable",$scope.ctrl.budgetCourant, 3, 6, null, null, null, null);
        promiseOptions.then(function(value) {
          $scope.compteOptions = value.data;
          
          BanqueCompteResource.getAll().$promise
          .then((result) => {
            if (result.banqueCompte.length === 0) {
              $scope.banqueComptes = {};
            } else { 
              for (let i = 0, tot = result.banqueCompte.length; i < tot; i++) {
                $scope.banqueComptes[i] = result.banqueCompte[i];
                $scope.banqueComptes[i]["nomSousPosteBudgetaireLov"] = $scope.compteOptions.find(ele => ele.id === (result.banqueCompte[i].idSousPosteBudgetaireRegle === null ? -1 : result.banqueCompte[i].idSousPosteBudgetaireRegle)).nomSousPosteBudgetaireLov;
              }         
            }
          }).catch(err => err);
        });
    };

    // ICI ON AJOUTE LA BANQUE AVEC LES COMPTES
    async function setupPlaidHandler() {

      let promiseToken = new Promise( (resolve, reject) => {
        $scope.isLoading = true;
        let promiseLinkToken = plaidServices.PlaidResource("createLinkToken");
        promiseLinkToken.then(function(data) {
          $scope.linkToken = data.link_token;
          console.log("link_token " + $scope.linkToken);
          resolve(true);
        })
        .catch(error => {
          resolve(false);
        })
        .finally(function() {
          $scope.isLoading = false;
        });
      });

      Promise.all([promiseToken])
      .then( (result) => {
        console.log("handler " + $scope.linkToken);

        $scope.handler = Plaid.create({
          token: $scope.linkToken,
          onSuccess: function(publicToken, metadata) {
            $scope.isLoading = true;

            let promisePublicToken = plaidServices.PlaidResource("exchangePublicToken",publicToken);
            promisePublicToken.then(function(data) {
              $scope.getBanque();
              $scope.$applyAsync();       
            })
            .catch(error => {
              $scope.error = "Erreur lors de l'échange du token public: " + error.message;
              console.error("Erreur dans onSuccess:", error);             
            })
            .finally(function() {
              $scope.isLoading = false;
              $scope.$applyAsync();
            });
          },   
          onEvent: function(eventName, metadata) {
            console.log("Event:", eventName);
            console.log("Metadata:", metadata);
          },
          onExit: function(error, metadata) {
            console.log(error, metadata);
            if (error) {
              $scope.error = "Plaid Link fermé avec erreur: " + error.message;
              $scope.$applyAsync();; // Pour s'assurer que l'UI est mise à jour
            }
          }
        });
      });

    }; 
    
    $scope.majSoldeCompte = function(banqueId) {

      let accounts = [];
      let banqueCompteBalances = $scope.banqueComptes.filter(cpt => cpt.idBanque === banqueId);
      let access_token = $scope.banques.filter(bank => bank.id === banqueId)[0].accessToken;

      for (var i=0,  tot=banqueCompteBalances.length; i < tot; i++) {
        accounts[i] = banqueCompteBalances[i].idCompte;
      }

      let promiseAccountBalance = plaidServices.PlaidResource("getAccountBalance",access_token, accounts, banqueCompteBalances);
      promiseAccountBalance.then(function(data) {
        $scope.getBanque();
        $scope.$applyAsync(); 
      })
      .catch(err => {
        cuServices.message('delete', err, true);
      })
    }

    $scope.lierBanque = function() { 

      if ($scope.handler) {
        $scope.handler.open();
      } else {
        $scope.error = "Plaid Link n'est pas initialisé";
        setupPlaidHandler(); // Tentative de réinitialisation
      }
      console.log("Lier nouveau");
    };

    $scope.supprimeBanque = function(index, banque, rowform) {
      BanqueResource.remove({"id": banque.id}).$promise
          .then(async () => {
            cuServices.message('delete', false, false);
            $scope.banques.splice($scope.banques.indexOf(banque), 1);
          })
          .catch(err => {
            cuServices.message('delete', err, true);
          });
    };

    $scope.supprimeBanqueCompte = function(index, banqueCompte, rowform) {
      BanqueCompteResource.remove({"id": banqueCompte.id}).$promise
          .then(async () => {
            cuServices.message('delete', false, false);
            $scope.banqueComptes.splice($scope.banqueComptes.indexOf(banqueCompte), 1);
          })
          .catch(err => {
            cuServices.message('delete', err, true);
          });
    };

    $scope.modifierBanqueCompte = function(banqueCompte, rowform) {
      let titre = $translate.instant("GLOBALE.AIDE.LIERBANQUECOMPTE");
      let boutonOk = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
      let boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

      banqueCompteModal(boutonOk, boutonAnnuler, titre, banqueCompte, $scope.compteOptions).result.then(async function(objetBanqueCompte) {
        $scope.getBanque();   
        $scope.$applyAsync();

      }).catch(err => {
        $scope.$applyAsync();
      });
 //     rowform.$show();
    };
/*
    $scope.enregistreBanqueCompte = function(banqueCompte, rowform) {
      return new Promise((resolve, reject) => {
        if (!rowform.$invalid) {
          if (rowform.$dirty) {

            var condition = ' WHERE t.id <> ' + banqueCompte.id +
                              ' AND t."idSousPosteBudgetaireRegle" is not null';

            let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'banqueCompte', condition, 'idSousPosteBudgetaireRegle', ((typeof rowform.$data.idSousPosteBudgetaireRegle === 'undefined') ? "-1" : '"' || rowform.$data.idSousPosteBudgetaireRegle) || '"', "GLOBALE.MESSAGE.UNICITE_BANQUECOMPTE");
            promiseValideUnicite.then(async function(valide) {

              if (valide) {
                if (rowform.$data.nomCompte != null) {
                  banqueCompte.nomCompte = rowform.$data.nomCompte;
                }

                banqueCompte.idSousPosteBudgetaireRegle = rowform.$data.idSousPosteBudgetaireRegle;

                BanqueCompteResource.update(banqueCompte).$promise
                      .then(() => {
                        cuServices.message("update", false, false);
                        rowform.$dirty = false;
                        resolve(true);
                      })
                      .catch(err => {
                        cuServices.message("update", err, true);
                        resolve(false);
                      });
              } else {
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
*/    

    $scope.onhide = function(rowform) {
    };

    $scope.oncancel = function(rowform) {
    };

    $scope.onChangeForm = function(rowform) {
      rowform.$dirty = true;
    };

    $scope.onCancelForm = function(posteBudgetaire,rowform) {
      rowform.$cancel();
    };

    editableOptions.theme = 'bs3';
    editableThemes['bs3'].submitTpl = '<button ng-attr-type="submit" class="btn btn-primary btn-with-icon"><i class="ion-checkmark-round"></i></button>';
    editableThemes['bs3'].cancelTpl = '<button ng-attr-type="button" ng-click="$form.$cancel()" class="btn btn-default btn-with-icon"><i class="ion-close-round"></i></button>';

    // Appeler init lors de l'initialisation du contrôleur
    init();
  }
})();
