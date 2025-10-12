/**
 * Created by k.danovsky on 13.05.2016.
 */

(function () {
  'use strict';

  var basic = {
    default: '#ffffff',
    defaultText: '#666666',
    border: '#dddddd',
    borderDark: '#aaaaaa',
  };

  // main functional color scheme
  var colorScheme = {
    primary: '#36878F',
    info: '#2dacd1',
    success: '#90b900',
    warning: '#dfb81c',
    danger: '#e85656',
  };

  // dashboard colors for charts
  var dashboardColors = {
    blueStone: '#005562',
    surfieGreen: '#0e8174',
    silverTree: '#6eba8c',
    gossip: '#b9f2a1',
    white: '#10c4b5',
    blue: '#3C3CFF'
  };

  // Couleurs par catégorie
  var categorieColors = {
    rev: '#015562',
    dep: '#191970',
    cpt: '#36878F',
    epa: '#90B900',
    pre: '#805BBB',
    cre: '#DD4B39'
  };

  var fluxColors = {
    c1: '#015562',
    c2: '#DD4B39',
    c3: '#90B900',
    c4: '#805BBB',
    c5: '#191970',
    c6: '#36878F'
  };

  angular.module('i2sFinance.theme')
    .provider('baConfig', configProvider);

  /** @ngInject */
  function configProvider(colorHelper) {
    var conf = {
      theme: {
        blur: false,
      },
      colors: {
        default: basic.default,
        defaultText: basic.defaultText,
        border: basic.border,
        borderDark: basic.borderDark,

        primary: colorScheme.primary,
        info: colorScheme.info,
        success: colorScheme.success,
        warning: colorScheme.warning,
        danger: colorScheme.danger,

        primaryLight: colorHelper.tint(colorScheme.primary, 30),
        infoLight: colorHelper.tint(colorScheme.info, 30),
        successLight: colorHelper.tint(colorScheme.success, 30),
        warningLight: colorHelper.tint(colorScheme.warning, 30),
        dangerLight: colorHelper.tint(colorScheme.danger, 30),

        primaryDark: colorHelper.shade(colorScheme.primary, 15),
        infoDark: colorHelper.shade(colorScheme.info, 15),
        successDark: colorHelper.shade(colorScheme.success, 15),
        warningDark: colorHelper.shade(colorScheme.warning, 15),
        dangerDark: colorHelper.shade(colorScheme.danger, 15),

        dashboard: {
          blueStone: dashboardColors.blueStone,
          surfieGreen: dashboardColors.surfieGreen,
          silverTree: dashboardColors.silverTree,
          gossip: dashboardColors.gossip,
          white: dashboardColors.white,
        },

        categorie: {
          rev: categorieColors.rev,
          dep: categorieColors.dep,
          cpt: categorieColors.cpt,
          epa: categorieColors.epa,
          pre: categorieColors.pre,
          cre: categorieColors.cre
        },

        flux: {
          c1: fluxColors.c1,
          c2: fluxColors.c2,
          c3: fluxColors.c3,
          c4: fluxColors.c4,
          c5: fluxColors.c5,
          c6: fluxColors.c6
        }
      }
    };

    conf.changeTheme = function(theme) {
      angular.merge(conf.theme, theme)
    };

    conf.changeColors = function(colors) {
      angular.merge(conf.colors, colors)
    };

    conf.$get = function () {
      delete conf.$get;
      return conf;
    };
    return conf;
  }
})();
