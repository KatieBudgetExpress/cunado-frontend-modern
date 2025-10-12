/**
 * @author Sébastien Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.conciliation')
        .controller('DepensesRevenusCtrl', DepensesRevenusCtrl);

    /** @ngInject */
    function DepensesRevenusCtrl($scope,
                                 $rootScope,
                                 $timeout,
                                 $filter,
                                 cuServices,
                                 $translate,
                                 prepareAnalyse,
                                 transactionDepRevModal,
                                 RegleExceptionResource,
                                 RegleExceptionVentilationResource,
                                 conciliationMontantModal) {

        const vm = this;
        $scope.sectionDepRevData = [];
        $scope.newRegleException = {};
        $scope.newRegleExceptionVentilation = {};

        let start = moment().startOf('month');
        let end = moment().endOf('month');

        $scope.dateDebut = start.format("YYYY-MM-DD");
        $scope.dateFin = end.format("YYYY-MM-DD");

        $scope.operationDepRev = function (setPage) {

            $scope.sectionDepRevData = [];

            let promiseSolde = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, "1900-01-01", $scope.dateFin, 0);
            promiseSolde.then(function(value) {
              let promiseSection = cuServices.viConciliationSectionDepRev("getParDate",$scope.ctrl.budgetCourant, $scope.dateDebut, $scope.dateFin);
              promiseSection.then(function(value) {
                let data = value.data;
                let cpt = 0;
                for (let i = 0, tot = data.length; i < tot; i++) {

                    $scope.sectionDepRevData[cpt] = {
                        idRegle: data[i].idRegle,
                        idRegleException: data[i].idRegleException,
                        dateOperation: data[i].dateOperation,
                        image: data[i].image,
                        typeImage: data[i].typeImage,
                        operation: $translate.instant(data[i].description),
                        idCategorie: data[i].idCategorie,
                        montant: data[i].montant,
                        concilie: data[i].concilie
                    };
                    cpt += 1;
                }
                $scope.$applyAsync();
                if (setPage) {
                  $timeout(function () {
                      $scope.setPage(vm.pageCurrent);
                  });
                }
              });
            });
        }

        $scope.operationDepRev(false);

        // Événement appelé par le contrôleur parent "ConciliationCtrl"
        $scope.$on('redoOperationDepRev', function (e) {
            $scope.operationDepRev(false);
        });

        $scope.ajoutTransaction = function (codeCategorie) {
            $scope.categorie = $rootScope.arrayCategorie.find(categorie => categorie.code === codeCategorie);
            transactionDepRevModal($scope.categorie, null, null, $scope.ctrl.budgetCourant, 1, 1, $scope.ctrl.signe, false).result.then(function (retour) {
                if (retour) {
                    $scope.operationDepRev(false);
                }
            });
        };

        $scope.aConcilie = function () {
            if ($scope.$parent.liste.temporaire.length > 0) {
                return false;
            } else {
                return true;
            }
        }

        $scope.creationVentilation = function () {
          return new Promise((resolve, reject) => {
            RegleExceptionVentilationResource.create($scope.newRegleExceptionVentilation).$promise
              .then((result) => {
                resolve(true);
              })
              .catch((err) => {
                cuServices.message("create", err, true);
                resolve(false);
              });
          });
        };

        $scope.ajouteVentilations = async function (idRegleException, item) {
          return new Promise((resolve, reject) => {
            // On fait ajoute maintenant les lignes de ventilation
            $scope.$parent.liste.temporaire.forEach(async (ligneConcilie) => {
                let montantConcil = 0;
                // Dépense
                if (item.idCategorie === 2) {
                  montantConcil = (ligneConcilie.montantTmp) ? (ligneConcilie.montantTmp * -1) : (parseFloat(ligneConcilie.TRNAMT) * -1);
                } else {
                  montantConcil = (ligneConcilie.montantTmp) ? ligneConcilie.montantTmp : parseFloat(ligneConcilie.TRNAMT);
                }

                // On concilie
                let typeOpe = ligneConcilie.TRNTYPE;
                let dateConcil = $scope.$parent.vm.getDate(ligneConcilie.DTPOSTED);
                let descConcil = (ligneConcilie.descTmp) ? ligneConcilie.descTmp : ligneConcilie.NAME;

                $scope.newRegleExceptionVentilation = {
                    idRegleException: idRegleException,
                    date: dateConcil,
                    description: descConcil,
                    montant: montantConcil
                };

                await $scope.creationVentilation();

                $scope.newRegleExceptionVentilation = {};
                const dataIndex = $scope.$parent.liste.concilie.findIndex(ele => ele.$$hashKey === ligneConcilie.$$hashKey);
                if (dataIndex == -1) {
                    $scope.$parent.liste.concilie.push(ligneConcilie);
                }
                resolve(true);
            });
          });
        };

        $scope.concilier = function (item) {

          const titre = $translate.instant("ECRAN.CONCILIATION.MODALE_MONTANT");
          const boutonOk = $translate.instant("GLOBALE.BOUTON.APPLIQUER");
          const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

          conciliationMontantModal(boutonOk, boutonAnnuler, titre, $scope.$parent.liste.temporaire, $scope.ctrl.signe).result.then(function (retour) {
              if (retour !== null) {
                $scope.$parent.liste.temporaire = retour;
                $scope.concilierSuite(item);
              }
          });
        };

        $scope.concilierSuite = function (item) {

          let promiseException = cuServices.regleException("getParRegleDate", item.idRegle, item.dateOperation);
          promiseException.then(function(value) {
            const data = value.data;
            if (data.length > 0) {
              $scope.newRegleException = {
                  'id': data[0].id,
                  'idRegle': data[0].idRegle,
                  'dateRegle': data[0].dateRegle,
                  'dateException': data[0].dateException,
                  'montantException': data[0].montantException,
                  'aucunVersement': data[0].aucunVersement,
                  'concilie': 1
              };
            } else {
              $scope.newRegleException = {
                  'idRegle': item.idRegle,
                  'dateRegle': item.dateOperation,
                  'montantException': item.montant,
                  'aucunVersement': 0,
                  'concilie': 1
              };
            }

            $scope.$eval(($scope.newRegleException.id ? "update" : "create"),RegleExceptionResource)($scope.newRegleException).$promise
              .then(async (result) => {
                  cuServices.message(($scope.newRegleException.id ? "update" : "create"), false, false);

                  let idRegleException = $scope.newRegleException.id || result.regleException.id;

                  if (idRegleException != -1) {
                      // On fait ajoute maintenant les lignes de ventilation
                      await $scope.ajouteVentilations(idRegleException, item);

                      $scope.$parent.liste.temporaire = [];
                      $scope.newRegleException = {};
                      vm.pageCurrent = $scope.getCurrentPage();
                      $scope.operationDepRev(true);
                  }
              })
              .catch((err) => {
                  cuServices.message(($scope.newRegleException.id ? "update" : "create"), err, true);
              });
          });
        };

        $scope.getCurrentPage = function () {
          return angular.element($('#pagerId')).isolateScope().currentPage;
        }

        $scope.setPage = function (pageNumber) {
          angular.element($('#pagerId')).isolateScope().selectPage(pageNumber);
        }

        //
        // GESTION DU DATE RANGE picker
        //
        function cb(start, end) {
            $('#reportrange_conciliation span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
        }

        const objRanges = {};
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.MOIS_COURANT")] = [moment().startOf('month'), moment().endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIER_MOIS")] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.3DERNIER_MOIS")] = [moment().subtract(3, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.6DERNIER_MOIS")] = [moment().subtract(6, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.ANNEE_COURANTE")] = [moment().startOf('year'), moment().endOf('year')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.DERNIERE_ANNEE")] = [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')];
        objRanges[$translate.instant("ECRAN.TABLEAUBORD.CETTE_SEMAINE")] = [moment().startOf('week'), moment().endOf('week')];

        $('#reportrange_conciliation').daterangepicker({
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

        $('#reportrange_conciliation').on('apply.daterangepicker', function (ev, picker) {

            $scope.dateDebut = picker.startDate.format('YYYY-MM-DD');
            $scope.dateFin = picker.endDate.format('YYYY-MM-DD');

            $scope.ctrl.updateAxeVisibiliteUsager(4, $scope.dateDebut, false);
            $scope.ctrl.updateAxeVisibiliteUsager(5, $scope.dateFin, true);

            $scope.operationDepRev(false);

            $scope.$apply();

        });

    }

})();
