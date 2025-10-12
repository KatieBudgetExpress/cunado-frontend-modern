(function () {
    'use strict';

    angular.module('i2sFinance.resources.plaidResource', [])
        .factory('PlaidResource', PlaidResourceFactory);

    /* @ngInject */
    function PlaidResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: true};

        var actions = {
            createLinkToken: {
                method: 'GET',
                url: `${urlBasePriver}/plaid/createLinkToken`
            },
            exchangePublicToken: {
                method: 'POST',
                url: `${urlBasePriver}/plaid/exchangePublicToken`
            },
            getAccountBalance: {
                method: 'POST',
                url: `${urlBasePriver}/plaid/getAccountBalance`
            },
            getTransactions: {
                method: 'POST',
                url: `${urlBasePriver}/plaid/getTransactions`
            } 
        };
        return $resource(`${urlBasePriver}/plaid`, params, actions) ;
    }
})();
