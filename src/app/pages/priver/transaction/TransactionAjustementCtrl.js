/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.transaction')
      .controller('TransactionAjustementCtrl', TransactionAjustementCtrl);

  /** @ngInject */
  async function TransactionAjustementCtrl($scope,
                                           $rootScope,
                                           $timeout,
                                           $filter,
                                           $uibModal,
                                           $location,
                                           $stateParams,
                                           cuServices,
                                           $translate,
                                           dialogModal,
                                           ajustementSoldeModal,
                                           prepareAnalyse,
                                           RegleResource) {

    $scope.idRegle = $scope.$parent.regle.id;
    $scope.idSousPosteBudgetaireRegle = $scope.$parent.regle.idSousPosteBudgetaireRegle;

    $scope.titreCreer = $translate.instant("GLOBALE.AIDE.CREER_AJUSTEMENT");
    $scope.titreModif = $translate.instant("GLOBALE.AIDE.MODIFIER_AJUSTEMENT");
    $scope.boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonModif = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
    $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
    $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    $scope.chargerRegleAjustement = function() {

      let promiseAjustement = cuServices.viRegleAjustement("getParId",$scope.idSousPosteBudgetaireRegle);
      promiseAjustement.then(function(value) {
        let data = value.data;
        if (data.length > 0) {
          $scope.regleAjustements = data;
        } else {
          $scope.regleAjustements = [];
        }
      });
    };

    await $scope.chargerRegleAjustement();

    $scope.modifierAjustement = async function(regleAjustement) {
      ajustementSoldeModal($scope.boutonModif, $scope.boutonSupprimer, $scope.boutonAnnuler, $scope.titreModif, $scope.$parent.idBudget, $scope.idSousPosteBudgetaireRegle, regleAjustement, $scope.$parent.signe, false).result.then(async function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          let promiseGenere = prepareAnalyse.genereOperationsEtSoldes($scope.$parent.idBudget, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
          promiseGenere.then(function(data) {
            let promiseSoldeCompte = prepareAnalyse.getSoldeCompte($scope.idSousPosteBudgetaireRegle, moment(new Date()).format('YYYY-MM-DD'));
            promiseSoldeCompte.then(function(data) {
              $scope.$parent.regle.montant = data[0].soldeNum;
            });
          });
          $scope.chargerRegleAjustement();
         }
      });
    };

    $scope.creerAjustement = function() {
      ajustementSoldeModal($scope.boutonCreer, false, $scope.boutonAnnuler, $scope.titreCreer, $scope.$parent.idBudget, $scope.idSousPosteBudgetaireRegle, null, $scope.$parent.signe, true).result.then(async function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          let promiseGenere = prepareAnalyse.genereOperationsEtSoldes($scope.$parent.idBudget, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
          promiseGenere.then(function(data) {
            let promiseSoldeCompte = prepareAnalyse.getSoldeCompte($scope.idSousPosteBudgetaireRegle, moment(new Date()).format('YYYY-MM-DD'));
            promiseSoldeCompte.then(function(data) {
              $scope.$parent.regle.montant = data[0].soldeNum;
            });
          });
          $scope.chargerRegleAjustement();
         }
      });
    };

    $scope.supprimerAjustement = function(regleAjustement) {
      // Supprimer la règle
      RegleResource.remove({"id": regleAjustement.idRegle}).$promise
          .then(async () => {
            cuServices.message('delete', false, false);
            $scope.$parent.setModifie(true);
            let promiseGenere = prepareAnalyse.genereOperationsEtSoldes($scope.$parent.idBudget, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
            promiseGenere.then(function(data) {
              let promiseSoldeCompte = prepareAnalyse.getSoldeCompte($scope.idSousPosteBudgetaireRegle, moment(new Date()).format('YYYY-MM-DD'));
              promiseSoldeCompte.then(function(data) {
                $scope.$parent.regle.montant = data[0].soldeNum;
              });
            });
            $scope.chargerRegleAjustement();
          })
          .catch(err => {
            cuServices.message('delete', err, true);
          });
    };

  }

})();
