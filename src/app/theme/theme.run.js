/**
 * @author v.lugovksy
 * created on 15.12.2015
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
    .run(themeRun);

  /** @ngInject */
  function themeRun($timeout, $rootScope, layoutPaths, preloader, $q, baSidebarService, themeLayoutSettings) {
    $rootScope.$activeLoadingPage = false;
    $rootScope.$activeLogin = true;
    $rootScope.$wizAnnulerDisabled = false;

    //Activer la confirmation avant de changer de page
    $rootScope.$confirmChangePage = {
      indicateur: false,
      message: ""
    };

    var whatToWait = [
      preloader.loadAmCharts(),
//      $timeout(3000)
    ];

    var theme = themeLayoutSettings;
    if (theme.blur) {
      if (theme.mobile) {
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'budgetExpress-bg.jpg'));
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg-mobile.jpg'));
      } else {
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'budgetExpress-bg.jpg'));
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg.jpg'));
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg-blurred.jpg'));
      }
    }

    $q.all(whatToWait).then(function () {
      $rootScope.$pageFinishedLoading = true;
    });

    $timeout(function () {
      if (!$rootScope.$pageFinishedLoading) {
        $rootScope.$pageFinishedLoading = true;
      }
    }); //, 7000);

    $rootScope.$watch('$activeLoadingPage', (newVal, oldVal) => {
        if (newVal !== oldVal && newVal) {
            const element = angular.element('.loader-content');
            if (!element.hasClass('loader-content-block')) {
                element.addClass('loader-content-block');
            }
        }
    });

    $rootScope.$baSidebarService = baSidebarService;
  }

})();
