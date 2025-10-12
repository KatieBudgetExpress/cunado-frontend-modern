/**
 * @author Maxime Gagnon
 *
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.theme')
        .service('printer', printerService);

    /** @ngInject */
    function printerService($window) {
        const TIMER = 300;

        return function (elementHtml) {
            const ele = document.createElement('IFRAME');
            ele.domain = document.domain;
            ele.style.position = "absolute";
            ele.style.top = "-10000px";
            document.body.appendChild(ele);
            ele.contentDocument.write(elementHtml);
            setTimeout(function () {
                ele.focus();
                ele.contentWindow.print();
                ele.parentNode.removeChild(ele);
            }, TIMER);
            $window.focus();
        }
    }


})();
