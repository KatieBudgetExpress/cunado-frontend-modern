/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.transaction')
      .controller('TransactionExceptionTransfertCtrl', TransactionExceptionTransfertCtrl);

  /** @ngInject */
  function TransactionExceptionTransfertCtrl($scope,
                                             $timeout,
                                             $filter,
                                             $uibModal,
                                             $location,
                                             $stateParams,
                                             cuServices,
                                             $translate,
                                             dialogModal,
                                             creationExceptionTransfertModal,
                                             RegleExceptionResource) {

    $scope.idRegleDe = $scope.$parent.regleTransfert.idRegleLienTransfert;
    $scope.idRegleVers = null;
    $scope.regleExceptions = [];
    $scope.typeTransfert = 'REMB';

    $scope.titreCreer = $translate.instant("GLOBALE.AIDE.CREER_EXCEPTION_TRANSFERT");
    $scope.titreModif = $translate.instant("GLOBALE.AIDE.MODIFIER_EXCEPTION_TRANSFERT");
    $scope.boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonModif = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
    $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
    $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    if ($scope.provenance === 'CRE') {
      $scope.typeTransfert = 'REMB';
    } else if ($scope.provenance === 'EPA') {
      $scope.typeTransfert = 'VERS';
    } else if ($scope.provenance === 'PRE') {
      $scope.typeTransfert = 'PAIE';
    } else {
      $scope.typeTransfert = 'COMPTE';
    }

    $scope.chargerRegleException = function() {
      // **************************************************************************************
      // Trouve la règle en lien avec la règle d'origine
      // **************************************************************************************
      let promiseRegle = cuServices.regle("getParLienType",$scope.idRegleDe, 11, null);
      promiseRegle.then(function(value) {
        const data = value.data;
        if (data.length > 0) {
          $scope.idRegleVers = data[0].id;
        }
      });

      // **************************************************************************************
      // La vue cache les exceptions juste conciliés
      // **************************************************************************************
      let promise = cuServices.viRegleException("getParIdRegle",$scope.idRegleDe);
      promise.then(function(value) {
        if (value.data.length > 0) {
          $scope.regleExceptions = value.data;
        } else {
          $scope.regleExceptions = [];
        }
      })
      .catch(err => {
        cuServices.message('get', err, true);
        $scope.regleExceptions = [];
      });
    };

    $scope.chargerRegleException();

    $scope.modifierException = function(regleException) {
      creationExceptionTransfertModal($scope.boutonModif, $scope.boutonSupprimer, $scope.boutonAnnuler, $scope.titreModif, $scope.$parent.idBudget, $scope.idRegleDe, $scope.idRegleVers, regleException, $scope.$parent.signe, false, $scope.typeTransfert).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          $scope.chargerRegleException();
         }
      });
    };

    $scope.creerException = function() {
      creationExceptionTransfertModal($scope.boutonCreer, false, $scope.boutonAnnuler, $scope.titreCreer, $scope.$parent.idBudget, $scope.idRegleDe, $scope.idRegleVers, null, $scope.$parent.signe, true, $scope.typeTransfert).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          $scope.chargerRegleException();
         }
      });
    };

    $scope.supprimerException = function(regleException) {

      let promiseRegleExc = new Promise( (resolve, reject) => {
        RegleExceptionResource.remove({"id": regleException.id}).$promise
            .then((result) => {
              if (result.regleException > 0) {
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch(err => {
              cuServices.message('delete', err, true);
              resolve(false);
            });
      });

      let promiseRegleVersExc = new Promise( (resolve, reject) => {
        if ($scope.idRegleVers !== null) {
          RegleExceptionResource.removeParRegleDateRegle({"idRegle": $scope.idRegleVers,
                                                          "dateRegle": regleException.dateRegle}).$promise
              .then((result) => {
                 if (result.regleException > 0) {
                   resolve(true);
                 } else {
                   resolve(false);
                 }
              })
              .catch(err => {
                cuServices.message('delete', err, true);
                resolve(false);
              });
        } else {
          resolve(false);
        }
      });

      Promise.all([promiseRegleExc, promiseRegleVersExc])
      .then( (result) => {
        if (result[0] || result[1]) {
          $scope.$parent.setModifie(true);
          $scope.chargerRegleException();
        }
      });

    };
  }

})();
