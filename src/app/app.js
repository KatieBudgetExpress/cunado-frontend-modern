'use strict';

var app = angular.module('i2sFinance', [
    'ngAnimate',
    'moment-picker',
    'smart-table',
    'multipleDatePicker',
    'ui.bootstrap',
    'ui.sortable',
    'ui.router',
    'ngResource',
    'ngTouch',
    'toastr',
    'smart-table',
    "xeditable",
    'ui.slimscroll',
    'ngJsTree',
    'ng-mfb',
    'nvd3',
    'angular-progress-button-styles',
    'pascalprecht.translate',
    'validation.match',
    'app.languages',
    'i2sFinance.resources',
    'i2sFinance.theme',
    'i2sFinance.services',
    'i2sFinance.admin',
    'i2sFinance.priver',
    'i2sFinance.public',
    'app.config',
    'ngFileUpload',
    'ngFileSaver',
    'angular-uuid',
    'angular-toArrayFilter',
	'ng-plaid'
]);


// ON LAISSE À TRUE, CAR J'AI BESOIN DU ISOLATESCOPE DANS LA CONCILIATION
app.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(true);
}]);

app.config(['$httpProvider', function($httpProvider, $injector) {
  $httpProvider.interceptors.push(function($injector) {
    return {
     'request': function(config) {

         // On ajoute le token si besoin
         if (config.params && config.params.authen) {

           $injector.get('authService').validateSession();

           // On pousse le token
           const token = localStorage.getItem("beToken");
           config.cache = false;
           config.headers['Cache-Control'] = 'no-cache';
           config.headers['Authorization'] = "Bearer " + token;
         };
         return config;
      },
      'response': function(response) {
         // Gérer les réponses TODO
         return response;
      }
    };
  });
}]);

app.config(function ($translateProvider, $translatePartialLoaderProvider) {

	var naviLang = navigator.language.substr(0, 2).toUpperCase();
  var langue = 'FR';

  $translateProvider.preferredLanguage(langue.toLowerCase());
  $translateProvider.useLoaderCache('$translationCache');
  $translateProvider.useStaticFilesLoader({
    prefix: 'languages/',
    suffix: '.json'
  });

	$translateProvider.determinePreferredLanguage(langue.toLowerCase());
	$translateProvider.useSanitizeValueStrategy('escapeParameters');
});

//app.controller('HomeCtrl', function ($translate, dataService, $scope, $rootScope, dialogModal, cuCurrency, cuBudget, prepareAnalyse, cuOpenWeb, $location, cuElectron) {

