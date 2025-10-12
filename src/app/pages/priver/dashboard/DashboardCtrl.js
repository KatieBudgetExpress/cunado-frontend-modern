(function () {
    'use strict';

    angular.module('i2sFinance.priver.dashboard')
        .controller('DashboardCtrl', DashboardCtrl);

    /** @ngInject */
    function DashboardCtrl($rootScope,
                           $timeout,
                           $scope,
                           $translate,
                           baConfig,
                           baUtil,
                           colorHelper,
                           prepareAnalyse,
                           cuServices,
                           ViAnalyseRegleSommaireInfoPosteResource,
                           SousPosteBudgetaireRegleResource) {

      $scope.dashLoaded = false;

      $scope.prepareDashboard = async () => {
        if ($rootScope.appLoad) {
          $rootScope.$activeLoadingPage = false;
          const pieColor = baUtil.hexToRGB(baConfig.colors.defaultText, 0.2);

          let dateDuJour;
          if ($rootScope.budgetActif.dateDebut !== null && $rootScope.budgetActif.dateDebut !== '' && moment(new Date()).isBefore(moment($rootScope.budgetActif.dateDebut))) {
            dateDuJour = $rootScope.budgetActif.dateDebut;
          }  else {
            dateDuJour = moment(new Date()).format("YYYY-MM-DD");
          }

          let start = moment(dateDuJour).startOf('month');
          let end = moment(dateDuJour).endOf('month');

          // id:2  ecran:DASHBOARD  composant:DATE_DEBUT
          if ($scope.ctrl.axesVisibilites.find(x => x.id === 2).valeur !== "") {
              start = moment($scope.ctrl.axesVisibilites.find(x => x.id === 2).valeur, "YYYY-MM-DD");
          }

          // id:3  ecran:DASHBOARD  composant:DATE_FIN
          if ($scope.ctrl.axesVisibilites.find(x => x.id === 3).valeur !== "") {
              end = moment($scope.ctrl.axesVisibilites.find(x => x.id === 3).valeur, "YYYY-MM-DD");
          }

          // Sert à ne pas toujours refaire solde du compte principal tant que l'on demeure dans l'écran
          $scope.dateFinCompteGen = "";

          $scope.dateDebut = start.format("YYYY-MM-DD");
          $scope.dateFin = end.format("YYYY-MM-DD");
          $scope.charts = [];
          $scope.doughnutDataDep = {};
          $scope.doughnutDataRev = {};
          $scope.totalDep = "0.00";
          $scope.totalRev = "0.00";
          $scope.totalCpt = "0.00";

          $scope.transparent = baConfig.theme.blur;
          const dashboardColors = baConfig.colors.dashboard;

          // ************************************************************************************************
          //  On lance le calcul des opérations et soldes
          // ************************************************************************************************
          $scope.calculOperation = function () {
            return new Promise((resolve, reject) => {
              if ($scope.dateFinCompteGen === "") {
                  if (moment($scope.dateFin, "YYYY-MM-DD").isSameOrBefore(moment().endOf('year'))) {
                    let promise = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 0);
                    promise.then(function(value) {
                      $scope.dateFinCompteGen = moment().endOf('year').format("YYYY-MM-DD");
                      resolve(value);
                    });
                  } else {
                    let promise = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", $scope.dateFin, 0);
                    promise.then(function(value) {
                      $scope.dateFinCompteGen = moment($scope.dateFin, "YYYY-MM-DD");
                      resolve(value);
                    });
                  }
              } else if (moment($scope.dateFinCompteGen, "YYYY-MM-DD").isBefore(moment($scope.dateFin, "YYYY-MM-DD"))) {
                let promise = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", $scope.dateFin, 0);
                promise.then(function(value) {
                  $scope.dateFinCompteGen = moment($scope.dateFin, "YYYY-MM-DD");
                  resolve(value);
                });
              } else {
                resolve(true);
              }
            });
          };

          // ************************************************************************************************
          //  DEPENSES DE TOUS LES COMPTES
          // ************************************************************************************************
          $scope.chargementDepenses = function () {
            return new Promise((resolve, reject) => {
              const backgroundColor = [
                  dashboardColors.gossip,
                  dashboardColors.white,
                  dashboardColors.silverTree,
                  dashboardColors.surfieGreen,
                  dashboardColors.blueStone
              ];
              const hoverBackgroundColor = [
                  colorHelper.shade(dashboardColors.gossip, 15),
                  colorHelper.shade(dashboardColors.white, 15),
                  colorHelper.shade(dashboardColors.silverTree, 15),
                  colorHelper.shade(dashboardColors.surfieGreen, 15),
                  colorHelper.shade(dashboardColors.blueStone, 15)
              ];
              let cptDep = 0;
              let labelsDep = [];
              let dataDep = [];
              let prcDep = [];
              let orderDep = [];

              const paramDep = { "idBudget" : $scope.ctrl.budgetCourant,
                                "idSousPosteBudgetaireRegle" : null,
                                "dateDebut" : $scope.dateDebut,
                                "dateFin" : $scope.dateFin,
                                "codeCategorie" : 'DEP',
                                "force" : 1,
                                "codeCat1" : 'DEP',
                                "codeCat2" : 'AUT'
                              };

              ViAnalyseRegleSommaireInfoPosteResource.getParCategorie(paramDep).$promise
                  .then((result) => {
                    let prcArr = 0;
                    let prcArrFinal = 100;

                    for (let j = 0, tot2 = result.data.length; j < tot2; j++) {

                        if (j === (tot2 - 1)) {
                            prcArr = Math.round(prcArrFinal * 10) / 10;
                        } else {
                            prcArr = Math.round(result.data[j].pourcentage * 10) / 10;
                            prcArrFinal = prcArrFinal - prcArr;
                        }

                        labelsDep.push($translate.instant(result.data[j].description));
                        dataDep.push(result.data[j].montantFormat);
                        prcDep.push(prcArr);
                        orderDep.push(cptDep);

                        cptDep += 1;
                    }

                    if (result.data.length === 0) {
                        $scope.totalDep = "0.00";
                        $scope.charts[0] = {
                            color: pieColor,
                            description: $translate.instant("PARAM.CATEGORIE.DEPENSE"),
                            stats: "0.00",
                            typeIcon: 'glossy',
                            icon: 'Pay',
                            percent: 0
                        };
                        $scope.doughnutDataDep = {};
                    } else {
                        $scope.totalDep = result.data[cptDep - 1].montantTotalFormat;

                        $scope.doughnutDataDep = {
                          labels: labelsDep,
                          datasets: [{
                            data: dataDep,
                            backgroundColor: backgroundColor,
                            hoverBackgroundColor: hoverBackgroundColor,
                            percentage: prcDep,
                            order: orderDep
                          }]
                        };

                        $scope.charts[0] = {
                            color: pieColor,
                            description: $translate.instant("PARAM.CATEGORIE.DEPENSE"),
                            stats: result.data[cptDep - 1].montantTotalFormat,
                            typeIcon: 'glossy',
                            icon: 'Money',
                            percent: 0
                        };
                    }
                    resolve(true);

                  }).catch((err) => {
                    cuServices.message('ViAnalyseRegleSommaireInfoPosteResource', err, true);
                    resolve(false);
                  });
            });
          }
          // ************************************************************************************************
          //  REVENUS
          // ************************************************************************************************
          $scope.chargementRevenus = function () {
            return new Promise((resolve, reject) => {
              const backgroundColor = [
                  dashboardColors.gossip,
                  dashboardColors.white,
                  dashboardColors.silverTree,
                  dashboardColors.surfieGreen,
                  dashboardColors.blueStone
              ];
              const hoverBackgroundColor = [
                  colorHelper.shade(dashboardColors.gossip, 15),
                  colorHelper.shade(dashboardColors.white, 15),
                  colorHelper.shade(dashboardColors.silverTree, 15),
                  colorHelper.shade(dashboardColors.surfieGreen, 15),
                  colorHelper.shade(dashboardColors.blueStone, 15)
              ];
              let cptRev = 0;
              let labelsRev = [];
              let dataRev = [];
              let prcRev = [];
              let orderRev = [];

              const paramRev = { "idBudget" : $scope.ctrl.budgetCourant,
                                 "idSousPosteBudgetaireRegle" : null,
                                 "dateDebut" : $scope.dateDebut,
                                 "dateFin" : $scope.dateFin,
                                 "codeCategorie" : 'REV',
                                 "force" : 1,
                                 "codeCat1" : 'REV',
                                 "codeCat2" : 'AUT'
                               };

              ViAnalyseRegleSommaireInfoPosteResource.getParCategorie(paramRev).$promise
                  .then((result) => {
                    let prcArr = 0;
                    let prcArrFinal = 100;

                    for (let j = 0, tot2 = result.data.length; j < tot2; j++) {

                        if (j === (tot2 - 1)) {
                            prcArr = Math.round(prcArrFinal * 10) / 10;
                        } else {
                            prcArr = Math.round(result.data[j].pourcentage * 10) / 10;
                            prcArrFinal = prcArrFinal - prcArr;
                        }

                        labelsRev.push($translate.instant(result.data[j].description));
                        dataRev.push(result.data[j].montantFormat);
                        prcRev.push(prcArr);
                        orderRev.push(cptRev);

                        cptRev += 1;
                    }

                    if (result.data.length === 0) {
                        $scope.totalRev = "0.00";
                        $scope.charts[1] = {
                            color: pieColor,
                            description: $translate.instant("PARAM.CATEGORIE.REVENU"),
                            stats: "0.00",
                            typeIcon: 'glossy',
                            icon: 'Pay',
                            percent: 0
                        };
                        $scope.doughnutDataRev = {};
                    } else {
                        $scope.totalRev = result.data[cptRev - 1].montantTotalFormat;

                        $scope.doughnutDataRev = {
                          labels: labelsRev,
                          datasets: [{
                            data: dataRev,
                            backgroundColor: backgroundColor,
                            hoverBackgroundColor: hoverBackgroundColor,
                            percentage: prcRev,
                            order: orderRev
                          }]
                        };

                        $scope.charts[1] = {
                            color: pieColor,
                            description: $translate.instant("PARAM.CATEGORIE.REVENU"),
                            stats: result.data[cptRev - 1].montantTotalFormat,
                            typeIcon: 'glossy',
                            icon: 'Money',
                            percent: 0
                        };
                    }
                    resolve(true);

                  }).catch((err) => {
                    cuServices.message('ViAnalyseRegleSommaireInfoPosteResource', err, true);
                    resolve(false);
                  });
            });
          }

          // ************************************************************************************************
          //  COMPTES
          // ************************************************************************************************
          $scope.chargementComptes = function () {
            return new Promise((resolve, reject) => {
                const paramSousPoste = { "idBudget" : $scope.ctrl.budgetCourant,
                                         "comptePrincipal" : 1
                                       };

              SousPosteBudgetaireRegleResource.getCptPrinc(paramSousPoste).$promise
                  .then((result) => {
                    if (result.data.length > 0) {
                      $scope.totalCpt = "-";

                      var promise = prepareAnalyse.getSoldeCompte(result.data[0].id, $scope.dateFin);
                      promise.then(function(data) {
                        if (data.length > 0) {
                          $scope.totalCpt = data[0].soldeNum;
                          $scope.charts[2] = {
                              color: pieColor,
                              description: $translate.instant("ECRAN.TABLEAUBORD.SECTION_COMPTE"),
                              stats: $scope.totalCpt,
                              typeIcon: 'glossy',
                              icon: 'Bank',
                              percent: 0
                          };
                        } else {
                          $scope.totalCpt = "0.00";
                          $scope.charts[2] = {
                              color: pieColor,
                              description: $translate.instant("ECRAN.TABLEAUBORD.SECTION_COMPTE"),
                              stats: "0.00",
                              typeIcon: 'glossy',
                              icon: 'Bank',
                              percent: 0
                          };
                        }
                        resolve(true);
                      }).catch((err) => {
                        cuServices.message('prepareAnalyse.getSoldeCompte', err, true);
                        resolve(false);
                      });
                    } else {
                      resolve(true);
                    }

                  }).catch((err) => {
                    cuServices.message('SousPosteBudgetaireRegleResource', err, true);
                    resolve(false);
                  });
            });
          }

          $scope.chargementDashboard = function () {
            return new Promise(async (resolve, reject) => {
              $scope.doughnutDataDep = {};
              $scope.doughnutDataRev = {};

              await $scope.chargementDepenses();
              await $scope.chargementRevenus();
              await $scope.chargementComptes();

              resolve(true);
            });
          };

          let promise = $scope.calculOperation();
          promise.then(async function(value) {
            let promiseCharge =  $scope.chargementDashboard();
            promiseCharge.then(async function(value) {
              $scope.dashLoaded = true;
              $scope.$apply();
              $scope.$applyAsync();
            });
          });

          /*
          Les logos seront:
          -----------------------
          Revenu.....: Pay
          Dépense....: Money
          Compte.....: Bank
          Crédit.....: Bank cards
          Placement..: Stock
          Prêt.......: Credit
          */
          //
          // GESTION DU DATE RANGE picker
          //
          function cb(start, end) {
              $('#reportrange span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
          }

          const objRanges = {};
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.MOIS_COURANT")] = [moment().startOf('month'), moment().endOf('month')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIER_MOIS")] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.3DERNIER_MOIS")] = [moment().subtract(3, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.6DERNIER_MOIS")] = [moment().subtract(6, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.ANNEE_COURANTE")] = [moment().startOf('year'), moment().endOf('year')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIERE_ANNEE")] = [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')];
          objRanges[$translate.instant("ECRAN.TABLEAUBORD.CETTE_SEMAINE")] = [moment().startOf('week'), moment().endOf('week')];

          $('#reportrange').daterangepicker({
              startDate: start,
              endDate: end,
              opens: 'left',
              ranges: objRanges,
              locale: {
                  'format': 'YYYY-MM-DD',
                  'separator': ' - ',
                  'applyLabel': $translate.instant("GLOBALE.BOUTON.APPLIQUER"),
                  'cancelLabel': $translate.instant("GLOBALE.BOUTON.ANNULER"),
                  'fromLabel': $translate.instant("ECRAN.TABLEAUBORD.LIBELLE_DE"),
                  'toLabel': $translate.instant("ECRAN.TABLEAUBORD.LIBELLE_A"),
                  'customRangeLabel': $translate.instant("ECRAN.TABLEAUBORD.PERSONNALISE"),
                  'weekLabel': $translate.instant("ECRAN.TABLEAUBORD.LIBELLE_SEMAINE"),
                  'daysOfWeek': [
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.DIMANCHE"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.LUNDI"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.MARDI"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.MERCREDI"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.JEUDI"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.VENDREDI"),
                      $translate.instant("GLOBALE.JOUR_SEMAINE_COURT.SAMEDI")
                  ],
                  'monthNames': [
                      $translate.instant("GLOBALE.MOIS_COMPLET.JANVIER"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.FEVRIER"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.MARS"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.AVRIL"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.MAI"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.JUIN"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.JUILLET"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.AOUT"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.SEPTEMBRE"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.OCTOBRE"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.NOVEMBRE"),
                      $translate.instant("GLOBALE.MOIS_COMPLET.DECEMBRE")
                  ],
                  'firstDay': 0
              }
          }, cb);

          cb(start, end);

          $('#reportrange').on('apply.daterangepicker', function (ev, picker) {
              $scope.dateDebut = picker.startDate.format('YYYY-MM-DD');
              $scope.dateFin = picker.endDate.format('YYYY-MM-DD');

              $scope.ctrl.updateAxeVisibiliteUsager(2, $scope.dateDebut, false);
              $scope.ctrl.updateAxeVisibiliteUsager(3, $scope.dateFin, true);

              let promise = $scope.calculOperation();
              promise.then(function(value) {
                $scope.chargementDashboard();
                $scope.$apply();
              });
          });

        }
      }

      $rootScope.$watch('appLoad', (value) => {
        if (value) {
          $scope.prepareDashboard();
        }
      });
    }

})();
