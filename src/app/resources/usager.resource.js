(function () {
    'use strict';

    angular.module('i2sFinance.resources.usager', [])
        .factory('UsagerResource', UsagerResourceFactory);

    /* @ngInject */
    function UsagerResourceFactory($resource, urlBasePriver, urlBasePublic) {

        var params = {authen: false};

        /*
        * Site pour la doc : https://docs.angularjs.org/api/ngResource/service/$resource
        *
        * Fonction normal d'une resource
        * get = 1 donnée
        * save = un post ou put s'il détecte qu'il y a un id
        * query = toutes les données
        * remove = suppression
        * delete = suppression
        *
        * Methode:
        *
        *   'get':    {method: 'GET'},
        *   'save':   {method: 'POST'},
        *   'query':  {method: 'GET', isArray: true},
        *   'remove': {method: 'DELETE'},
        *   'delete': {method: 'DELETE'}
        *
        *   (les actions c'est si on veut ajouter d'autre méthode que ceux déjà existants)
        *
        *   *************************************
        *   * Exemple d'utilisation             *
        *   * -dataBody = données dans le body  *
        *   *************************************
        *   var data = {
                email: 'test@test221.com',
                password: 'lune13',
                password2: 'lune13'
            };

            UsagerResource.register(data).$promise
                .then((result) => {
                    console.log(result)
                })
                .catch(err=>err);
        */

        var actions = {
            getAll: {
                method: 'GET'
            },
            login: {
                method: 'POST',
                url: `${urlBasePublic}/loginUsager`
            },
            validate: {
                method: 'POST',
                url: `${urlBasePublic}/validateUsager`
            },
            register: {
                method: 'POST',
                url: `${urlBasePublic}/usager`
            },
            mpOublie: {
                method: 'POST',
                url: `${urlBasePublic}/mpOublie`
            }
        };
        return $resource(`${urlBasePriver}/usagers`, params, actions) ;

    }
})();
