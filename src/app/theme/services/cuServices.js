/**
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .service('cuServices', function ($q,
                                       $rootScope,
                                       toastr,
                                       toastrConfig,
                                       $translate,
                                       ActionSystemeResource,
                                       ValideUniciteResource,
                                       ViAnalyseRegleDetailInfoResource,
                                       ViRegleSousPosteBudgetaireResource,
                                       RegleExceptionResource,
                                       RegleExceptionVentilationResource,
                                       RegleResource,
                                       RegleImpactResource,
                                       RegleDateResource,
                                       ViRegleSoldeResource,
                                       ViSousPosteBudgetaireResource,
                                       ViPosteBudgetaireResource,
                                       ViSousPosteBudgetaireRegleValidationResource,
                                       ViRegleAjustementResource,
                                       ViRegleExceptionResource,
                                       ViRegleExceptionCacheResource,
                                       ViAnalyseRegleDetailResource,
                                       ImportFileResource,
                                       ViConciliationSectionDepRevResource,
                                       ViRapportDetailleSectionCompteCreditResource,
                                       ViRapportDetailleSectionDepRevResource,
                                       ViRapportResource,
                                       ViRapportSommaireSectionDepRevResource,
                                       ViAnalyseRegleSommaireInfoPosteResource,
                                       ViReglePosteBudgetaireResource,
                                       ViSequenceMaxResource,
                                       ViLienBancaireResource
                                      ) {

    //********************************************************************************************************
    // Message de BD
    //********************************************************************************************************
    this.message = function (action, err, log) {

      if (action === "delete") {
        if (!err) {
          let message = $translate.instant("GLOBALE.MESSAGE.SUPP_SUCCES");
          log ? console.log(message) : toastr.success(message);
        } else {
          let message = $translate.instant("GLOBALE.MESSAGE.ERREUR");
          log ? console.log(message + " : " + err) : toastr.error(message);
          $rootScope.$activeLoadingPage = false;
        }
      } else if (action === "update") {
        if (!err) {
          let message = $translate.instant("GLOBALE.MESSAGE.MAJ_SUCCES");
          log ? console.log(message) : toastr.success(message);
        } else {
          let message = $translate.instant("GLOBALE.MESSAGE.ERREUR_MAJ");
          log ? console.log(message + " : " + err) : toastr.error(message);
          $rootScope.$activeLoadingPage = false;
        }
      } else if (action === "create") {
        if (!err) {
          let message = $translate.instant("GLOBALE.MESSAGE.CREATION_SUCCES");
          log ? console.log(message) : toastr.success(message);
        } else {
          let message = $translate.instant("GLOBALE.MESSAGE.ERREUR_CREATION");
          log ? console.log(message + " : " + err) : toastr.error(message);
          $rootScope.$activeLoadingPage = false;
        }
      }
    }

    //********************************************************************************************************
    // valideUnicite: getParCondition
    //
    // Pour le paramètre "condition"penser à mettre:
    //  1) les " pour les noms de colonne en camelCase
    //  2) Un espace au début
    //  3) le terme WHERE
    //    => Ex: " WHERE t.\"idRegle\" = 1"
    //********************************************************************************************************
    this.valideUnicite = function (appel, table, condition, champUnique, valeurChamp, message) {

      return new Promise((resolve, reject) => {

        if (appel === "getParCondition") {
          const data = { "table" : table,
                         "condition" : condition,
                         "champUnique" : champUnique };
          ValideUniciteResource.getParCondition(data).$promise
                                       .then((result) => {
                                         let valide = true;
                                         let valeurChampBd = '';

                                         if (result.data.length > 0) {
                                           for (var i=0,  tot=result.data.length; i < tot; i++) {
                                             valeurChampBd = $translate.instant(result.data[i].cleunique);
                                             if(!isNaN(valeurChampBd)) {
                                                if (valeurChampBd.toString() === valeurChamp.toString()){
                                                  valide = false;
                                                  i = tot;
                                                }
                                             }
                                             else if (valeurChampBd.toUpperCase().trim() === valeurChamp.toUpperCase().trim()){
                                               valide = false;
                                               i = tot;
                                             }
                                           }
                                         }
                                         if (!valide){
                                           toastr.error($translate.instant(message));
                                         }
                                         resolve(valide);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "aucuneValidation") {
          resolve(true);
        }
      });
    }

    //********************************************************************************************************
    // viAnalyseRegleDetailInfo: getParBudgetDate
    //                           getParBudget
    //********************************************************************************************************
    this.viAnalyseRegleDetailInfo = function (appel, idBudget, dateDebut, dateFin) {

      return new Promise((resolve, reject) => {

        if (appel === "getParBudgetDate") {
          const data = { "idBudget" : idBudget,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin };
          ViAnalyseRegleDetailInfoResource.getParBudgetDate(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else {
          const data = { "idBudget" : idBudget };
          ViAnalyseRegleDetailInfoResource.getParBudget(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRegleSousPosteBudgetaire: getParBudgetCateg
    //                             getParBudgetId
    //                             getParLovNullable
    //                             getParLovTous
    //                             getParGroupe
    //********************************************************************************************************
    this.viRegleSousPosteBudgetaire = function (appel, idBudget, idCat1, idCat2, idCat3, idCat4, idCat5, idSousPosteBudgetaireRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParBudgetCateg") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "idCat1" : idCat1,
                         "idCat2" : idCat2,
                         "idCat3" : idCat3,
                         "idCat4" : idCat4,
                         "idCat5" : idCat5
                        };
          ViRegleSousPosteBudgetaireResource.getParBudgetCateg(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParBudgetId") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle
                        };
          ViRegleSousPosteBudgetaireResource.getParBudgetId(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParLovNullable") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "idCat1" : idCat1,
                         "idCat2" : idCat2,
                         "idCat3" : idCat3,
                         "idCat4" : idCat4,
                         "idCat5" : idCat5
                        };
          ViRegleSousPosteBudgetaireResource.getParLovNullable(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParLovTous") {
          const data = { "idBudget" : idBudget,
                         "idCat1" : idCat1,
                         "idCat2" : idCat2
                        };
          ViRegleSousPosteBudgetaireResource.getParLovTous(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParGroupe") {
          const data = { "idBudget" : idBudget,
                         "idCat1" : idCat1
                        };
          ViRegleSousPosteBudgetaireResource.getParGroupe(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // regleExceptionVentilation: getParRegleException
    //********************************************************************************************************
    this.regleExceptionVentilation = function (appel, id, objet) {

      return new Promise((resolve, reject) => {

        if (appel === "getParRegleException" && id !== null) {
          const data = { "idRegleException" : id };
          RegleExceptionVentilationResource.getParRegleException(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getId" && id !== null) {
          const data = { "id" : id };
          RegleExceptionVentilationResource.getId(data).$promise
                                       .then((result) => {
                                         resolve(result.regleExceptionVentilation);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // regle: getParLienType,
    //        getParLienTypeDate,
    //        getParSousPosteMaitre
    //********************************************************************************************************
    this.regle = function (appel, id, idTypeOperation, dateEvenement) {

      return new Promise((resolve, reject) => {

        if (appel === "getParLienType") {
          const data = { "idRegleLienTransfert" : id,
                         "idTypeOperation" : idTypeOperation
                       };
          RegleResource.getParLienType(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParLienTypeDate") {
          const data = { "idRegleLienTransfert" : id,
                         "idTypeOperation" : idTypeOperation,
                         "dateEvenement" : dateEvenement
                       };
          RegleResource.getParLienTypeDate(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParSousPosteMaitre") {
          const data = { "idSousPosteBudgetaireRegle" : id
                       };
          RegleResource.getParSousPosteMaitre(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // regleImpact: getParRegle
    //********************************************************************************************************
    this.regleImpact = function (appel, idRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParRegle") {
          const data = { "idRegle" : idRegle
                       };
          RegleImpactResource.getParRegle(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // regleException: getParRegle,
    //                 getParRegleDate
    //********************************************************************************************************
    this.regleException = function (appel, idRegle, dateRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParRegle") {
          const data = { "idRegle" : idRegle
                       };
          RegleExceptionResource.getParRegle(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParRegleDate") {
          const data = { "idRegle" : idRegle,
                         "dateRegle" : dateRegle
                       };
          RegleExceptionResource.getParRegleDate(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // regleDate: getParRegle
    //********************************************************************************************************
    this.regleDate = function (appel, idRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParRegle") {
          const data = { "idRegle" : idRegle
                       };
          RegleDateResource.getParRegle(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRegleSolde: getParSousPosteRegleMaitre
    //
    //********************************************************************************************************
    this.viRegleSolde = function (appel, idSousPosteBudgetaireRegle, maitre) {

      return new Promise((resolve, reject) => {

        if (appel === "getParSousPosteRegleMaitre") {
          const data = { "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "maitre" : maitre };
          ViRegleSoldeResource.getParSousPosteRegleMaitre(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viSousPosteBudgetaire: getParId
    //                        getParCateg
    //********************************************************************************************************
    this.viSousPosteBudgetaire = function (appel, id) {

      return new Promise((resolve, reject) => {

        if (appel === "getParId") {
          const data = { "id" : id };
          ViSousPosteBudgetaireResource.getParId(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParCateg") {
          const data = { "idCategorie" : id };
          ViSousPosteBudgetaireResource.getParCateg(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viPosteBudgetaire: getParCateg
    //                    getAll
    //********************************************************************************************************
    this.viPosteBudgetaire = function (appel, id) {

      return new Promise((resolve, reject) => {

        if (appel === "getParCateg") {
          const data = { "idCategorie" : id };
          ViPosteBudgetaireResource.getParCateg(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getAll") {
          const data = {};
          ViPosteBudgetaireResource.getAll(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viSousPosteBudgetaireRegleValidation: getParId
    //
    //********************************************************************************************************
    this.viSousPosteBudgetaireRegleValidation = function (appel, id) {

      return new Promise((resolve, reject) => {

        if (appel === "getParId") {
          const data = { "idSousPosteBudgetaireRegle" : id };
          ViSousPosteBudgetaireRegleValidationResource.getParId(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRegleAjustement: getParId
    //
    //********************************************************************************************************
    this.viRegleAjustement = function (appel, id) {

      return new Promise((resolve, reject) => {

        if (appel === "getParId") {
          const data = { "idSousPosteBudgetaireRegle" : id };
          ViRegleAjustementResource.getParId(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRegleException: getParIdRegle
    //
    //********************************************************************************************************
    this.viRegleException = function (appel, id) {

      return new Promise((resolve, reject) => {

        if (appel === "getParIdRegle") {
          const data = { "idRegle" : id };
          ViRegleExceptionResource.getParIdRegle(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRegleExceptionCache: getParIdRegleDateRegle
    //
    //********************************************************************************************************
    this.viRegleExceptionCache = function (appel, id, dateRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParIdRegleDateRegle") {
          const data = { "idRegle" : id,
                         "dateRegle" : dateRegle };
          ViRegleExceptionCacheResource.getParIdRegleDateRegle(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viAnalyseRegleDetail: getPrecedent,
    //                       getSuivant
    //********************************************************************************************************
    this.viAnalyseRegleDetail = function (appel, idRegle, dateDebut, dateFin, dateRef) {

      return new Promise((resolve, reject) => {

        if (appel === "getPrecedent") {
          const data = { "idRegle" : idRegle,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "dateRef" : dateRef };
          ViAnalyseRegleDetailResource.getPrecedent(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getSuivant") {
          const data = { "idRegle" : idRegle,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "dateRef" : dateRef };
          ViAnalyseRegleDetailResource.getSuivant(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // Suppression d'un "sousPosteBudgetaireRegle"
    //
    //********************************************************************************************************
    this.supprimeSousPosteBudgetaireRegle = function (idBudget, idRegle, idSousPosteBudgetaireRegle) {

      return new Promise((resolve, reject) => {

        const data = { "codeAction" : 'SUPPRIME_REGLE',
                       "idReference1" : idBudget,
                       "idReference2" : idRegle,
                       "idReference3" : idSousPosteBudgetaireRegle,
                       "force" : 0
                     };

        ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => {
                        console.log(err); // TODO
                        reject(err);
                      });
      });
    }

    //********************************************************************************************************
    // Suppression des "regleImpact" et "regleDate" d'une règle
    //
    //********************************************************************************************************
    this.supprimeRegleDateImpact = function (idBudget, idRegle1, idRegle2) {

      return new Promise((resolve, reject) => {

        const data = { "codeAction" : 'SUPPRIME_DATE_IMPACT',
                       "idReference1" : idBudget,
                       "idReference2" : idRegle1,
                       "idReference3" : idRegle2,
                       "force" : 0
                     };

        ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => {
                        console.log(err); // TODO
                        reject(err);
                      });
      });
    }

    //********************************************************************************************************
    // Suppression d'un "budget"
    //
    //********************************************************************************************************
    this.supprimeBudget = function (idBudget, flgSupBudget) {

      return new Promise((resolve, reject) => {

        const data = { "codeAction" : 'SUPPRIME_BUDGET',
                       "idReference1" : idBudget,
                       "valeurParamInt1" : flgSupBudget,
                       "force" : 0
                     };

        ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => {
                        console.log(err); // TODO
                        reject(err);
                      });
      });
    }

    //********************************************************************************************************
    // Mise-à jour des séquences
    //
    //********************************************************************************************************
    this.majSequence = function () {

      return new Promise((resolve, reject) => {

        const data = { "codeAction" : 'MAJ_SEQUENCE',
                       "idReference1" : 0,
                       "force" : 0
                     };

        ActionSystemeResource.doAction(data).$promise
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => {
                        console.log(err); // TODO
                        reject(err);
                      });
      });
    }

    //********************************************************************************************************
    // importFileResource: getFileOfxQfx
    //                     getFileCsv
    //                     getFileDb
    //********************************************************************************************************
    this.importFileResource = function (appel, file) {

      return new Promise((resolve, reject) => {

        if (appel === "getFileOfxQfx") {
          const data = { "file" : file };
          ImportFileResource.getFileOfxQfx(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.IMPORTATION_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        } else if (appel === "getFileCsv") {
          const data = { "file" : file };
          ImportFileResource.getFileCsv(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.IMPORTATION_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        } else if (appel === "getFileDb") {
          const data = { "file" : file };
          ImportFileResource.getFileDb(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.IMPORTATION_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viConciliationSectionDepRev: getParIdRegleDateRegle
    //
    //********************************************************************************************************
    this.viConciliationSectionDepRev = function (appel, id, date1, date2) {

      return new Promise((resolve, reject) => {

        if (appel === "getParDate") {
          const data = { "idBudget" : id,
                         "date1" : date1,
                         "date2" : date2 };
          ViConciliationSectionDepRevResource.getParDate(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRapportDetailleSectionCompteCredit: getParSousPoste
    //
    //********************************************************************************************************
    this.viRapportDetailleSectionCompteCredit = function (appel, idSousPosteBudgetaireRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParSousPoste") {
          const data = { "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle };
          ViRapportDetailleSectionCompteCreditResource.getParSousPoste(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRapportDetailleSectionDepRev: getParBudgetCat
    //
    //********************************************************************************************************
    this.viRapportDetailleSectionDepRev = function (appel, idBudget, categorieRevenu, categorieDepense, idSousPosteBudgetaireRegle) {

      return new Promise((resolve, reject) => {

        if (appel === "getParBudgetCat") {
          const data = { "idBudget" : idBudget,
                         "categorieRevenu" : categorieRevenu,
                         "categorieDepense" : categorieDepense,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle };
          ViRapportDetailleSectionDepRevResource.getParBudgetCat(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRapport: getVentilation
    //
    //********************************************************************************************************
    this.viRapport = function (appel) {

      return new Promise((resolve, reject) => {

        if (appel === "getVentilation") {
          ViRapportResource.getVentilation().$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viRapportSommaireSectionDepRev: getParPoste
    //                                 getParSousPoste
    //********************************************************************************************************
    this.viRapportSommaireSectionDepRev = function (appel, idBudget, idSousPosteBudgetaireRegle, dateDebut, dateFin, categorieRevenu, categorieDepense, idCategorie) {

      return new Promise((resolve, reject) => {

        if (appel === "getParPoste") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "categorieRevenu" : categorieRevenu,
                         "categorieDepense" : categorieDepense,
                         "idCategorie" : idCategorie };
          ViRapportSommaireSectionDepRevResource.getParPoste(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        } else if (appel === "getParSousPoste") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "categorieRevenu" : categorieRevenu,
                         "categorieDepense" : categorieDepense,
                         "idCategorie" : idCategorie };
          ViRapportSommaireSectionDepRevResource.getParSousPoste(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viAnalyseRegleSommaireInfoPoste: getParCategorie
    //
    //********************************************************************************************************
    this.viAnalyseRegleSommaireInfoPoste = function (appel,
                                                     idBudget,
                                                     idSousPosteBudgetaireRegle,
                                                     dateDebut,
                                                     dateFin,
                                                     codeCategorie,
                                                     codeCat1,
                                                     codeCat2) {

      return new Promise((resolve, reject) => {

        if (appel === "getParCategorie") {
          const data = { "idBudget" : idBudget,
                         "idSousPosteBudgetaireRegle" : idSousPosteBudgetaireRegle,
                         "dateDebut" : dateDebut,
                         "dateFin" : dateFin,
                         "codeCategorie" : codeCategorie,
                         "force" : 1,
                         "codeCat1" : codeCat1,
                         "codeCat2" : codeCat2 };
          ViAnalyseRegleSommaireInfoPosteResource.getParCategorie(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viReglePosteBudgetaire: getParBudgetCateg
    //
    //********************************************************************************************************
    this.viReglePosteBudgetaire = function (appel, idBudget, idCategorie) {

      return new Promise((resolve, reject) => {

        if (appel === "getParBudgetCateg") {
          const data = { "idBudget" : idBudget,
                         "idCategorie" : idCategorie };
          ViReglePosteBudgetaireResource.getParBudgetCateg(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viSequenceMax: getSeq
    //
    //********************************************************************************************************
    this.viSequenceMax = function (appel) {

      return new Promise((resolve, reject) => {

        if (appel === "getSeq") {
          const data = {};
          ViSequenceMaxResource.getSeq(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         console.log(err); // TODO
                                         reject(err);
                                       });
        }
      });
    }

    //********************************************************************************************************
    // viLienBancaire: getLovLienBancaireActif
    //                 getLovLienBancaireTous
    //********************************************************************************************************
    this.viLienBancaire = function (appel) {

      return new Promise((resolve, reject) => {

        if (appel === "getLovLienBancaireActif") {
          const data = {};
          ViLienBancaireResource.getLovLienBancaireActif(data).$promise
                          .then((result) => {
                            resolve(result);
                          })
                          .catch((err) => {
                            console.log(err); // TODO
                            reject(err);
                          });
        } else if (appel === "getLovLienBancaireTous") {
          const data = {};
          ViLienBancaireResource.getLovLienBancaireTous(data).$promise
                          .then((result) => {
                            resolve(result);
                          })
                          .catch((err) => {
                            console.log(err); // TODO
                            reject(err);
                          });
        } 
      });
    }

  })
})();
