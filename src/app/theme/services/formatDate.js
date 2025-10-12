/**
 * @author Sébastien Lizotte
 *
 * Retourne: YYYY-MM-DD
 */
 (function () {
   'use strict';

   angular.module('i2sFinance.theme')
     .service('formatDate', formatDate);

     function formatDate() {
       return function(dateParam) {
         var d = new Date(dateParam),
             mois = '' + (d.getMonth() + 1),
             jour = '' + d.getDate(),
             annee = d.getFullYear();

             if (mois.length < 2) mois = '0' + mois;
             if (jour.length < 2) jour = '0' + jour;

             return [annee, mois, jour].join('-');
       };
     }
  })();
