(function () {
    'use strict';

    angular.module('i2sFinance.priver.budgetCalendrier')
        .controller('BudgetCalendarCtrl', BudgetCalendarCtrl);

    /** @ngInject */
    function BudgetCalendarCtrl($scope,
                                $rootScope,
                                $translate,
                                baConfig,
                                operationJournaliereModal,
                                dialogModal,
                                prepareAnalyse,
                                tableauJours,
                                $timeout,
                                cuServices,
                                cuCurrency,
                                RegleExceptionResource) {

        const categorieColors = baConfig.colors.categorie;

        let dateDuJour;
        if ($rootScope.budgetActif.dateDebut !== null && $rootScope.budgetActif.dateDebut !== '' && moment(new Date()).isBefore(moment($rootScope.budgetActif.dateDebut))) {
          dateDuJour = $rootScope.budgetActif.dateDebut;
        }  else {
          dateDuJour = moment(new Date()).format("YYYY-MM-DD");
        }

        $scope.$parent.dateActive = dateDuJour;
        let initialLocaleCode = $scope.ctrl.languageSelected.code === "EN" ? 'en' : 'fr-ca';
        $scope.events = [];

        // ************************************************************************************************
        //  Chargements des événements du calendrier
        // ************************************************************************************************
        $scope.chargementEvenement = function (dateDebut, dateFin) {
          return new Promise((resolve, reject) => {
            let promise = cuServices.viAnalyseRegleDetailInfo("getParBudgetDate",$scope.ctrl.budgetCourant, dateDebut, dateFin);
            promise.then(function(value) {
              const data2 = value.data;
              let couleur = categorieColors.rev;
              let cpt = 0;

              for (let j = 0, tot2 = data2.length; j < tot2; j++) {

                  if (data2[j].codeCategorie === "REV") {
                      couleur = categorieColors.rev;
                  } else if (data2[j].codeCategorie === "DEP") {
                      couleur = categorieColors.dep;
                  } else if (data2[j].codeCategorie === "CPT") {
                      couleur = categorieColors.cpt;
                  } else if (data2[j].codeCategorie === "EPA") {
                      couleur = categorieColors.epa;
                  } else if (data2[j].codeCategorie === "PRE") {
                      couleur = categorieColors.pre;
                  } else if (data2[j].codeCategorie === "CRE") {
                      couleur = categorieColors.cre;
                  }

                  $scope.events[cpt] = {
                      title: cuCurrency.format(data2[j].descriptionMontant, $scope.ctrl.devise) + " - " + $translate.instant(data2[j].description),
                      start: data2[j].date,
                      color: couleur,
                      idSousPosteBudgetaireRegle: data2[j].idSousPosteBudgetaireRegle,
                      idSousPosteBudgetaireRegleImpact: data2[j].idSousPosteBudgetaireRegleImpact,
                      montant: data2[j].montant,
                      montantOrigine: data2[j].montantOrigine,
                      image: data2[j].image,
                      typeImage: data2[j].typeImage,
                      imageImpact: data2[j].imageImpact,
                      typeImageImpact: data2[j].typeImageImpact,
                      nom: data2[j].nom,
                      nomImpact: data2[j].nomImpact,
                      idRegle: data2[j].idRegle,
                      dateRegleOri: data2[j].dateOri,
                      dateRegle: data2[j].date,
                      codeCategorie: data2[j].codeCategorie,
                      idBudget: $scope.ctrl.budgetCourant,
                      signe: $scope.$parent.signe,
                      isException: data2[j].isException,
                      concilie: data2[j].concilie,
                      idRegleException: data2[j].idRegleException,
                      idTypeOperation: data2[j].idTypeOperation,
                      transfert: data2[j].transfert,
                      idRegleLien: data2[j].idRegleLien,
                      maitre: data2[j].maitre
                  };
                  cpt += 1;
              }
              $('#calendar').fullCalendar('removeEvents');
              $('#calendar').fullCalendar('removeEventSources');
              $('#calendar').fullCalendar('addEventSource', $scope.events);
              $('#calendar').fullCalendar('refetchEventSources', $scope.events);

              resolve(value);
            });

          });
        };

        $timeout(() => {
            $('.fc-today-button').bind("click", function () {
                // On s'occupe du background du jour actif
                $('.fc-state-highlight').removeClass("fc-state-highlight");
                $('[data-date=' + dateDuJour + ']').addClass("fc-state-highlight");

                $scope.$parent.dateActive = dateDuJour;
                // Appel de la variation journalière, pas besoin de reconstruire les soldes
                $scope.$parent.chargementVariationJournaliere(dateDuJour);
            });
        });
        const $element = $('#calendar').fullCalendar({
            //height: 335,
            customButtons: {
              conciliationBouton: {
                  icon: 'fa fa fa-check-square-o',
                  click: function() {
                      $scope.concilierMois();
                  }
              }
            },
            header: {
                left: 'prev,next', // 'prev,next today'
                center: 'title',
                right: 'today, conciliationBouton' // month, listMonth, listWeek, listDay, basicDay'
            },
            defaultDate: dateDuJour,
            nowIndicator: true,
            locale: initialLocaleCode,
            selectable: true,
            selectHelper: true,
            showNonCurrentDates: false,
            fixedWeekCount: true,
            editable: true,
            objectEquality: true,
            eventLimit: true, // allow "more" link when too many events
            events: $scope.events,
            viewRender: viewRender,
            dayClick: dayClick,
            eventClick: eventClick,
            eventDrop: eventDrop,
            eventRender: function(event, element) {
              let buffer = "";
              if (event.concilie === 1) {
                buffer = buffer + "<i class='fa fa-check-square-o'></i>&nbsp;";
              }
              if (event.idTypeOperation === 12) {
                buffer = buffer + "<i class='fa fa-arrow-circle-up'></i>&nbsp;";
              } else if (event.idTypeOperation === 11) {
                buffer = buffer + "<i class='fa fa-arrow-circle-down'></i>&nbsp;";
              } else if (event.idTypeOperation === 4) {
                buffer = buffer + "<i class='fa fa-refresh'></i>&nbsp;";
              }

              if (event.concilie === 1 || event.transfert === 1 || event.idTypeOperation === 4){
                element.find(".fc-title").prepend(buffer + "&nbsp;");
              }
            },
            eventAfterAllRender: function(){
                document.getElementsByClassName("fc-conciliationBouton-button")[0].setAttribute('title', $translate.instant('ECRAN.CALENDRIER.OPERATIONS_LIEU'));
                $scope.ctrl.initMonthClick();
            }
        });

        function viewRender(view, element) {
          if (view.type==='month') {
            const dateRef = view.start.format('YYYY-MM-DD');
            const dateDebut = view.start.format('YYYY-MM-DD');
            const dateFin = view.end.format('YYYY-MM-DD');

            $scope.events = [];

            $rootScope.$activeLoadingPage = true;
            $timeout(() => {

              let promise = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, dateDebut, dateFin, 0);
              promise.then(function(value) {

                let promiseChargement = $scope.chargementEvenement(dateDebut, moment(dateRef, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                promiseChargement.then(function(chargement) {

                  if (moment(view.options.defaultDate).startOf('month').isSame(moment(dateDebut, 'YYYY-MM-DD').startOf('month'))) {
                      // Si on retourne ou ouvre le mois de la date du jour, on affiche l'info de la date du jour
                      $scope.$parent.dateActive = $scope.$parent.dateActive || view.options.defaultDate;
                  } else {
                    if (moment($scope.$parent.dateActive).startOf('month').isSame(moment(dateDebut, 'YYYY-MM-DD').startOf('month'))) {
                      $scope.$parent.dateActive = $scope.$parent.dateActive;
                    } else {
                      $scope.$parent.dateActive = moment(dateDebut, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
                    }
                  }
                  view.options.defaultDate = $scope.$parent.dateActive;
                  // On s'occupe du background du jour actif
                  $(".fc-today").removeClass("fc-today");
                  $(".fc-state-highlight").removeClass("fc-state-highlight");
                  const getDay = moment($scope.$parent.dateActive, 'YYYY/MM/DD');
                  $('#calendar').find( view.dayGrid.cellEls.not('.fc-disabled-day')[getDay.format('D')-1]).addClass("fc-state-highlight");

                    let promiseFlux = $scope.$parent.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                            moment(dateFin, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'));
                    promiseFlux.then(function(chargement) {

                      let promiseVariationJournaliere = $scope.$parent.chargementVariationJournaliere($scope.$parent.dateActive);
                      promiseVariationJournaliere.then(function(varJournaliere) {

                        let promiseVariationMensuelle = $scope.$parent.chargementVariationMensuelle($scope.$parent.dateActive);
                        promiseVariationMensuelle.then(function(varMensuelle) {
                          $rootScope.$activeLoadingPage = false;
                        });
                      });
                    });
                });
              });
            });
          }


        }

        function dayClick(date, jsEvent, view) {
            const dateActive = date.format('YYYY-MM-DD');

            // On s'occupe du background du jour actif
            $(".fc-today").removeClass("fc-today");
            $(".fc-state-highlight").removeClass("fc-state-highlight");
            $(this).addClass("fc-state-highlight");

            //On active le bouton Today
            $('.fc-today-button').removeAttr('disabled');
            $('.fc-today-button').removeClass('fc-state-disabled');

            $scope.$parent.dateActive = dateActive;
            // Appel de la variation journalière, pas besoin de reconstruire les soldes
            $scope.$parent.chargementVariationJournaliere(dateActive);

            var evenements = $('#calendar').fullCalendar('clientEvents', function(event){ 
              return ( dateActive == event.start._i ); // May be change
            });

            if (evenements.length > 0) {
              evenements.sort((item1, item2) => {
                // Convert names to lowercase for case-insensitive sorting
                const lowercaseName1 = item1.title.toLowerCase();
                const lowercaseName2 = item2.title.toLowerCase();
              
                // Compare the lowercase versions of names
                if (lowercaseName1 < lowercaseName2) {
                  return -1; // Return a negative value if person1 should come before person2
                } else if (lowercaseName1 > lowercaseName2) {
                  return 1;  // Return a positive value if person1 should come after person2
                } else {
                  return 0;  // Return 0 if names are equal
                }
              });
  
              var text = "";
              evenements.forEach((ele) => {
                text = text + '<div style="background-color: ' + ele.color + '; color: white">&nbsp;' + ele.title + '</div>'
              });
  
              dialogModal(text , 'default',  
                                 $translate.instant(dateActive),
                                 $translate.instant('GLOBALE.BOUTON.OK'), false,
                                 false , false);
            }     
        }

        function eventClick(calEvent, jsEvent, view) {
          const dateRef = view.start.format('YYYY-MM-DD');
          const dateDebut = view.start.format('YYYY-MM-DD');
          const dateFin = view.end.format('YYYY-MM-DD');

          $scope.titreOperation = $translate.instant("GLOBALE.AIDE.OPERATION_JOURNALIERE");
          $scope.boutonEnregistrer = $translate.instant("GLOBALE.BOUTON.ENREGISTRER");
          $scope.boutonSupprimer = $translate.instant("GLOBALE.BOUTON.SUPPRIMER");
          $scope.boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

          var parametres = {
            'codeCategorie': calEvent.codeCategorie,
            'dateOperation': calEvent.dateRegleOri,
            'dateEvenement': calEvent.start.format('YYYY-MM-DD'),
            'idBudget': calEvent.idBudget,
            'idRegle': calEvent.idRegle,
            'idRegleException': calEvent.idRegleException,
            'idTypeOperation': calEvent.idTypeOperation,
            'idSousPosteBudgetaireRegle': calEvent.idSousPosteBudgetaireRegle,
            'idSousPosteBudgetaireRegleImpact': calEvent.idSousPosteBudgetaireRegleImpact,
            'montant': calEvent.montantOrigine,
            'image': calEvent.image,
            'typeImage': calEvent.typeImage,
            'imageImpact': calEvent.imageImpact,
            'typeImageImpact': calEvent.typeImageImpact,
            'nom': calEvent.nom,
            'nomImpact': calEvent.nomImpact,
            'isException': calEvent.isException,
            'concilie': calEvent.concilie,
            'transfert': calEvent.transfert,
            'idRegleLien': calEvent.idRegleLien,
            'maitre': calEvent.maitre
          };

          operationJournaliereModal($scope.boutonEnregistrer,
                                    $scope.boutonSupprimer,
                                    $scope.boutonAnnuler,
                                    $scope.titreOperation,
                                    parametres,
                                    $scope.ctrl.signe,
                                    $scope.ctrl.devise).result.then(function(retour) {
            if (retour) {
              $scope.events = [];
              $rootScope.$activeLoadingPage = true;
              $timeout(() => {
                let promise = prepareAnalyse.genereOperationsEtSoldes(calEvent.idBudget, dateDebut, dateFin, 0);
                promise.then(function(value) {

                  let promiseChargement = $scope.chargementEvenement(dateDebut, moment(dateRef, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                  promiseChargement.then(function(chargement) {

                    let promiseFlux = $scope.$parent.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                            moment(dateFin, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'));
                    promiseFlux.then(function(chargement) {

                      let promiseVariationJournaliere = $scope.$parent.chargementVariationJournaliere($scope.$parent.dateActive);
                      promiseVariationJournaliere.then(function(varJournaliere) {

                        let promiseVariationMensuelle = $scope.$parent.chargementVariationMensuelle($scope.$parent.dateActive);
                        promiseVariationMensuelle.then(function(varMensuelle) {
                          $rootScope.$activeLoadingPage = false;
                        });
                      });
                    });
                  });
                });
              });
            } else {
              $scope.chargementEvenement(dateDebut,
                                         moment(dateRef, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
            }
          });
        }

        function eventDrop(event, delta, revertFunc, jsEvent, ui, view) {

          const dateDrop = event.start.format();
          const dateRef = view.start.format('YYYY-MM-DD');
          const dateDebut = view.start.format('YYYY-MM-DD');
          const dateFin = view.end.format('YYYY-MM-DD');

          let message = $translate.instant('GLOBALE.MESSAGE.CHANGE_DATE_EXC');
          if (event.idTypeOperation === 4 && event.maitre === 1) {
            message = $translate.instant('GLOBALE.MESSAGE.CHANGE_DATE_OUV');
          } else if (event.idTypeOperation === 4 && event.maitre === 0) {
            message = $translate.instant('GLOBALE.MESSAGE.CHANGE_DATE_AJU');
          }

          dialogModal(message,
                      'warning',
                      $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                      $translate.instant('GLOBALE.BOUTON.OUI'),
                      false,
                      $translate.instant('GLOBALE.BOUTON.NON'),
                      false).result.then(function (retour) {
              if (retour === 1) {
                $rootScope.$activeLoadingPage = true;

                var newRegleException = {};
                var newRegleExceptionLien = {};

                if (event.isException) {
                  newRegleException = { 'id' : event.idRegleException,
                                        'idRegle': event.idRegle,
                                        'dateRegle': event.dateRegleOri,
                                        'dateException': dateDrop,
                                        'montantException': event.montant,
                                        'concilie':  event.concilie,
                                        'aucunVersement': 0
                                      };
                  newRegleExceptionLien = { 'idRegle': event.idRegleLien,
                                            'dateRegle': event.dateRegleOri,
                                            'dateException': dateDrop,
                                            'montantException': event.montant,
                                            'concilie':  event.concilie,
                                            'aucunVersement': 0
                                          };

                } else {
                  newRegleException = { 'idRegle': event.idRegle,
                                        'dateRegle': event.dateRegle,
                                        'dateException': dateDrop,
                                        'aucunVersement': 0
                                       };
                  newRegleExceptionLien = {'idRegle': event.idRegleLien,
                                           'dateRegle': event.dateRegle,
                                           'dateException': dateDrop,
                                           'aucunVersement': 0
                                          };
                }

                if (event.idTypeOperation === 4) {
                  newRegleException.dateRegle = dateDrop;
                }

                let promiseRegleException = new Promise( (resolve, reject) => {
                  if (event.transfert) {
                    // On enregistre une exception sur la destination
                    if (event.isException) {
                      RegleExceptionResource.removeParRegleDateException({"idRegle": event.idRegleLien,
                                                                          "dateException": event.dateRegle}).$promise
                          .then(() => {
                            // Silencieux
                            newRegleException.id = null;
                            newRegleExceptionLien.id = null;

                            RegleExceptionResource.create(newRegleExceptionLien).$promise
                                .then((result) => {
                                   cuServices.message("create", false, false);
                                   resolve(result);
                                })
                                .catch(err => {
                                   cuServices.message("create", err, true);
                                   $rootScope.$activeLoadingPage = false;
                                   reject(err);
                                });
                          })
                          .catch(err => {
                             cuServices.message("delete", err, true);
                             $rootScope.$activeLoadingPage = false;
                             reject(err);
                          });
                    } else {
                      RegleExceptionResource.removeParRegleDateRegle({"idRegle": event.idRegleLien,
                                                                      "dateRegle": event.dateRegle}).$promise
                          .then(() => {
                            // Silencieux
                            newRegleException.id = null;
                            newRegleExceptionLien.id = null;

                            RegleExceptionResource.create(newRegleExceptionLien).$promise
                                .then((result) => {
                                   // Silencieux
                                   resolve(result);
                                })
                                .catch(err => {
                                   cuServices.message("create", err, true);
                                   $rootScope.$activeLoadingPage = false;
                                   reject(err);
                                });
                          })
                          .catch(err => {
                             cuServices.message("delete", err, true);
                             $rootScope.$activeLoadingPage = false;
                             reject(err);
                          });
                    }
                  } else {
                    resolve(true);
                  }
                });

                Promise.all([promiseRegleException])
                .then( (result) => {

                     $scope.$eval((newRegleException.id ? "update" : "create"),RegleExceptionResource)(newRegleException).$promise
                       .then((result) => {
                         cuServices.message((newRegleException.id ? "update" : "create"), false, false);
                         $scope.events = [];
                         $rootScope.$activeLoadingPage = true;
                         $timeout(() => {
                           let promise = prepareAnalyse.genereOperationsEtSoldes(event.idBudget, dateDebut, dateFin, 0);
                           promise.then(function(value) {

                             let promiseChargement = $scope.chargementEvenement(dateDebut, moment(dateRef, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD'));
                             promiseChargement.then(function(chargement) {

                               let promiseFlux = $scope.$parent.chargementFluxTresorie(moment(dateDebut, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'),
                                                                                       moment(dateFin, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'));
                               promiseFlux.then(function(chargement) {

                                 let promiseVariationJournaliere = $scope.$parent.chargementVariationJournaliere($scope.$parent.dateActive);
                                 promiseVariationJournaliere.then(function(varJournaliere) {

                                   let promiseVariationMensuelle = $scope.$parent.chargementVariationMensuelle($scope.$parent.dateActive);
                                   promiseVariationMensuelle.then(function(varMensuelle) {
                                     $rootScope.$activeLoadingPage = false;
                                   });
                                 });
                               });
                             });
                           });
                         });
                       })
                       .catch((err) => {
                         cuServices.message((newRegleException.id ? "update" : "create"), err, true);
                       });
                });
              } else {
                  revertFunc();
              }
          });
        }

        $scope.concilierMois = function () {

          const dateDebutMois = moment($scope.$parent.dateActive, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
          const dateFinMois = moment($scope.$parent.dateActive, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');

          dialogModal($translate.instant('GLOBALE.MESSAGE.CONCILIE_MOIS'),
                      'warning',
                      $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                      $translate.instant('GLOBALE.BOUTON.OUI'),
                      false,
                      $translate.instant('GLOBALE.BOUTON.NON'),
                      false).result.then(function (retour) {
            if (retour === 1) {
              $rootScope.$activeLoadingPage = true;

              let newRegleExceptionCreate = [];
              let newRegleExceptionUpdateId = [];

              for (let i = 0, tot = $scope.events.length; i < tot; i++) {
                if ($scope.events[i].concilie === 0) {
                  if ($scope.events[i].isException === 1) {
                    newRegleExceptionUpdateId.push($scope.events[i].idRegleException);
                  } else {
                    newRegleExceptionCreate.push({ 'idRegle': $scope.events[i].idRegle,
                                                    'dateRegle': $scope.events[i].dateRegle,
                                                    'dateException': $scope.events[i].dateRegle,
                                                    'montantException': $scope.events[i].montant,
                                                    'aucunVersement': 0,
                                                    'concilie' : 1
                                                 });
                  }
                }
              }

              let promiseRegleExceptionUpdate = new Promise( (resolve, reject) => {

                if (newRegleExceptionUpdateId.length > 0) {
                  const data = { "objet": {"concilie": 1},
                                   "id" : newRegleExceptionUpdateId };
                  RegleExceptionResource.update(data).$promise
                      .then((result) => {
                         cuServices.message("update", false, false);
                         resolve(result);
                      })
                      .catch(err => {
                         cuServices.message("update", err, true);
                         $rootScope.$activeLoadingPage = false;
                         reject(err);
                      });
                } else {
                  resolve(true);
                }
              });

              let promiseRegleExceptionCreate = new Promise( (resolve, reject) => {
                if (newRegleExceptionCreate.length > 0) {
                  RegleExceptionResource.bulkCreate(newRegleExceptionCreate).$promise
                      .then((result) => {
                         // Silencieux
                         resolve(result);
                      })
                      .catch(err => {
                         cuServices.message("create", err, true);
                         $rootScope.$activeLoadingPage = false;
                         reject(err);
                      });
                } else {
                  resolve(true);
                }
              });

              Promise.all([promiseRegleExceptionUpdate, promiseRegleExceptionCreate])
              .then( (result) => {
                $scope.events = [];
                $rootScope.$activeLoadingPage = true;
                $timeout(() => {
                  let promise = prepareAnalyse.genereOperationsEtSoldes($scope.ctrl.budgetCourant, dateDebutMois, dateFinMois, 0);
                  promise.then(function(value) {

                    let promiseChargement = $scope.chargementEvenement(dateDebutMois,dateFinMois);
                    promiseChargement.then(function(chargement) {

                      let promiseFlux = $scope.$parent.chargementFluxTresorie(moment(dateDebutMois, 'YYYY-MM-DD').startOf('month').subtract(1, 'day').format('YYYY-MM-DD'), dateFinMois);
                      promiseFlux.then(function(chargement) {

                        let promiseVariationJournaliere = $scope.$parent.chargementVariationJournaliere($scope.$parent.dateActive);
                        promiseVariationJournaliere.then(function(varJournaliere) {

                          let promiseVariationMensuelle = $scope.$parent.chargementVariationMensuelle($scope.$parent.dateActive);
                          promiseVariationMensuelle.then(function(varMensuelle) {
                            $rootScope.$activeLoadingPage = false;
                          });
                        });
                      });
                    });
                  });
                });
              });
            }
          });
        };

    }
})();
