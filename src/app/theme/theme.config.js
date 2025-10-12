/**
 * Created by k.danovsky on 13.05.2016.
 */

(function () {
    'use strict';

    angular.module('i2sFinance.theme')
        .config(StateConfig$provide)
        .run(runApp);

    /** @ngInject */
    function StateConfig$provide($provide, $stateProvider) {
        $provide.decorator('$uiViewScroll', uiViewScrollDecorator);


        $stateProvider.state('static', {
            abstract: true,
            views: {
                pages: {
                    templateUrl: 'app/layouts/content-only/content-only.html'
                }
            }
        });
        $stateProvider.state('public', {
            abstract: true,
            views: {
                pages: {
                    templateUrl: 'app/layouts/content-only/content-only.html'
                }
            }
        });
        $stateProvider.state('priver', {
            abstract: true,
/*
            resolve: {
                user: function ($auth) {
                  debugger;
                    return $auth.getUser();
                }
            },
*/            
            views: {
                pages: {
                    templateUrl: 'app/layouts/vertical-navigation/vertical-navigation.html'

                }
            }
        });
        $stateProvider.state('admin', {
            abstract: true,
            views: {
                pages: {
                    templateUrl: 'app/layouts/vertical-navigation/vertical-navigation.html'

                }
            }
        });

    }

    /** @ngInject */
    function runApp($location) {
        $location.path('/auth');
    }


    /** @ngInject */
    function uiViewScrollDecorator($delegate, $anchorScroll, baUtil) {
        return function (uiViewElement) {
            if (baUtil.hasAttr(uiViewElement, "autoscroll-body-top")) {
                $anchorScroll();
            } else {
                $delegate(uiViewElement);
            }
        };
    }
})();
