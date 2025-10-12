(function () {
    'use strict';

    angular.module('i2sFinance.public.auth')
        .controller('authController', AuthController);

    /** @ngInject */
    function AuthController($scope,
                            $rootScope,
                            $filter,
                            $translate,
                            UsagerResource,
                            $location,
                            authService,
                            inputTextModal,
                            dialogModal,
                            toastr) {
        const vm = this;
        vm.$onInit = $onInit;
        vm.submit = submit;
        vm.mpOublie = mpOublie;

        var naviLang = navigator.language.substr(0, 2).toUpperCase();

        if (naviLang === "FR") {
          vm.lblBouton = 'Connexion';
          vm.lblCourriel = 'Courriel';
          vm.lblMotPasse = 'Mot de passe';
          vm.lblMotPasseOublie = 'Mot de passe oublié?';
        } else {
          vm.lblBouton = 'Login';
          vm.lblCourriel = 'Email';
          vm.lblMotPasse = 'Password';
          vm.lblMotPasseOublie = 'Forgot password?';
        }

        $scope.picture = $filter('appImage')('pic-i2s-128.png');
        $rootScope.$activeLogin = true;

        //MÉTHODE D'INITIALISATION
        function $onInit() {
            /*
                ici est seulement pour te montrer qu'on doit initialiser les variables
                dans cette méthode (pour ce contrôle il n'est pas nécessaire de le faire,
                mais c'était pour l'exemple
             */
            vm.email = '';
            vm.password = '';
        }

        function mpOublie() {

          const titre = $translate.instant("GLOBALE.AIDE.COURRIEL_REQUIS");
          const boutonOk = $translate.instant("GLOBALE.BOUTON.APPLIQUER");
          const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");

          inputTextModal(boutonOk, boutonAnnuler, titre, false, 0).result.then(function (texteRetourne) {
              if (texteRetourne === null) {
                $location.path('/auth');
              } else {
                // TODO enregistrer le nouveau mot de passées
                const data = { "email" : texteRetourne };

                UsagerResource.mpOublie(data).$promise
                    .then((result) => {
                      // Veuillez vous connecter avec votre nouveau mot de passe
                      $location.path('/auth');
                      dialogModal($translate.instant('GLOBALE.AIDE.MOTPASSEOUBLIE') + ' (' + texteRetourne + ')' , 'info',
                          $translate.instant('GLOBALE.MESSAGE.INFORMATION'),
                          $translate.instant('GLOBALE.BOUTON.OK'), false,
                          false , false);
                    })
                    .catch(err => {
                       $location.path('/auth');
                    });
              }
          });
        }

        function submit() {

          if (vm.email && vm.password) {
            const data = {
                email: vm.email,
                password: vm.password
            };

            UsagerResource.login(data).$promise
                .then((result) => {
                    authService.setSession(result);
                    $rootScope.$activeLogin = false;
                    $location.path('/dashboard');
                })
                .catch((err) => {
                  // On arrête tout et on retourne au Login
                  toastr.error($translate.instant('GLOBALE.MESSAGE.NONAUTORISE'), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
                })
          }
        }
    }

})();