app.controller('HomeCtrl', function ($translate,
                                     $scope,
                                     $rootScope,
                                     $location,
                                     authService,
                                     toastr,
                                     toastrConfig,
                                     ViInfoUsagerResource,
                                     ViInfoBaseResource,
                                     AxeVisibiliteUsagerResource,
                                     BudgetResource,
                                     ProfilResource,
                                     cuCurrency,
                                     cuOpenWeb,
                                     prepareAnalyse,
                                     selectModal,
                                     dialogModal,
                                     inputTextModal,
                                     cuServices) {
// $translate.refresh();
  var ctrl = this;
  var naviLang = navigator.language.substr(0, 2).toUpperCase();
  var profilExistant = false;

  $rootScope.appLoad = false;
  $rootScope.modeDemo = false;
  $rootScope.calculSoldeApresOuverture = false;
  $rootScope.budgetCourantDescription = "";
  $rootScope.budgetActif = {};
  $rootScope.arrayCategorie = [];
  $rootScope.arrayValeurElement = [];
  $rootScope.arrayTypeOperation = [];
  $scope.budgetDateFinGenere = null;

  ctrl.arrayCategorie = [];
  ctrl.arraySiteWeb = [];
  ctrl.arrayTypeOperation = [];
  ctrl.arrayValeurElement = [];
  ctrl.arrayAxeVisibiliteUsager = [];
  ctrl.arrayBudget = [];
  ctrl.arrayProfil = [];
  ctrl.messageBienvenue = {};
  //
  ctrl.language = 'FR';

  //
  // INITIALISE L'APPLICATION POUR L'USAGER COURANT
  //
  $rootScope.initApp = (messageInfo) => {
    ctrl.messageBienvenue = messageInfo;

    let promiseInfoBase = new Promise( (resolve, reject) => {
      ViInfoBaseResource.getAll().$promise
                      .then((result) => {
                         resolve(result);
                      })
                      .catch(err => {
                        reject(err);
                      });
    });

    let promiseInfoUsager = new Promise( (resolve, reject) => {
      ViInfoUsagerResource.getAll().$promise
                      .then((result) => {
                         resolve(result);
                      })
                      .catch(err => {
                        reject(err);
                      });

    });

    Promise.all([promiseInfoBase, promiseInfoUsager])
    .then( (result) => {
      ctrl.arrayCategorie = result[0].data[0].categorie;
      ctrl.arraySiteWeb = result[0].data[0].siteWeb;
      ctrl.arrayTypeOperation = result[0].data[0].typeOperation;
      ctrl.arrayValeurElement = result[0].data[0].valeurElement;
      ctrl.arrayAxeVisibiliteUsager = result[1].data[0].axeVisibiliteUsager;
      ctrl.arrayBudget = result[1].data[0].budget;
      ctrl.arrayProfil = result[1].data[0].profil;
      //
      $rootScope.arrayCategorie = ctrl.arrayCategorie;
      $rootScope.arrayValeurElement = ctrl.arrayValeurElement;
      $rootScope.arrayTypeOperation = ctrl.arrayTypeOperation;
      //
      $scope.prepareApp();
    })
    .catch((err) => {
      console.log(err);
      // On arrête tout et on retourne au Login
      toastr.error($translate.instant('GLOBALE.MESSAGE.NONAUTORISE'), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
      $location.path('/auth');
    })
  }

  $scope.prepareApp = () => {
    //
  	// GESTION DE LA DEVISE PAR DÉFAUT
  	//
    ctrl.devise = ctrl.arrayValeurElement.find(vae => vae.type === 'vaeDevise' && vae.defaut === 1).code;
    ctrl.signe = cuCurrency.findCurrency(ctrl.devise).symbol;

    //
    // INFORMATION DU PROFIL
    //
    if (ctrl.arrayProfil.length === 0 || ctrl.arrayProfil[0].vaeLangue.length === 0) {
      if (naviLang === 'FR' || naviLang === 'EN') {
        ctrl.language = naviLang;
      } else {
        ctrl.language = 'FR';
      }
    } else {
      ctrl.language = ctrl.arrayProfil[0].vaeLangue;
      ctrl.devise = ctrl.arrayProfil[0].vaeDevise;
      ctrl.signe = cuCurrency.findCurrency(ctrl.devise).symbol;
    }

    if (ctrl.arrayProfil.length > 0) {
      profilExistant = true;
      $rootScope.$profilExistant = true;
    } else {
      profilExistant = false;
      $rootScope.$profilExistant = false;
    }

    //
    // GESTION DE LA LISTE DE DEVISE
    //
    ctrl.deviseOptions = ctrl.arrayValeurElement.filter(vae => vae.type === 'vaeDevise')
                                                .sort(function(a, b) {return a.tri - b.tri});
    ctrl.deviseSelected = ctrl.arrayValeurElement.find(vae => vae.type === 'vaeDevise' && vae.code === ctrl.devise);

    //
    // GESTION DE LA LANGUE
    //
    ctrl.languageOptions = ctrl.arrayValeurElement.filter(vae => vae.type === 'vaeLangue')
                                                  .sort(function(a, b) {return a.tri - b.tri});
    ctrl.languageSelected = ctrl.arrayValeurElement.find(vae => vae.type === 'vaeLangue' && vae.code === ctrl.language);

    ctrl.updateLanguage();

    if (ctrl.messageBienvenue) {
      toastr.info(ctrl.messageBienvenue.info,  $translate.instant('GLOBALE.MESSAGE.BIENVENUE'));
    }

    //
    // GESTION DE LA LISTE DES PERIODICITÉS
    //
    ctrl.periodiciteOptions = ctrl.arrayValeurElement.filter(vae => vae.type === 'vaePeriodicite')
                                                     .sort(function(a, b) {return a.tri - b.tri});
    ctrl.periodiciteSelected = ctrl.arrayValeurElement.find(vae => vae.type === 'vaePeriodicite' && vae.code === 'MENSUEL');

    //
  	// GESTION DES AXES DE VISIBILITÉS USAGER
  	//
    let promiseAxeVisibilite = new Promise( (resolve, reject) => {
      const ids = ctrl.arrayAxeVisibiliteUsager.filter(axe => (axe.ecran === 'DASHBOARD' || axe.ecran === 'ANALYSE') ).map(a => a.id);
      const data = { "objet": {"valeur": ""},
                     "id" : ids };
      AxeVisibiliteUsagerResource.update(data).$promise
          .then((result) => {
            // Silencieux
            AxeVisibiliteUsagerResource.getAll().$promise
                .then((result) => {
                  resolve(result);
                })
                .catch(err => {
                   reject(err);
                });
          })
          .catch(err => {
             cuServices.message("update", err, true);
             reject(err);
          });
    });

    Promise.all([promiseAxeVisibilite])
    .then( (result) => {
      ctrl.axesVisibilites = result[0].axeVisibiliteUsager;
      ctrl.arrayAxeVisibiliteUsager = result[0].axeVisibiliteUsager;
      //
      // Récupère les données pour les liens de bas page
      //
      $rootScope.siteWeb = ctrl.arraySiteWeb;
      // Mets à jour le bon URL d'aide
  //    $rootScope.urlHelp = $rootScope.siteWeb.find(site => site.key === $rootScope.urlHelp + '-' + $rootScope.appLocaleCode.toLowerCase()).value;

      ctrl.urlBasPage = ctrl.arraySiteWeb.map((ele, i) => {
        const obj = {};
        const [key, lng] = ele.key.split('-');
        if (ctrl.language === 'EN' && lng.toLowerCase() === 'en') {
          obj[key] = ele.value;
        } else if (ctrl.language === 'FR' && lng.toLowerCase() === 'fr') {
          obj[key] = ele.value;
        }
        return obj;
      }).reduce((acc, ele) => {
        const key = Object.keys(ele)[0];
        acc[key] = ele[key];
        return acc;
      });

      //
      //
      //
      if (!ctrl.arrayProfil[0].abonnementActive) {
        // On arrête tout et on retourne au Login
        $location.path('/auth');
        dialogModal($translate.instant('GLOBALE.MESSAGE.ABONNEMENT_INACTIF'), 'danger',
            $translate.instant('GLOBALE.MESSAGE.DANGER'),
            $translate.instant('GLOBALE.BOUTON.OK'), false,
            false , false);

      } else if (ctrl.arrayProfil[0].abonnementDateFin && moment(new Date()).isAfter(moment(ctrl.arrayProfil[0].abonnementDateFin))) {
        // On arrête tout et on retourne au Login
        $location.path('/auth');
        dialogModal($translate.instant('GLOBALE.MESSAGE.ABONNEMENT_EXPIRE'), 'danger',
            $translate.instant('GLOBALE.MESSAGE.DANGER'),
            $translate.instant('GLOBALE.BOUTON.OK'), false,
            false , false);

      } else if (ctrl.arrayProfil[0].mpTemporaire) {

        const titre = $translate.instant("GLOBALE.AIDE.NOUVEAUMOTPASSE");
        const boutonOk = $translate.instant("GLOBALE.BOUTON.APPLIQUER");

        inputTextModal(boutonOk, false, titre, true, 8).result.then(function (texteRetourne) {
            if (texteRetourne === null) {
              toastr.error($translate.instant('GLOBALE.MESSAGE.NONAUTORISE'), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
              $location.path('/auth');
            } else {
              // TODO enregistrer le nouveau mot de passées
              const data = { "mp": texteRetourne,
                             "email" : ctrl.arrayProfil[0].courriel };
              ProfilResource.updateMp(data).$promise
                  .then((result) => {
                    // Veuillez vous connecter avec votre nouveau mot de passe
                    $location.path('/auth');
                    dialogModal($translate.instant('GLOBALE.AIDE.ENTREZNOUVEAUMOTPASSE') + ' (' + texteRetourne + ')' , 'info',
                        $translate.instant('GLOBALE.MESSAGE.INFORMATION'),
                        $translate.instant('GLOBALE.BOUTON.OK'), false,
                        false , false);
                  })
                  .catch(err => {
                     cuServices.message("update", err, true);
                     $location.path('/auth');
                  });
            }
        });

      } else if (profilExistant && ctrl.arrayBudget && ctrl.arrayBudget.length > 0) {
        //
        // GESTION DU BUDGET DE DÉFAUT
        //
        if (ctrl.arrayBudget.find(bdg => bdg.defaut === 1)) {
          $rootScope.budgetActif = ctrl.arrayBudget.find(bdg => bdg.defaut === 1);
          ctrl.budgetCourant = $rootScope.budgetActif.id;
          $scope.budgetDateFinGenere = $rootScope.budgetActif.dateFinGenere;
          $rootScope.budgetCourantDescription = $rootScope.budgetActif.nom;
          //
          // On génère ou maximise????
          //
          const dateFin = moment().endOf('year').format('YYYY-MM-DD');
          if ($scope.budgetDateFinGenere === null || $scope.budgetDateFinGenere === "") {
            // On génère les soldes
            let promise = prepareAnalyse.genereOperationsEtSoldes(ctrl.budgetCourant, "1900-01-01", moment().endOf('year').format("YYYY-MM-DD"), 1);
            promise.then(function(value) {
              $rootScope.appLoad = true;
              $rootScope.$digest();
            });
          } else {
            // Maximiser les opérations et soldes pour l'année courante seulement
            if ($scope.budgetDateFinGenere > dateFin) {
              let promise = prepareAnalyse.maximiseOperationsEtSoldes(ctrl.budgetCourant, dateFin);
              promise.then(function(value) {
                $rootScope.appLoad = true;
                $rootScope.$digest();
              });
            } else {
              $rootScope.appLoad = true;
              $rootScope.$digest();
            }
          }
        } else {
          ctrl.selectBudget();
        }
      } else {
        $location.path('/assistant');
      }
    })
    .catch((err) => {
      // On arrête tout et on retourne au Login
      toastr.error($translate.instant('GLOBALE.MESSAGE.NONAUTORISE'), $translate.instant('GLOBALE.MESSAGE.ERREUR'));
      $location.path('/auth');
    })
  }

  $translate.use('en');
  $translate.use('fr');
  $translate.use(ctrl.language.toLowerCase());
  $rootScope.appLocaleCode = ctrl.language;


  ctrl.selectBudget = function () {
    const titre = $translate.instant("GLOBALE.AIDE.SELECTIONNERBUDGET");
    const boutonOk = $translate.instant("GLOBALE.BOUTON.SELECTIONNER");
    const boutonAnnuler = $translate.instant("GLOBALE.BOUTON.ANNULER");
    const selectOption = "item as (item.nom + ' (' + item.dateDebut +')') for item in objetListe | orderBy:'nom | translate':false:localeSensitiveComparator";

    selectModal(boutonOk, boutonAnnuler, titre, ctrl.arrayBudget.sort(function(a, b) {return b.id - a.id})[0], ctrl.arrayBudget, selectOption).result.then(async function (idBudget) {
        if (idBudget) {
          $rootScope.budgetActif = ctrl.arrayBudget.find(bdg => bdg.id === idBudget);
          $rootScope.budgetActif.defaut = 1;
          ctrl.budgetCourant = $rootScope.budgetActif.id;
          $scope.budgetDateFinGenere = $rootScope.budgetActif.dateFinGenere;
          $rootScope.budgetCourantDescription = $rootScope.budgetActif.nom;

          BudgetResource.update($rootScope.budgetActif).$promise
              .then((result) => {
                $rootScope.appLoad = true;
                $scope.$applyAsync();
              }).catch((err) => {
                $rootScope.appLoad = true;
                $scope.$applyAsync();
              });
        }
    });
  };


  ctrl.updateLanguage = function () {
      $rootScope.appLocaleCode = $scope.ctrl.languageSelected.code;
      ctrl.language = ctrl.languageSelected.code;
      $translate.use(ctrl.languageSelected.code.toLowerCase());

      let locale = $scope.ctrl.languageSelected.code === 'EN' ? 'en' : 'fr-ca';
  		moment.locale(locale);
  		$('#calendar').fullCalendar('option', 'locale', locale);
  };

  //
  // Mise à jour de l'axe de visibilité usager
  //
  ctrl.updateAxeVisibiliteUsager = function (id, valeur, maj) {

    const data = { "objet": {"valeur": valeur},
                   "id" : [id] };
    AxeVisibiliteUsagerResource.update(data).$promise
        .then((result) => {
          AxeVisibiliteUsagerResource.getAll().$promise
              .then((result) => {
                ctrl.axesVisibilites = result.axeVisibiliteUsager;
                ctrl.arrayAxeVisibiliteUsager = result.axeVisibiliteUsager;
              })
              .catch(err => err);
        })
        .catch(err => err);
  };

  //
  // Mise à jour du budget
  //
  ctrl.updateBudget = function (data) {

    BudgetResource.update(data).$promise
        .then((result) => {
          BudgetResource.getAll().$promise
              .then((result) => {
                ctrl.arrayBudget = result.budget;
                $rootScope.budgetActif = ctrl.arrayBudget.find(bdg => bdg.defaut === 1);
              })
              .catch(err => err);
        })
        .catch(err => err);
  };

  $scope.$watch('ctrl.deviseSelected', (newVal, oldVal) => {
    if (newVal !== oldVal) {
      ctrl.devise = newVal.code;
      ctrl.signe = cuCurrency.findCurrency(ctrl.devise).symbol;
    }
  });

  // Quitter l'application
  ctrl.quitterApplication = function () {
    authService.logout();
    $location.path('/auth');
  };

  ctrl.localeSensitiveComparator = function (v1, v2) {
    // If we don't get strings, just compare by index
    if (v1.type !== 'string' || v2.type !== 'string') {
      return (v1.index < v2.index) ? -1 : 1;
    }
    // Compare strings alphabetically, taking locale into account
    return v1.value.localeCompare(v2.value);
  };

  //
  // GESTION DES SITES WEB
  //
	ctrl.openSitePrincipal = function () {
		cuOpenWeb.open(ctrl.urlBasPage.i2sfinance);
	};
	ctrl.openSiteFacebook = function () {
		cuOpenWeb.open(ctrl.urlBasPage.facebook);
	};
	ctrl.openSiteTwitter = function () {
		cuOpenWeb.open(ctrl.urlBasPage.twitter);
	};
	ctrl.openSiteGoogle = function () {
		cuOpenWeb.open(ctrl.urlBasPage.google);
	};

});


app.run(['$rootScope', '$window', 'dialogModal', '$translate', '$state', 'authService', '$location', function ($rootScope, $window, dialogModal, $translate, $state, authService, $location) {

	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

    if ($rootScope.$confirmChangePage.indicateur) {
			event.preventDefault();

  			dialogModal($translate.instant($rootScope.$confirmChangePage.message), 'warning',
				$translate.instant('GLOBALE.MESSAGE.ATTENTION'),
				$translate.instant('GLOBALE.SWITCH.OUI'), false,
				$translate.instant('GLOBALE.SWITCH.NON'), false).result
				.then((result) => {
					if (result) {
						if (toState.data.pageTitle) {
							$rootScope.pageTitle = toState.data.pageTitle;
							$rootScope.$confirmChangePage = {
								indicateur: false,
								message: ''
							};
              $rootScope.urlHelp = $rootScope.siteWeb.find(site => site.key === toState.data.urlHelp + '-' + $rootScope.appLocaleCode.toLowerCase()).value;
						}
						$state.go(toState.name);
					}
				});

		} else {
			if (toState.data && toState.data.pageTitle) {
				$rootScope.pageTitle = toState.data.pageTitle;
        // Pour le loading initial
        if ($rootScope.siteWeb) {
          $rootScope.urlHelp = $rootScope.siteWeb.find(site => site.key === toState.data.urlHelp + '-' + $rootScope.appLocaleCode.toLowerCase()).value;
        } else {
          $rootScope.urlHelp = toState.data.urlHelp;
        }
			}
		}
	});
}]);

