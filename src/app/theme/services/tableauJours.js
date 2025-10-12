/**
 * @author Sébastien Lizotte
 *
 * Retourne un tableau de dates en format: YYYY-MM-DD
 */
 (function () {
   'use strict';

   angular.module('i2sFinance.theme')
     .service('tableauJours', tableauJours);

     function tableauJours() {
       return function(dateDebut, dateFin) {
         var dates = [];
         var dateCourante = moment(dateDebut,"YYYY-MM-DD");

         while (dateCourante.isSameOrBefore(moment(dateFin,"YYYY-MM-DD"))) {
           dates.push(dateCourante.format("DD"));
           dateCourante = dateCourante.add(1, 'day');
         }
         return dates;
       };
     }
  })();
