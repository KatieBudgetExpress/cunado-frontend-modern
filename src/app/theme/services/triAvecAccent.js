/**
 * @author Sébastien Lizotte
 *
 * Exemple: Elephant : EElleepphhaanntt
 *          Éléphant : EÉlleépphhaanntt
 *          Eléphant : EElleépphhaanntt
 *
 * Trier sera: EElleepphhaanntt
 *             EElleépphhaanntt
 *             EÉlleépphhaanntt
 */
 (function () {
   'use strict';

   angular.module('i2sFinance.theme')
     .service('triAvecAccent', triAvecAccent);

     function triAvecAccent() {
       return function(str) {
         var accents    = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
         var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";

         if (str == null || str.length == 0) {
           return '';
         }
         str = str.split('');
         var strLen = str.length;
         var i, x;
         for (i = 0; i < strLen; i++) {
           if ((x = accents.indexOf(str[i])) != -1) {
             str[i] = accentsOut[x] + str[i]; // Éducation
           } else {
             str[i] = str[i] + str[i];
           }
         }
         return str.join('')
       };
     }
  })();
