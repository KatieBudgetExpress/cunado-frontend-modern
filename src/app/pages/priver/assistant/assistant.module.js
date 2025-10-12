/**
 * @author S.Lizotte
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.priver.assistant', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider.state('priver.assistant', {
            url: '/assistant',
            title: 'Assistant',
            views: {
                content: {
                    templateUrl: 'app/pages/priver/assistant/assistant.html',
                    controller: 'AssistantCtrl',
                    controllerAs: 'vm'
                }
            },
            data: {
                      pageTitle: 'ECRAN.ASSISTANT.TITRE',
                      urlHelp: 'assistant'
                  }
        });
    }

})();
