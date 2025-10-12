/**
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
      .service('authService', function ($rootScope, $location, toastr, toastrConfig, $translate) {

        this.setSession = function(authResult) {
          const expiresAt = moment().add(authResult.expiresIn,'second');

          localStorage.setItem('beToken', authResult.token);
          localStorage.setItem("beExpiresAt", JSON.stringify(expiresAt.valueOf()) );
          $rootScope.initApp({ "info" : authResult.usager.prenom + ' ' + authResult.usager.nom });
        }

        this.logout = function() {
            localStorage.removeItem("beToken");
            localStorage.removeItem("beExpiresAt");
        }

        this.isLoggedIn = function() {
            return moment().isBefore(this.getExpiration());
        }

        this.isLoggedOut = function() {
            return !this.isLoggedIn();
        }

        this.getExpiration = function() {
            const expiration = localStorage.getItem("beExpiresAt");
            const expiresAt = JSON.parse(expiration);
            return moment(expiresAt);
        }

        this.validateSession = function() {
          if (this.isLoggedOut()) {
            toastr.error($translate.instant('GLOBALE.MESSAGE.CONNEXION'), $translate.instant('GLOBALE.MESSAGE.EXPIREE'));
            $location.path('/auth');
          }
        }
  })
})();
