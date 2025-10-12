(function () {
    'use strict';

    angular.module('i2sFinance.priver.analyse')
        .controller('AnalyseCtrl', AnalyseCtrl);

    /** @ngInject */
    function AnalyseCtrl($scope,
                         $rootScope,
                         $filter,
                         $timeout,
                         $translate,
                         cuServices,
                         baConfig,
                         prepareAnalyse,
                         colorHelper,
                         printer,
                         cuCurrency,
                         cuExportExcel) {

        const vm = this;
        const analyseColors = baConfig.colors.flux;
        const dashboardColors = baConfig.colors.dashboard;

        let dateDuJour;
        if ($rootScope.budgetActif.dateDebut !== null && $rootScope.budgetActif.dateDebut !== '' && moment(new Date()).isBefore(moment($rootScope.budgetActif.dateDebut))) {
          dateDuJour = $rootScope.budgetActif.dateDebut;
        }  else {
          dateDuJour = moment(new Date()).format("YYYY-MM-DD");
        }

        let start = moment(dateDuJour).startOf('month');
        let end = moment(dateDuJour).endOf('month');

        $scope.boutonActionInactif = false;
        $scope.estAnalyser = false;
        $scope.estPret = false;
        $scope.rapportActif = 0;
        $scope.analyseListeCompte = [];
        $scope.analyseCompteData = [];
        $scope.analyseDepRevData = [];
        $scope.analyseDepRevVentilation = [];
        $scope.analyseRevDataPosteBudgetaires = [];
        $scope.analyseRevDataSousPosteBudgetaires = [];
        $scope.analyseDepDataPosteBudgetaires = [];
        $scope.analyseDepDataSousPosteBudgetaires = [];
        $scope.analyseTotalRevenu = 0;
        $scope.analyseTotalDepense = 0;
        $scope.analyseTotalRevenuPlanifie = 0;
        $scope.analyseTotalRevenuDifference = 0;
        $scope.analyseTotalDepensePlanifie = 0;
        $scope.analyseTotalDepenseDifference = 0;
        $scope.analyseDiffRevenuDep = 0;
        $scope.analyseDiffRevenuDepPlanif = 0;
        $scope.analyseDiffRevenuDepDiff = 0;
        $scope.analyseTotalCptEntreesReel = 0;
        $scope.analyseTotalCptEntreesPlanifie = 0;
        $scope.analyseTotalCptEntreesDiff = 0;
        $scope.analyseTotalCptSortiesReel = 0;
        $scope.analyseTotalCptSortiesPlanifie = 0;
        $scope.analyseTotalCptSortiesDiff = 0;
        $scope.analyseTotalDepRevEntreesReel = 0;
        $scope.analyseTotalDepRevEntreesPlanifie = 0;
        $scope.analyseTotalDepRevEntreesDiff = 0;
        $scope.analyseTotalDepRevSortiesReel = 0;
        $scope.analyseTotalDepRevSortiesPlanifie = 0;
        $scope.analyseTotalDepRevSortiesDiff = 0;
        $scope.analyseDiffDepRevES = 0;
        $scope.analyseDiffDepRevESPlanif = 0;
        $scope.analyseDiffDepRevESDiff = 0;
        $scope.entreesDepRevOver = false;
        $scope.entreesDepRevPlanifOver = false;
        $scope.entreesDepRevDiffOver = false;
        $scope.revOver = false;
        $scope.revOverPlanif = false;
        $scope.revOverDiff = false;
        $scope.revDiffPos = true;
        $scope.depDiffPos = true;
        $scope.entreesDiffPos = true;
        $scope.sortiesDiffPos = true;
        $scope.analyseSoldeTotalCompte = 0;
        $scope.analyseSoldeTotalCredit = 0;
        $scope.analyseSoldeTotalPret = 0;
        $scope.analyseSoldeTotalEpargne = 0;
        $scope.revenuData = false;
        $scope.depenseData = false;
        $scope.compteData = false;
        $scope.creditData = false;
        $scope.epargneData = false;
        $scope.pretData = false;
        $scope.doughnutDataDep = {};
        $scope.doughnutDataRev = {};

        $scope.switcherValues = {
            revenu: true,
            depense: true,
            compte: true,
            credit: true,
            epargne: true,
            pret: true,
            comparatif: false,
            conciliation: false,
            poste: false,
            sousPoste: false,
            graphique: false
        };

        $scope.picture = $filter('appImage')('pic-i2s-64.png');

        $scope.$watch('switcherValues.revenu', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.depense', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.compte', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.credit', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.epargne', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.pret', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.comparatif', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.conciliation', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.poste', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });
        $scope.$watch('switcherValues.sousPoste', (newVal, oldVal) => {
          $scope.estAnalyser = false;
      });
        $scope.$watch('switcherValues.graphique', (newVal, oldVal) => {
            $scope.estAnalyser = false;
        });

        $scope.switcherValuesChange = function (switcher) {
            $scope.estAnalyser = false;
        };

        // Gestion de la langue
        $scope.initialLocaleCode = $scope.ctrl.languageSelected.code === "EN" ? 'en' : 'fr-ca';
        moment.locale($scope.initialLocaleCode);

        // Trouver les Comptes de banque et de carte de crédit
        let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParLovTous",$scope.ctrl.budgetCourant, 3, 6, null, null, null, null);
        promiseOptions.then(function(value) {
          $scope.compteOptions = value.data;
          // On choisi le compte principal par défaut
          $scope.compteSelected = value.data[0];
          $scope.$applyAsync();
        });

        $scope.compteChange = function (compte) {
            $scope.compteSelected = compte;
            $scope.estAnalyser = false;
            $scope.$applyAsync();
        };

        $scope.chargementInitial = function () {
            $scope.rapports = [];
            $scope.rapports.push({
                    id: 0,
                    nom: $translate.instant("ECRAN.ANALYSE.RAPPORT1"),
                    actif: false
                }
            );
            $scope.rapports.push({
                    id: 1,
                    nom: $translate.instant("ECRAN.ANALYSE.RAPPORT2"),
                    actif: false
                }
            );
            $scope.rapports.push({
                    id: 2,
                    nom: $translate.instant("ECRAN.ANALYSE.RAPPORT3"),
                    actif: false
                }
            );
            $scope.rapports.push({
                    id: 3,
                    nom: $translate.instant("ECRAN.ANALYSE.RAPPORT4"),
                    actif: false
                }
            );
        };

        $scope.selectionneRapport = function (index) {
            $scope.rapports[0].actif = false;
            $scope.rapports[1].actif = false;
            $scope.rapports[2].actif = false;
            $scope.rapports[3].actif = false;
            $scope.rapports[index].actif = true;

            if (index !== $scope.rapportActif) {
                $scope.rapportActif = index;
                $scope.estAnalyser = false;
            }
        };

        $scope.chargementInitial();
        $scope.selectionneRapport(0);

        $scope.actionImprimer = function () {
            const tableHtml = getElementByID('zoneImprimable').innerHTML
                .replace(/(ng-\w+-\w+="(.|\n)*?"|ng-\w+="(.|\n)*?"|ng-(\w+-\w+)|ng-(\w+))/g, '')
                .replace(/<!--(.*?)-->/gm, "");
            printer(tableHtml);
        };

        $scope.actionExporterExcel = function () {
          const tableHtml = getElementByID('zoneImprimable');
          if ($scope.rapportActif === 0) {
            cuExportExcel(tableHtml, 'Analyse',[1],[1]);
          } else if ($scope.rapportActif === 1) {
            cuExportExcel(tableHtml, 'Analyse',[0],[0]);
          } else if ($scope.rapportActif === 2) {
            cuExportExcel(tableHtml, 'Analyse',null,null);
          }
        };

        // id:4  ecran:ANALYSE  composant:DATE_DEBUT
        const axeVisibilites4 = $scope.ctrl.axesVisibilites.find((axe) => axe.id === 4); //on applique la recherche une seule fois (meilleur performance)
        if (axeVisibilites4.valeur !== "") {
            start = moment(axeVisibilites4.valeur, "YYYY-MM-DD");
        }

        // id:5  ecran:ANALYSE  composant:DATE_FIN
        const axeVisibilites5 = $scope.ctrl.axesVisibilites.find(axe => axe.id === 5); //on applique la recherche une seule fois (meilleur performance)
        if (axeVisibilites5.valeur !== "") {
            end = moment(axeVisibilites5.valeur, "YYYY-MM-DD");
        }

        $scope.dateDebut = start.format("YYYY-MM-DD");
        $scope.dateFin = end.format("YYYY-MM-DD");

        //
        // GESTION DU DATE RANGE picker
        //
        function cb(start, end) {
            $('#reportrange_analyse span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
        }

        const objRanges = {};
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.MOIS_COURANT")] = [moment().startOf('month'), moment().endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIER_MOIS")] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.3DERNIER_MOIS")] = [moment().subtract(3, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.6DERNIER_MOIS")] = [moment().subtract(6, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.ANNEE_COURANTE")] = [moment().startOf('year'), moment().endOf('year')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIERE_ANNEE")] = [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.CETTE_SEMAINE")] = [moment().startOf('week'), moment().endOf('week')];

        $('#reportrange_analyse').daterangepicker({
            startDate: start,
            endDate: end,
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

        $('#reportrange_analyse').on('apply.daterangepicker', function (ev, picker) {

            $scope.dateDebut = picker.startDate.format('YYYY-MM-DD');
            $scope.dateFin = picker.endDate.format('YYYY-MM-DD');

            $scope.ctrl.updateAxeVisibiliteUsager(4, $scope.dateDebut, false);
            $scope.ctrl.updateAxeVisibiliteUsager(5, $scope.dateFin, true);

            if ($scope.estAnalyser) {
                $scope.analyse($scope.rapportActif);
            }

            $scope.$apply();

        });

        function getElementByID(id) {
            const elements = angular.element('#' + id);
            return elements.length ? elements[0] : null;
        }

        $scope.chargementAnalyseDetailleeSectionCompteCredit = function (idSousPosteBudgetaireRegle) {
          return new Promise((resolve, reject) => {
            if ($scope.switcherValues.compte || $scope.switcherValues.credit || $scope.switcherValues.epargne || $scope.switcherValues.pret) {
              let promise = cuServices.viRapportDetailleSectionCompteCredit("getParSousPoste",idSousPosteBudgetaireRegle);
              promise.then(function(value) {
                let data2 = value.data;
                for (let j = 0, tot2 = data2.length; j < tot2; j++) {

                    $scope.analyseCompteData[$scope.cpt] = {
                        idCompte: data2[j].idSousPosteBudgetaireRegle,
                        date: data2[j].date,
                        image: data2[j].image,
                        operation: $translate.instant(data2[j].description),
                        entree: data2[j].montantEntree,
                        sortie: data2[j].montantSortie,
                        solde: data2[j].solde,
                        reel: data2[j].montantReel,
                        planifie: data2[j].montantPlanifie,
                        entreePlanifie: data2[j].montantEntreePlanifie,
                        sortiePlanifie: data2[j].montantSortiePlanifie,
                        difference: data2[j].montantDifference,
                        concilie: data2[j].concilie,
                        tri: data2[j].tri
                    };
                    // Total des entrées
                    $scope.analyseTotalCptEntreesReel     = $scope.analyseTotalCptEntreesReel + parseFloat(data2[j].montantEntree === null ? 0 : data2[j].montantEntree);
                    $scope.analyseTotalCptEntreesPlanifie = $scope.analyseTotalCptEntreesPlanifie + parseFloat(data2[j].montantEntreePlanifie === null ? 0 : data2[j].montantEntreePlanifie);
                    $scope.analyseTotalCptEntreesDiff = $scope.analyseTotalCptEntreesReel - $scope.analyseTotalCptEntreesPlanifie;
                    // Total es sorties
                    $scope.analyseTotalCptSortiesReel = $scope.analyseTotalCptSortiesReel + parseFloat(data2[j].montantSortie === null ? 0 : data2[j].montantSortie);
                    $scope.analyseTotalCptSortiesPlanifie = $scope.analyseTotalCptSortiesPlanifie + parseFloat(data2[j].montantSortiePlanifie === null ? 0 : data2[j].montantSortiePlanifie);
                    $scope.analyseTotalCptSortiesDiff = $scope.analyseTotalCptSortiesPlanifie - $scope.analyseTotalCptSortiesReel;
                    $scope.cpt += 1;
                }
                resolve(true);

              }).catch(function(err) {
                cuServices.message("get", err, true);
                resolve(false);
              });
            } else {
              resolve(true);
            }
          });
        }

        $scope.chargementAnalyseDetailleeSectionDepRev = function (categorieRevenu, categorieDepense, idSousPosteBudgetaireRegle) {
          return new Promise((resolve, reject) => {
            if ($scope.switcherValues.depense || $scope.switcherValues.revenu) {
              let promise = cuServices.viRapportDetailleSectionDepRev("getParBudgetCat", $scope.ctrl.budgetCourant, categorieRevenu, categorieDepense, idSousPosteBudgetaireRegle);
              promise.then(function(value) {
                let data3 = value.data;
                let cpt = 0;

                for (let j = 0, tot2 = data3.length; j < tot2; j++) {

                    $scope.analyseDepRevData[cpt] = {
                        idRegle: data3[j].idRegle,
                        date: data3[j].date,
                        image: data3[j].image,
                        operation: $translate.instant(data3[j].description),
                        nomPoste: $translate.instant(data3[j].nomPosteBudgetaire),
                        entree: data3[j].montantEntree,
                        sortie: data3[j].montantSortie,
                        solde: data3[j].solde,
                        reel: data3[j].montantReel,
                        planifie: data3[j].montantPlanifie,
                        entreePlanifie: data3[j].montantEntreePlanifie,
                        sortiePlanifie: data3[j].montantSortiePlanifie,
                        difference: data3[j].montantDifference,
                        concilie: data3[j].concilie
                    };

                    // Total des entrées
                    $scope.analyseTotalDepRevEntreesReel     = $scope.analyseTotalDepRevEntreesReel + parseFloat(data3[j].montantEntree === null ? 0 : data3[j].montantEntree);
                    $scope.analyseTotalDepRevEntreesPlanifie = $scope.analyseTotalDepRevEntreesPlanifie + parseFloat(data3[j].montantEntreePlanifie === null ? 0 : data3[j].montantEntreePlanifie);
                    $scope.analyseTotalDepRevEntreesDiff = $scope.analyseTotalDepRevEntreesReel - $scope.analyseTotalDepRevEntreesPlanifie;
                    // Total es sorties
                    $scope.analyseTotalDepRevSortiesReel = $scope.analyseTotalDepRevSortiesReel + parseFloat(data3[j].montantSortie === null ? 0 : data3[j].montantSortie);
                    $scope.analyseTotalDepRevSortiesPlanifie = $scope.analyseTotalDepRevSortiesPlanifie + parseFloat(data3[j].montantSortiePlanifie === null ? 0 : data3[j].montantSortiePlanifie);
                    $scope.analyseTotalDepRevSortiesDiff = $scope.analyseTotalDepRevSortiesPlanifie - $scope.analyseTotalDepRevSortiesReel;
                    cpt += 1;
                }
                resolve(true);

              }).catch(function(err) {
                cuServices.message("get", err, true);
                resolve(false);
              });
            } else {
              resolve(true);
            }
          });
        }

        //**************************
        // Pour tous les comptes
        //**************************
        $scope.chargementAnalyseDetailleeTous = function (categorieRevenu, categorieDepense) {
          return new Promise(async (resolve, reject) => {
            // Génération des soldes
            let promiseRegle = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 6, 4, 5, null, null);
            promiseRegle.then(async function(value) {
              let data = value.data;
              //
              let idxCompte = 0;
              $scope.cpt = 0;
              // Pour chaque catégorie avec solde
              for (let i = 0, tot = data.length; i < tot; i++) {
                  // Conserve la liste des compte et crédit
                  $scope.analyseListeCompte[idxCompte] = {
                      idx: idxCompte,
                      id: data[i].id,
                      idCategorie: data[i].idCategorie,
                      description: data[i].nomSousPosteBudgetaireLov,
                      totalCptEntreesReel: 0,
                      totalCptEntreesPlanifie: 0,
                      totalCptEntreesDiff: 0,
                      totalCptSortiesReel: 0,
                      totalCptSortiesPlanifie: 0,
                      totalCptSortiesDiff: 0,
                      diffCptES: 0,
                      diffCptESPlanif: 0,
                      diffCptESDiff: 0,
                      entreesCptOver: 0,
                      entreesPlanCptOver: true,
                      entreesDiffCptOver: true,
                      entreesDiffPos: true,
                      sortiesDiffPos: true
                  };
                  idxCompte += 1;
                  //
                  await $scope.chargementAnalyseDetailleeSectionCompteCredit(data[i].id);
                  // On set les totaux

                  //REEL CPT/CRE
                  $scope.analyseListeCompte[idxCompte-1].diffCptES = $scope.analyseTotalCptEntreesReel - $scope.analyseTotalCptSortiesReel;
                  if ($scope.analyseListeCompte[idxCompte-1].diffCptES >= 0) {
                    $scope.analyseListeCompte[idxCompte-1].entreesCptOver = true;
                  } else {
                    $scope.analyseListeCompte[idxCompte-1].entreesCptOver = false;
                  }

                  // PLANIF
                  $scope.analyseListeCompte[idxCompte-1].diffCptESPlanif = $scope.analyseTotalCptEntreesPlanifie - $scope.analyseTotalCptSortiesPlanifie;
                  if ($scope.analyseListeCompte[idxCompte-1].diffCptESPlanif >= 0) {
                    $scope.analyseListeCompte[idxCompte-1].entreesPlanCptOver = true;
                  } else {
                    $scope.analyseListeCompte[idxCompte-1].entreesPlanCptOver = false;
                  }

                  // DIFFÉRENCE
                  $scope.analyseListeCompte[idxCompte-1].diffCptESDiff = $scope.analyseTotalCptEntreesDiff + $scope.analyseTotalCptSortiesDiff;
                  if ($scope.analyseListeCompte[idxCompte-1].diffCptESDiff >= 0) {
                    $scope.analyseListeCompte[idxCompte-1].entreesDiffCptOver = true;
                  } else {
                    $scope.analyseListeCompte[idxCompte-1].entreesDiffCptOver = false;
                  }
                  $scope.analyseListeCompte[idxCompte-1].entreesDiffPos = $scope.analyseTotalCptEntreesDiff >= 0 ? true : false;
                  $scope.analyseListeCompte[idxCompte-1].sortiesDiffPos = $scope.analyseTotalCptSortiesDiff >= 0 ? true : false;

                  $scope.analyseListeCompte[idxCompte-1].totalCptEntreesReel = $scope.analyseTotalCptEntreesReel;
                  $scope.analyseListeCompte[idxCompte-1].totalCptEntreesPlanifie = $scope.analyseTotalCptEntreesPlanifie;
                  $scope.analyseListeCompte[idxCompte-1].totalCptEntreesDiff = $scope.analyseTotalCptEntreesDiff;
                  $scope.analyseListeCompte[idxCompte-1].totalCptSortiesReel = $scope.analyseTotalCptSortiesReel;
                  $scope.analyseListeCompte[idxCompte-1].totalCptSortiesPlanifie = $scope.analyseTotalCptSortiesPlanifie;
                  $scope.analyseListeCompte[idxCompte-1].totalCptSortiesDiff = $scope.analyseTotalCptSortiesDiff;

                  $scope.analyseTotalCptEntreesReel     = 0;
                  $scope.analyseTotalCptEntreesPlanifie = 0;
                  $scope.analyseTotalCptEntreesDiff     = 0;
                  $scope.analyseTotalCptSortiesReel     = 0;
                  $scope.analyseTotalCptSortiesPlanifie = 0;
                  $scope.analyseTotalCptSortiesDiff     = 0;
              }

              // On amène tous les dépenses et revenus
              if ($scope.switcherValues.depense || $scope.switcherValues.revenu) {
                await $scope.chargementAnalyseDetailleeSectionDepRev(categorieRevenu, categorieDepense, null);
              }
              resolve(true);

            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        }
        $scope.chargementAnalyseDetailleeSimple = function (categorieRevenu, categorieDepense) {
          return new Promise(async (resolve, reject) => {
            // Conserve la liste des compte et crédit
            $scope.analyseListeCompte[0] = {
                idx: 0,
                id: $scope.compteSelected.id,
                idCategorie: $scope.compteSelected.idCategorie,
                description: $scope.compteSelected.nomSousPosteBudgetaireLov,
                totalCptEntreesReel: 0,
                totalCptEntreesPlanifie: 0,
                totalCptEntreesDiff: 0,
                totalCptSortiesReel: 0,
                totalCptSortiesPlanifie: 0,
                totalCptSortiesDiff: 0,
                diffCptES: 0,
                diffCptESPlanif: 0,
                diffCptESDiff: 0,
                entreesCptOver: 0,
                entreesPlanCptOver: true,
                entreesDiffCptOver: true,
                entreesDiffPos: true,
                sortiesDiffPos: true
            };
            //
            $scope.cpt = 0;
            await $scope.chargementAnalyseDetailleeSectionCompteCredit($scope.compteSelected.id);
            // On set les totaux

            //REEL CPT/CRE
            $scope.analyseListeCompte[0].diffCptES = $scope.analyseTotalCptEntreesReel - $scope.analyseTotalCptSortiesReel;
            if ($scope.analyseListeCompte[0].diffCptES >= 0) {
              $scope.analyseListeCompte[0].entreesCptOver = true;
            } else {
              $scope.analyseListeCompte[0].entreesCptOver = false;
            }

            // PLANIF
            $scope.analyseListeCompte[0].diffCptESPlanif = $scope.analyseTotalCptEntreesPlanifie - $scope.analyseTotalCptSortiesPlanifie;
            if ($scope.analyseListeCompte[0].diffCptESPlanif >= 0) {
              $scope.analyseListeCompte[0].entreesPlanCptOver = true;
            } else {
              $scope.analyseListeCompte[0].entreesPlanCptOver = false;
            }

            // DIFFÉRENCE
            $scope.analyseListeCompte[0].diffCptESDiff = $scope.analyseTotalCptEntreesDiff + $scope.analyseTotalCptSortiesDiff;
            if ($scope.analyseListeCompte[0].diffCptESDiff >= 0) {
              $scope.analyseListeCompte[0].entreesDiffCptOver = true;
            } else {
              $scope.analyseListeCompte[0].entreesDiffCptOver = false;
            }
            $scope.analyseListeCompte[0].entreesDiffPos = $scope.analyseTotalCptEntreesDiff >= 0 ? true : false;
            $scope.analyseListeCompte[0].sortiesDiffPos = $scope.analyseTotalCptSortiesDiff >= 0 ? true : false;

            $scope.analyseListeCompte[0].totalCptEntreesReel = $scope.analyseTotalCptEntreesReel;
            $scope.analyseListeCompte[0].totalCptEntreesPlanifie = $scope.analyseTotalCptEntreesPlanifie;
            $scope.analyseListeCompte[0].totalCptEntreesDiff = $scope.analyseTotalCptEntreesDiff;
            $scope.analyseListeCompte[0].totalCptSortiesReel = $scope.analyseTotalCptSortiesReel;
            $scope.analyseListeCompte[0].totalCptSortiesPlanifie = $scope.analyseTotalCptSortiesPlanifie;
            $scope.analyseListeCompte[0].totalCptSortiesDiff = $scope.analyseTotalCptSortiesDiff;

            // On amène les dépenses et revenus pour le compte choisi
            if ($scope.switcherValues.depense || $scope.switcherValues.revenu) {
              await $scope.chargementAnalyseDetailleeSectionDepRev(categorieRevenu, categorieDepense, $scope.compteSelected.id);
            }
            resolve(true);
          });
        }

        // ************************************************************************************************
        //  Chargement du rapport détaillé par opération
        // ************************************************************************************************
        $scope.chargementAnalyseDetaillee = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {
            let categorieRevenu = "NON";
            let categorieDepense = "NON";
            let categorieCompte = "NON";
            let categorieEpargne = "NON";
            let categoriePret = "NON";
            let categorieCredit = "NON";

            if ($scope.switcherValues.revenu) {
              categorieRevenu = "OUI";
            }
            if ($scope.switcherValues.depense) {
              categorieDepense = "OUI";
            }
            if ($scope.switcherValues.compte) {
              categorieCompte = "OUI";
            }
            if ($scope.switcherValues.epargne) {
              categorieEpargne = "OUI";
            }
            if ($scope.switcherValues.pret) {
              categoriePret = "OUI";
            }
            if ($scope.switcherValues.credit) {
              categorieCredit = "OUI";
            }

            if ($scope.compteSelected.id === -1) {
              //**************************
              // Pour tous les comptes
              //**************************
              await $scope.chargementAnalyseDetailleeTous(categorieRevenu, categorieDepense);

            } else {
              //**************************
              // Pour un compte
              //**************************
              await $scope.chargementAnalyseDetailleeSimple(categorieRevenu, categorieDepense);
            }

            //REEL DEP/REV
            $scope.analyseDiffDepRevES = $scope.analyseTotalDepRevEntreesReel - $scope.analyseTotalDepRevSortiesReel;
            if ($scope.analyseDiffDepRevES >= 0) {
              $scope.entreesDepRevOver = true;
            } else {
              $scope.entreesDepRevOver = false;
            }

            // PLANIF
            $scope.analyseDiffDepRevESPlanif = $scope.analyseTotalDepRevEntreesPlanifie - $scope.analyseTotalDepRevSortiesPlanifie;
            if ($scope.analyseDiffDepRevESPlanif >= 0) {
              $scope.entreesDepRevPlanifOver = true;
            } else {
              $scope.entreesDepRevPlanifOver = false;
            }

            // DIFFÉRENCE
            $scope.analyseDiffDepRevESDiff = $scope.analyseTotalDepRevEntreesDiff + $scope.analyseTotalDepRevSortiesDiff;
            if ($scope.analyseDiffDepRevESDiff >= 0) {
              $scope.entreesDepRevDiffOver = true;
            } else {
              $scope.entreesDepRevDiffOver = false;
            }
            $scope.entreesDiffPos = $scope.analyseTotalDepRevEntreesDiff >= 0 ? true : false;
            $scope.sortiesDiffPos = $scope.analyseTotalDepRevSortiesDiff >= 0 ? true : false;

            let promiseVentilation = cuServices.viRapport("getVentilation");
            promiseVentilation.then(async function(value) {
              if (value.data.length) {
                $scope.analyseDepRevVentilation = value.data;
              }
              resolve(true);
            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        };

        $scope.chargementAnalyseSommaireSolde = function (data, idx, dateFin) {
          return new Promise(async (resolve, reject) => {
            //**************************
            // Pour un compte
            //**************************
            // Conserve la liste des compte et crédit
            var promiseSolde = prepareAnalyse.getSoldeCompte(data.id, dateFin);
            promiseSolde.then(function(value) {
              let solde = Number(value[0].solde);

              if (data.idCategorie === 3) {
                  $scope.analyseSoldeTotalCompte = $scope.analyseSoldeTotalCompte + solde;
                  $scope.compteData = true;
              } else if (data.idCategorie === 6) {
                  $scope.analyseSoldeTotalCredit = $scope.analyseSoldeTotalCredit + solde;
                  $scope.creditData = true;
              } else if (data.idCategorie === 4) {
                  $scope.analyseSoldeTotalEpargne = $scope.analyseSoldeTotalEpargne + solde;
                  $scope.epargneData = true;
              } else {
                  $scope.analyseSoldeTotalPret = $scope.analyseSoldeTotalPret + solde;
                  $scope.pretData = true;
              }
              $scope.analyseListeCompte[idx] = {
                  idx: idx,
                  id: data.id,
                  idCategorie: data.idCategorie,
                  description: data.nomSousPosteBudgetaireLov,
                  solde: solde.toFixed(2),
                  image: data.image,
                  typeImage: data.typeImage
              };
              resolve(true);
            }).catch(function(err) {
              cuServices.message("solde", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireTous = function (dateFin) {
          return new Promise(async (resolve, reject) => {
            let promiseRegle = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 6, 4, 5, null, null);
            promiseRegle.then(async function(value) {
              let data = value.data;
              let solde = 0;
              let idxCompte = 0;

              // Pour chaque catégorie avec solde
              for (var i = 0, tot = data.length; i < tot; i++) {
                await $scope.chargementAnalyseSommaireSolde(data[i], idxCompte, dateFin);
                idxCompte += 1;
              }
              resolve(true);
            }).catch(function(err) {
              cuServices.message("solde", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireSimple = function (dateFin) {
          return new Promise(async (resolve, reject) => {
            //**************************
            // Pour un compte
            //**************************
            await $scope.chargementAnalyseSommaireSolde($scope.compteSelected, 0, dateFin);
            resolve(true);
          });
        }

        $scope.chargementAnalyseSommaireRevenu = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {

            const idCategorie = 1;
            const idSousPosteBudgetaireRegle = $scope.compteSelected.id === -1 ? null : $scope.compteSelected.id;

            let promise = cuServices.viRapportSommaireSectionDepRev("getParPoste", $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, dateDebut, dateFin, $scope.categorieRevenu, $scope.categorieDepense, idCategorie);
            promise.then(function(value) {
              let data1 = value.data;
              let cpt = 0;
              let couleur;
              let highlight;
              for (let j = 0, tot2 = data1.length; j < tot2; j++) {


                  if (j === 0) {
                      couleur = dashboardColors.gossip;
                      highlight = colorHelper.shade(dashboardColors.gossip, 15);
                  } else if (j === 1) {
                      couleur = dashboardColors.white;
                      highlight = colorHelper.shade(dashboardColors.white, 15);
                  } else if (j === 2) {
                      couleur = dashboardColors.silverTree;
                      highlight = colorHelper.shade(dashboardColors.silverTree, 15);
                  } else if (j === 3) {
                      couleur = dashboardColors.surfieGreen;
                      highlight = colorHelper.shade(dashboardColors.surfieGreen, 15);
                  } else if (j === 4) {
                      couleur = dashboardColors.blueStone;
                      highlight = colorHelper.shade(dashboardColors.blueStone, 15);
                  }

                  $scope.analyseRevDataPosteBudgetaires[cpt] = {
                      idPosteBudgetaire: data1[j].idPosteBudgetaire,
                      description: $translate.instant(data1[j].description),
                      montant: data1[j].montant,
                      montantPlanifie: data1[j].montantPlanifie,
                      montantDifference: data1[j].montantDifference,
                      image: null,
                      tri: data1[j].tri,
                      idCategorie: data1[j].idCategorie,
                      key: $translate.instant(data1[j].description),
                      y: data1[j].montant,
                      color: couleur
                  };
                  $scope.analyseTotalRevenu = $scope.analyseTotalRevenu + parseFloat(data1[j].montant);
                  $scope.analyseTotalRevenuPlanifie = $scope.analyseTotalRevenuPlanifie + parseFloat(data1[j].montantPlanifie);
                  $scope.analyseTotalRevenuDifference = $scope.analyseTotalRevenuDifference + parseFloat(data1[j].montantDifference);
                  cpt += 1;
              }
              if (cpt > 0) {
                  $scope.revenuData = true;

                  let promise = cuServices.viRapportSommaireSectionDepRev("getParSousPoste", $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, dateDebut, dateFin, $scope.categorieRevenu, $scope.categorieDepense, idCategorie);
                  promise.then(function(value) {
                    let data1 = value.data;
                    let cpt = 0;
                    let index = -1;

                    for (let j = 0, tot2 = data1.length; j < tot2; j++) {

                        // Mettre la condition selon la switch "Sous-poste sommarisé"
                        if ($scope.switcherValues.sousPoste) {
                          index = $scope.analyseRevDataSousPosteBudgetaires.findIndex(ele => 
                            (ele.idPosteBudgetaire ===  data1[j].idPosteBudgetaire) && 
                            (ele.idSousPosteBudgetaire ===  data1[j].idSousPosteBudgetaire) );                         
                        }
                      
                        if (index >= 0) {
                           $scope.analyseRevDataSousPosteBudgetaires[index].montant = parseFloat($scope.analyseRevDataSousPosteBudgetaires[index].montant) + parseFloat(data1[j].montant);
                           $scope.analyseRevDataSousPosteBudgetaires[index].montantPlanifie = parseFloat($scope.analyseRevDataSousPosteBudgetaires[index].montantPlanifie) + parseFloat(data1[j].montantPlanifie);
                           $scope.analyseRevDataSousPosteBudgetaires[index].montantDifference = parseFloat($scope.analyseRevDataSousPosteBudgetaires[index].montantDifference) + parseFloat(data1[j].montantDifference);
                           if (data1[j].concilie > $scope.analyseRevDataSousPosteBudgetaires[index].concilie) {
                             $scope.analyseRevDataSousPosteBudgetaires[index].concilie = data1[j].concilie;
                           }
                           if ($scope.analyseRevDataSousPosteBudgetaires[index].description.indexOf($translate.instant(data1[j].description)) < 0) {
                             $scope.analyseRevDataSousPosteBudgetaires[index].description = $scope.analyseRevDataSousPosteBudgetaires[index].description + " / " + $translate.instant(data1[j].description);
                           }
                        } else {
                          $scope.analyseRevDataSousPosteBudgetaires[cpt] = {
                            idPosteBudgetaire: data1[j].idPosteBudgetaire,
                            idSousPosteBudgetaire: data1[j].idSousPosteBudgetaire,
                            idSousPosteBudgetaireRegle: data1[j].idSousPosteBudgetaireRegle,
                            idRegle: data1[j].idRegle,
                            idSousPosteBudgetaireRegleOperation: data1[j].idSousPosteBudgetaireRegleOperation,
                            description: $translate.instant(data1[j].description),
                            image: data1[j].image,
                            montant: data1[j].montant,
                            montantPlanifie: data1[j].montantPlanifie,
                            montantDifference: data1[j].montantDifference,
                            concilie: data1[j].concilie
                          };
                          cpt += 1;                         
                        }
                    }
                    resolve(true);
                  }).catch(function(err) {
                    cuServices.message("get", err, true);
                    resolve(false);
                  });
              } else {
                resolve(true);
              }
            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireDepense = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {
            const idCategorie = 2;
            const idSousPosteBudgetaireRegle = $scope.compteSelected.id === -1 ? null : $scope.compteSelected.id;

            let promise = cuServices.viRapportSommaireSectionDepRev("getParPoste", $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, dateDebut, dateFin, $scope.categorieRevenu, $scope.categorieDepense, idCategorie);
            promise.then(function(value) {
              let data1 = value.data;
              let cpt = 0;
              for (let j = 0, tot2 = data1.length; j < tot2; j++) {
                  $scope.analyseDepDataPosteBudgetaires[cpt] = {
                      idPosteBudgetaire: data1[j].idPosteBudgetaire,
                      description: $translate.instant(data1[j].description),
                      montant: data1[j].montant,
                      montantPlanifie: data1[j].montantPlanifie,
                      montantDifference: data1[j].montantDifference,
                      image: null,
                      tri: data1[j].tri,
                      idCategorie: data1[j].idCategorie
                  };
                  $scope.analyseTotalDepense = $scope.analyseTotalDepense + parseFloat(data1[j].montant);
                  $scope.analyseTotalDepensePlanifie = $scope.analyseTotalDepensePlanifie + parseFloat(data1[j].montantPlanifie)
                  $scope.analyseTotalDepenseDifference = $scope.analyseTotalDepenseDifference + parseFloat(data1[j].montantDifference);
                  cpt += 1;
              }
              if (cpt > 0) {
                  $scope.depenseData = true;

                  let promise = cuServices.viRapportSommaireSectionDepRev("getParSousPoste", $scope.ctrl.budgetCourant, idSousPosteBudgetaireRegle, dateDebut, dateFin, $scope.categorieRevenu, $scope.categorieDepense, idCategorie);
                  promise.then(function(value) {
                    let data1 = value.data;
                    let cpt = 0;
                    let index = -1;
                    for (let j = 0, tot2 = data1.length; j < tot2; j++) {

                      // Mettre la condition selon la switch "Sous-poste sommarisé"
                      if ($scope.switcherValues.sousPoste) {
                        index = $scope.analyseDepDataSousPosteBudgetaires.findIndex(ele =>
                          (ele.idPosteBudgetaire ===  data1[j].idPosteBudgetaire) && 
                          (ele.idSousPosteBudgetaire ===  data1[j].idSousPosteBudgetaire) );
                      }

                      if (index >= 0) {
                         $scope.analyseDepDataSousPosteBudgetaires[index].montant = parseFloat($scope.analyseDepDataSousPosteBudgetaires[index].montant) + parseFloat(data1[j].montant);
                         $scope.analyseDepDataSousPosteBudgetaires[index].montantPlanifie = parseFloat($scope.analyseDepDataSousPosteBudgetaires[index].montantPlanifie) + parseFloat(data1[j].montantPlanifie) ;
                         $scope.analyseDepDataSousPosteBudgetaires[index].montantDifference = parseFloat($scope.analyseDepDataSousPosteBudgetaires[index].montantDifference) + parseFloat(data1[j].montantDifference);
                         if (data1[j].concilie > $scope.analyseDepDataSousPosteBudgetaires[index].concilie) {
                           $scope.analyseDepDataSousPosteBudgetaires[index].concilie = data1[j].concilie;
                         }
                         if ($scope.analyseDepDataSousPosteBudgetaires[index].description.indexOf($translate.instant(data1[j].description)) < 0) {
                           $scope.analyseDepDataSousPosteBudgetaires[index].description = $scope.analyseDepDataSousPosteBudgetaires[index].description + " / " + $translate.instant(data1[j].description);
                         }
                      } else {
                        $scope.analyseDepDataSousPosteBudgetaires[cpt] = {
                          idPosteBudgetaire: data1[j].idPosteBudgetaire,
                          idSousPosteBudgetaire: data1[j].idSousPosteBudgetaire,
                          idSousPosteBudgetaireRegle: data1[j].idSousPosteBudgetaireRegle,
                          idRegle: data1[j].idRegle,
                          idSousPosteBudgetaireRegleOperation: data1[j].idSousPosteBudgetaireRegleOperation,
                          description: $translate.instant(data1[j].description),
                          image: data1[j].image,
                          montant: data1[j].montant,
                          montantPlanifie: data1[j].montantPlanifie,
                          montantDifference: data1[j].montantDifference,
                          concilie: data1[j].concilie
                        };
                        cpt += 1;
                      }
                    }
                    resolve(true);
                  }).catch(function(err) {
                    cuServices.message("get", err, true);
                    resolve(false);
                  });
              } else {
                resolve(true);
              }
            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireGraphiqueDep = function (dateDebut, dateFin, backgroundColor, hoverBackgroundColor) {
          return new Promise(async (resolve, reject) => {

            // ************************************************************************************************
            //  DEPENSES
            // ************************************************************************************************
            let cptDep = 0;
            let labelsDep = [];
            let dataDep = [];
            let prcDep = [];
            let orderDep = [];

            const codeCategorie = 'DEP';
            const idSousPosteBudgetaireRegle = $scope.compteSelected.id === -1 ? null : $scope.compteSelected.id;

            let promise = cuServices.viAnalyseRegleSommaireInfoPoste("getParCategorie",
                                                                    $scope.ctrl.budgetCourant,
                                                                    idSousPosteBudgetaireRegle,
                                                                    dateDebut,
                                                                    dateFin,
                                                                    codeCategorie,
                                                                    'DEP',
                                                                    'AUT');
            promise.then(function(value) {
              let data = value.data;

              let couleur = dashboardColors.gossip;
              let highlight = colorHelper.shade(dashboardColors.gossip, 15);
              let prcArr = 0;
              let prcArrFinal = 100;

              for (let j = 0, tot2 = data.length; j < tot2; j++) {
                if (j === (tot2 - 1)) {
                    prcArr = Math.round(prcArrFinal * 10) / 10;
                } else {
                    prcArr = Math.round(data[j].pourcentage * 10) / 10;
                    prcArrFinal = prcArrFinal - prcArr;
                }

                labelsDep.push($translate.instant(data[j].description));
                dataDep.push(data[j].montantFormat);
                prcDep.push(prcArr);
                orderDep.push(cptDep);

                cptDep += 1;
              }

              if (data.length === 0) {
                $scope.totalDep = "0.00";
                $scope.doughnutDataDep = {};
              } else {
                $scope.totalDep = data[cptDep - 1].montantTotalFormat;
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
              }
              resolve(true);
            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireGraphiqueRev = function (dateDebut, dateFin, backgroundColor, hoverBackgroundColor) {
          return new Promise(async (resolve, reject) => {

            // ************************************************************************************************
            //  DEPENSES
            // ************************************************************************************************
            let cptRev = 0;
            let labelsRev = [];
            let dataRev = [];
            let prcRev = [];
            let orderRev = [];

            const codeCategorie = 'REV';
            const idSousPosteBudgetaireRegle = $scope.compteSelected.id === -1 ? null : $scope.compteSelected.id;

            let promise = cuServices.viAnalyseRegleSommaireInfoPoste("getParCategorie",
                                                                    $scope.ctrl.budgetCourant,
                                                                    idSousPosteBudgetaireRegle,
                                                                    dateDebut,
                                                                    dateFin,
                                                                    codeCategorie,
                                                                    'REV',
                                                                    'AUT');
            promise.then(function(value) {
              let data = value.data;
              let couleur = dashboardColors.gossip;
              let highlight = colorHelper.shade(dashboardColors.gossip, 15);
              let prcArr = 0;
              let prcArrFinal = 100;

              for (let j = 0, tot2 = data.length; j < tot2; j++) {
                if (j === (tot2 - 1)) {
                    prcArr = Math.round(prcArrFinal * 10) / 10;
                } else {
                    prcArr = Math.round(data[j].pourcentage * 10) / 10;
                    prcArrFinal = prcArrFinal - prcArr;
                }

                labelsRev.push($translate.instant(data[j].description));
                dataRev.push(data[j].montantFormat);
                prcRev.push(prcArr);
                orderRev.push(cptRev);

                cptRev += 1;
              }

              if (data.length === 0) {
                $scope.totalRev = "0.00";
                $scope.doughnutDataRev = {};
              } else {
                $scope.totalRev = data[cptRev - 1].montantTotalFormat;
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
              }
              resolve(true);
            }).catch(function(err) {
              cuServices.message("get", err, true);
              resolve(false);
            });
          });
        }

        $scope.chargementAnalyseSommaireGraphique = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {
            $scope.$apply();
            $scope.doughnutDataDep = {};
            $scope.doughnutDataRev = {};

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

            if ($scope.switcherValues.depense) {
              await $scope.chargementAnalyseSommaireGraphiqueDep(dateDebut, dateFin, backgroundColor, hoverBackgroundColor);
            }

            if ($scope.switcherValues.revenu) {
              await $scope.chargementAnalyseSommaireGraphiqueRev(dateDebut, dateFin, backgroundColor, hoverBackgroundColor);
            }
            resolve(true);
          });
        }

        // ************************************************************************************************
        //  Chargement du rapport sommaire par opération
        // ************************************************************************************************
        $scope.chargementAnalyseSommaire = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {

            $scope.categorieRevenu = "NON";
            $scope.categorieDepense = "NON";
            $scope.categorieCompte = "NON";
            $scope.categorieEpargne = "NON";
            $scope.categoriePret = "NON";
            $scope.categorieCredit = "NON";

            if ($scope.switcherValues.revenu) {
              $scope.categorieRevenu = "OUI";
            }
            if ($scope.switcherValues.depense) {
              $scope.categorieDepense = "OUI";
            }
            if ($scope.switcherValues.compte) {
              $scope.categorieCompte = "OUI";
            }
            if ($scope.switcherValues.epargne) {
              $scope.categorieEpargne = "OUI";
            }
            if ($scope.switcherValues.pret) {
              $scope.categoriePret = "OUI";
            }
            if ($scope.switcherValues.credit) {
              $scope.categorieCredit = "OUI";
            }

            if ($scope.compteSelected.id === -1) {
              //**************************
              // Pour tous les comptes
              //**************************
              await $scope.chargementAnalyseSommaireTous(dateFin);

            } else {
              //**************************
              // Pour un compte
              //**************************
              await $scope.chargementAnalyseSommaireSimple(dateFin);
            }

            // Formatage des soldes
            $scope.analyseSoldeTotalCompte  = $scope.analyseSoldeTotalCompte.toFixed(2);
            $scope.analyseSoldeTotalCredit  = $scope.analyseSoldeTotalCredit.toFixed(2);
            $scope.analyseSoldeTotalEpargne = $scope.analyseSoldeTotalEpargne.toFixed(2);
            $scope.analyseSoldeTotalPret    = $scope.analyseSoldeTotalPret.toFixed(2);

            if ($scope.switcherValues.revenu) {
              await $scope.chargementAnalyseSommaireRevenu(dateDebut, dateFin);
              $scope.$applyAsync();
            }

            if ($scope.switcherValues.depense) {
              await $scope.chargementAnalyseSommaireDepense(dateDebut, dateFin);
              $scope.$applyAsync();
            }

            if ($scope.switcherValues.depense && $scope.switcherValues.revenu) {
              // RÉEL
              $scope.analyseDiffRevenuDep = $scope.analyseTotalRevenu - $scope.analyseTotalDepense;
              if ($scope.analyseDiffRevenuDep >= 0) {
                $scope.revOver = true;
              } else {
                $scope.revOver = false;
              }
              // PLANIF
              $scope.analyseDiffRevenuDepPlanif = $scope.analyseTotalRevenuPlanifie - $scope.analyseTotalDepensePlanifie;
              if ($scope.analyseDiffRevenuDepPlanif >= 0) {
                $scope.revOverPlanif = true;
              } else {
                $scope.revOverPlanif = false;
              }
              // DIFFÉRENCE
              $scope.analyseDiffRevenuDepDiff = $scope.analyseTotalRevenuDifference + $scope.analyseTotalDepenseDifference;
              if ($scope.analyseDiffRevenuDepDiff >= 0) {
                $scope.revOverDiff = true;
              } else {
                $scope.revOverDiff = false;
              }
              $scope.revDiffPos = $scope.analyseTotalRevenuDifference >= 0 ? true : false;
              $scope.depDiffPos = $scope.analyseTotalDepenseDifference >= 0 ? true : false;
            }

            if ($scope.switcherValues.graphique) {
              await $scope.chargementAnalyseSommaireGraphique(dateDebut, dateFin);
            }
            $scope.$applyAsync();
            resolve(true);
          });
        };

        $scope.createDoughnutDep = () => {
          let ctx = document.getElementById('chartdepense-area').getContext('2d');

          window.myDoughnutDep = new Chart(ctx, {
            type: 'doughnut',
            data: $scope.doughnutDataDep,
            options: {
              cutoutPercentage: 64,
              responsive: true,
              segmentShowStroke: false,
              elements: {
                arc: {
                  borderWidth: 0
                }
              }
            }
          });
        }

        $scope.createDoughnutRev = () => {
          let ctx = document.getElementById('chartrevenu-area').getContext('2d');

          window.myDoughnutRev = new Chart(ctx, {
            type: 'doughnut',
            data: $scope.doughnutDataRev,
            options: {
              cutoutPercentage: 64,
              responsive: true,
              segmentShowStroke: false,
              elements: {
                arc: {
                  borderWidth: 0
                }
              }
            }
          });
        }

        $scope.chargementBilanSolde = function (data, idx, dateFin) {
          return new Promise(async (resolve, reject) => {
            //**************************
            // Pour un compte
            //**************************
            // Conserve la liste des compte et crédit
            var promiseSolde = prepareAnalyse.getSoldeCompte(data.id, dateFin);
            promiseSolde.then(function(value) {
              let signe = "+";
              let operation;
              let type;
              let solde = Number(value[0].solde);

              if (data.idCategorie === 3) {
                $scope.analyseSoldeTotal = $scope.analyseSoldeTotal + solde;
                signe = "+";
                operation = $translate.instant('ECRAN.ANALYSE.OPERATION_COMPTE');
                type = $translate.instant('ECRAN.ANALYSE.TYPE_ENCAISSE');
              } else if (data.idCategorie === 6) {
                $scope.analyseSoldeTotal = $scope.analyseSoldeTotal - solde;
                signe = "-";
                operation = $translate.instant('ECRAN.ANALYSE.OPERATION_CREDIT');
                type = $translate.instant('ECRAN.ANALYSE.TYPE_SOLDE');
              } else if (data.idCategorie === 4) {
                $scope.analyseSoldeTotal = $scope.analyseSoldeTotal + solde;
                signe = "+";
                operation = $translate.instant('ECRAN.ANALYSE.OPERATION_EPARGNE');
                type = $translate.instant('ECRAN.ANALYSE.TYPE_SOLDE');
              } else {
                $scope.analyseSoldeTotal = $scope.analyseSoldeTotal - solde;
                signe = "-";
                operation = $translate.instant('ECRAN.ANALYSE.OPERATION_PRET');
                type = $translate.instant('ECRAN.ANALYSE.TYPE_SOLDE');
              }

              // Conserve la liste des comptes et crédits
              $scope.analyseListeCompte[idx] = {
                idx: idx,
                operation: operation,
                type: type,
                id: data.id,
                idCategorie: data.idCategorie,
                description: data.nomSousPosteBudgetaireLov,
                solde: solde.toFixed(2),
                signe: signe
              };

              resolve(true);
            }).catch(function(err) {
              cuServices.message("solde", err, true);
              resolve(false);
            });
          });
        }

        // ************************************************************************************************
        //  Chargement du rapport bilan financier
        // ************************************************************************************************
        $scope.chargementBilan = function (dateDebut, dateFin) {
          return new Promise(async (resolve, reject) => {
            $scope.analyseListeCompte = [];
            $scope.analyseSoldeTotal = 0;

            // ************************************************************************************************
            // Pour tous les comptes et prêt
            // ************************************************************************************************
            let promiseRegle = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 6, 4, 5, null, null);
            promiseRegle.then(async function(value) {
              let data = value.data;
              let solde = 0;
              let idxCompte = 0;

              // Pour chaque catégorie avec solde
              for (var i = 0, tot = data.length; i < tot; i++) {
                await $scope.chargementBilanSolde(data[i], idxCompte, dateFin);
                idxCompte += 1;
              }
              resolve(true);
            }).catch(function(err) {
              cuServices.message("solde", err, true);
              resolve(false);
            });
          });
        }

        $scope.$on('elementClick.directive', async function (angularEvent, event) {
          console.log(event);
        });

        $scope.$watch('goOptionsFlux', (newVal, oldVal) => {
          if (newVal) {
            $scope.tickvalues = new Array($scope.dataFlux[0].values.length);
            $scope.tickformat = new Array($scope.dataFlux[0].values.length);
            for (let a = 0; a < $scope.dataFlux[0].values.length; a++) {
                $scope.header[a] = $scope.ctrl.languageSelected.code === "EN" ? moment($scope.dataFlux[0].values[a].date, 'YYYY-MM-DD').format('MMMM D, YYYY') : moment($scope.dataFlux[0].values[a].date, 'YYYY-MM-DD').format('D MMMM YYYY');
                $scope.tickformat[a] = moment($scope.dataFlux[0].values[a].date).format('YYYY-MM-DD');
            }

            // lineChart
            $scope.optionsFlux = {
                chart: {
                    type: 'lineChart',
                    height: 400,
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
                    xAxis: {
                        showMaxMin: false,
                        staggerLabels: true,
                        rotateLabels: 0,
                        tickFormat: function (d) {
                            return $scope.tickformat[d];
                        }
                    },
                    yAxis: {
                        showMaxMin: true,
                        tickFormat: function (d) {
                          return d3.format('.2f')(d);
                          //return d + ' ';
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
            $scope.libelleAxeX = $translate.instant('ECRAN.CALENDRIER.LIBELLE_DU') +
                                 moment(dateDebut, 'YYYY-MM-DD').format('D MMMM') +
                                 $translate.instant('ECRAN.CALENDRIER.LIBELLE_AU') +
                                 moment(dateFin, 'YYYY-MM-DD').format('D MMMM');

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
                      couleur = analyseColors.c1;
                  } else if (i === 1) {
                      couleur = analyseColors.c2;
                  } else if (i === 2) {
                      couleur = analyseColors.c3;
                  } else if (i === 3) {
                      couleur = analyseColors.c4;
                  } else if (i === 4) {
                      couleur = analyseColors.c5;
                  } else if (i === 5) {
                      couleur = analyseColors.c6;
                  } else {
                      couleur = "";
                  }

                  let promiseFlux = prepareAnalyse.getFlux($scope.ctrl.budgetCourant, dateDebut, dateFin, data[i], couleur, false, false);
                  promiseFlux.then(function(flux) {
                    $scope.dataFlux.push(flux);
                    $scope.dataFluxTri[i] = flux;

                    count = count - 1;
                    if (count === 0) {
                      $scope.dataFlux = $scope.dataFluxTri;
                      $scope.goOptionsFlux = true;
                      resolve(true);
                    }
                  }).catch(function(err) {
                    cuServices.message("getFlux", err, true);
                    resolve(false);
                  });
              }
            }).catch(function(err) {
              cuServices.message("getParBudgetCateg", err, true);
              resolve(false);
            });
          });
        };

        $scope.analyse = function (index) {
            $scope.estPret = false
            $rootScope.$activeLoadingPage = true;
            $timeout(() => {
                // Préparation de l'analyse
                $scope.analyseListeCompte = [];
                $scope.analyseCompteData = [];
                $scope.analyseDepRevData = [];
                $scope.analyseDepRevVentilation = [];
                $scope.analyseRevDataPosteBudgetaires = [];
                $scope.analyseRevDataSousPosteBudgetaires = [];
                $scope.analyseDepDataPosteBudgetaires = [];
                $scope.analyseDepDataSousPosteBudgetaires = [];
                $scope.analyseTotalRevenu = 0;
                $scope.analyseTotalDepense = 0;
                $scope.analyseTotalRevenuPlanifie = 0;
                $scope.analyseTotalRevenuDifference = 0;
                $scope.analyseTotalDepensePlanifie = 0;
                $scope.analyseTotalDepenseDifference = 0;
                $scope.analyseDiffRevenuDep = 0;
                $scope.analyseDiffRevenuDepPlanif = 0;
                $scope.analyseDiffRevenuDepDiff = 0;
                $scope.analyseTotalCptEntreesReel = 0;
                $scope.analyseTotalCptEntreesPlanifie = 0;
                $scope.analyseTotalCptEntreesDiff = 0;
                $scope.analyseTotalCptSortiesReel = 0;
                $scope.analyseTotalCptSortiesPlanifie = 0;
                $scope.analyseTotalCptSortiesDiff = 0;
                $scope.analyseTotalDepRevEntreesReel = 0;
                $scope.analyseTotalDepRevEntreesPlanifie = 0;
                $scope.analyseTotalDepRevEntreesDiff = 0;
                $scope.analyseTotalDepRevSortiesReel = 0;
                $scope.analyseTotalDepRevSortiesPlanifie = 0;
                $scope.analyseTotalDepRevSortiesDiff = 0;
                $scope.analyseDiffDepRevES = 0;
								$scope.analyseDiffDepRevESPlanif = 0;
								$scope.analyseDiffDepRevESDiff = 0;
                $scope.entreesDepRevOver = false;
                $scope.entreesDepRevPlanifOver = false;
                $scope.entreesDepRevDiffOver = false;
                $scope.revOver = false;
                $scope.revOverPlanif = false;
                $scope.revOverDiff  = false;
                $scope.revDiffPos = true;
                $scope.depDiffPos = true;
                $scope.entreesDiffPos = true;
                $scope.sortiesDiffPos = true;
                $scope.analyseSoldeTotalCompte = 0;
                $scope.analyseSoldeTotalCredit = 0;
                $scope.analyseSoldeTotalPret = 0;
                $scope.analyseSoldeTotalEpargne = 0;
                $scope.revenuData = false;
                $scope.depenseData = false;
                $scope.compteData = false;
                $scope.creditData = false;
                $scope.epargneData = false;
                $scope.pretData = false;

                let promiseAnalyse = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", $scope.dateFin, 0);
                promiseAnalyse.then(async function(value) {
                  // RAPPORT DÉTAILLÉ PAR OPÉRATION
                  if ($scope.rapportActif === 0) {
                      $scope.boutonActionInactif = false;

                      let promiseAnalyse = prepareAnalyse.genereRapportDetaille($scope.ctrl.budgetCourant, $scope.dateDebut, $scope.dateFin, 1);
                      promiseAnalyse.then(async function(value) {
                        await $scope.chargementAnalyseDetaillee($scope.dateDebut, $scope.dateFin);
                        $scope.estAnalyser = true;
                        $scope.estPret = true;
                        $rootScope.$activeLoadingPage = false;
                        $scope.$applyAsync();
                      }).catch(function(err) {
                        cuServices.message("analyse", err, true);
                        $rootScope.$activeLoadingPage = false;
                        $scope.$applyAsync();
                      });
                  }
                  // RAPPORT SOMMAIRE PAR OPÉRATION
                  else if ($scope.rapportActif === 1) {
                      $scope.boutonActionInactif = false;
                      await $scope.chargementAnalyseSommaire($scope.dateDebut, $scope.dateFin);
                      $scope.estAnalyser = true;
                      $scope.estPret = true;
                      $rootScope.$activeLoadingPage = false;

                      $scope.$applyAsync();
                      if ($scope.switcherValues.graphique) {
                          $timeout(() => {
                            $scope.createDoughnutDep();
                            $scope.createDoughnutRev();
                          },500);
                      }
                  }
                  // RAPPORT BILAN FINANCIER
                  else if ($scope.rapportActif === 2) {
                      $scope.boutonActionInactif = false;
                      await $scope.chargementBilan($scope.dateDebut, $scope.dateFin);
                      $scope.estAnalyser = true;
                      $scope.estPret = true;
                      $rootScope.$activeLoadingPage = false;
                      $scope.$applyAsync();
                  }
                  // FLUX DE TRÉSORERIE
                  else if ($scope.rapportActif === 3) {
                      $scope.boutonActionInactif = true;
                      await $scope.chargementFluxTresorie($scope.dateDebut, $scope.dateFin);
                      $scope.estAnalyser = true;
                      $scope.estPret = true;
                      $rootScope.$activeLoadingPage = false;
                      $scope.$applyAsync();
                  }
                  else {
                    $rootScope.$activeLoadingPage = false;
                    $scope.$applyAsync();
                  }
                }).catch(function(err) {
                  cuServices.message("analyse", err, true);
                  $rootScope.$activeLoadingPage = false;
                  $scope.$applyAsync();
                });
            });
        };

    }
})();
