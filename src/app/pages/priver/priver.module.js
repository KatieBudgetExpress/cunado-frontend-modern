(function () {
  'use strict';

  angular.module('i2sFinance.priver', [
    'ui.router',
    'i2sFinance.priver.dashboard',
    'i2sFinance.priver.budgetCalendrier',
    'i2sFinance.priver.profile',
    'i2sFinance.priver.transaction',
    'i2sFinance.priver.conciliation',
    'i2sFinance.priver.analyse',
    'i2sFinance.priver.operation.compte',
    'i2sFinance.priver.operation.credit',
    'i2sFinance.priver.operation.depense',
    'i2sFinance.priver.operation.epargne',
    'i2sFinance.priver.operation.pret',
    'i2sFinance.priver.operation.revenu',
    'i2sFinance.priver.sousPosteBudgetaire',
    'i2sFinance.priver.posteBudgetaire',
    'i2sFinance.priver.copiebudget',
    'i2sFinance.priver.assistant',
    'i2sFinance.priver.banque'
  ])

  .config(routeConfig);

  /** @ngInject */
  function routeConfig($urlRouterProvider, baSidebarServiceProvider) {

    baSidebarServiceProvider.addStaticItem({
        title: 'Operation',
        icon: 'ion-calculator',
        menuTitle: 'GLOBALE.MENU_OPERATION',
        subMenu: [
            {
                title: 'Revenu',
                stateRef: 'priver.operationRevenu',
                fixedHref: "#!/revenu/1",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_REVENU'
            },
            {
                title: 'Depense',
                stateRef: 'priver.operationDepense',
                fixedHref: "#!/depense/2",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_DEPENSE'
            },
            {
                title: 'Compte',
                stateRef: 'priver.operationCompte',
                fixedHref: "#!/compte/3",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_COMPTE'
            },
            {
                title: 'Credit',
                stateRef: 'priver.operationCredit',
                fixedHref: "#!/credit/6",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_CREDIT'
            },
            {
                title: 'Epargne',
                stateRef: 'priver.operationEpargne',
                fixedHref: "#!/epargne/4",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_EPARGNE'
            },
            {
                title: 'Pret',
                stateRef: 'priver.operationPret',
                fixedHref: "#!/pret/5",
                menuTitle: 'ECRAN.TRANSACTION.TITRE_TRS_PRET'
            }
        ]
    });

    baSidebarServiceProvider.addStaticItem({
        title: 'Conciliation',
        icon: 'fa fa-check-square-o',
        stateRef: 'priver.conciliation',
        menuTitle: 'ECRAN.CONCILIATION.TITRE_MENU'
    });

    baSidebarServiceProvider.addStaticItem({
        title: 'Analyse',
        icon: 'fa fa-bar-chart',
        stateRef: 'priver.analyse',
        menuTitle: 'ECRAN.ANALYSE.TITRE_MENU'
    });

  }

})();