app.constant('listeGlossyBusinessIcons',
	[
		{name: '2D pie chart', img: '2D pie chart'},
		{name: '3D bar chart', img: '3D bar chart'},
		{name: '3d chart', img: '3d chart'},
		{name: '3D pie chart', img: '3D pie chart'},
		{name: '3Dchart', img: '3Dchart'},
		{name: 'Abacus', img: 'Abacus'},
		{name: 'About', img: 'About'},
		{name: 'Accept changes', img: 'Accept changes'},
		{name: 'Access', img: 'Access'},
		{name: 'Account', img: 'Account'},
		{name: 'Accounts', img: 'Accounts'},
		{name: 'Add', img: 'Add'},
		{name: 'Address book', img: 'Address book'},
		{name: 'Admin', img: 'Admin'},
		{name: 'Advertising', img: 'Advertising'},
		{name: 'Agent', img: 'Agent'},
		{name: 'Air cargo', img: 'Air cargo'},
		{name: 'Air tickets', img: 'Air tickets'},
		{name: 'Airplane', img: 'Airplane'},
		{name: 'Alarm clock', img: 'Alarm clock'},
		{name: 'Alarm', img: 'Alarm'},
		{name: 'All reports', img: 'All reports'},
		{name: 'Apply', img: 'Apply'},
		{name: 'Appointment calendar', img: 'Appointment calendar'},
		{name: 'Appointment', img: 'Appointment'},
		{name: 'ATM', img: 'ATM'},
		{name: 'Attach', img: 'Attach'},
		{name: 'Auction', img: 'Auction'},
		{name: 'Audience', img: 'Audience'},
		{name: 'Auto insurance', img: 'Auto insurance'},
		{name: 'Automobile loan interest payment', img: 'Automobile loan interest payment'},
		{name: 'Automobile loan', img: 'Automobile loan'},
		{name: 'Baby carriage', img: 'Baby carriage'},
		{name: 'Back', img: 'Back'},
		{name: 'Bad mark', img: 'Bad mark'},
		{name: 'Baggage', img: 'Baggage'},
		{name: 'Balloon', img: 'Balloon'},
		{name: 'Bank cards', img: 'Bank cards'},
		{name: 'Bank service', img: 'Bank service'},
		{name: 'Bank', img: 'Bank'},
		{name: 'Banner', img: 'Banner'},
		{name: 'Barcode scanner', img: 'Barcode scanner'},
		{name: 'Barcode scanning', img: 'Barcode scanning'},
		{name: 'Barcode', img: 'Barcode'},
		{name: 'Battery', img: 'Battery'},
		{name: 'Beverage', img: 'Beverage'},
		{name: 'Bike', img: 'Bike'},
		{name: 'Black bus', img: 'Black bus'},
		{name: 'Black car', img: 'Black car'},
		{name: 'Black list', img: 'Black list'},
		{name: 'Black pencil', img: 'Black pencil'},
		{name: 'Blank', img: 'Blank'},
		{name: 'Blanks', img: 'Blanks'},
		{name: 'Boat', img: 'Boat'},
		{name: 'Book of records', img: 'Book of records'},
		{name: 'Book-keeper', img: 'Book-keeper'},
		{name: 'Book', img: 'Book'},
		{name: 'Boss', img: 'Boss'},
		{name: 'Box', img: 'Box'},
		{name: 'Briefcase', img: 'Briefcase'},
		{name: 'Building', img: 'Building'},
		{name: 'Buildings', img: 'Buildings'},
		{name: 'Bulldozer', img: 'Bulldozer'},
		{name: 'Bundle', img: 'Bundle'},
		{name: 'Buoy', img: 'Buoy'},
		{name: 'Burn CD', img: 'Burn CD'},
		{name: 'Burn Text', img: 'Burn Text'},
		{name: 'Bus', img: 'Bus'},
		{name: 'Busy', img: 'Busy'},
		{name: 'Buy', img: 'Buy'},
		{name: 'Buyer bag', img: 'Buyer bag'},
		{name: 'Cabriolet', img: 'Cabriolet'},
		{name: 'Calc stakes', img: 'Calc stakes'},
		{name: 'Calculator', img: 'Calculator'},
		{name: 'Calendar', img: 'Calendar'},
		{name: 'Call up', img: 'Call up'},
		{name: 'Call', img: 'Call'},
		{name: 'Camcoder', img: 'Camcoder'},
		{name: 'Camera', img: 'Camera'},
		{name: 'Cancel', img: 'Cancel'},
		{name: 'Car card index', img: 'Car card index'},
		{name: 'Car crash', img: 'Car crash'},
		{name: 'Car expenses', img: 'Car expenses'},
		{name: 'Car key', img: 'Car key'},
		{name: 'Car repair', img: 'Car repair'},
		{name: 'Car', img: 'Car'},
		{name: 'Card file', img: 'Card file'},
		{name: 'Card index', img: 'Card index'},
		{name: 'Card terminal', img: 'Card terminal'},
		{name: 'Card', img: 'Card'},
		{name: 'Cards', img: 'Cards'},
		{name: 'Cargo ship', img: 'Cargo ship'},
		{name: 'Cargo', img: 'Cargo'},
		{name: 'Cars', img: 'Cars'},
		{name: 'Case History', img: 'Case History'},
		{name: 'Case', img: 'Case'},
		{name: 'Cash register', img: 'Cash register'},
		{name: 'Category', img: 'Category'},
		{name: 'CD', img: 'CD'},
		{name: 'Cellphone', img: 'Cellphone'},
		{name: 'Certificate seal', img: 'Certificate seal'},
		{name: 'Certificate', img: 'Certificate'},
		{name: 'Certification', img: 'Certification'},
		{name: 'Chart', img: 'Chart'},
		{name: 'Chat', img: 'Chat'},
		{name: 'Check out cart', img: 'Check out cart'},
		{name: 'Chemistry', img: 'Chemistry'},
		{name: 'Cheque', img: 'Cheque'},
		{name: 'Children', img: 'Children'},
		{name: 'City', img: 'City'},
		{name: 'Client list', img: 'Client list'},
		{name: 'Clients', img: 'Clients'},
		{name: 'Clipboard', img: 'Clipboard'},
		{name: 'Clock', img: 'Clock'},
		{name: 'Closed package', img: 'Closed package'},
		{name: 'Clothes', img: 'Clothes'},
		{name: 'Coffee break', img: 'Coffee break'},
		{name: 'Coffee', img: 'Coffee'},
		{name: 'Coin', img: 'Coin'},
		{name: 'Coins', img: 'Coins'},
		{name: 'Company', img: 'Company'},
		{name: 'Compass', img: 'Compass'},
		{name: 'Computer Acces', img: 'Computer Acces'},
		{name: 'Computer', img: 'Computer'},
		{name: 'Conference', img: 'Conference'},
		{name: 'Construction', img: 'Construction'},
		{name: 'Contact', img: 'Contact'},
		{name: 'Content', img: 'Content'},
		{name: 'Conversion of currency', img: 'Conversion of currency'},
		{name: 'Copy', img: 'Copy'},
		{name: 'Copyright', img: 'Copyright'},
		{name: 'Cosmetics', img: 'Cosmetics'},
		{name: 'Courier', img: 'Courier'},
		{name: 'Crane truck', img: 'Crane truck'},
		{name: 'Crawler crane', img: 'Crawler crane'},
		{name: 'Create', img: 'Create'},
		{name: 'Credit cards', img: 'Credit cards'},
		{name: 'Credit', img: 'Credit'},
		{name: 'Curve points', img: 'Curve points'},
		{name: 'Customers', img: 'Customers'},
		{name: 'Cut', img: 'Cut'},
		{name: 'Dashboard', img: 'Dashboard'},
		{name: 'Data server', img: 'Data server'},
		{name: 'Database', img: 'Database'},
		{name: 'Datasheet', img: 'Datasheet'},
		{name: 'Date and time', img: 'Date and time'},
		{name: 'Delete note', img: 'Delete note'},
		{name: 'Delete', img: 'Delete'},
		{name: 'Delivery', img: 'Delivery'},
		{name: 'Demography', img: 'Demography'},
		{name: 'Desk clock', img: 'Desk clock'},
		{name: 'Desk', img: 'Desk'},
		{name: 'Diagram', img: 'Diagram'},
		{name: 'Dial', img: 'Dial'},
		{name: 'Dialing', img: 'Dialing'},
		{name: 'Diary', img: 'Diary'},
		{name: 'Digital signature', img: 'Digital signature'},
		{name: 'Directory', img: 'Directory'},
		{name: 'Display', img: 'Display'},
		{name: 'Documents', img: 'Documents'},
		{name: 'Dollar', img: 'Dollar'},
		{name: 'Door', img: 'Door'},
		{name: 'Down', img: 'Down'},
		{name: 'Downward pointer', img: 'Downward pointer'},
		{name: 'Driil', img: 'Driil'},
		{name: 'Driver', img: 'Driver'},
		{name: 'Drugs', img: 'Drugs'},
		{name: 'Dustbin', img: 'Dustbin'},
		{name: 'Earnings', img: 'Earnings'},
		{name: 'Ecology', img: 'Ecology'},
		{name: 'Electric', img: 'Electric'},
		{name: 'Electronics', img: 'Electronics'},
		{name: 'Email', img: 'Email'},
		{name: 'Engineer', img: 'Engineer'},
		{name: 'Envelope', img: 'Envelope'},
		{name: 'European flag', img: 'European flag'},
		{name: 'Event manager', img: 'Event manager'},
		{name: 'Excavator', img: 'Excavator'},
		{name: 'Exit', img: 'Exit'},
		{name: 'Expert', img: 'Expert'},
		{name: 'Factory', img: 'Factory'},
		{name: 'Family', img: 'Family'},
		{name: 'Favourites', img: 'Favourites'},
		{name: 'Fax', img: 'Fax'},
		{name: 'Female', img: 'Female'},
		{name: 'Final document', img: 'Final document'},
		{name: 'Finance', img: 'Finance'},
		{name: 'Financial insurance', img: 'Financial insurance'},
		{name: 'Find in folder', img: 'Find in folder'},
		{name: 'Find on computer', img: 'Find on computer'},
		{name: 'Find', img: 'Find'},
		{name: 'Fire damage', img: 'Fire damage'},
		{name: 'First aid', img: 'First aid'},
		{name: 'First', img: 'First'},
		{name: 'Flow Block', img: 'Flow Block'},
		{name: 'Flowchart', img: 'Flowchart'},
		{name: 'Food', img: 'Food'},
		{name: 'Forklift truck', img: 'Forklift truck'},
		{name: 'Forms', img: 'Forms'},
		{name: 'Forward', img: 'Forward'},
		{name: 'Free', img: 'Free'},
		{name: 'Freight car', img: 'Freight car'},
		{name: 'Freight charges', img: 'Freight charges'},
		{name: 'Freight Container', img: 'Freight Container'},
		{name: 'Fruits', img: 'Fruits'},
		{name: 'Fuel', img: 'Fuel'},
		{name: 'Full basket', img: 'Full basket'},
		{name: 'Furniture', img: 'Furniture'},
		{name: 'Gantt chart', img: 'Gantt chart'},
		{name: 'Gantt charts', img: 'Gantt charts'},
		{name: 'Genealogy', img: 'Genealogy'},
		{name: 'Gift', img: 'Gift'},
		{name: 'Global web', img: 'Global web'},
		{name: 'Globe', img: 'Globe'},
		{name: 'Go back', img: 'Go back'},
		{name: 'Go forward', img: 'Go forward'},
		{name: 'Go', img: 'Go'},
		{name: 'Good mark', img: 'Good mark'},
		{name: 'Goods', img: 'Goods'},
		{name: 'Graph', img: 'Graph'},
		{name: 'Hammer', img: 'Hammer'},
		{name: 'Hand truck', img: 'Hand truck'},
		{name: 'Hand', img: 'Hand'},
		{name: 'Handshake', img: 'Handshake'},
		{name: 'Hangar', img: 'Hangar'},
		{name: 'Hangup', img: 'Hangup'},
		{name: 'Helicopter', img: 'Helicopter'},
		{name: 'Helmet', img: 'Helmet'},
		{name: 'Help book', img: 'Help book'},
		{name: 'Help', img: 'Help'},
		{name: 'Hierarchy', img: 'Hierarchy'},
		{name: 'Hint', img: 'Hint'},
		{name: 'Hints', img: 'Hints'},
		{name: 'History', img: 'History'},
		{name: 'Hoisting crane', img: 'Hoisting crane'},
		{name: 'Holidays', img: 'Holidays'},
		{name: 'Home technics', img: 'Home technics'},
		{name: 'Home', img: 'Home'},
		{name: 'Hotel', img: 'Hotel'},
		{name: 'Hourglass', img: 'Hourglass'},
		{name: 'How to', img: 'How to'},
		{name: 'Income', img: 'Income'},
		{name: 'Index', img: 'Index'},
		{name: 'Info', img: 'Info'},
		{name: 'Information', img: 'Information'},
		{name: 'Inquiry', img: 'Inquiry'},
		{name: 'Instrument', img: 'Instrument'},
		{name: 'Insurance', img: 'Insurance'},
		{name: 'Interior', img: 'Interior'},
		{name: 'Internet access', img: 'Internet access'},
		{name: 'Internet', img: 'Internet'},
		{name: 'Intranet', img: 'Intranet'},
		{name: 'Inventory', img: 'Inventory'},
		{name: 'IPad', img: 'IPad'},
		{name: 'IPhone', img: 'IPhone'},
		{name: 'IPod', img: 'IPod'},
		{name: 'Jeep', img: 'Jeep'},
		{name: 'Journey', img: 'Journey'},
		{name: 'Key', img: 'Key'},
		{name: 'Keyboard', img: 'Keyboard'},
		{name: 'Keys', img: 'Keys'},
		{name: 'Kitchen', img: 'Kitchen'},
		{name: 'Lamp', img: 'Lamp'},
		{name: 'Laser printer', img: 'Laser printer'},
		{name: 'List', img: 'List'},
		{name: 'Loading', img: 'Loading'},
		{name: 'Location', img: 'Location'},
		{name: 'Lock', img: 'Lock'},
		{name: 'Login', img: 'Login'},
		{name: 'Logistics', img: 'Logistics'},
		{name: 'Logout', img: 'Logout'},
		{name: 'Lorry', img: 'Lorry'},
		{name: 'Love', img: 'Love'},
		{name: 'Mail', img: 'Mail'},
		{name: 'Mailbox', img: 'Mailbox'},
		{name: 'Maintenance', img: 'Maintenance'},
		{name: 'Map', img: 'Map'},
		{name: 'Maps', img: 'Maps'},
		{name: 'Market report', img: 'Market report'},
		{name: 'Market', img: 'Market'},
		{name: 'Marketer', img: 'Marketer'},
		{name: 'Mechanic', img: 'Mechanic'},
		{name: 'Medical insurance', img: 'Medical insurance'},
		{name: 'Medical Store', img: 'Medical Store'},
		{name: 'Medical supplies', img: 'Medical supplies'},
		{name: 'Medical', img: 'Medical'},
		{name: 'Meeting', img: 'Meeting'},
		{name: 'Metal shopping cart', img: 'Metal shopping cart'},
		{name: 'Mobile Phone', img: 'Mobile Phone'},
		{name: 'Money bag', img: 'Money bag'},
		{name: 'Money turnover', img: 'Money turnover'},
		{name: 'Money', img: 'Money'},
		{name: 'Monitor and phone', img: 'Monitor and phone'},
		{name: 'Monitor', img: 'Monitor'},
		{name: 'Mortgage loan', img: 'Mortgage loan'},
		{name: 'Music notes', img: 'Music notes'},
		{name: 'Music', img: 'Music'},
		{name: 'My computer', img: 'My computer'},
		{name: 'New file', img: 'New file'},
		{name: 'New note', img: 'New note'},
		{name: 'New', img: 'New'},
		{name: 'News source', img: 'News source'},
		{name: 'Newspaper', img: 'Newspaper'},
		{name: 'Next note', img: 'Next note'},
		{name: 'No', img: 'No'},
		{name: 'Note', img: 'Note'},
		{name: 'Notebook computer', img: 'Notebook computer'},
		{name: 'Notebook', img: 'Notebook'},
		{name: 'Notes', img: 'Notes'},
		{name: 'Office chair', img: 'Office chair'},
		{name: 'Office phone', img: 'Office phone'},
		{name: 'Office', img: 'Office'},
		{name: 'OK', img: 'OK'},
		{name: 'Online contacts', img: 'Online contacts'},
		{name: 'Online Store', img: 'Online Store'},
		{name: 'Open barrier', img: 'Open barrier'},
		{name: 'Open card index', img: 'Open card index'},
		{name: 'Open folder', img: 'Open folder'},
		{name: 'Open lock', img: 'Open lock'},
		{name: 'Open', img: 'Open'},
		{name: 'Order tracking', img: 'Order tracking'},
		{name: 'Package', img: 'Package'},
		{name: 'Pallet 3d', img: 'Pallet 3d'},
		{name: 'Pallet', img: 'Pallet'},
		{name: 'Panel Truck', img: 'Panel Truck'},
		{name: 'Paste document', img: 'Paste document'},
		{name: 'Paste', img: 'Paste'},
		{name: 'Pay', img: 'Pay'},
		{name: 'Payment', img: 'Payment'},
		{name: 'PC-Web synchronization', img: 'PC-Web synchronization'},
		{name: 'Pencil', img: 'Pencil'},
		{name: 'Percent', img: 'Percent'},
		{name: 'Period end', img: 'Period end'},
		{name: 'Personal loan', img: 'Personal loan'},
		{name: 'Personal smartcard', img: 'Personal smartcard'},
		{name: 'Petroleum industry', img: 'Petroleum industry'},
		{name: 'Phone and monitor', img: 'Phone and monitor'},
		{name: 'Phone Number', img: 'Phone Number'},
		{name: 'Phone Support', img: 'Phone Support'},
		{name: 'Phone', img: 'Phone'},
		{name: 'Phones', img: 'Phones'},
		{name: 'Pick', img: 'Pick'},
		{name: 'Pickup', img: 'Pickup'},
		{name: 'Pie chart', img: 'Pie chart'},
		{name: 'Piggy bank', img: 'Piggy bank'},
		{name: 'Pirate', img: 'Pirate'},
		{name: 'Pointer', img: 'Pointer'},
		{name: 'Police car', img: 'Police car'},
		{name: 'Police officer', img: 'Police officer'},
		{name: 'Postman', img: 'Postman'},
		{name: 'Preview', img: 'Preview'},
		{name: 'Previous note', img: 'Previous note'},
		{name: 'Price List', img: 'Price List'},
		{name: 'Print Preview', img: 'Print Preview'},
		{name: 'Print', img: 'Print'},
		{name: 'Printer', img: 'Printer'},
		{name: 'Product basket', img: 'Product basket'},
		{name: 'Products', img: 'Products'},
		{name: 'Protection', img: 'Protection'},
		{name: 'Provider', img: 'Provider'},
		{name: 'Publicity agent', img: 'Publicity agent'},
		{name: 'Put away', img: 'Put away'},
		{name: 'Query', img: 'Query'},
		{name: 'Question', img: 'Question'},
		{name: 'Receptionist', img: 'Receptionist'},
		{name: 'Recycling', img: 'Recycling'},
		{name: 'Redo', img: 'Redo'},
		{name: 'Reflex camera', img: 'Reflex camera'},
		{name: 'Refresh', img: 'Refresh'},
		{name: 'Registration', img: 'Registration'},
		{name: 'Remote access', img: 'Remote access'},
		{name: 'Remove', img: 'Remove'},
		{name: 'Report', img: 'Report'},
		{name: 'Reports', img: 'Reports'},
		{name: 'Resources', img: 'Resources'},
		{name: 'Road roller', img: 'Road roller'},
		{name: 'Road', img: 'Road'},
		{name: 'Safe', img: 'Safe'},
		{name: 'Sale', img: 'Sale'},
		{name: 'Sales', img: 'Sales'},
		{name: 'Sandbag', img: 'Sandbag'},
		{name: 'Save', img: 'Save'},
		{name: 'Scales', img: 'Scales'},
		{name: 'Scanner', img: 'Scanner'},
		{name: 'Schedule', img: 'Schedule'},
		{name: 'Scheduled', img: 'Scheduled'},
		{name: 'Search', img: 'Search'},
		{name: 'Secrecy', img: 'Secrecy'},
		{name: 'Secretary', img: 'Secretary'},
		{name: 'Security control', img: 'Security control'},
		{name: 'Security guard', img: 'Security guard'},
		{name: 'Send', img: 'Send'},
		{name: 'Shield', img: 'Shield'},
		{name: 'Ship', img: 'Ship'},
		{name: 'Shipping', img: 'Shipping'},
		{name: 'Shopping cart', img: 'Shopping cart'},
		{name: 'Sign document', img: 'Sign document'},
		{name: 'Sign', img: 'Sign'},
		{name: 'Skull', img: 'Skull'},
		{name: 'Smart phone', img: 'Smart phone'},
		{name: 'Smile', img: 'Smile'},
		{name: 'Social Network', img: 'Social Network'},
		{name: 'Sporting goods', img: 'Sporting goods'},
		{name: 'Sports', img: 'Sports'},
		{name: 'Spy', img: 'Spy'},
		{name: 'Staff', img: 'Staff'},
		{name: 'Stairs', img: 'Stairs'},
		{name: 'Stamp', img: 'Stamp'},
		{name: 'Statistics', img: 'Statistics'},
		{name: 'Stock down', img: 'Stock down'},
		{name: 'Stock up', img: 'Stock up'},
		{name: 'Stock', img: 'Stock'},
		{name: 'Stop sign', img: 'Stop sign'},
		{name: 'Stop watch', img: 'Stop watch'},
		{name: 'Store', img: 'Store'},
		{name: 'Storehouse', img: 'Storehouse'},
		{name: 'Storekeeper', img: 'Storekeeper'},
		{name: 'Structure', img: 'Structure'},
		{name: 'Sum', img: 'Sum'},
		{name: 'Support', img: 'Support'},
		{name: 'Sync', img: 'Sync'},
		{name: 'T-shirt', img: 'T-shirt'},
		{name: 'Table', img: 'Table'},
		{name: 'Tables', img: 'Tables'},
		{name: 'Tank truck', img: 'Tank truck'},
		{name: 'Target', img: 'Target'},
		{name: 'Tasks', img: 'Tasks'},
		{name: 'Tax', img: 'Tax'},
		{name: 'Taxi-lorry', img: 'Taxi-lorry'},
		{name: 'Taxi', img: 'Taxi'},
		{name: 'Tear-off calendar', img: 'Tear-off calendar'},
		{name: 'Telephone directory', img: 'Telephone directory'},
		{name: 'Telephone receiver', img: 'Telephone receiver'},
		{name: 'Telephone', img: 'Telephone'},
		{name: 'Text File', img: 'Text File'},
		{name: 'Text', img: 'Text'},
		{name: 'Thief', img: 'Thief'},
		{name: 'Time management', img: 'Time management'},
		{name: 'Time', img: 'Time'},
		{name: 'Timer', img: 'Timer'},
		{name: 'Timetable', img: 'Timetable'},
		{name: 'Toll', img: 'Toll'},
		{name: 'Tooling', img: 'Tooling'},
		{name: 'Tools', img: 'Tools'},
		{name: 'Tow truck', img: 'Tow truck'},
		{name: 'Traffic protection', img: 'Traffic protection'},
		{name: 'Trailer', img: 'Trailer'},
		{name: 'Transfer', img: 'Transfer'},
		{name: 'Translation', img: 'Translation'},
		{name: 'Transport', img: 'Transport'},
		{name: 'Trash', img: 'Trash'},
		{name: 'Travel', img: 'Travel'},
		{name: 'Turn off', img: 'Turn off'},
		{name: 'TV', img: 'TV'},
		{name: 'Umbrella', img: 'Umbrella'},
		{name: 'Under construction', img: 'Under construction'},
		{name: 'Undo', img: 'Undo'},
		{name: 'Unemployed', img: 'Unemployed'},
		{name: 'Units', img: 'Units'},
		{name: 'Unloading', img: 'Unloading'},
		{name: 'Up', img: 'Up'},
		{name: 'Update password', img: 'Update password'},
		{name: 'Update', img: 'Update'},
		{name: 'USA flag', img: 'USA flag'},
		{name: 'User group', img: 'User group'},
		{name: 'User login', img: 'User login'},
		{name: 'User logout', img: 'User logout'},
		{name: 'User', img: 'User'},
		{name: 'Users', img: 'Users'},
		{name: 'View', img: 'View'},
		{name: 'VOIP', img: 'VOIP'},
		{name: 'Warehouse', img: 'Warehouse'},
		{name: 'Warning', img: 'Warning'},
		{name: 'Watch', img: 'Watch'},
		{name: 'Weather', img: 'Weather'},
		{name: 'Web statistics', img: 'Web statistics'},
		{name: 'Web', img: 'Web'},
		{name: 'Wedding', img: 'Wedding'},
		{name: 'Wheelbarrow', img: 'Wheelbarrow'},
		{name: 'Wheeled tractor', img: 'Wheeled tractor'},
		{name: 'Wizard', img: 'Wizard'},
		{name: 'Worker', img: 'Worker'},
		{name: 'Working gloves', img: 'Working gloves'},
		{name: 'World', img: 'World'},
		{name: 'Wrench', img: 'Wrench'},
		{name: 'Www', img: 'Www'},
		{name: 'XXX', img: 'XXX'},
		{name: 'Yacht', img: 'Yacht'},
		{name: '_2D pie chart', img: '_2D pie chart'},
		{name: '_3D bar chart', img: '_3D bar chart'},
		{name: '_3d chart', img: '_3d chart'},
		{name: '_3D pie chart', img: '_3D pie chart'},
		{name: '_3Dchart', img: '_3Dchart'},
		{name: '_Abacus', img: '_Abacus'},
		{name: '_About', img: '_About'},
		{name: '_Accept changes', img: '_Accept changes'},
		{name: '_Access', img: '_Access'},
		{name: '_Account', img: '_Account'},
		{name: '_Accounts', img: '_Accounts'},
		{name: '_Add', img: '_Add'},
		{name: '_Address book', img: '_Address book'},
		{name: '_Admin', img: '_Admin'},
		{name: '_Advertising', img: '_Advertising'},
		{name: '_Agent', img: '_Agent'},
		{name: '_Air cargo', img: '_Air cargo'},
		{name: '_Air tickets', img: '_Air tickets'},
		{name: '_Airplane', img: '_Airplane'},
		{name: '_Alarm clock', img: '_Alarm clock'},
		{name: '_Alarm', img: '_Alarm'},
		{name: '_All reports', img: '_All reports'},
		{name: '_Apply', img: '_Apply'},
		{name: '_Appointment calendar', img: '_Appointment calendar'},
		{name: '_Appointment', img: '_Appointment'},
		{name: '_ATM', img: '_ATM'},
		{name: '_Attach', img: '_Attach'},
		{name: '_Auction', img: '_Auction'},
		{name: '_Audience', img: '_Audience'},
		{name: '_Auto insurance', img: '_Auto insurance'},
		{name: '_Automobile loan interest payment', img: '_Automobile loan interest payment'},
		{name: '_Automobile loan', img: '_Automobile loan'},
		{name: '_Baby carriage', img: '_Baby carriage'},
		{name: '_Back', img: '_Back'},
		{name: '_Bad mark', img: '_Bad mark'},
		{name: '_Baggage', img: '_Baggage'},
		{name: '_Balloon', img: '_Balloon'},
		{name: '_Bank cards', img: '_Bank cards'},
		{name: '_Bank service', img: '_Bank service'},
		{name: '_Bank', img: '_Bank'},
		{name: '_Banner', img: '_Banner'},
		{name: '_Barcode scanner', img: '_Barcode scanner'},
		{name: '_Barcode scanning', img: '_Barcode scanning'},
		{name: '_Barcode', img: '_Barcode'},
		{name: '_Battery', img: '_Battery'},
		{name: '_Beverage', img: '_Beverage'},
		{name: '_Bike', img: '_Bike'},
		{name: '_Black bus', img: '_Black bus'},
		{name: '_Black car', img: '_Black car'},
		{name: '_Black list', img: '_Black list'},
		{name: '_Black pencil', img: '_Black pencil'},
		{name: '_Blank', img: '_Blank'},
		{name: '_Blanks', img: '_Blanks'},
		{name: '_Boat', img: '_Boat'},
		{name: '_Book of records', img: '_Book of records'},
		{name: '_Book-keeper', img: '_Book-keeper'},
		{name: '_Book', img: '_Book'},
		{name: '_Boss', img: '_Boss'},
		{name: '_Box', img: '_Box'},
		{name: '_Briefcase', img: '_Briefcase'},
		{name: '_Building', img: '_Building'},
		{name: '_Buildings', img: '_Buildings'},
		{name: '_Bulldozer', img: '_Bulldozer'},
		{name: '_Bundle', img: '_Bundle'},
		{name: '_Buoy', img: '_Buoy'},
		{name: '_Burn CD', img: '_Burn CD'},
		{name: '_Burn Text', img: '_Burn Text'},
		{name: '_Bus', img: '_Bus'},
		{name: '_Busy', img: '_Busy'},
		{name: '_Buy', img: '_Buy'},
		{name: '_Buyer bag', img: '_Buyer bag'},
		{name: '_Cabriolet', img: '_Cabriolet'},
		{name: '_Calc stakes', img: '_Calc stakes'},
		{name: '_Calculator', img: '_Calculator'},
		{name: '_Calendar', img: '_Calendar'},
		{name: '_Call up', img: '_Call up'},
		{name: '_Call', img: '_Call'},
		{name: '_Camcoder', img: '_Camcoder'},
		{name: '_Camera', img: '_Camera'},
		{name: '_Cancel', img: '_Cancel'},
		{name: '_Car card index', img: '_Car card index'},
		{name: '_Car crash', img: '_Car crash'},
		{name: '_Car expenses', img: '_Car expenses'},
		{name: '_Car key', img: '_Car key'},
		{name: '_Car repair', img: '_Car repair'},
		{name: '_Car', img: '_Car'},
		{name: '_Card file', img: '_Card file'},
		{name: '_Card index', img: '_Card index'},
		{name: '_Card terminal', img: '_Card terminal'},
		{name: '_Card', img: '_Card'},
		{name: '_Cards', img: '_Cards'},
		{name: '_Cargo ship', img: '_Cargo ship'},
		{name: '_Cargo', img: '_Cargo'},
		{name: '_Cars', img: '_Cars'},
		{name: '_Case History', img: '_Case History'},
		{name: '_Case', img: '_Case'},
		{name: '_Cash register', img: '_Cash register'},
		{name: '_Category', img: '_Category'},
		{name: '_CD', img: '_CD'},
		{name: '_Cellphone', img: '_Cellphone'},
		{name: '_Certificate seal', img: '_Certificate seal'},
		{name: '_Certificate', img: '_Certificate'},
		{name: '_Certification', img: '_Certification'},
		{name: '_Chart', img: '_Chart'},
		{name: '_Chat', img: '_Chat'},
		{name: '_Check out cart', img: '_Check out cart'},
		{name: '_Chemistry', img: '_Chemistry'},
		{name: '_Cheque', img: '_Cheque'},
		{name: '_Children', img: '_Children'},
		{name: '_City', img: '_City'},
		{name: '_Client list', img: '_Client list'},
		{name: '_Clients', img: '_Clients'},
		{name: '_Clipboard', img: '_Clipboard'},
		{name: '_Clock', img: '_Clock'},
		{name: '_Closed package', img: '_Closed package'},
		{name: '_Clothes', img: '_Clothes'},
		{name: '_Coffee break', img: '_Coffee break'},
		{name: '_Coffee', img: '_Coffee'},
		{name: '_Coin', img: '_Coin'},
		{name: '_Coins', img: '_Coins'},
		{name: '_Company', img: '_Company'},
		{name: '_Compass', img: '_Compass'},
		{name: '_Computer Acces', img: '_Computer Acces'},
		{name: '_Computer', img: '_Computer'},
		{name: '_Conference', img: '_Conference'},
		{name: '_Construction', img: '_Construction'},
		{name: '_Contact', img: '_Contact'},
		{name: '_Content', img: '_Content'},
		{name: '_Conversion of currency', img: '_Conversion of currency'},
		{name: '_Copy', img: '_Copy'},
		{name: '_Copyright', img: '_Copyright'},
		{name: '_Cosmetics', img: '_Cosmetics'},
		{name: '_Courier', img: '_Courier'},
		{name: '_Crane truck', img: '_Crane truck'},
		{name: '_Crawler crane', img: '_Crawler crane'},
		{name: '_Create', img: '_Create'},
		{name: '_Credit cards', img: '_Credit cards'},
		{name: '_Credit', img: '_Credit'},
		{name: '_Curve points', img: '_Curve points'},
		{name: '_Customers', img: '_Customers'},
		{name: '_Cut', img: '_Cut'},
		{name: '_Dashboard', img: '_Dashboard'},
		{name: '_Data server', img: '_Data server'},
		{name: '_Database', img: '_Database'},
		{name: '_Datasheet', img: '_Datasheet'},
		{name: '_Date and time', img: '_Date and time'},
		{name: '_Delete note', img: '_Delete note'},
		{name: '_Delete', img: '_Delete'},
		{name: '_Delivery', img: '_Delivery'},
		{name: '_Demography', img: '_Demography'},
		{name: '_Desk clock', img: '_Desk clock'},
		{name: '_Desk', img: '_Desk'},
		{name: '_Diagram', img: '_Diagram'},
		{name: '_Dial', img: '_Dial'},
		{name: '_Dialing', img: '_Dialing'},
		{name: '_Diary', img: '_Diary'},
		{name: '_Digital signature', img: '_Digital signature'},
		{name: '_Directory', img: '_Directory'},
		{name: '_Display', img: '_Display'},
		{name: '_Documents', img: '_Documents'},
		{name: '_Dollar', img: '_Dollar'},
		{name: '_Door', img: '_Door'},
		{name: '_Down', img: '_Down'},
		{name: '_Downward pointer', img: '_Downward pointer'},
		{name: '_Driil', img: '_Driil'},
		{name: '_Driver', img: '_Driver'},
		{name: '_Drugs', img: '_Drugs'},
		{name: '_Dustbin', img: '_Dustbin'},
		{name: '_Earnings', img: '_Earnings'},
		{name: '_Ecology', img: '_Ecology'},
		{name: '_Electric', img: '_Electric'},
		{name: '_Electronics', img: '_Electronics'},
		{name: '_Email', img: '_Email'},
		{name: '_Engineer', img: '_Engineer'},
		{name: '_Envelope', img: '_Envelope'},
		{name: '_European flag', img: '_European flag'},
		{name: '_Event manager', img: '_Event manager'},
		{name: '_Excavator', img: '_Excavator'},
		{name: '_Exit', img: '_Exit'},
		{name: '_Expert', img: '_Expert'},
		{name: '_Factory', img: '_Factory'},
		{name: '_Family', img: '_Family'},
		{name: '_Favourites', img: '_Favourites'},
		{name: '_Fax', img: '_Fax'},
		{name: '_Female', img: '_Female'},
		{name: '_Final document', img: '_Final document'},
		{name: '_Finance', img: '_Finance'},
		{name: '_Financial insurance', img: '_Financial insurance'},
		{name: '_Find in folder', img: '_Find in folder'},
		{name: '_Find on computer', img: '_Find on computer'},
		{name: '_Find', img: '_Find'},
		{name: '_Fire damage', img: '_Fire damage'},
		{name: '_First aid', img: '_First aid'},
		{name: '_First', img: '_First'},
		{name: '_Flow Block', img: '_Flow Block'},
		{name: '_Flowchart', img: '_Flowchart'},
		{name: '_Food', img: '_Food'},
		{name: '_Forklift truck', img: '_Forklift truck'},
		{name: '_Forms', img: '_Forms'},
		{name: '_Forward', img: '_Forward'},
		{name: '_Free', img: '_Free'},
		{name: '_Freight car', img: '_Freight car'},
		{name: '_Freight charges', img: '_Freight charges'},
		{name: '_Freight Container', img: '_Freight Container'},
		{name: '_Fruits', img: '_Fruits'},
		{name: '_Fuel', img: '_Fuel'},
		{name: '_Full basket', img: '_Full basket'},
		{name: '_Furniture', img: '_Furniture'},
		{name: '_Gantt chart', img: '_Gantt chart'},
		{name: '_Gantt charts', img: '_Gantt charts'},
		{name: '_Genealogy', img: '_Genealogy'},
		{name: '_Gift', img: '_Gift'},
		{name: '_Global web', img: '_Global web'},
		{name: '_Globe', img: '_Globe'},
		{name: '_Go back', img: '_Go back'},
		{name: '_Go forward', img: '_Go forward'},
		{name: '_Go', img: '_Go'},
		{name: '_Good mark', img: '_Good mark'},
		{name: '_Goods', img: '_Goods'},
		{name: '_Graph', img: '_Graph'},
		{name: '_Hammer', img: '_Hammer'},
		{name: '_Hand truck', img: '_Hand truck'},
		{name: '_Hand', img: '_Hand'},
		{name: '_Handshake', img: '_Handshake'},
		{name: '_Hangar', img: '_Hangar'},
		{name: '_Hangup', img: '_Hangup'},
		{name: '_Helicopter', img: '_Helicopter'},
		{name: '_Helmet', img: '_Helmet'},
		{name: '_Help book', img: '_Help book'},
		{name: '_Help', img: '_Help'},
		{name: '_Hierarchy', img: '_Hierarchy'},
		{name: '_Hint', img: '_Hint'},
		{name: '_Hints', img: '_Hints'},
		{name: '_History', img: '_History'},
		{name: '_Hoisting crane', img: '_Hoisting crane'},
		{name: '_Holidays', img: '_Holidays'},
		{name: '_Home technics', img: '_Home technics'},
		{name: '_Home', img: '_Home'},
		{name: '_Hotel', img: '_Hotel'},
		{name: '_Hourglass', img: '_Hourglass'},
		{name: '_How to', img: '_How to'},
		{name: '_Income', img: '_Income'},
		{name: '_Index', img: '_Index'},
		{name: '_Info', img: '_Info'},
		{name: '_Information', img: '_Information'},
		{name: '_Inquiry', img: '_Inquiry'},
		{name: '_Instrument', img: '_Instrument'},
		{name: '_Insurance', img: '_Insurance'},
		{name: '_Interior', img: '_Interior'},
		{name: '_Internet access', img: '_Internet access'},
		{name: '_Internet', img: '_Internet'},
		{name: '_Intranet', img: '_Intranet'},
		{name: '_Inventory', img: '_Inventory'},
		{name: '_IPad', img: '_IPad'},
		{name: '_IPhone', img: '_IPhone'},
		{name: '_IPod', img: '_IPod'},
		{name: '_Jeep', img: '_Jeep'},
		{name: '_Journey', img: '_Journey'},
		{name: '_Key', img: '_Key'},
		{name: '_Keyboard', img: '_Keyboard'},
		{name: '_Keys', img: '_Keys'},
		{name: '_Kitchen', img: '_Kitchen'},
		{name: '_Lamp', img: '_Lamp'},
		{name: '_Laser printer', img: '_Laser printer'},
		{name: '_List', img: '_List'},
		{name: '_Loading', img: '_Loading'},
		{name: '_Location', img: '_Location'},
		{name: '_Lock', img: '_Lock'},
		{name: '_Login', img: '_Login'},
		{name: '_Logistics', img: '_Logistics'},
		{name: '_Logout', img: '_Logout'},
		{name: '_Lorry', img: '_Lorry'},
		{name: '_Love', img: '_Love'},
		{name: '_Mail', img: '_Mail'},
		{name: '_Mailbox', img: '_Mailbox'},
		{name: '_Maintenance', img: '_Maintenance'},
		{name: '_Map', img: '_Map'},
		{name: '_Maps', img: '_Maps'},
		{name: '_Market report', img: '_Market report'},
		{name: '_Market', img: '_Market'},
		{name: '_Marketer', img: '_Marketer'},
		{name: '_Mechanic', img: '_Mechanic'},
		{name: '_Medical insurance', img: '_Medical insurance'},
		{name: '_Medical Store', img: '_Medical Store'},
		{name: '_Medical supplies', img: '_Medical supplies'},
		{name: '_Medical', img: '_Medical'},
		{name: '_Meeting', img: '_Meeting'},
		{name: '_Metal shopping cart', img: '_Metal shopping cart'},
		{name: '_Mobile Phone', img: '_Mobile Phone'},
		{name: '_Money bag', img: '_Money bag'},
		{name: '_Money turnover', img: '_Money turnover'},
		{name: '_Money', img: '_Money'},
		{name: '_Monitor and phone', img: '_Monitor and phone'},
		{name: '_Monitor', img: '_Monitor'},
		{name: '_Mortgage loan', img: '_Mortgage loan'},
		{name: '_Music notes', img: '_Music notes'},
		{name: '_Music', img: '_Music'},
		{name: '_My computer', img: '_My computer'},
		{name: '_New file', img: '_New file'},
		{name: '_New note', img: '_New note'},
		{name: '_New', img: '_New'},
		{name: '_News source', img: '_News source'},
		{name: '_Newspaper', img: '_Newspaper'},
		{name: '_Next note', img: '_Next note'},
		{name: '_No', img: '_No'},
		{name: '_Note', img: '_Note'},
		{name: '_Notebook computer', img: '_Notebook computer'},
		{name: '_Notebook', img: '_Notebook'},
		{name: '_Notes', img: '_Notes'},
		{name: '_Office chair', img: '_Office chair'},
		{name: '_Office phone', img: '_Office phone'},
		{name: '_Office', img: '_Office'},
		{name: '_OK', img: '_OK'},
		{name: '_Online contacts', img: '_Online contacts'},
		{name: '_Online Store', img: '_Online Store'},
		{name: '_Open barrier', img: '_Open barrier'},
		{name: '_Open card index', img: '_Open card index'},
		{name: '_Open folder', img: '_Open folder'},
		{name: '_Open lock', img: '_Open lock'},
		{name: '_Open', img: '_Open'},
		{name: '_Order tracking', img: '_Order tracking'},
		{name: '_Package', img: '_Package'},
		{name: '_Pallet 3d', img: '_Pallet 3d'},
		{name: '_Pallet', img: '_Pallet'},
		{name: '_Panel Truck', img: '_Panel Truck'},
		{name: '_Paste document', img: '_Paste document'},
		{name: '_Paste', img: '_Paste'},
		{name: '_Pay', img: '_Pay'},
		{name: '_Payment', img: '_Payment'},
		{name: '_PC-Web synchronization', img: '_PC-Web synchronization'},
		{name: '_Pencil', img: '_Pencil'},
		{name: '_Percent', img: '_Percent'},
		{name: '_Period end', img: '_Period end'},
		{name: '_Personal loan', img: '_Personal loan'},
		{name: '_Personal smartcard', img: '_Personal smartcard'},
		{name: '_Petroleum industry', img: '_Petroleum industry'},
		{name: '_Phone and monitor', img: '_Phone and monitor'},
		{name: '_Phone Number', img: '_Phone Number'},
		{name: '_Phone Support', img: '_Phone Support'},
		{name: '_Phone', img: '_Phone'},
		{name: '_Phones', img: '_Phones'},
		{name: '_Pick', img: '_Pick'},
		{name: '_Pickup', img: '_Pickup'},
		{name: '_Pie chart', img: '_Pie chart'},
		{name: '_Piggy bank', img: '_Piggy bank'},
		{name: '_Pirate', img: '_Pirate'},
		{name: '_Pointer', img: '_Pointer'},
		{name: '_Police car', img: '_Police car'},
		{name: '_Police officer', img: '_Police officer'},
		{name: '_Postman', img: '_Postman'},
		{name: '_Preview', img: '_Preview'},
		{name: '_Previous note', img: '_Previous note'},
		{name: '_Price List', img: '_Price List'},
		{name: '_Print Preview', img: '_Print Preview'},
		{name: '_Print', img: '_Print'},
		{name: '_Printer', img: '_Printer'},
		{name: '_Product basket', img: '_Product basket'},
		{name: '_Products', img: '_Products'},
		{name: '_Protection', img: '_Protection'},
		{name: '_Provider', img: '_Provider'},
		{name: '_Publicity agent', img: '_Publicity agent'},
		{name: '_Put away', img: '_Put away'},
		{name: '_Query', img: '_Query'},
		{name: '_Question', img: '_Question'},
		{name: '_Receptionist', img: '_Receptionist'},
		{name: '_Recycling', img: '_Recycling'},
		{name: '_Redo', img: '_Redo'},
		{name: '_Reflex camera', img: '_Reflex camera'},
		{name: '_Refresh', img: '_Refresh'},
		{name: '_Registration', img: '_Registration'},
		{name: '_Remote access', img: '_Remote access'},
		{name: '_Remove', img: '_Remove'},
		{name: '_Report', img: '_Report'},
		{name: '_Reports', img: '_Reports'},
		{name: '_Resources', img: '_Resources'},
		{name: '_Road roller', img: '_Road roller'},
		{name: '_Road', img: '_Road'},
		{name: '_Safe', img: '_Safe'},
		{name: '_Sale', img: '_Sale'},
		{name: '_Sales', img: '_Sales'},
		{name: '_Sandbag', img: '_Sandbag'},
		{name: '_Save', img: '_Save'},
		{name: '_Scales', img: '_Scales'},
		{name: '_Scanner', img: '_Scanner'},
		{name: '_Schedule', img: '_Schedule'},
		{name: '_Scheduled', img: '_Scheduled'},
		{name: '_Search', img: '_Search'},
		{name: '_Secrecy', img: '_Secrecy'},
		{name: '_Secretary', img: '_Secretary'},
		{name: '_Security control', img: '_Security control'},
		{name: '_Security guard', img: '_Security guard'},
		{name: '_Send', img: '_Send'},
		{name: '_Shield', img: '_Shield'},
		{name: '_Ship', img: '_Ship'},
		{name: '_Shipping', img: '_Shipping'},
		{name: '_Shopping cart', img: '_Shopping cart'},
		{name: '_Sign document', img: '_Sign document'},
		{name: '_Sign', img: '_Sign'},
		{name: '_Skull', img: '_Skull'},
		{name: '_Smart phone', img: '_Smart phone'},
		{name: '_Smile', img: '_Smile'},
		{name: '_Social Network', img: '_Social Network'},
		{name: '_Sporting goods', img: '_Sporting goods'},
		{name: '_Sports', img: '_Sports'},
		{name: '_Spy', img: '_Spy'},
		{name: '_Staff', img: '_Staff'},
		{name: '_Stairs', img: '_Stairs'},
		{name: '_Stamp', img: '_Stamp'},
		{name: '_Statistics', img: '_Statistics'},
		{name: '_Stock down', img: '_Stock down'},
		{name: '_Stock up', img: '_Stock up'},
		{name: '_Stock', img: '_Stock'},
		{name: '_Stop sign', img: '_Stop sign'},
		{name: '_Stop watch', img: '_Stop watch'},
		{name: '_Store', img: '_Store'},
		{name: '_Storehouse', img: '_Storehouse'},
		{name: '_Storekeeper', img: '_Storekeeper'},
		{name: '_Structure', img: '_Structure'},
		{name: '_Sum', img: '_Sum'},
		{name: '_Support', img: '_Support'},
		{name: '_Sync', img: '_Sync'},
		{name: '_T-shirt', img: '_T-shirt'},
		{name: '_Table', img: '_Table'},
		{name: '_Tables', img: '_Tables'},
		{name: '_Tank truck', img: '_Tank truck'},
		{name: '_Target', img: '_Target'},
		{name: '_Tasks', img: '_Tasks'},
		{name: '_Tax', img: '_Tax'},
		{name: '_Taxi-lorry', img: '_Taxi-lorry'},
		{name: '_Taxi', img: '_Taxi'},
		{name: '_Tear-off calendar', img: '_Tear-off calendar'},
		{name: '_Telephone directory', img: '_Telephone directory'},
		{name: '_Telephone receiver', img: '_Telephone receiver'},
		{name: '_Telephone', img: '_Telephone'},
		{name: '_Text File', img: '_Text File'},
		{name: '_Text', img: '_Text'},
		{name: '_Thief', img: '_Thief'},
		{name: '_Time management', img: '_Time management'},
		{name: '_Time', img: '_Time'},
		{name: '_Timer', img: '_Timer'},
		{name: '_Timetable', img: '_Timetable'},
		{name: '_Toll', img: '_Toll'},
		{name: '_Tooling', img: '_Tooling'},
		{name: '_Tools', img: '_Tools'},
		{name: '_Tow truck', img: '_Tow truck'},
		{name: '_Traffic protection', img: '_Traffic protection'},
		{name: '_Trailer', img: '_Trailer'},
		{name: '_Transfer', img: '_Transfer'},
		{name: '_Translation', img: '_Translation'},
		{name: '_Transport', img: '_Transport'},
		{name: '_Trash', img: '_Trash'},
		{name: '_Travel', img: '_Travel'},
		{name: '_Turn off', img: '_Turn off'},
		{name: '_TV', img: '_TV'},
		{name: '_Umbrella', img: '_Umbrella'},
		{name: '_Under construction', img: '_Under construction'},
		{name: '_Undo', img: '_Undo'},
		{name: '_Unemployed', img: '_Unemployed'},
		{name: '_Units', img: '_Units'},
		{name: '_Unloading', img: '_Unloading'},
		{name: '_Up', img: '_Up'},
		{name: '_Update password', img: '_Update password'},
		{name: '_Update', img: '_Update'},
		{name: '_USA flag', img: '_USA flag'},
		{name: '_User group', img: '_User group'},
		{name: '_User login', img: '_User login'},
		{name: '_User logout', img: '_User logout'},
		{name: '_User', img: '_User'},
		{name: '_Users', img: '_Users'},
		{name: '_View', img: '_View'},
		{name: '_VOIP', img: '_VOIP'},
		{name: '_Warehouse', img: '_Warehouse'},
		{name: '_Warning', img: '_Warning'},
		{name: '_Watch', img: '_Watch'},
		{name: '_Weather', img: '_Weather'},
		{name: '_Web statistics', img: '_Web statistics'},
		{name: '_Web', img: '_Web'},
		{name: '_Wedding', img: '_Wedding'},
		{name: '_Wheelbarrow', img: '_Wheelbarrow'},
		{name: '_Wheeled tractor', img: '_Wheeled tractor'},
		{name: '_Wizard', img: '_Wizard'},
		{name: '_Worker', img: '_Worker'},
		{name: '_Working gloves', img: '_Working gloves'},
		{name: '_World', img: '_World'},
		{name: '_Wrench', img: '_Wrench'},
		{name: '_Www', img: '_Www'},
		{name: '_XXX', img: '_XXX'},
		{name: '_Yacht', img: '_Yacht'}
	]
);
