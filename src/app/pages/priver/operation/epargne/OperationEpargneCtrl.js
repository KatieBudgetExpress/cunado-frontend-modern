(function () {
  'use strict';

  angular.module('i2sFinance.priver.operation.epargne')
      .controller('OperationEpargneCtrl', OperationEpargneCtrl);

  /** @ngInject */
  function OperationEpargneCtrl($scope,
                                $rootScope,
                                fileReader,
                                $filter,
                                $uibModal,
                                toastr,
                                toastrConfig,
                                $location,
                                $stateParams,
                                transactionCompteModal,
                                prepareAnalyse,
                                cuServices,
                                SousPosteBudgetaireRegleResource) {

    $scope.affPoste = true;

    var initSwitch = false;
    // id:1  ecran:OPERATION  composant:SWITCH_POSTE
    if ($scope.ctrl.axesVisibilites.find(x => x.id === 1).valeur === "true") {
      initSwitch = true;
    }

    $scope.switcherOperation = {
      poste: initSwitch
    };

    $scope.$watch('switcherOperation.poste', (newVal, oldVal) => {
        if (newVal !== oldVal) {
          $scope.ctrl.updateAxeVisibiliteUsager(1,newVal,true);
        }
    });

    $scope.localeSensitiveComparator = function(v1, v2) {
      // If we don't get strings, just compare by index
      if (v1.type !== 'string' || v2.type !== 'string') {
        return (v1.index < v2.index) ? -1 : 1;
      }

      // Compare strings alphabetically, taking locale into account
      return v1.value.localeCompare(v2.value);
    };

    $scope.categorie = $rootScope.arrayCategorie.find(categorie => categorie.id === 4);

    $scope.trierAccent = {
      nom: function (value) { return triAvecAccent($translate.instant(value.nom)) },
      description: function (value) { return triAvecAccent(value.description) }
    };

    $scope.getReglePosteBudgetaire = function (){
      // On refait le calcul des soldes au besoin
      let promiseAnalyse = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 0);
      promiseAnalyse.then(async function(value) {

        let promisePoste = cuServices.viReglePosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, $scope.categorie.id);
        promisePoste.then(function(value) {
          let data = value.data;
          if (data.length === 0) {
            $scope.reglePosteBudgetaires = {};
            $scope.affPoste = false;
            $scope.$applyAsync();
          } else {
            $scope.reglePosteBudgetaires = data;
            $scope.affPoste = true;

            let promiseRegleSousPosteBudgetaireGroups = new Promise( (resolve, reject) => {
              let promiseGroupe = cuServices.viRegleSousPosteBudgetaire("getParGroupe",$scope.ctrl.budgetCourant, $scope.categorie.id, null, null, null, null, null);
              promiseGroupe.then(function(value) {
                if (value.data.length === 0) {
                  $scope.regleSousPosteBudgetaireGroups = {};
                } else {
                  $scope.regleSousPosteBudgetaireGroups = value.data;
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('getParGroupe', err, true);
                resolve(false);
              });
            });

            let promiseRegleSousPosteBudgetaires = new Promise( (resolve, reject) => {
              let promiseSelect = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, $scope.categorie.id, null, null, null, null, null);
              promiseSelect.then(function(value) {
                if (value.data.length === 0) {
                  $scope.regleSousPosteBudgetaires = {};
                } else {
                  $scope.regleSousPosteBudgetaires = value.data;
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('getParBudgetCateg', err, true);
                resolve(false);
              });
            });

            Promise.all([promiseRegleSousPosteBudgetaireGroups, promiseRegleSousPosteBudgetaires])
            .then( (result) => {
              $scope.$applyAsync();
            });
          }
        }).catch(function(err) {
          cuServices.message("viReglePosteBudgetaire", err, true);
          $scope.$applyAsync();
        });
      }).catch(function(err) {
        cuServices.message("genereOperationsEtSoldes", err, true);
        $scope.$applyAsync();
      });
    };

    $scope.ajoutTransaction = function() {
      transactionCompteModal($scope.categorie, null, null, $scope.ctrl.budgetCourant,1, $scope.ctrl.signe, $scope.ctrl.devise, false).result.then(function(retour) {

        if(retour){
          let data = $rootScope.budgetActif
          data.dateFinGenere = null;
          $scope.ctrl.updateBudget(data);
        }
        $scope.getReglePosteBudgetaire();
      });
    };

    $scope.modifierSousPoste = function(sousPosteBudgetaireRegle) {
      SousPosteBudgetaireRegleResource.getId({"id" : sousPosteBudgetaireRegle.id}).$promise
          .then((result) => {
            if (result.sousPosteBudgetaireRegle) {
              transactionCompteModal($scope.categorie, null, result.sousPosteBudgetaireRegle, $scope.ctrl.budgetCourant,0, $scope.ctrl.signe, $scope.ctrl.devise, false).result.then(function(retour) {

                if(retour){
                  let data = $rootScope.budgetActif
                  data.dateFinGenere = null;
                  $scope.ctrl.updateBudget(data);
                }
                $scope.getReglePosteBudgetaire();
              });
            }
          });
    };
  }

})();
