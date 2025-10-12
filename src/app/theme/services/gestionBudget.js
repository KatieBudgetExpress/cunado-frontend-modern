/**
 * @author Sébastien Lizotte
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .service('gestionBudget', function ($q,
                                          $rootScope,
                                          $timeout,
                                          $location,
                                          toastr,
                                          toastrConfig,
                                          cuServices,
                                          $translate,
                                          dialogModal,
                                          selectModal,
                                          Upload,
                                          FileSaver,
                                          Blob,
                                          prepareAnalyse,
                                          SousPosteBudgetaireRegleResource,
                                          BudgetResource,
                                          PosteBudgetaireResource,
                                          SousPosteBudgetaireResource,
                                          RegleResource,
                                          RegleDateResource,
                                          RegleImpactResource,
                                          RegleExceptionResource,
                                          RegleExceptionVentilationResource,
                                          inputTextModal) {

    var insertBuffer = "";
    var insertBufferSolde = "";
    var insertBufferSoldeFin = "";
    var vm = this;

    //********************************************************************************************************
    // Suppression d'un budget
    //********************************************************************************************************
    vm.supprimerBudget = function (budget) {
      return new Promise((resolve, reject) => {
        let promiseSupp = cuServices.supprimeBudget(budget.id, 1);
        promiseSupp.then(function(value) {

          BudgetResource.getAll().$promise
              .then((result) => {
                if (result.budget.length === 0) {
                  $location.path('/assistant');
                  resolve(true);
                } else {
                  if (budget.defaut === 1) {
                    const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERBUDGET");
                    const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
                    const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
                    const selectOption = "item as (item.nom + ' (' + item.dateDebut +')') for item in objetListe | orderBy:'nom | translate':false:localeSensitiveComparator";

                    selectModal(boutonOk, boutonAnnuler, titre, result.budget.sort(function(a, b) {return b.id - a.id})[0], result.budget, selectOption).result.then(async function (idBudget) {
                        if (idBudget) {
                          $rootScope.budgetActif = result.budget.find(bdg => bdg.id === idBudget);
                          $rootScope.budgetActif.defaut = 1;
                          $rootScope.budgetCourantDescription = $rootScope.budgetActif.nom;

                          BudgetResource.update($rootScope.budgetActif).$promise
                              .then((result) => {
                                resolve(true);
                              }).catch((err) => {
                                resolve(false);
                              });
                        }
                    });
                  } else {
                    resolve(true);
                  }
                }
              }).catch(function(err) {
                resolve(false);
              });
        }).catch(function(err) {
          resolve(false);
        });
      });
    };

        //********************************************************************************************************
    // Exportation d'un budget
    //********************************************************************************************************
    vm.exporteBudget = function (oldBudget, withFile) {

      return new Promise((resolve, reject) => {
        //******************************************************************************
        // Étape 1 (Budget)
        //******************************************************************************
        let objetExport = [];
        let newBudget = oldBudget;
        let newSousPosteBudgetaireRegle = [];
        let newRegle = [];
        let newRegleImpact = [];
        let newRegleDate = [];
        let newRegleException = [];
        let newRegleExceptionVentilation = [];

        //******************************************************************************
        // Étape 2 (Sous poste budgétaire règle)
        //******************************************************************************
        let promiseSousPosteBudgetaireRegle = new Promise( (resolve, reject) => {
          SousPosteBudgetaireRegleResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newSousPosteBudgetaireRegle.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('SousPosteBudgetaireRegleResource.getParBudget', err, true);
                resolve(false);
              });
        });

        //******************************************************************************
        // Étape 3 (Règle)
        //******************************************************************************
        let promiseRegle = new Promise( (resolve, reject) => {
          RegleResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newRegle.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('RegleResource.getParBudget', err, true);
                resolve(false);
              });
        });

        //******************************************************************************
        // Étape 4 (RegleDate)
        //******************************************************************************
        let promiseRegleDate = new Promise( (resolve, reject) => {
          RegleDateResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newRegleDate.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('RegleDateResource.getParBudget', err, true);
                resolve(false);
              });
        });

        //******************************************************************************
        // Étape 5 (RegleImpact)
        //******************************************************************************
        let promiseRegleImpact = new Promise( (resolve, reject) => {
          RegleImpactResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newRegleImpact.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('RegleImpactResource.getParBudget', err, true);
                resolve(false);
              });
        });

        //******************************************************************************
        // Étape 6 (RegleException)
        //******************************************************************************
        let promiseRegleException = new Promise( (resolve, reject) => {
          RegleExceptionResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newRegleException.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('RegleExceptionResource.getParBudget', err, true);
                resolve(false);
              });
        });

        //******************************************************************************
        // Étape 7 (RegleExceptionVentilation)
        //******************************************************************************
        let promiseRegleExceptionVentilation = new Promise( (resolve, reject) => {
          RegleExceptionVentilationResource.getParBudget({"idBudget": oldBudget.id}).$promise
              .then((result) => {
                if (result.data.length > 0) {
                  newRegleExceptionVentilation.push(result.data);
                }
                resolve(true);
              }).catch(err => {
                cuServices.message('RegleExceptionVentilationResource.getParBudget', err, true);
                resolve(false);
              });
        });

        Promise.all([promiseSousPosteBudgetaireRegle,
                     promiseRegle,
                     promiseRegleDate,
                     promiseRegleImpact,
                     promiseRegleException,
                     promiseRegleExceptionVentilation])
        .then( (result) => {
          objetExport.push({
            budget: newBudget,
            sousPosteBudgetaireRegle: newSousPosteBudgetaireRegle[0],
            regle: newRegle[0],
            regleImpact: newRegleImpact[0],
            regleDate: newRegleDate[0],
            regleException: newRegleException[0],
            regleExceptionVentilation: newRegleExceptionVentilation[0]
          });

          if (withFile) {
            let nom = newBudget.nom;
            let filename = nom.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.bud';
            let data = new Blob([JSON.stringify(objetExport[0])], { type: 'text/plain;charset=utf-8' });
            FileSaver.saveAs(data, filename);
  
            resolve(true);
          } else {
            resolve(objetExport[0]);
          }

        }).catch(err => {
          resolve(false);
        });
      });
    };

    //********************************************************************************************************
    // Importation d'un budget
    //********************************************************************************************************
    vm.importeBudget = function (oldBudget, objetImport) {
      return new Promise(async (resolve, reject) => {

        //******************************************************************************
        // Étape 1 (Validation du budget)
        //******************************************************************************
        if (typeof(objetImport.budget)    === 'undefined' ||
            typeof(objetImport.budget.id) === 'undefined' ||
            objetImport.budget.id !== oldBudget.id) {
          // On arrête tout de suite
          toastr.error($translate.instant("GLOBALE.MESSAGE.BUDGET_DIFFERENT"));
          resolve(false);
        } else {
          //******************************************************************************
          // Étape 2 (Suppression du budget au complet)
          //******************************************************************************
          let promiseSupp = cuServices.supprimeBudget(oldBudget.id, 0);
          promiseSupp.then(function(value) {

            //******************************************************************************
            // Étape 3 (Sous poste budgétaire règle) sousPosteBudgetaireRegle
            //******************************************************************************
            if (typeof(objetImport.sousPosteBudgetaireRegle) !== 'undefined' && objetImport.sousPosteBudgetaireRegle.length) {
              let promiseSousPosteBudgetaireRegle = SousPosteBudgetaireRegleResource.bulkCreate(objetImport.sousPosteBudgetaireRegle).$promise;
              promiseSousPosteBudgetaireRegle.then(function(value) {

                //******************************************************************************
                // Étape 4 (Règle) regle
                //******************************************************************************
                if (typeof(objetImport.regle) !== 'undefined' && objetImport.regle.length) {
                  let promiseRegle = RegleResource.bulkCreate(objetImport.regle).$promise;
                  promiseRegle.then(function(value) {

                    //******************************************************************************
                    // Étape 5 (RegleDate) regleDate
                    //******************************************************************************
                    let promiseRegleDate = new Promise( (resolve, reject) => {
                      if (typeof(objetImport.regleDate) !== 'undefined' && objetImport.regleDate.length) {
                        RegleDateResource.bulkCreate(objetImport.regleDate).$promise
                            .then((result) => {
                              resolve(true);
                            }).catch(err => {
                              cuServices.message('RegleDateResource.bulkCreate', err, true);
                              resolve(false);
                            });
                      } else {
                        resolve(true);
                      }
                    });

                    //******************************************************************************
                    // Étape 6 (RegleImpact) regleImpact
                    //******************************************************************************
                    let promiseRegleImpact = new Promise( (resolve, reject) => {
                      if (typeof(objetImport.regleImpact) !== 'undefined' && objetImport.regleImpact.length) {
                        RegleImpactResource.bulkCreate(objetImport.regleImpact).$promise
                            .then((result) => {
                              resolve(true);
                            }).catch(err => {
                              cuServices.message('RegleImpactResource.bulkCreate', err, true);
                              resolve(false);
                            });
                      } else {
                        resolve(true);
                      }
                    });

                    //******************************************************************************
                    // Étape 7 (RegleException) regleException
                    //******************************************************************************
                    let promiseRegleException = new Promise( (resolve, reject) => {
                      if (typeof(objetImport.regleException) !== 'undefined' && objetImport.regleException.length) {
                        RegleExceptionResource.bulkCreate(objetImport.regleException).$promise
                            .then((result) => {

                              //******************************************************************************
                              // Étape 8 (RegleExceptionVentilation) regleExceptionVentilation
                              //******************************************************************************
                              if (typeof(objetImport.regleExceptionVentilation) !== 'undefined' && objetImport.regleExceptionVentilation.length) {
                                RegleExceptionVentilationResource.bulkCreate(objetImport.regleExceptionVentilation).$promise
                                    .then((result) => {
                                      resolve(true);
                                    }).catch(err => {
                                      cuServices.message('RegleExceptionVentilationResource.bulkCreate', err, true);
                                      resolve(false);
                                    });
                              } else {
                                resolve(true);
                              }
                            }).catch(err => {
                              cuServices.message('RegleExceptionResource.bulkCreate', err, true);
                              resolve(false);
                            });
                      } else {
                        resolve(true);
                      }
                    });

                    Promise.all([promiseRegleDate,
                                 promiseRegleImpact,
                                 promiseRegleException])
                    .then( (result) => {
                      toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
                      resolve(true);
                    }).catch(err => {
                      toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                      resolve(false);
                    });
                  }).catch(function(err) {
                    toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                    resolve(false);
                  });
                } else {
                  toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
                  resolve(true);
                }
              }).catch(function(err) {
                toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                resolve(false);
              });
            } else {
              toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
              resolve(true);
            }
          }).catch(function(err) {
            toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR"));
            resolve(false);
          });
        }
      });
    };

    // Async genereOperationsEtSoldes
    vm.genereOperationsEtSoldes = async function (idBudget, dateFin) {
      const retour = await prepareAnalyse.genereOperationsEtSoldes(idBudget, "1900-01-01", dateFin, 1);
      return retour;
    }

    // Async getSoldeCompte
    vm.getSoldeCompte = async function (idSousPosteBudgetaireRegle, dateSolde) {
      const solde = await prepareAnalyse.getSoldeCompte(idSousPosteBudgetaireRegle, dateSolde);
      return solde.length ? solde[0].soldeNum : 0;
    }

    // Async getDateEvenementSuivant
    vm.getDateEvenementSuivant = async function (idBudget, idRegle, dateRef) {
      const dateEvenement = await prepareAnalyse.getDateEvenementSuivant(idBudget, idRegle, dateRef);
      return dateEvenement;
    }

    //********************************************************************************************************
    // Copie d'un budget pour la date de début demandée
    //********************************************************************************************************
    vm.copieBudget = function (oriBudget, newBudget) {
      return new Promise(async (resolve, reject) => {

        //******************************************************************************
        // Étape 0 (Générer les soldes du budget d'origine en date du début du nouveau budget)
        //******************************************************************************
        await vm.genereOperationsEtSoldes(oriBudget.id, newBudget.dateDebut);

        //******************************************************************************
        // Étape 1 (Get budget d'origine)
        //******************************************************************************
        let promiseGetBudget = vm.exporteBudget(oriBudget, false);
        promiseGetBudget.then(async function(objetCopie) {
         
          //******************************************************************************
          // Étape 2 (Création du budget)
          //******************************************************************************
          const dateDebut = newBudget.dateDebut;
          newBudget.id = null;
          newBudget.protege = 0;
          newBudget.motPasse = null;
          newBudget.defaut = 0;    

          BudgetResource.create(newBudget).$promise
          .then(async (result) => {          
            newBudget.id = result.budget.id;

            let newSousPosteBudgetaireRegle = [];
            let newRegle = [];
            let newRegleDate = [];
            let newRegleImpact = [];
            let newRegleException = [];
            let newRegleExceptionVentilation = [];
            let tableauSousPosteBudgetaireRegle = [];
            let tableauRegle12 = [];

            //******************************************************************************
            // Étape 3 (Trouver les séquences maximums)
            //******************************************************************************
            let promiseSeq = cuServices.viSequenceMax("getSeq");
            promiseSeq.then(async function(value) {
              
              let seqSousPosteBudgetaireRegle = value.data[0].seqSousPosteBudgetaireRegle;
              let seqRegle = value.data[0].seqRegle;
              let seqRegleDate = value.data[0].seqRegleDate;
              let seqRegleImpact = value.data[0].seqRegleImpact;
              let seqRegleException = value.data[0].seqRegleException;
              let seqRegleExceptionVentilation = value.data[0].seqRegleExceptionVentilation;

              //******************************************************************************
              // Étape 4 (Sous poste budgétaire règle) sousPosteBudgetaireRegle
              //******************************************************************************
              for (const sousPosteBudgetaireRegle of objetCopie.sousPosteBudgetaireRegle) {

                let supprimeNewSousPosteBudgetaireRegle = true;
                let oldSeqSousPosteBudgetaireRegle = sousPosteBudgetaireRegle.id;
                seqSousPosteBudgetaireRegle += 1;
                sousPosteBudgetaireRegle.id = seqSousPosteBudgetaireRegle;
                sousPosteBudgetaireRegle.idBudget = newBudget.id;

                //******************************************************************************
                // Étape 5 (Règle) regle
                //******************************************************************************
                const listRegle = typeof objetCopie.regle === 'undefined' ? [] : objetCopie.regle.filter(reg => reg.idSousPosteBudgetaireRegle === oldSeqSousPosteBudgetaireRegle);
                
                for (const regle of listRegle) {
                  let copieRegle = true;

                  // Si pas maitre et typeOperation 4 : On valide si l'ajustement est après notre date de début, sinon on l'importe pas
                  if (regle.idTypeOperation === 4 && regle.maitre === 0) {
                    if (moment(regle.dateDebut).isBefore(dateDebut)) {
                      //On arrête
                      copieRegle = false;
                    }
                  }

                  // Si typeOperation 11;12;13;14 : On va chercher la prochaine cédule d'opération et on valide avec la date de fin
                  if (regle.idTypeOperation === 11 || regle.idTypeOperation === 12 || regle.idTypeOperation === 13 || regle.idTypeOperation === 14) {
                    let dateOrigine = moment(dateDebut).subtract(1, 'day').format('YYYY-MM-DD');
                    regle.dateDebut = await vm.getDateEvenementSuivant(oriBudget.id, regle.id, dateOrigine);
                    // J'ai reçu la date envoyée (-1 jour), ça veux dire qu'il n'y a pas de prochaine fois
                    if (regle.dateDebut === dateOrigine) {
                      //On arrête
                      copieRegle = false;
                    } else {
                      if (regle.dateFin !== null && regle.dateFin !== '') {
                        if (moment(regle.dateFin).isBefore(moment(regle.dateDebut))) {
                          //On arrête
                          copieRegle = false;
                        }
                      }
                    }
                  }

                  // Go pour la copie de la règle
                  if (copieRegle) {
                    // On a au moins une règle valide
                    supprimeNewSousPosteBudgetaireRegle = false;
                    let oldSeqRegle = regle.id;
                    seqRegle += 1;
                    regle.id = seqRegle;
                    regle.idSousPosteBudgetaireRegle = seqSousPosteBudgetaireRegle;

                    // Si maitre et typeOperation 4 : On trouve le solde à la date choisie pour le nouveau budget
                    if (regle.idTypeOperation === 4 && regle.maitre === 1) {
                      regle.montant = await vm.getSoldeCompte(oldSeqSousPosteBudgetaireRegle, moment(dateDebut).subtract(1, 'day').format('YYYY-MM-DD'));
                      regle.dateDebut = moment(dateDebut).subtract(1, 'day').format('YYYY-MM-DD');
                      regle.dateFin = moment(dateDebut).subtract(1, 'day').format('YYYY-MM-DD');
                    }

                    newRegle.push(regle);

                    // Si typeOperation 12: on garde le oldIdRegle et le newIdRegle dans un tableau
                    if (regle.idTypeOperation === 12) {
                      tableauRegle12.push({
                        oldIdRegle: oldSeqRegle,
                        newIdRegle: seqRegle
                      });
                    }

                    //******************************************************************************
                    // Étape 6 (RegleDate) Selon la date
                    //******************************************************************************
                    const listRegleDate = typeof objetCopie.regleDate === 'undefined' ? [] : objetCopie.regleDate.filter(reg => reg.idRegle === oldSeqRegle);  
                    for (const regleDate of listRegleDate) {
                      if (moment(regleDate.dateFixe).isSameOrAfter(moment(dateDebut))) {
                        seqRegleDate += 1;
                        regleDate.id = seqRegleDate;
                        regleDate.idRegle = seqRegle;
                        newRegleDate.push(regleDate);
                      }
                    }

                    //******************************************************************************
                    // Étape 7 (RegleImpact) Tous
                    //******************************************************************************
                    const listRegleImpact = typeof objetCopie.regleImpact === 'undefined' ? [] : objetCopie.regleImpact.filter(reg => reg.idRegle === oldSeqRegle);  
                    for (const regleImpact of listRegleImpact) {
                      seqRegleImpact += 1;
                      regleImpact.id = seqRegleImpact;
                      regleImpact.idRegle = seqRegle;
                      newRegleImpact.push(regleImpact);
                    }

                    //******************************************************************************
                    // Étape 8 (RegleException)
                    //******************************************************************************
                    const listRegleException = typeof objetCopie.regleException === 'undefined' ? [] : objetCopie.regleException.filter(reg => reg.idRegle === oldSeqRegle);
                    for (const regleException of listRegleException) {
                      if ( ( (regleException.dateException == null || regleException.dateException == '') && moment(regleException.dateRegle).isSameOrAfter(moment(dateDebut)) )
                        || ( moment(regleException.dateException).isSameOrAfter(moment(dateDebut))) ) {
                          
                        let oldSeqRegleException = regleException.id;
                        seqRegleException += 1;
                        regleException.id = seqRegleException;
                        regleException.idRegle = seqRegle;
                        if (regleException.montant == null || regleException.montant == '') {
                            regleException.montant = null;
                        }
                        newRegleException.push(regleException);

                        //******************************************************************************
                        // Étape 9 (regleExceptionVentilation)
                        //******************************************************************************
                        const listRegleExceptionVentilation = typeof objetCopie.regleExceptionVentilation === 'undefined' ? [] : objetCopie.regleExceptionVentilation.filter(reg => reg.idRegleException === oldSeqRegleException);
                        for (const regleExceptionVentilation of listRegleExceptionVentilation) {
                          seqRegleExceptionVentilation += 1;
                          regleExceptionVentilation.id = seqRegleExceptionVentilation;
                          regleExceptionVentilation.idRegleException = seqRegleException;
                          newRegleExceptionVentilation.push(regleExceptionVentilation);
                        }
                      } 
                    };
                  }
                }

                if (!supprimeNewSousPosteBudgetaireRegle) {
                  newSousPosteBudgetaireRegle.push(sousPosteBudgetaireRegle);

                  // On garde le oldIdSousPosteBudgetaireRegle et le newIdSousPosteBudgetaireRegle dans un tableau pour faire la
                  // mise à jour des impacts
                  tableauSousPosteBudgetaireRegle.push({
                    oldIdSousPosteBudgetaireRegle: oldSeqSousPosteBudgetaireRegle,
                    newIdSousPosteBudgetaireRegle: seqSousPosteBudgetaireRegle
                  });                
                }
              }

              //******************************************************************************
              // Étape 10 (regle.idRegleLienTransfert)
              //******************************************************************************
              for (var i=0,  tot=newRegle.length; i < tot; i++) {
                if (newRegle[i].idTypeOperation === 11 || newRegle[i].idTypeOperation === 12) {
                  if (tableauRegle12.find(tab => tab.oldIdRegle === newRegle[i].idRegleLienTransfert)) {
                    newRegle[i].idRegleLienTransfert = tableauRegle12.find(tab => tab.oldIdRegle === newRegle[i].idRegleLienTransfert).newIdRegle;
                  }
                }
              }

              //******************************************************************************
              // Étape 11 (regleException.idSousPosteBudgetaireRegleImpactException)
              //******************************************************************************
              for (var i=0,  tot=newRegleException.length; i < tot; i++) {
                if (tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleException[i].idSousPosteBudgetaireRegleImpactException)) {
                  newRegleException[i].idSousPosteBudgetaireRegleImpactException = tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleException[i].idSousPosteBudgetaireRegleImpactException).newIdSousPosteBudgetaireRegle;
                }
              }

              //******************************************************************************
              // Étape 12 (regleImpact.idSousPosteBudgetaireRegleImpact)
              //******************************************************************************
              let idx = newRegleImpact.length;
              while (idx--) {
                if (tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[idx].idSousPosteBudgetaireRegleImpact)) {
                  newRegleImpact[idx].idSousPosteBudgetaireRegleImpact = tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[idx].idSousPosteBudgetaireRegleImpact).newIdSousPosteBudgetaireRegle;
                } 
              }
                          
              //******************************************************************************
              // Étape 13 (Bulk Create)
              //******************************************************************************

              //******************************************************************************
              // Étape 13.1 (Sous poste budgétaire règle) sousPosteBudgetaireRegle
              //******************************************************************************
              if (newSousPosteBudgetaireRegle.length) {
                let promiseSousPosteBudgetaireRegle = SousPosteBudgetaireRegleResource.bulkCreate(newSousPosteBudgetaireRegle).$promise;
                promiseSousPosteBudgetaireRegle.then(function(value) {

                  //******************************************************************************
                  // Étape 13.2 (Règle) regle
                  //******************************************************************************
                  if (newRegle.length) {
                    let promiseRegle = RegleResource.bulkCreate(newRegle).$promise;
                    promiseRegle.then(function(value) {

                      //******************************************************************************
                      // Étape 13.3 (RegleDate) regleDate
                      //******************************************************************************
                      let promiseRegleDate = new Promise( (resolve, reject) => {
                        if (newRegleDate.length) {
                          RegleDateResource.bulkCreate(newRegleDate).$promise
                              .then((result) => {
                                resolve(true);
                              }).catch(err => {
                                cuServices.message('RegleDateResource.bulkCreate', err, true);
                                resolve(false);
                              });
                        } else {
                          resolve(true);
                        }
                      });

                      //******************************************************************************
                      // Étape 13.4 (RegleImpact) regleImpact
                      //******************************************************************************
                      let promiseRegleImpact = new Promise( (resolve, reject) => {
                        if (newRegleImpact.length) {
                          RegleImpactResource.bulkCreate(newRegleImpact).$promise
                              .then((result) => {
                                resolve(true);
                              }).catch(err => {
                                cuServices.message('RegleImpactResource.bulkCreate', err, true);
                                resolve(false);
                              });
                        } else {
                          resolve(true);
                        }
                      });

                      //******************************************************************************
                      // Étape 13.5 (RegleException) regleException
                      //******************************************************************************
                      let promiseRegleException = new Promise( (resolve, reject) => {
                        if (newRegleException.length) {
                          RegleExceptionResource.bulkCreate(newRegleException).$promise
                              .then((result) => {

                                //******************************************************************************
                                // Étape 13.6 (RegleExceptionVentilation) regleExceptionVentilation
                                //******************************************************************************
                                if (newRegleExceptionVentilation.length) {
                                  RegleExceptionVentilationResource.bulkCreate(newRegleExceptionVentilation).$promise
                                      .then((result) => {
                                        resolve(true);
                                      }).catch(err => {
                                        cuServices.message('RegleExceptionVentilationResource.bulkCreate', err, true);
                                        resolve(false);
                                      });
                                } else {
                                  resolve(true);
                                }
                              }).catch(err => {
                                cuServices.message('RegleExceptionResource.bulkCreate', err, true);
                                resolve(false);
                              });
                        } else {
                          resolve(true);
                        }
                      });

                      Promise.all([promiseRegleDate,
                                    promiseRegleImpact,
                                    promiseRegleException])
                      .then( (result) => {
                        toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_COPIE"));
                        $rootScope.$activeLoadingPage = false;
                        resolve(newBudget);
                      }).catch(err => {
                        toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                        $rootScope.$activeLoadingPage = false;
                        resolve(false);
                      });
                    }).catch(function(err) {
                      toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                      $rootScope.$activeLoadingPage = false;
                      resolve(false);
                    });
                  } else {
                    toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_COPIE"));
                    $rootScope.$activeLoadingPage = false;
                    resolve(newBudget);
                  }
                }).catch(function(err) {
                  toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                  $rootScope.$activeLoadingPage = false;
                  resolve(false);
                });
              } else {
                toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_COPIE"));
                $rootScope.$activeLoadingPage = false;
                resolve(newBudget);
              }              
            }).catch(function(err) {
              cuServices.message("Séquence", err, true);
              resolve(false);
            });
          }).catch((err) => {
            cuServices.message("Création Budget", err, true);
            resolve(false);
          });
        }).catch(function(err) {
          toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR"));
          resolve(false);
        });
      });
    };

    //********************************************************************************************************
    // Validation du mot de passe du budget
    //********************************************************************************************************
    vm.valideMotPasse = function(motPasse) {
      var deferred = $q.defer();
      deferred.notify();

      const titre = $translate.instant("GLOBALE.AIDE.SAISIRMOTPASSE");
      const boutonOk = $translate.instant("GLOBALE.BOUTON.APPLIQUER");
      const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

      inputTextModal(boutonOk, boutonAnnuler, titre, true, 0).result.then(function (texteRetourne) {
          if (texteRetourne === null || texteRetourne !== motPasse) {
            deferred.reject();
          } else {
            deferred.resolve();
          }
      });
      return deferred.promise;
    };



    //******************************************************************************
    // Importation d'un budget de Sqlite
    //     => Gestion des postes et sous postes budgétaires
    //******************************************************************************
    vm.importeSqliteBudgetPosteCreateUpdate = function (isPoste, create, objet) {
      return new Promise(async (resolve, reject) => {
        if (isPoste) {
          if (create) {
            PosteBudgetaireResource.create(objet).$promise
                .then(async (result) => {
                  resolve(true);
                })
                .catch(err => {
                  cuServices.message("Création PosteBudgetaire", err, true);
                  resolve(false);
                });
          } else {
            PosteBudgetaireResource.update(objet).$promise
                .then(async (result) => {
                  resolve(true);
                })
                .catch(err => {
                  cuServices.message("Mise-à-jour PosteBudgetaire", err, true);
                  resolve(false);
                });
          }
        } else {
          if (create) {
            SousPosteBudgetaireResource.create(objet).$promise
                .then(async (result) => {
                  resolve(true);
                })
                .catch(err => {
                  cuServices.message("Création PosteBudgetaire", err, true);
                  resolve(false);
                });
          } else {
            SousPosteBudgetaireResource.update(objet).$promise
                .then(async (result) => {
                  resolve(true);
                })
                .catch(err => {
                  cuServices.message("Mise-à-jour PosteBudgetaire", err, true);
                  resolve(false);
                });
          }
        }
      });
    };

    vm.importeSqliteBudgetPoste = function (validation, objetImport, sousPosteBudgetaireInexistant) {
      return new Promise(async (resolve, reject) => {
        let listPosteBudgetaire = JSON.parse(objetImport.posteBudgetaire);
        let listSousPosteBudgetaire = JSON.parse(objetImport.sousPosteBudgetaire);

        PosteBudgetaireResource.getAll().$promise
            .then(async (result) => {
              if (result.posteBudgetaire.length > 0) {
                let posteBudgetaireActuels = result.posteBudgetaire;

                for (let i = 0, tot = listPosteBudgetaire.length; i < tot; i++) {

                  if(posteBudgetaireActuels.find(pb => pb.id === listPosteBudgetaire[i].id)) {
                    // On update le poste
                    if (!validation) {
                      await vm.importeSqliteBudgetPosteCreateUpdate(true, false, listPosteBudgetaire[i]);
                    }
                  } else {
                    // On crée le poste
                    if (!validation) {
                      await vm.importeSqliteBudgetPosteCreateUpdate(true, true, listPosteBudgetaire[i]);
                    }
                  }
                }
                SousPosteBudgetaireResource.getAll().$promise
                    .then(async (result) => {
                      if (result.sousPosteBudgetaire.length > 0) {
                        let sousPosteBudgetaireActuels = result.sousPosteBudgetaire;

                        for (let i = 0, tot = listSousPosteBudgetaire.length; i < tot; i++) {

                          if(sousPosteBudgetaireActuels.find(pb => pb.id === listSousPosteBudgetaire[i].id)) {
                            // On update le sous poste
                            if (!validation) {
                              await vm.importeSqliteBudgetPosteCreateUpdate(false, false, listSousPosteBudgetaire[i]);
                            }
                          } else {
                            // On crée le sous poste
                            if (!validation) {
                              await vm.importeSqliteBudgetPosteCreateUpdate(false, true, listSousPosteBudgetaire[i]);
                            } else {
                              sousPosteBudgetaireInexistant.push(listSousPosteBudgetaire[i]);
                            }
                          }
                        }
                        resolve(true);
                      } else {
                        resolve(true);
                      }
                    }).catch((err) => {
                      cuServices.message("SousPosteBudgetaireResource getAll", err, true);
                      resolve(false);
                    });
              } else {
                resolve(true);
              }
            }).catch((err) => {
              cuServices.message("PosteBudgetaireResource getAll", err, true);
              resolve(false);
            });
      });
    };

    //********************************************************************************************************
    // Importation d'un budget de Sqlite
    //********************************************************************************************************
    vm.importeSqliteBudget = function (newBudget, objetImport) {
      return new Promise(async (resolve, reject) => {

        let oldBudgetId = newBudget.id;

        //******************************************************************************
        // Étape 1 (Validation du budget)
        //******************************************************************************
        let promiseValideUnicite = cuServices.valideUnicite("getParCondition", 'budget', ' WHERE 1=1 ', 'nom', newBudget.nom, "GLOBALE.MESSAGE.UNICITE_BUDGET");
        promiseValideUnicite.then(function(valide) {
          if (valide) {
            //******************************************************************************
            // Étape 2 (Question à l'usager pour les postes budgétaires)
            //******************************************************************************
            dialogModal($translate.instant('GLOBALE.MESSAGE.SOUS_POSTE_CONF'), 'warning',
                $translate.instant('GLOBALE.MESSAGE.ATTENTION'),
                $translate.instant('GLOBALE.SWITCH.OUI'), false,
                $translate.instant('GLOBALE.SWITCH.NON'), false).result
                .then(async (retour) => {
                    $rootScope.$activeLoadingPage = true;
                    let sousPosteBudgetaireInexistant = [];
                    let listSousPosteBudgetaire = JSON.parse(objetImport.sousPosteBudgetaire);

                    if (retour) {
                      //******************************************************************************
                      // Étape 2.5 (Gestion des postes et sous postes budgétaires)
                      //******************************************************************************
                      await vm.importeSqliteBudgetPoste(false, objetImport);
                    } else {
                      await vm.importeSqliteBudgetPoste(true, objetImport, sousPosteBudgetaireInexistant);
                    }
                    //******************************************************************************
                    // Étape 3 (Création du budget)
                    //******************************************************************************
                    newBudget.id = null;
                    newBudget.protege = 0;
                    newBudget.motPasse = null;
                    newBudget.defaut = 0;

                    BudgetResource.create(newBudget).$promise
                      .then((result) => {
                        newBudget.id = result.budget.id;

                        let newSousPosteBudgetaireRegle = [];
                        let newRegle = [];
                        let newRegleDate = [];
                        let newRegleImpact = [];
                        let newRegleException = [];
                        let newRegleExceptionVentilation = [];
                        let tableauSousPosteBudgetaireRegle = [];
                        let tableauRegle12 = [];

                        // Trouver les séquences maximums
                        let promiseSeq = cuServices.viSequenceMax("getSeq");
                        promiseSeq.then(function(value) {
                          let seqSousPosteBudgetaireRegle = value.data[0].seqSousPosteBudgetaireRegle;
                          let seqRegle = value.data[0].seqRegle;
                          let seqRegleDate = value.data[0].seqRegleDate;
                          let seqRegleImpact = value.data[0].seqRegleImpact;
                          let seqRegleException = value.data[0].seqRegleException;
                          let seqRegleExceptionVentilation = value.data[0].seqRegleExceptionVentilation;

                          //******************************************************************************
                          // Étape 4 (Sous poste budgétaire règle) sousPosteBudgetaireRegle
                          //******************************************************************************
                          let listSousPosteBudgetaireRegle = JSON.parse(objetImport.sousPosteBudgetaireRegle).filter(sbr => sbr.idBudget === oldBudgetId);
                          listSousPosteBudgetaireRegle.forEach((sousPosteBudgetaireRegle) => {
                            // Si sous poste budgetaire inexistant on skip cet opération
                            if(!sousPosteBudgetaireInexistant.find(pb => pb.id === sousPosteBudgetaireRegle.idSousPosteBudgetaire) &&
                               listSousPosteBudgetaire.find(pb => pb.id === sousPosteBudgetaireRegle.idSousPosteBudgetaire)) {
                              let oldSeqSousPosteBudgetaireRegle = sousPosteBudgetaireRegle.id;
                              seqSousPosteBudgetaireRegle += 1;
                              sousPosteBudgetaireRegle.id = seqSousPosteBudgetaireRegle;
                              sousPosteBudgetaireRegle.idBudget = newBudget.id;
                              if (sousPosteBudgetaireRegle.limiteEmprunt == null || sousPosteBudgetaireRegle.limiteEmprunt == '') {
                                  sousPosteBudgetaireRegle.limiteEmprunt = null;
                              }
                              if (sousPosteBudgetaireRegle.taux == null || sousPosteBudgetaireRegle.taux == '') {
                                  sousPosteBudgetaireRegle.taux = null;
                              }
                              newSousPosteBudgetaireRegle.push(sousPosteBudgetaireRegle);

                              // On garde le oldIdSousPosteBudgetaireRegle et le newIdSousPosteBudgetaireRegle dans un tableau pour faire la
                              // mise à jour des impacts
                              tableauSousPosteBudgetaireRegle.push({
                                oldIdSousPosteBudgetaireRegle: oldSeqSousPosteBudgetaireRegle,
                                newIdSousPosteBudgetaireRegle: seqSousPosteBudgetaireRegle
                              });

                              //******************************************************************************
                              // Étape 5 (Règle) regle
                              //******************************************************************************
                              let listRegle = JSON.parse(objetImport.regle).filter(reg => reg.idSousPosteBudgetaireRegle === oldSeqSousPosteBudgetaireRegle);
                              listRegle.forEach((regle) => {
                                let oldSeqRegle = regle.id;
                                seqRegle += 1;
                                regle.id = seqRegle;
                                regle.idSousPosteBudgetaireRegle = seqSousPosteBudgetaireRegle;
                                if (regle.montant == null || regle.montant == '') {
                                    regle.montant = null;
                                }
                                if (regle.jourDeux == null || regle.jourDeux == '') {
                                    regle.jourDeux = null;
                                }
                                if (regle.jourUn == null || regle.jourUn == '') {
                                    regle.jourUn = null;
                                }
                                if (regle.taux == null || regle.taux == '') {
                                    regle.taux = null;
                                }
                                newRegle.push(regle);

                                // Si typeOperation 12: on garde le oldIdRegle et le newIdRegle dans un tableau
                                if (regle.idTypeOperation === 12) {
                                  tableauRegle12.push({
                                    oldIdRegle: oldSeqRegle,
                                    newIdRegle: seqRegle
                                  });
                                }

                                //******************************************************************************
                                // Étape 6 (RegleDate) regleDate
                                //******************************************************************************
                                let listRegleDate = JSON.parse(objetImport.regleDate).filter(reg => reg.idRegle === oldSeqRegle);
                                listRegleDate.forEach((regleDate) => {
                                  seqRegleDate += 1;
                                  regleDate.id = seqRegleDate;
                                  regleDate.idRegle = seqRegle;
                                  newRegleDate.push(regleDate);
                                });

                                //******************************************************************************
                                // Étape 7 (RegleImpact)
                                //******************************************************************************
                                let listRegleImpact = JSON.parse(objetImport.regleImpact).filter(reg => reg.idRegle === oldSeqRegle);
                                listRegleImpact.forEach((regleImpact) => {
                                  seqRegleImpact += 1;
                                  regleImpact.id = seqRegleImpact;
                                  regleImpact.idRegle = seqRegle;
                                  newRegleImpact.push(regleImpact);
                                });

                                //******************************************************************************
                                // Étape 8 (RegleException)
                                //******************************************************************************
                                let listRegleException = JSON.parse(objetImport.regleException).filter(reg => reg.idRegle === oldSeqRegle);
                                listRegleException.forEach((regleException) => {
                                  let oldSeqRegleException = regleException.id;
                                  seqRegleException += 1;
                                  regleException.id = seqRegleException;
                                  regleException.idRegle = seqRegle;
                                  if (regleException.montant == null || regleException.montant == '') {
                                      regleException.montant = null;
                                  }
                                  newRegleException.push(regleException);

                                  //******************************************************************************
                                  // Étape 9 (regleExceptionVentilation)
                                  //******************************************************************************
                                  let listRegleExceptionVentilation = JSON.parse(objetImport.regleExceptionVentilation).filter(reg => reg.idRegleException === oldSeqRegleException);
                                  listRegleExceptionVentilation.forEach((regleExceptionVentilation) => {
                                    seqRegleExceptionVentilation += 1;
                                    regleExceptionVentilation.id = seqRegleExceptionVentilation;
                                    regleExceptionVentilation.idRegleException = seqRegleException;
                                    newRegleExceptionVentilation.push(regleExceptionVentilation);
                                  });
                                });
                              });
                            }
                          });

                          //******************************************************************************
                          // Étape 10 (regle.idRegleLienTransfert)
                          //******************************************************************************
                          for (var i=0,  tot=newRegle.length; i < tot; i++) {
                            if (newRegle[i].idTypeOperation === 11 || newRegle[i].idTypeOperation === 12) {
                              if (tableauRegle12.find(tab => tab.oldIdRegle === newRegle[i].idRegleLienTransfert)) {
                                newRegle[i].idRegleLienTransfert = tableauRegle12.find(tab => tab.oldIdRegle === newRegle[i].idRegleLienTransfert).newIdRegle;
                              }
                            }
                          }

                          //******************************************************************************
                          // Étape 11 (regleException.idSousPosteBudgetaireRegleImpactException)
                          //******************************************************************************
                          for (var i=0,  tot=newRegleException.length; i < tot; i++) {
                            if (tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleException[i].idSousPosteBudgetaireRegleImpactException)) {
                              newRegleException[i].idSousPosteBudgetaireRegleImpactException = tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleException[i].idSousPosteBudgetaireRegleImpactException).newIdSousPosteBudgetaireRegle;
                            }
                          }

                          //******************************************************************************
                          // Étape 12 (regleImpact.idSousPosteBudgetaireRegleImpact)
                          //******************************************************************************
                          let idx = newRegleImpact.length;

                          while (idx--) {
                            if (tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[idx].idSousPosteBudgetaireRegleImpact)) {
                              newRegleImpact[idx].idSousPosteBudgetaireRegleImpact = tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[idx].idSousPosteBudgetaireRegleImpact).newIdSousPosteBudgetaireRegle;
                            } else {
                              // ***** SI ON EST ICI C'EST QU'IL Y A UNE ERREUR FK DANS LA BD SQLITE. 
                              // LE idSousPosteBudgetaireRegleImpact n'est pas valide dans le cas des transferts, donc on supprime tout ce qui
                              // concerne la/les regles associées à ce transfert.
                              //
                              // Enleve les règles associées à l'impact en erreur
                              const listeRegleSupp = newRegle.filter(reg => reg.idRegleLienTransfert === newRegleImpact[idx].idRegle);
                              listeRegleSupp.forEach((regle) => {
                                // Enleve les règles dates associées
                                const listeRegleDateSupp = newRegleDate.filter(reg => reg.idRegle === regle.id);
                                listeRegleDateSupp.forEach((regleDate) => {
                                  newRegleDate.splice(newRegleDate.indexOf(regleDate), 1);
                                });

                                // Enleve les règles exceptions date associées
                                const listeRegleExcSupp = newRegleException.filter(reg => reg.idRegle === regle.id);
                                listeRegleExcSupp.forEach((regleException) => {
                                  newRegleException.splice(newRegleException.indexOf(regleException), 1);

                                  // Enlève les ventilations d'exception
                                  const listeExceptionVentilationSupp = newRegleExceptionVentilation.filter(reg => reg.idRegleException === regleException.id);
                                  listeExceptionVentilationSupp.forEach((regleExceptionVentilation) => {
                                    newRegleExceptionVentilation.splice(newRegleExceptionVentilation.indexOf(regleDate), 1);
                                  });
                                });
                                // Enlève la règle
                                newRegle.splice(newRegle.indexOf(regle), 1);
                              });
                              // Enleve l'impact problématique
                              newRegleImpact.splice(idx,1);
                            }
                          }

/*
                          for (var i=0,  tot=newRegleImpact.length; i < tot; i++) {
                            if (tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[i].idSousPosteBudgetaireRegleImpact)) {
                              newRegleImpact[i].idSousPosteBudgetaireRegleImpact = tableauSousPosteBudgetaireRegle.find(tab => tab.oldIdSousPosteBudgetaireRegle === newRegleImpact[i].idSousPosteBudgetaireRegleImpact).newIdSousPosteBudgetaireRegle;
                            } 
                          }
*/
                          //******************************************************************************
                          // Étape 13 (Bulk Create)
                          //******************************************************************************

                          //******************************************************************************
                          // Étape 13.1 (Sous poste budgétaire règle) sousPosteBudgetaireRegle
                          //******************************************************************************
                          if (newSousPosteBudgetaireRegle.length) {
                            let promiseSousPosteBudgetaireRegle = SousPosteBudgetaireRegleResource.bulkCreate(newSousPosteBudgetaireRegle).$promise;
                            promiseSousPosteBudgetaireRegle.then(function(value) {

                              //******************************************************************************
                              // Étape 13.2 (Règle) regle
                              //******************************************************************************
                              if (newRegle.length) {
                                let promiseRegle = RegleResource.bulkCreate(newRegle).$promise;
                                promiseRegle.then(function(value) {

                                  //******************************************************************************
                                  // Étape 13.3 (RegleDate) regleDate
                                  //******************************************************************************
                                  let promiseRegleDate = new Promise( (resolve, reject) => {
                                    if (newRegleDate.length) {
                                      RegleDateResource.bulkCreate(newRegleDate).$promise
                                          .then((result) => {
                                            resolve(true);
                                          }).catch(err => {
                                            cuServices.message('RegleDateResource.bulkCreate', err, true);
                                            resolve(false);
                                          });
                                    } else {
                                      resolve(true);
                                    }
                                  });

                                  //******************************************************************************
                                  // Étape 13.4 (RegleImpact) regleImpact
                                  //******************************************************************************
                                  let promiseRegleImpact = new Promise( (resolve, reject) => {
                                    if (newRegleImpact.length) {
                                      RegleImpactResource.bulkCreate(newRegleImpact).$promise
                                          .then((result) => {
                                            resolve(true);
                                          }).catch(err => {
                                            cuServices.message('RegleImpactResource.bulkCreate', err, true);
                                            resolve(false);
                                          });
                                    } else {
                                      resolve(true);
                                    }
                                  });

                                  //******************************************************************************
                                  // Étape 13.5 (RegleException) regleException
                                  //******************************************************************************
                                  let promiseRegleException = new Promise( (resolve, reject) => {
                                    if (newRegleException.length) {
                                      RegleExceptionResource.bulkCreate(newRegleException).$promise
                                          .then((result) => {

                                            //******************************************************************************
                                            // Étape 13.6 (RegleExceptionVentilation) regleExceptionVentilation
                                            //******************************************************************************
                                            if (newRegleExceptionVentilation.length) {
                                              RegleExceptionVentilationResource.bulkCreate(newRegleExceptionVentilation).$promise
                                                  .then((result) => {
                                                    resolve(true);
                                                  }).catch(err => {
                                                    cuServices.message('RegleExceptionVentilationResource.bulkCreate', err, true);
                                                    resolve(false);
                                                  });
                                            } else {
                                              resolve(true);
                                            }
                                          }).catch(err => {
                                            cuServices.message('RegleExceptionResource.bulkCreate', err, true);
                                            resolve(false);
                                          });
                                    } else {
                                      resolve(true);
                                    }
                                  });

                                  Promise.all([promiseRegleDate,
                                               promiseRegleImpact,
                                               promiseRegleException])
                                  .then( (result) => {
                                    toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
                                    $rootScope.$activeLoadingPage = false;
                                    resolve(newBudget);
                                  }).catch(err => {
                                    toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                                    $rootScope.$activeLoadingPage = false;
                                    resolve(false);
                                  });
                                }).catch(function(err) {
                                  toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                                  $rootScope.$activeLoadingPage = false;
                                  resolve(false);
                                });
                              } else {
                                toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
                                $rootScope.$activeLoadingPage = false;
                                resolve(newBudget);
                              }
                            }).catch(function(err) {
                              toastr.error($translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION"));
                              $rootScope.$activeLoadingPage = false;
                              resolve(false);
                            });
                          } else {
                            toastr.info($translate.instant("GLOBALE.MESSAGE.BUDGET_IMPORTE"));
                            $rootScope.$activeLoadingPage = false;
                            resolve(newBudget);
                          }
                        }).catch(function(err) {
                          cuServices.message("Séquence", err, true);
                          resolve(false);
                        });
                      }).catch((err) => {
                        cuServices.message("Création Budget", err, true);
                        resolve(false);
                      });
                });
          } else {
            resolve(false);
          }
        });
      });
    };

  });
})();
