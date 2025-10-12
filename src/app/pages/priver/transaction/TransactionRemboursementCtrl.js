/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.priver.transaction')
      .controller('TransactionRemboursementCtrl', TransactionRemboursementCtrl);

  /** @ngInject */
  function TransactionRemboursementCtrl($scope,
                                        $timeout,
                                        $filter,
                                        $uibModal,
                                        $location,
                                        $stateParams,
                                        cuServices,
                                        cuCurrency,
                                        $translate,
                                        dialogModal,
                                        transfertCompteModal,
                                        prepareAnalyse,
                                        ViRegleTransfertCompteResource,
                                        RegleResource) {

    $scope.idRegle = $scope.$parent.regle.id;
    $scope.idSousPosteBudgetaireRegle = $scope.$parent.regle.idSousPosteBudgetaireRegle;
    $scope.regleRemboursements = [];
    $scope.typeTransfert = 'REMB';

    $scope.titreCreer = $translate.instant("GLOBALE.AIDE.CREER_TRANSFERT");
    $scope.titreModif = $translate.instant("GLOBALE.AIDE.MODIFIER_TRANSFERT");
    $scope.boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonModif = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
    $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
    $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

    $scope.affSupp      = $translate.instant('GLOBALE.MESSAGE.CONFIRMATION_SUPPRESSION');
    $scope.affSwitchOui = $translate.instant('GLOBALE.SWITCH.OUI');
    $scope.affSwitchNon = $translate.instant('GLOBALE.SWITCH.NON');
    $scope.affAttention = $translate.instant('GLOBALE.MESSAGE.ATTENTION');

    if ($scope.$parent.categorie.code === 'CRE') {
      $scope.typeTransfert = 'REMB';
    } else if ($scope.$parent.categorie.code === 'EPA') {
      $scope.typeTransfert = 'VERS';
    } else if ($scope.$parent.categorie.code === 'PRE') {
      $scope.typeTransfert = 'PAIE';
    }

    $scope.chargerRegleRemboursement = function() {
      $scope.regleRemboursements = [];

      ViRegleTransfertCompteResource.getParSousPosteRegleType({"idSousPosteBudgetaireRegle" : $scope.idSousPosteBudgetaireRegle,
                                                               "typeTransfert" : $scope.typeTransfert}).$promise
          .then((result) => {
            let data = result.data;
            if (data.length > 0) {
              let idx = 0;
              // Pour chaque catégorie avec solde
              for (let i = 0, tot = data.length; i < tot; i++) {

                  let montantAff = cuCurrency.format(data[i].montant, $scope.$parent.devise);

                  if (data[i].idValeurElementPeriodicite === 8) {
                    // Mensuel
                    if (data[i].uniteFrequence != null && data[i].uniteFrequence > 1) {
                      montantAff = montantAff + ' / ' + data[i].uniteFrequence + ' ' + $translate.instant("GLOBALE.PERIODICITE.AN") + 's';
                    } else {
                      montantAff = montantAff + ' / ' + $translate.instant("GLOBALE.PERIODICITE.ANNEE");
                    }
                  } else if (data[i].idValeurElementPeriodicite === 9) {
                    // Mensuel
                    if (data[i].uniteFrequence != null && data[i].uniteFrequence > 1) {
                      montantAff = montantAff + ' / ' + data[i].uniteFrequence + ' ' + $translate.instant("GLOBALE.PERIODICITE.MENSUEL");
                    } else {
                      montantAff = montantAff + ' / ' + $translate.instant("GLOBALE.PERIODICITE.MENSUEL");
                    }
                  } else if (data[i].idValeurElementPeriodicite === 10) {
                    // Jour
                    if (data[i].uniteFrequence != null && data[i].uniteFrequence > 1) {
                      montantAff = montantAff + ' / ' + data[i].uniteFrequence + ' ' + $translate.instant("GLOBALE.PERIODICITE.JOUR") + 's';
                    } else {
                      montantAff = montantAff + ' / ' + $translate.instant("GLOBALE.PERIODICITE.JOUR");
                    }
                  } else if (data[i].idValeurElementPeriodicite === 11) {
                    // Semaine
                    if (data[i].uniteFrequence != null && data[i].uniteFrequence > 1) {
                      montantAff = montantAff + ' / ' + data[i].uniteFrequence + ' ' + $translate.instant("GLOBALE.PERIODICITE.SEMAINE") + 's';
                    } else {
                      montantAff = montantAff + ' / ' + $translate.instant("GLOBALE.PERIODICITE.SEMAINE");
                    }
                  } else if (data[i].idValeurElementPeriodicite === 13) {
                    // Bi-mensuel
                    montantAff = montantAff + ' ' + $translate.instant("GLOBALE.PERIODICITE.BIMENSUEL");

                  } else if (data[i].idValeurElementPeriodicite === 14) {
                    //  Quelques fois
                    montantAff = montantAff + ' ' + $translate.instant("GLOBALE.PERIODICITE.QUELQUESFOIS");

                  } else if (data[i].idValeurElementPeriodicite === 15) {
                    // Une fois
                    montantAff = montantAff + ' ' + $translate.instant("GLOBALE.PERIODICITE.LE") + ' ' + data[i].dateDebut;
                  }
                  //
                  $scope.regleRemboursements[idx] = {
                    idx: idx,
                    idRegle: data[i].idRegle,
                    idSousPosteBudgetaireRegle: data[i].idSousPosteBudgetaireRegle,
                    idSousPosteBudgetaireRegleDe: data[i].idSousPosteBudgetaireRegleDe,
                    descriptionDe: data[i].descriptionDe,
                    idSousPosteBudgetaireRegleVers: data[i].idSousPosteBudgetaireRegleVers,
                    descriptionVers: data[i].descriptionVers,
                    idTypeOperation: data[i].idTypeOperation,
                    idValeurElementPeriodicite: data[i].idValeurElementPeriodicite,
                    uniteFrequence: data[i].uniteFrequence,
                    nombreVersement: data[i].nombreVersement,
                    dateDebut: data[i].dateDebut,
                    dateFin: data[i].dateFin,
                    jourUn: data[i].jourUn,
                    jourDeux: data[i].jourDeux,
                    pourToujours: data[i].pourToujours,
                    prolonger: data[i].prolonger,
                    paieSolde: data[i].paieSolde,
                    idRegleLienTransfert: data[i].idRegleLienTransfert,
                    maitre: data[i].maitre,
                    montant: data[i].montant,
                    montantAff: montantAff.toLowerCase(),
                    dateTooltip: data[i].dateTooltip,
                    tri: data[i].tri
                  };
                  idx += 1;
              }
            } else {
              $scope.regleRemboursements = [];
            }
          });
    };

    $scope.chargerRegleRemboursement();

    $scope.modifierRemboursement = function(regleRemboursement) {

      transfertCompteModal($scope.boutonModif, $scope.boutonSupprimer, $scope.boutonAnnuler, $scope.titreModif, $scope.$parent.idBudget, regleRemboursement.idSousPosteBudgetaireRegleDe, regleRemboursement, $scope.$parent.signe, false, $scope.$parent.categorie.code, $scope.typeTransfert).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          let promiseGenere = prepareAnalyse.genereOperationsEtSoldes($scope.$parent.idBudget, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
          promiseGenere.then(function(data) {
            let promiseSoldeCompte = prepareAnalyse.getSoldeCompte($scope.idSousPosteBudgetaireRegle, moment(new Date()).format('YYYY-MM-DD'));
            promiseSoldeCompte.then(function(data) {
              $scope.$parent.regle.montant = data[0].soldeNum;
            });
          });
          $scope.chargerRegleRemboursement();
         }
      });

    };

    $scope.ajoutRemboursement = function() {

      transfertCompteModal($scope.boutonCreer, false, $scope.boutonAnnuler, $scope.titreCreer, $scope.$parent.idBudget, $scope.idSousPosteBudgetaireRegle, null, $scope.$parent.signe, true, $scope.$parent.categorie.code, $scope.typeTransfert).result.then(function(retour) {
        if (retour) {
          $scope.$parent.setModifie(true);
          let promiseGenere = prepareAnalyse.genereOperationsEtSoldes($scope.$parent.idBudget, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
          promiseGenere.then(function(data) {
            let promiseSoldeCompte = prepareAnalyse.getSoldeCompte($scope.idSousPosteBudgetaireRegle, moment(new Date()).format('YYYY-MM-DD'));
            promiseSoldeCompte.then(function(data) {
              $scope.$parent.regle.montant = data[0].soldeNum;
            });
          });
          $scope.chargerRegleRemboursement();
         }
      });

    };

    $scope.supprimeRemboursement = function(regleRemboursement) {
      // Supprimer la règle
      RegleResource.remove({"id": regleRemboursement.idRegle}).$promise
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
