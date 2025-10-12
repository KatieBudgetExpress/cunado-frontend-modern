/**
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .service('plaidServices', function ($q,
                                          $rootScope,
                                          toastr,
                                          toastrConfig,
                                          $translate,
                                          PlaidResource
                                         ) {

    //********************************************************************************************************
    // Message de PLAID
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
    // PlaidResource: createLinkToken
    //                exchangePublicToken
    //                getAccountBalance
    //                getTransactions
    //                     
    //********************************************************************************************************
    this.PlaidResource = function (appel, token, accounts, banqueComptes, compte, dateDe, dateA) {

      return new Promise((resolve, reject) => {

        if (appel === "createLinkToken") {
          const data = {};
          PlaidResource.createLinkToken(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.PLAID_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        } else if (appel === "exchangePublicToken") {
          const data = { "public_token" : token };
          PlaidResource.exchangePublicToken(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.PLAID_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        } else if (appel === "getAccountBalance") {
          const data = { "access_token" : token,
                         "accounts" : accounts,
                         "banqueComptes" : banqueComptes
          };
          PlaidResource.getAccountBalance(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.PLAID_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        } else if (appel === "getTransactions") {
          const data = { "access_token" : token,
                         "compte" : compte,
                         "dateDe" : dateDe, 
                         "dateA" : dateA
          };
          PlaidResource.getTransactions(data).$promise
                                       .then((result) => {
                                         resolve(result);
                                       })
                                       .catch((err) => {
                                         toastr.error($translate.instant("GLOBALE.MESSAGE.PLAID_ERROR"), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                                         reject(err);
                                       });
        }
      });
    }

  
    
  })
})();
