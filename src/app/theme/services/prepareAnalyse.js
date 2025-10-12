/**
 * @author Sébastien Lizotte
 *
 * toastr.success('Your information has been saved successfully!');
 * toastr.info("You've got a new email!", 'Information');
 * toastr.error("Your information hasn't been saved!", 'Error');
 * toastr.warning('Your computer is about to explode!', 'Warning');
 *
 */
(function () {
  'use strict';

//.service('prepareAnalyse', function (toastr, toastrConfig, dataService, $translate, ActionSystemeResource) {
  angular.module('i2sFinance.theme')
      .service('prepareAnalyse', function ($q,
                                           toastr,
                                           toastrConfig,
                                           $translate,
                                           ActionSystemeResource,
                                           SoldeResource,
                                           cuServices,
                                           ViAnalyseRegleCompteFluxPeriodeResource,
                                           ViAnalyseRegleDetailResource) {

    var insertBuffer = "";
    var insertBufferSolde = "";
    var insertBufferSoldeFin = "";

    //********************************************************************************************************
    //
    // Maximiser les opérations et soldes pour un budget (Année courante)
    //
    //********************************************************************************************************
    this.maximiseOperationsEtSoldes = function (idBudget, dateFin) {

      return new Promise((resolve, reject) => {

        const data = { "codeAction" : 'MAX_OPERATIONS',
                       "idReference1" : idBudget,
                       "valeurParamTexte1" : '1900-01-01',
                       "valeurParamTexte2" : dateFin,
                       "force" : 0
                     };

        ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => {
                        cuServices.message('ActionSystemeResource', err, true);
                        reject(err);
                      });
      });
    }

    //********************************************************************************************************
    //
    // Génération des opérations et soldes pour un budget
    //
    //********************************************************************************************************
    this.genereOperationsEtSoldes = function (idBudget, dateDebut, dateFin, force) {
      return new Promise((resolve, reject) => {

          const data = { "codeAction" : 'GEN_OPERATIONS',
                         "idReference1" : idBudget,
                         "valeurParamTexte1" : '1900-01-01',
                         "valeurParamTexte2" : dateFin,
                         "force" : force
                       };

          ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);

                      })
                      .catch((err) => {
                        cuServices.message('ActionSystemeResource', err, true);
                        reject(err);
                      });
        });
    }

    //********************************************************************************************************
    //
    // Génération du rapport détaillé
    //
    //********************************************************************************************************
    this.genereRapportDetaille = function (idBudget, dateDebut, dateFin, force) {
      return new Promise((resolve, reject) => {

          const data = { "codeAction" : 'GEN_RAPPORT_DET',
                         "idReference1" : idBudget,
                         "valeurParamTexte1" : dateDebut,
                         "valeurParamTexte2" : dateFin,
                         "force" : force
                       };

          ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);

                      })
                      .catch((err) => {
                        cuServices.message('ActionSystemeResource', err, true);
                        reject(err);
                      });
        });
    }

    //********************************************************************************************************
    //
    // Trouve le solde d'un compte à une date désirée
    //
    //********************************************************************************************************
    this.getSoldeCompte = function (idSousPosteBudgetaireRegle, dateSolde) {
      return $q(function(resolve, reject) {
        let solde = 0;
        const data = { "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                       "date" : dateSolde
                     };
        SoldeResource.getParIdDate(data).$promise
           .then((result) => {
             resolve(result.data);
           })
           .catch((err) => {
             reject(0);
           });
      });
    }

    //********************************************************************************************************
    //
    // Flux par sousPosteBudgetaireRegle
    //
    //********************************************************************************************************
    this.getFlux = async function (idBudget, dateDebut, dateFin, sousPosteBudgetaireRegle, couleur, comptePrincipal, serieInactive) {

      return new Promise((resolve, reject) => {

          var flux = {};
          var valeur = [];

          const data = { "idBudget" : idBudget,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "idSousPosteBudgetaireRegle" : sousPosteBudgetaireRegle.id
                       };

          ViAnalyseRegleCompteFluxPeriodeResource.getFlux(data).$promise
                      .then((result) => {
                        let data = result.data;
                        for (var i=0,  tot=data.length; i < tot; i++) {
                          valeur.push( { date: data[i].date,
                                         label: moment(data[i].date,'YYYY-MM-DD').format('DD'),
                                         x: i,
                                         y: Number(data[i].solde)
                                       }
                                     );
                        }

                        if (couleur != ""){
                          // lineChart
                          flux = {
                            key: $translate.instant(sousPosteBudgetaireRegle.nomSousPosteBudgetaireLov),
                            disabled: serieInactive,
                            values: valeur,
                            area: comptePrincipal,
                            color: couleur
                          }
                        } else {
                          // lineChart
                          flux = {
                            key: $translate.instant(sousPosteBudgetaireRegle.nomSousPosteBudgetaireLov),
                            disabled: serieInactive,
                            values: valeur,
                            area: comptePrincipal
                          }
                        }
                        resolve(flux);
                      })
                      .catch((err) => {
                        cuServices.message('ViAnalyseRegleCompteFluxPeriodeResource', err, true);
                        reject(err);
                      });
        });
    };

    // ************************************************************************************************
    //  Trouve la date précédente de l'événement
    //
    // ************************************************************************************************
    this.getDateEvenementPrecedent = function (idBudget, idRegle, dateRef) {
      return new Promise((resolve, reject) => {
        // Pour éviter les erreurs
        if (dateRef === null || dateRef == undefined) {
          dateRef = moment().format('YYYY-MM-DD');
        }
        let dateRetour = dateRef;
        let dateDebut = moment(dateRef,'YYYY-MM-DD').add(-10, 'year').format('YYYY-MM-DD');

        let promiseAnalyse = cuServices.viAnalyseRegleDetail("getPrecedent",idRegle, dateDebut, dateRef, dateRef);
        promiseAnalyse
          .then((value) => {
            const data = value.data;
            if (data.length > 0) {
              dateRetour = data[data.length-1].date;
            }
            resolve(dateRetour);
          })
          .catch((err) => {
            cuServices.message('cuServices.viAnalyseRegleDetail', err, true);
            resolve(dateRetour);
          });
      });
    };

    // ************************************************************************************************
    //  Trouve la date suivante de l'événement
    //
    // ************************************************************************************************
    this.getDateEvenementSuivant = function (idBudget, idRegle, dateRef) {
      return new Promise((resolve, reject) => {
        // Pour éviter les erreurs
        if (dateRef === null || dateRef == undefined) {
          dateRef = moment().format('YYYY-MM-DD');
        }
        var dateRetour = dateRef;
        var dateFin = moment(dateRef,'YYYY-MM-DD').add(10, 'year').format('YYYY-MM-DD');

        let promiseAnalyse = cuServices.viAnalyseRegleDetail("getSuivant",idRegle, dateRef, dateFin, dateRef);
        promiseAnalyse
          .then((value) => {
            const data = value.data;
            if (data.length > 0) {
              dateRetour = data[0].date;
            }
            resolve(dateRetour);
          })
          .catch((err) => {
            cuServices.message('cuServices.viAnalyseRegleDetail', err, true);
            resolve(dateRetour);
          });
      });
    };
  })
})();
