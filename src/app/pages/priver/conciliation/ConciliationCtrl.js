(function () {
    'use strict';

    angular.module('i2sFinance.priver.conciliation')
        .controller('ConciliationCtrl', ConciliationCtrl);

    /** @ngInject */
    function ConciliationCtrl($scope,
                              $rootScope,
                              translateFilter,
                              $translate,
                              selectModal,
                              cuServices,
                              plaidServices,
                              $state,
                              SousPosteBudgetaireRegleResource,
                              RegleResource,
                              RegleImpactResource,
                              RegleExceptionResource,
                              RegleExceptionVentilationResource) {

        $rootScope.$confirmChangePage = {
            indicateur: false,
            message: ""
        };

        const vm = this;
        vm.typeLibUsed = undefined;
        vm.getDate = getDate;
        vm.toggleData = toggleData;
        vm.action = action;
        vm.ajouterTransaction = ajouterTransaction;
        vm.radioChange = radioChange;
        vm.upload = upload;
        vm.changeCompte = changeCompte;
        vm.getNumeroCompteOfx = getNumeroCompteOfx;
        vm.typeConciliation = 1;
        vm.lienBancaireSelected = {};
        $scope.liste = {
            temporaire: [],
            concilie: []
        };

        // **************************************************************************************
        // 
        // **************************************************************************************
        let promise = cuServices.viLienBancaire("getLovLienBancaireActif");
        promise.then(function(value) {
            if (value.data.length > 0) {
            $scope.lienBancaires = value.data;
            } else {
            $scope.lienBancaires = [];
            }
            $scope.$applyAsync();
        })
        .catch(err => {
            $scope.lienBancaires = [];
        });

        $scope.$on('AnnuleWizard',function(event, data){
            $state.go('priver.budgetCalendrier');
        });

        function action() {
            $state.go('priver.budgetCalendrier');
        }

        $scope.$watch('::vm.importFile', (newObj, oldObj) => {
            if (newObj !== oldObj) {
                setvalideForm(newObj, false);
            }
        });

        $scope.$watch('vm.associationFrom.$submitted', async (newObj, oldObj) => {
          if (newObj) {
            $scope.$broadcast('submitValide', {});
          }
        });

        $scope.$watch('::vm.associationFrom', (newObj, oldObj) => {
            if (newObj !== oldObj) {
                setvalideForm(newObj, false);
            }
        });

        $scope.$watch('::vm.finFrom', (newObj, oldObj) => {
            if (newObj !== oldObj) {
                setvalideForm(newObj, false);
            }
        });
 
        let dateDuJour = moment(new Date()).format("YYYY-MM-DD");
        let start = moment(dateDuJour).startOf('month');
        let end = moment(dateDuJour).endOf('month');

        $scope.dateDebut = start.format("YYYY-MM-DD");
        $scope.dateFin = end.format("YYYY-MM-DD");

        function getDate(data) {
            let dateTrs = new Date(data);
            if (!isNaN(Number(data.substring(0, data.length >= 10 ? 10 : data.length)))) {
              dateTrs = new Date(data.substring(0, 8));
            }
            if (!moment(dateTrs).isValid()) {
              dateTrs = moment(data.substring(0, 8));
            }
            return moment(dateTrs).format('YYYY-MM-DD');
        }

        function radioChange() {
            setvalideForm(vm.importFile, false);

            if (vm.typeConciliation === 2) {
                if (Object.keys(vm.lienBancaireSelected).length > 0) {
                    setvalideForm(vm.importFile, true);
                }  
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

                    if (vm.lienBancaireSelected.accessToken) {
                      changeCompte();
                    }

                    $scope.dateDebut = picker.startDate.format('YYYY-MM-DD');
                    $scope.dateFin = picker.endDate.format('YYYY-MM-DD');
                    $scope.$apply();
                });
                $scope.datePickerLoad = true;
            }            
        }

        function changeCompte() {

            if (vm.lienBancaireSelected.accessToken) {
                console.log('Call service transaction et alimentente la table: ' + JSON.stringify(vm.lienBancaireSelected));

                let promiseGetTransaction = plaidServices.PlaidResource("getTransactions",vm.lienBancaireSelected.accessToken, null, null, vm.lienBancaireSelected,$scope.dateDebut,$scope.dateFin);
                promiseGetTransaction.then(function(data) {
                    
                    console.log(' data: ' + JSON.stringify(data[0]));
    
                })
                .catch(err => {
                    cuServices.message('delete', err, true);
                })
            }






        }

        function upload(files, file) {
            vm.dataImport = null;
            vm.tableData = null;
            $scope.liste = {
                temporaire: [],
                concilie: []
            };
            if (file) {
                setvalideForm(vm.importFile, true);
                setvalideForm(vm.associationFrom, true);
                vm.file = file;
                const type = file.name.split('.').pop();
                vm.typeLibUsed = type.toLowerCase();
                const reader = new FileReader();

                switch (type.toLowerCase()) {
                    case 'csv':
                        reader.onload = function (e) {
                          cuServices.importFileResource('getFileCsv', e.target.result.trim())
                            .then((value) => {
                                vm.dataImport = value.data;
                                return initTableDataBankCsv(JSON.parse(value.data));
                            })
                            .then((dataTab) => initTable(dataTab));
                        };
                        reader.readAsBinaryString(file);
                        break;
                    case 'ofx':
                        reader.onload = function (e) {
                          cuServices.importFileResource('getFileOfxQfx', e.target.result)
                            .then((value) => {
                                vm.dataImport = value.data;
                                return initTableDataBankOfx(value.data);
                            })
                            .then((dataTab) => initTable(dataTab));
                        };
                        reader.readAsBinaryString(file);
                        break;
                    case 'qfx':
                        reader.onload = function (e) {
                          cuServices.importFileResource('getFileOfxQfx', e.target.result)
                            .then((value) => {
                                vm.dataImport = value.data;
                                return initTableDataBankOfx(value.data);
                            })
                            .then((dataTab) => initTable(dataTab));
                        };
                        reader.readAsBinaryString(file);
                        break;
                    default:
                        console.log('Ce type de fichier n\'est pas pris en compte');
                }
            } else {
                setvalideForm(vm.importFile, false);
                setvalideForm(vm.associationFrom, false);
            }
        }

        function initTableDataBankOfx(dataBank) {
            $rootScope.$confirmChangePage = {
                indicateur: true,
                message: 'GLOBALE.MESSAGE.CONFIRMATION_CHANGEMENT_PAGE_CONCILIATION'
            };

            const dataComptes = dataBank.OFX.BANKMSGSRSV1 ? dataBank.OFX.BANKMSGSRSV1.STMTTRNRS : undefined;
            const dataCredit = dataBank.OFX.CREDITCARDMSGSRSV1 ? dataBank.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS : undefined;
            const dataPret = dataBank.OFX.CREDITCARDMSGSRSV1 ? dataBank.OFX.CREDITCARDMSGSRSV1.CCACCTINFO : undefined;

            const listeComptes = typeof dataComptes === 'undefined' ? [] : dataComptes instanceof Array ? dataComptes : [dataComptes];
            const listeCredit = typeof dataCredit === 'undefined' ? [] : dataCredit instanceof Array ? dataCredit : [dataCredit];
            const listePret = typeof dataPret === 'undefined' ? [] : dataPret instanceof Array ? dataPret : [dataPret];
            return [
                {
                    nom: 'ECRAN.CONCILIATION.ACCTTYPE_BANK_ACCOUNT',
                    listeInfo: 'STMTRS',
                    bankInfo: 'BANKACCTFROM',
                    liste: listeComptes
                }, {
                    nom: 'ECRAN.CONCILIATION.ACCTTYPE_CREDIT',
                    listeInfo: 'CCSTMTRS',
                    bankInfo: 'CCACCTFROM',
                    liste: listeCredit
                }, {
                    nom: 'ECRAN.CONCILIATION.ACCTTYPE_LOAN',//PRÊT
                    listeInfo: 'CCSTMTRS',
                    bankInfo: 'LOANACCTFROM',
                    liste: listePret
                }];
        }

        function getNumeroCompteOfx(data, cat) {
            if (data && cat) {
                //si compte, pret ou crédit
                let titre = data.ACCTTYPE ? translateFilter('ECRAN.CONCILIATION.ACCTTYPE_' + data.ACCTTYPE) : data.LOANACCTTYPE ? translateFilter('ECRAN.CONCILIATION.ACCTTYPE_' + data.LOANACCTTYPE) : translateFilter(cat.nom);
                return getNumeroTitre(titre, data.ACCTID);
            }
            return '';
        }

        function getNumeroTitre(titre, number) {
            let titretmp = titre;
            const numeroCarte = number.match(/\d/g).join("");
            if (numeroCarte.length > 4) {
                titretmp += ' ( ' + numeroCarte.substring(numeroCarte.length - 4, numeroCarte.length) + ' )';
            }
            return titretmp;
        }

        function initTable(data) {
            vm.tableData = data;
        }

        function setvalideForm(form, val) {
            form.$invalid = !val;
            form.$valid = val;
        }

        function initTableDataBankCsv(data) {

            $rootScope.$confirmChangePage = {
                indicateur: true,
                message: 'GLOBALE.MESSAGE.CONFIRMATION_CHANGEMENT_PAGE_CONCILIATION'
            };

            const accumulateur = {};
            data.forEach((valeurCourante) => {
                //On regarde si on a pas déjà cette variable dans l'acumulateur
                if (!Object.keys(accumulateur).filter((ele) => ele === valeurCourante.typeCompte).length) {
                    accumulateur[valeurCourante.typeCompte] = {
                        nom: getNumeroTitre(valeurCourante.typeCompte, valeurCourante.numeroCompte),
                        numeroCompte: valeurCourante.numeroCompte,
                        liste: [valeurCourante]
                    };
                } else {
                    accumulateur[valeurCourante.typeCompte].liste.push(valeurCourante);
                }

            });
            return accumulateur;
        }

        function toggleData(data) {
            const dataIndex = $scope.liste.temporaire.findIndex(ele => ele.$$hashKey === data.$$hashKey);
            if (dataIndex !== -1) {
                $scope.liste.temporaire.splice(dataIndex, 1);
            } else {
                $scope.liste.temporaire.push(data);
            }
        }

        $scope.enregistreTransaction = function (newSousPosteBudgetaireRegle, newRegle, idSousPosteBudgetaireRegleImpact) {
          return new Promise((resolve, reject) => {
            // On enregistre
            SousPosteBudgetaireRegleResource.create(newSousPosteBudgetaireRegle).$promise
              .then((result) => {
                  cuServices.message("create", false, false);
                  let retourIdMaitre = result.sousPosteBudgetaireRegle.id;

                  if (retourIdMaitre !== -1) {
                    newRegle.idSousPosteBudgetaireRegle = retourIdMaitre;

                    RegleResource.create(newRegle).$promise
                      .then((result) => {
                          let retourId = result.regle.id;

                          if (retourId !== -1) {

                              // Gestion de l'impact
                              let newRegleImpact = {
                                  idRegle: retourId,
                                  idSousPosteBudgetaireRegleImpact: idSousPosteBudgetaireRegleImpact
                              };
                              RegleImpactResource.create(newRegleImpact).$promise
                                .then((result) => {

                                  let newRegleException = {
                                    'idRegle': retourId,
                                    'dateRegle': newRegle.dateDebut,
                                    'montantException': newRegle.montant,
                                    'aucunVersement': 0,
                                    'concilie': 1,
                                  };

                                  RegleExceptionResource.create(newRegleException).$promise
                                    .then((result) => {
                                      let idRegleException = result.regleException.id;

                                      if (idRegleException != -1) {
                                          let newRegleExceptionVentilation = {
                                              idRegleException: idRegleException,
                                              date: newRegle.dateDebut,
                                              description: newRegle.description,
                                              montant: newRegle.montant
                                          };
                                          // On enregistre
                                          RegleExceptionVentilationResource.create(newRegleExceptionVentilation).$promise
                                            .then((result) => {
                                              resolve(true);
                                            })
                                            .catch((err) => {
                                              cuServices.message("create", err, true);
                                              resolve(false);
                                            });
                                      } else {
                                        resolve(false);
                                      }
                                    })
                                    .catch((err) => {
                                      cuServices.message("create", err, true);
                                      resolve(false);
                                    });
                                })
                                .catch((err) => {
                                  cuServices.message("create", err, true);
                                  resolve(false);
                                });
                          } else {
                            resolve(false);
                          }
                      })
                      .catch((err) => {
                        cuServices.message("create", err, true);
                        resolve(false);
                      });
                    } else {
                      resolve(false);
                    }
              })
              .catch((err) => {
                cuServices.message("create", err, true);
                resolve(false);
              });
          });
        };

        function ajouterTransaction(ligneConcilie) {

            let objetListe = [];
            let objetActuel = {};
            let idCategorie = 1;      //  1=Revenu  2=Dépense
            let idTypeOperation = 13; // 13=Revenu 14=Dépense
            // < 0 = Dépense  >= 0 Revenu
            if (parseFloat(ligneConcilie.TRNAMT) < 0) {
                // Dépense
                idCategorie = 2;
                idTypeOperation = 14;
            }

            let promisePoste = cuServices.viSousPosteBudgetaire("getParCateg",idCategorie);
            promisePoste.then(function(value) {
              let data = value.data;
              if (data.length > 0) {
                  objetListe = data;
              }
              const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERSOUSPOSTE");
              const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
              const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
              const selectOption = "item as item.nom | translate group by item.nomPosteBudgetaire | translate for item in objetListe | orderBy:'nom | translate':false:localeSensitiveComparator | orderBy:'nomPosteBudgetaire | translate':false:localeSensitiveComparator track by item.id";

              selectModal(boutonOk, boutonAnnuler, titre, objetActuel, objetListe, selectOption).result.then(function (idSousPosteBudgetaire) {
                  if (idSousPosteBudgetaire) {
                      let promiseOptions = cuServices.viRegleSousPosteBudgetaire("getParBudgetCateg",$scope.ctrl.budgetCourant, 3, 6, null, null, null, null);
                      promiseOptions.then(async function(value) {
                        let data = value.data;
                        // On choisi le compte principal par défaut
                        if (data.length > 0) {
                            let idSousPosteBudgetaireRegleImpact = data[0].id;

                            let newSousPosteBudgetaireRegle = {
                                'idBudget': $scope.ctrl.budgetCourant,
                                'idSousPosteBudgetaire': idSousPosteBudgetaire,
                                'description': '',
                                'comptePrincipal': 0,
                                'genere': 0,
                                'dateDebutGenere': "",
                                'dateFinGenere': "",
                                'taux': null,
                                'limiteEmprunt': null
                            };
                            let newRegle = {
                                'idSousPosteBudgetaireRegle': '',
                                'idTypeOperation': idTypeOperation,
                                'description': ligneConcilie.NAME,
                                'montant': Math.abs(parseFloat(ligneConcilie.TRNAMT)),
                                'taux': null,
                                'dateDebut': vm.getDate(ligneConcilie.DTPOSTED),
                                'dateFin': vm.getDate(ligneConcilie.DTPOSTED),
                                'uniteFrequence': 1,
                                'maitre': 1,
                                'idValeurElementPeriodicite': 15
                            };

                            await $scope.enregistreTransaction(newSousPosteBudgetaireRegle, newRegle, idSousPosteBudgetaireRegleImpact);

                            const dataIndex = $scope.liste.concilie.findIndex(ele => ele.$$hashKey === ligneConcilie.$$hashKey);
                            if (dataIndex == -1) {
                                $scope.liste.concilie.push(ligneConcilie);
                            }
                            // On met à jour le côté droit
                            $scope.$broadcast('redoOperationDepRev');
                        }
                      });
                  }
              });
            });
        }
    }

})();
