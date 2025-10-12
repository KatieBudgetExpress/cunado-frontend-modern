(function () {
    'use strict';

    angular.module('i2sFinance.priver.budgetCalendrier')
        .controller('BudgetCtrl', BudgetCtrl);

    /** @ngInject */
    function BudgetCtrl($timeout,
                        $scope,
                        $rootScope,
                        $translate,
                        cuServices,
                        baConfig,
                        selectModal,
                        transactionDepRevModal,
                        transactionCompteModal,
                        transfertCompteModal,
                        ajustementSoldeModal,
                        prepareAnalyse,
                        colorHelper,
                        cuCurrency) {

        $rootScope.$watch('$activeLoadingPage', (newVal, oldVal) => {
            if (newVal !== oldVal && newVal === false) {
                $timeout(()=>{
                    $('#calendar').fullCalendar('rerenderEvents');
                },500);// IMPORTANT : NE PAS ENLEVER POUR CORRIGER LE PROBLÈME SUP-0008 !!!
            }
        });

        $scope.$watch('goOptionsFlux', (newVal, oldVal) => {
          if (newVal) {

            $scope.tickvalues = new Array($scope.dataFlux[0].values.length);
            $scope.tickformat = new Array($scope.dataFlux[0].values.length);
            for (let a = 0; a < $scope.dataFlux[0].values.length; a++) {
                $scope.header[a] = $scope.ctrl.languageSelected.code === "EN" ? moment($scope.dataFlux[0].values[a].date, 'YYYY-MM-DD').format('MMMM D, YYYY') : moment($scope.dataFlux[0].values[a].date, 'YYYY-MM-DD').format('D MMMM YYYY');
                $scope.tickvalues[a] = $scope.dataFlux[0].values[a].x;
                $scope.tickformat[a] = $scope.dataFlux[0].values[a].label;
            }

            // lineChart
            $scope.optionsFlux = {
                chart: {
                    type: 'lineChart',
                    height: 275,
                    margin: {
                        top: 20,
                        right: 10,
                        bottom: 40,
                        left: 60
                    },
                    x: function (d) {
                        return d.x;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    duration: 500,
                    useInteractiveGuideline: true,
                    forceY: [0, 0],
                    clipEdge: false,
                    noData: $translate.instant('ECRAN.CALENDRIER.MISE_A_JOUR_ZONE'),
                    xAxis: {
                        axisLabel: $scope.libelleAxeX,
                        showMaxMin: false,
                        tickValues: $scope.tickvalues,
                        tickFormat: function (d) {
                            return $scope.tickformat[d];
                        }
                    },
                    yAxis: {
                        showMaxMin: true,
                        tickFormat: function (d) {
                          //return d3.format('.2f')(d);
                          return d + ' ';
                        }
                    },
                    interactiveLayer: {
                      dispatch: {
                        elementMousemove: function(t,u){
                          if (isNaN(t.pointXValue)) {
                            $timeout(function() {
                              d3.selectAll('.nvtooltip').style('opacity', 0);
                            }, 100);
                          }
                        }
                      },                         
                      tooltip: {
                            hideDelay: 0,
                            headerEnabled: true,
                            valueFormatter: function (d, i) {
                              //return d3.format('.2f')(d) + $scope.ctrl.signe;
                              return cuCurrency.format(d, $scope.ctrl.devise);
                            },
                            headerFormatter: function (d, i) {
                                return $scope.header[d];
                            }
                        }
                    },
                    legend: {
                        margin: {
                            top: 5,
                            right: 0,
                            bottom: 20,
                            left: 0
                        },
                        updateState: true,
                        dispatch: {
                          stateChange: function(e) {
                            $scope.serieDisabled = e.disabled;
                          }
                        }
                    },
                    zoom: {
                        enabled: false
                    }
                }
            };
            $scope.goOptionsFlux = false;
            $scope.$applyAsync();
          }
        });

        $scope.status = {
            isopen: false
        };

        $scope.getTitreMonth = function () {
            const moment = $('#calendar').fullCalendar('getDate');
            return Object.keys(moment).length?moment.format('MMMM YYYY'):'';
        };

        $scope.ctrl.initMonthClick = function () {
            const containerMonth = $('.fc-center');
            containerMonth.css("display", "none");
        };

        $scope.getRangeDate = function () {
            const listDate = [];
            const dateNow = moment(new Date());
            //On set la liste 3 ans avant et 6 ans après
            listDate.push((dateNow.year()-3));
            listDate.push((dateNow.year()-2));
            listDate.push((dateNow.year()-1));
            listDate.push((dateNow.year()));
            listDate.push((dateNow.year()+1));
            listDate.push((dateNow.year()+2));
            listDate.push((dateNow.year()+3));
            listDate.push((dateNow.year()+4));
            listDate.push((dateNow.year()+5));
            listDate.push((dateNow.year()+6));

            return listDate;
        };

        $scope.toggledRangeDate = function (open) {
            if(open){
                const dateNow = moment(new Date());
                const container = $('#listdate');
                const scrollTo = $('#'+dateNow.year());
                container.animate({
                    scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
                });
            }
        };

        $scope.setDateCalendar = function (date) {
            $('#calendar').fullCalendar('gotoDate', moment(date).format('YYYY-MM-DD'));
        };

        $scope.serieDisabled = [];
        $scope.dateActive;
        $scope.typeTransfert;

        const calendrierColors = baConfig.colors.flux;
        // Gestion de la langue
        $scope.initialLocaleCode = $scope.ctrl.languageSelected.code === "EN" ? 'en' : 'fr-ca';
        moment.locale($scope.initialLocaleCode);

        // ************************************************************************************************
        //  Chargements du flux de trésorie
        // ************************************************************************************************
        $scope.chargementFluxTresorie = function (dateDebut, dateFin) {

          return new Promise((resolve, reject) => {
            $scope.data = [];
            $scope.dataFlux = [];
            $scope.dataFluxTri = [];
            $scope.series = [];
            $scope.tickvalues = [];
            $scope.tickformat = [];
            $scope.header = [];
            $scope.openIndexJour = [1];
            $scope.openIndexMois = [1];
            $scope.postesSolde = [];

            if ($scope.ctrl.languageSelected.code === "EN") {
              $scope.libelleAxeX = $translate.instant('ECRAN.CALENDRIER.LIBELLE_DU') +
                  moment(dateDebut, 'YYYY-MM-DD').format('MMMM D') +
                  $translate.instant('ECRAN.CALENDRIER.LIBELLE_AU') +
                  moment(dateFin, 'YYYY-MM-DD').format('MMMM D');
            } else {
              $scope.libelleAxeX = $translate.instant('ECRAN.CALENDRIER.LIBELLE_DU') +
                  moment(dateDebut, 'YYYY-MM-DD').format('D MMMM') +
                  $translate.instant('ECRAN.CALENDRIER.LIBELLE_AU') +
                  moment(dateFin, 'YYYY-MM-DD').format('D MMMM');
            }

            let promise = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 6, null, null, null, null);
            promise.then(function(value) {
              const data = value.data;
              let couleur = "";
              let count = data.length;

              // Pour chaque catégorie avec solde
              for (let i = 0, tot = data.length; i < tot; i++) {

                  // Ajoute le sousPosteBudgetaireRegle
                  $scope.series.push($translate.instant(data[i].nomSousPosteBudgetaireLov));

                  if (i === 0) {
                      couleur = calendrierColors.c1;
                  } else if (i === 1) {
                      couleur = calendrierColors.c2;
                  } else if (i === 2) {
                      couleur = calendrierColors.c3;
                  } else if (i === 3) {
                      couleur = calendrierColors.c4;
                  } else if (i === 4) {
                      couleur = calendrierColors.c5;
                  } else if (i === 5) {
                      couleur = calendrierColors.c6;
                  } else {
                      couleur = "";
                  }

                  let serieInactive = false;
                  if ($scope.serieDisabled[i]) {
                    serieInactive = true;
                  }

                  let promiseFlux = prepareAnalyse.getFlux($scope.ctrl.budgetCourant, dateDebut, dateFin, data[i], couleur, false, serieInactive);
                  promiseFlux.then(function(flux) {
                    $scope.dataFlux.push(flux);
                    $scope.dataFluxTri[i] = flux;

                    $scope.postesSolde.push({
                            idSousPosteBudgetaireRegle: data[i].id,
                            nom: $translate.instant(data[i].nomSousPosteBudgetaireLov),
                            soldeOuvJour: cuCurrency.format("0.00", $scope.ctrl.devise),
                            variationJour: cuCurrency.format("0.00", $scope.ctrl.devise),
                            soldeFerJour: cuCurrency.format("0.00", $scope.ctrl.devise),
                            soldeOuvMois: cuCurrency.format("0.00", $scope.ctrl.devise),
                            variationMois: cuCurrency.format("0.00", $scope.ctrl.devise),
                            soldeFerMois: cuCurrency.format("0.00", $scope.ctrl.devise),
                            tri: data[i].rn
                    });

                    count = count - 1;
                    if (count === 0) {
                      $scope.dataFlux = $scope.dataFluxTri;
                      $scope.goOptionsFlux = true;
                      resolve(true);
                    }
                  });
              }
            });
          });
        }

        // ************************************************************************************************
        //  Soldes journaliers
        // ************************************************************************************************
        $scope.chargementVariationJournaliere = function (dateActive) {

          return new Promise((resolve, reject) => {

            const dateHier = moment(dateActive, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD');

            // Gestion de l'entête
            $scope.tabLibelleJour = $scope.ctrl.languageSelected.code === "EN" ? $translate.instant('ECRAN.CALENDRIER.LIBELLE_LE') + moment(dateActive, 'YYYY-MM-DD').format('MMMM D, YYYY') : $translate.instant('ECRAN.CALENDRIER.LIBELLE_LE') + moment(dateActive, 'YYYY-MM-DD').format('D MMMM YYYY');

            let count = $scope.postesSolde.length;

            // On va chercher les soldes
            for (let i = 0, tot = $scope.postesSolde.length; i < tot; i++) {
                let soldeOuv = 0;
                let soldeFer = 0;
                let variation = 0;

                var promiseSoldeOuv = prepareAnalyse.getSoldeCompte($scope.postesSolde[i].idSousPosteBudgetaireRegle, dateHier);
                promiseSoldeOuv.then(function(soldeOuverture) {
                  if (soldeOuverture.length) {
                    $scope.postesSolde[i].soldeOuvJour = cuCurrency.format(soldeOuverture[0].solde, $scope.ctrl.devise);
                    soldeOuv = soldeOuverture[0].soldeNum;
                  } else {
                    $scope.postesSolde[i].soldeOuvJour = cuCurrency.format(0, $scope.ctrl.devise);;
                    soldeOuv = 0;
                  }

                  var promiseSoldeFer = prepareAnalyse.getSoldeCompte($scope.postesSolde[i].idSousPosteBudgetaireRegle, dateActive);
                  promiseSoldeFer.then(function(soldeFermeture) {
                    if (soldeFermeture.length) {
                      $scope.postesSolde[i].soldeFerJour = cuCurrency.format(soldeFermeture[0].solde, $scope.ctrl.devise);
                      soldeFer = soldeFermeture[0].soldeNum;
                    } else {
                      $scope.postesSolde[i].soldeFerJour = cuCurrency.format(0, $scope.ctrl.devise);;
                      soldeFer = 0
                    }
                    // Trouve la variation
                    variation = soldeFer - soldeOuv;
                    $scope.postesSolde[i].variationJour = cuCurrency.format(variation, $scope.ctrl.devise);
                  });
                });

                count = count - 1;
                if (count === 0) {
                  $scope.$applyAsync();
                  resolve(true);
                }
            }
          });
        }

        // ************************************************************************************************
        //  Soldes mensuels
        // ************************************************************************************************
        $scope.chargementVariationMensuelle = function (dateDebut) {

          return new Promise((resolve, reject) => {
            const dateFinMois = moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
            const dateDernierJourMois = moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD');

            // Gestion de l'entête
            $scope.tabLibelleMois = $translate.instant('ECRAN.CALENDRIER.LIBELLE_EN') + moment(dateDebut, 'YYYY-MM-DD').format('MMMM YYYY');

            let count = $scope.postesSolde.length;

            // On va chercher les soldes
            for (let i = 0, tot = $scope.postesSolde.length; i < tot; i++) {
                let soldeOuv = 0;
                let soldeFer = 0;
                let variation = 0;

                var promiseSoldeOuv = prepareAnalyse.getSoldeCompte($scope.postesSolde[i].idSousPosteBudgetaireRegle, dateDernierJourMois);
                promiseSoldeOuv.then(function(soldeOuverture) {
                  if (soldeOuverture.length) {
                    //$scope.postesSolde[i].soldeOuvMois = data[0].solde + $scope.ctrl.signe;
                    $scope.postesSolde[i].soldeOuvMois = cuCurrency.format(soldeOuverture[0].solde, $scope.ctrl.devise);
                    soldeOuv = soldeOuverture[0].soldeNum;
                  } else {
                    $scope.postesSolde[i].soldeOuvMois = cuCurrency.format(0, $scope.ctrl.devise);
                    soldeOuv = 0;
                  }

                  var promiseSoldeFer = prepareAnalyse.getSoldeCompte($scope.postesSolde[i].idSousPosteBudgetaireRegle, dateFinMois);
                  promiseSoldeFer.then(function(soldeFermeture) {
                    if (soldeFermeture.length) {
                      //$scope.postesSolde[i].soldeFerMois = data[0].solde + $scope.ctrl.signe;
                      $scope.postesSolde[i].soldeFerMois = cuCurrency.format(soldeFermeture[0].solde, $scope.ctrl.devise);
                      soldeFer = soldeFermeture[0].soldeNum;
                    } else {
                      $scope.postesSolde[i].soldeFerMois = cuCurrency.format(0, $scope.ctrl.devise);
                      soldeFer = 0;
                    }
                    // Trouve la variation
                    variation = soldeFer - soldeOuv;
                    //$scope.postesSolde[i].variationMois = d3.format('.2f')(variation) + $scope.ctrl.signe;
                    $scope.postesSolde[i].variationMois = cuCurrency.format(variation, $scope.ctrl.devise);
                  });
                });

                count = count - 1;
                if (count === 0) {
                  $scope.$applyAsync();
                  resolve(true);
                }
            }
          });
        }

        $scope.ajusterSolde = function (poste) {
            ///$scope;
//            alert("Ajustement de solde pour:" + poste.nom);
        }

        $scope.ajoutAjustement = function () {
          let objetListe = [];
          let objetActuel = {};

          let promiseRegle = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 4, 5, 6, null, null);
          promiseRegle.then(function(value) {
            if (value.data.length > 0) {
                objetListe = value.data;
            }
            if (objetListe.length > 0) {
              const titre = $translate.instant("PARAM.TYPE_OPERATION.AJUSTEMENT") + ': ' + $translate.instant("GLOBALE.AIDE.SELECTIONNEROPERATION");
              const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
              const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
              const selectOption = "item as item.nomSousPosteBudgetaireLov | translate group by item.nomPosteBudgetaire | translate for item in objetListe | orderBy:'nomSousPosteBudgetaireLov | translate':false:localeSensitiveComparator | orderBy:'tri | translate':false:localeSensitiveComparator track by item.id";

              selectModal(boutonOk, boutonAnnuler, titre, objetActuel, objetListe, selectOption).result.then(function (idSousPosteBudgetaireRegle) {
                  if (idSousPosteBudgetaireRegle) {
                    const dateDebut = $('#calendar').fullCalendar('getView').start.format('YYYY-MM-DD');
                    const titreCreer = $translate.instant("GLOBALE.AIDE.CREER_AJUSTEMENT");
                    const boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
                    const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

                    ajustementSoldeModal(boutonCreer, false, boutonAnnuler, titreCreer, $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, null, $scope.ctrl.signe, true, $scope.dateActive).result.then(function(retour) {
                        if (retour) {
                          forceReloadCalendar();
/*
                          let promiseChargement = $scope.$$childHead.chargementEvenement(moment(dateDebut, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD'),
                                                                                         moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                          promiseChargement.then(function(chargement) {

                            let promiseFlux = $scope.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                            moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                            promiseFlux.then(function(chargement) {

                              let promiseVariationJournaliere = $scope.chargementVariationJournaliere($scope.dateActive);
                              promiseVariationJournaliere.then(function(varJournaliere) {

                                let promiseVariationMensuelle = $scope.chargementVariationMensuelle($scope.dateActive);
                                promiseVariationMensuelle.then(function(varMensuelle) {
                                  forceReloadCalendar();
                                });
                              });
                            });
                          });
*/
                         }
                      });
                  }
              });
            }
          }).catch(function(err) {
            cuServices.message("get", err, true);
          });
        }

        $scope.ajoutTransaction = function (codeCategorie) {

            $scope.categorie = $rootScope.arrayCategorie.find(categorie => categorie.code === codeCategorie);
            const dateDebut = $('#calendar').fullCalendar('getView').start.format('YYYY-MM-DD');

            if (codeCategorie === 'REV' || codeCategorie === 'DEP') {
                transactionDepRevModal($scope.categorie, null, null, $scope.ctrl.budgetCourant, 1, 1, $scope.ctrl.signe, false, $scope.dateActive).result.then(function (retour) {
                    if (retour) {
                      forceReloadCalendar();
/*
                      let promiseChargement = $scope.$$childHead.chargementEvenement(moment(dateDebut, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD'),
                                                                                     moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                      promiseChargement.then(function(chargement) {
                        let promiseFlux = $scope.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                        moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                        promiseFlux.then(function(chargement) {

                          let promiseVariationJournaliere = $scope.chargementVariationJournaliere($scope.dateActive);
                          promiseVariationJournaliere.then(function(varJournaliere) {

                            let promiseVariationMensuelle = $scope.chargementVariationMensuelle($scope.dateActive);
                            promiseVariationMensuelle.then(function(varMensuelle) {
                              forceReloadCalendar();
                            });
                          });
                        });
                      });
*/
                    }
                });
            } else {
              let objetListe = [];
              let objetActuel = {};

              let promiseRegle = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, $scope.categorie.id, null, null, null, null, null);
              promiseRegle.then(function(value) {
                if (value.data.length > 0) {
                    objetListe = value.data;
                }
                if (objetListe.length > 0) {
                  let titre = '';
                  const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                  const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
                  const selectOption = "item as item.nomSousPosteBudgetaireLov | translate group by item.nomPosteBudgetaire | translate for item in objetListe | orderBy:'nomSousPosteBudgetaireLov | translate':false:localeSensitiveComparator | orderBy:'nomSousPosteBudgetaireLov | translate':false:localeSensitiveComparator track by item.id";

                  // Ici on regarde quel type de transfert on veut faire
                  if (codeCategorie === 'CPT') {
                    titre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_COMPTE") + ': ' + $translate.instant("GLOBALE.AIDE.SELECTIONNEROPERATION");

                  } else if (codeCategorie === 'CRE') {
                    titre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_REMBOURSEMENT") + ': ' + $translate.instant("GLOBALE.AIDE.SELECTIONNEROPERATION");

                  } else if (codeCategorie === 'EPA') {
                    titre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_VERSEMENT") + ': ' + $translate.instant("GLOBALE.AIDE.SELECTIONNEROPERATION");

                  } else if (codeCategorie === 'PRE') {
                    titre = $translate.instant("ECRAN.TRANSACTION.TRANSFERT_PAIEMENT") + ': ' + $translate.instant("GLOBALE.AIDE.SELECTIONNEROPERATION");

                  }

                  selectModal(boutonOk, boutonAnnuler, titre, objetActuel, objetListe, selectOption).result.then(function (idSousPosteBudgetaireRegle) {
                      if (idSousPosteBudgetaireRegle) {
                        const boutonCreer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
                        const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
                        const titreCreer = $translate.instant("GLOBALE.AIDE.CREER_TRANSFERT");

//                        console.log('On ouvre ' + codeCategorie);
                        // Ici on regarde quel type de transfert on veut faire
                        if (codeCategorie === 'CPT') {
                          $scope.typeTransfert = "TRFCPT";
                        } else if (codeCategorie === 'CRE') {
                          $scope.typeTransfert = 'REMB';
                        } else if (codeCategorie === 'EPA') {
                          $scope.typeTransfert = 'VERS';
                        } else if (codeCategorie === 'PRE') {
                          $scope.typeTransfert = 'PAIE';
                        }

                        transfertCompteModal(boutonCreer, false, boutonAnnuler, titreCreer, $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, null, $scope.ctrl.signe, true, codeCategorie, $scope.typeTransfert, $scope.dateActive).result.then(function(retour) {
                          if (retour) {
                            forceReloadCalendar();
/*
                            let promiseChargement = $scope.$$childHead.chargementEvenement(moment(dateDebut, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD'),
                                                                                           moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                            promiseChargement.then(function(chargement) {

                              let promiseFlux = $scope.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                              moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                              promiseFlux.then(function(chargement) {

                                let promiseVariationJournaliere = $scope.chargementVariationJournaliere($scope.dateActive);
                                promiseVariationJournaliere.then(function(varJournaliere) {

                                  let promiseVariationMensuelle = $scope.chargementVariationMensuelle($scope.dateActive);
                                  promiseVariationMensuelle.then(function(varMensuelle) {
                                    forceReloadCalendar();
                                  });
                                });
                              });
                            });
*/
                           }
                        });
                      }
                  });
                } else {
                  transactionCompteModal($scope.categorie, null, null, $scope.ctrl.budgetCourant, 1, $scope.ctrl.signe, $scope.ctrl.devise, false, $scope.dateActive).result.then(function (retour) {
                      if (retour) {
                        forceReloadCalendar();
/*
                        let promiseChargement = $scope.$$childHead.chargementEvenement(moment(dateDebut, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD'),
                                                                                       moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                        promiseChargement.then(function(chargement) {

                          let promiseFlux = $scope.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                          moment(dateDebut, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                          promiseFlux.then(function(chargement) {

                            let promiseVariationJournaliere = $scope.chargementVariationJournaliere($scope.dateActive);
                            promiseVariationJournaliere.then(function(varJournaliere) {

                              let promiseVariationMensuelle = $scope.chargementVariationMensuelle($scope.dateActive);
                              promiseVariationMensuelle.then(function(varMensuelle) {
                                forceReloadCalendar();
                              });
                            });
                          });
                        });
*/
                      }
                  });
                }
              }).catch(function(err) {
                cuServices.message("get", err, true);
              });
            }
        };

        // Vu qu'on utilise "viewRender" il est seulement déclenché lors du rendu d'une nouvelle plage de dates ou lorsque le type d'affichage change.
	    // Ce petit hack permet de changer la vue sans la changer (invisible pour l'utilisateur). à voir plus tard si le calendrier peut changer de vu, mais pour le moment seul la vision mois est disponible
	    function forceReloadCalendar() {
		    $('#calendar').fullCalendar('changeView', 'agendaDay');
		    $('#calendar').fullCalendar('changeView', 'month');
	    }
    }
})();
