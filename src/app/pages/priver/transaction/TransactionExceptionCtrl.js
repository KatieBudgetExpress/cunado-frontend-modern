/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.transaction')
      .controller('TransactionExceptionCtrl', TransactionExceptionCtrl);

  /** @ngInject */
  function TransactionExceptionCtrl($scope,
                                    $rootScope,
                                    $timeout,
                                    $filter,
                                    $uibModal,
                                    $location,
                                    $stateParams,
                                    cuServices,
                                    $translate,
                                    dialogModal,
                                    creationExceptionModal,
                                    RegleExceptionResource) {

    $scope.idRegle = $scope.$parent.regle.id;

    $scope.titreCreer = $translate.instant("GLOBALE.AIDE.CREER_EXCEPTION");
    $scope.titreModif = $translate.instant("GLOBALE.AIDE.MODIFIER_EXCEPTION");
    $scope.boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonModif = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
    $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
    $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    $scope.chargerRegleException = function() {
      // **************************************************************************************
      // La vue cache les exceptions juste conciliés
      // **************************************************************************************
      let promise = cuServices.viRegleException("getParIdRegle",$scope.idRegle);
      promise.then(function(value) {
        if (value.data.length > 0) {
          $scope.regleExceptions = value.data;
        } else {
          $scope.regleExceptions = [];
        }
        $scope.$applyAsync();
      })
      .catch(err => {
        cuServices.message('get', err, true);
        $scope.regleExceptions = [];
      });
    };

    $scope.chargerRegleException();

    $scope.modifierException = function(regleException) {
      creationExceptionModal($scope.boutonModif, $scope.boutonSupprimer, $scope.boutonAnnuler, $scope.titreModif, $scope.$parent.idBudget, $scope.idRegle, regleException, $scope.$parent.signe, false).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          $scope.chargerRegleException();
          $scope.$applyAsync();
         }
      });
    };

    $scope.creerException = function() {
      creationExceptionModal($scope.boutonCreer, false, $scope.boutonAnnuler, $scope.titreCreer, $scope.$parent.idBudget, $scope.idRegle, null, $scope.$parent.signe, true).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          $scope.chargerRegleException();
          $scope.$applyAsync();
         }
      });
    };

    $scope.supprimerException = function(regleException) {
      RegleExceptionResource.remove({"id": regleException.id}).$promise
          .then((result) => {
            $scope.$parent.setModifie(true);
            $scope.chargerRegleException();
            $scope.$applyAsync();
          })
          .catch(err => {
            cuServices.message('delete', err, true);
            $scope.$parent.setModifie(false);
          });
    };
  }

})();
