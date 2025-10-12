/**
 * @author Sébastien Lizotte
 *
 */
 (function () {
   'use strict';

   angular.module('i2sFinance.theme')
     .service('fileUpload', ['$http', function ($http) {
        this.uploadFileToUrl = function(file, uploadUrl){

           return new Promise((resolve, reject) => {
               let fd = new FormData();
               fd.append('file', file);

               // On pousse le token
               const token = localStorage.getItem("beToken");

               $http.post(uploadUrl, fd, {
                  transformRequest: angular.identity,
                  headers: {'Content-Type': undefined,
                            'Cache-Control': 'no-cache',
                            'Authorization': "Bearer " + token }
               }).then(function(retour){
                  resolve(retour);
               }).catch(function(err){
                  reject(err);
               });
           });
        }
    }]);

  })();
