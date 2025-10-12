/**
 * @author Maxime Gagnon
 *
 *
 */
(function () {
    'use strict';

    angular.module('i2sFinance.theme')
        .service('cuExportExcel', printerService);

    /** @ngInject */
    function printerService() {

        return function (elementHtml, name, ignoreRows, ignoreCols) {
          /*
          new TableExport(DefaultTable, {
              headers: true,                              // (Boolean), display table headers (th or td elements) in the <thead>, (default: true)
              footers: true,                              // (Boolean), display table footers (th or td elements) in the <tfoot>, (default: false)
              formats: ['xlsx', 'csv', 'txt'],            // (String[]), filetype(s) for the export, (default: ['xlsx', 'csv', 'txt'])
              filename: 'id',                             // (id, String), filename for the downloaded file, (default: 'id')
              bootstrap: false,                           // (Boolean), style buttons using bootstrap, (default: false)
              position: 'bottom',                         // (top, bottom), position of the caption element relative to table, (default: 'bottom')
              ignoreRows: null,                           // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
              ignoreCols: null,                           // (Number, Number[]), column indices to exclude from the exported file(s) (default: null)
              ignoreCSS: '.tableexport-ignore',           // (selector, selector[]), selector(s) to exclude cells from the exported file(s) (default: '.tableexport-ignore')
              emptyCSS: '.tableexport-empty',             // (selector, selector[]), selector(s) to replace cells with an empty string in the exported file(s) (default: '.tableexport-empty')
              trimWhitespace: true                        // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: true)
          });
          */
            const instance = new TableExport(elementHtml, {
                formats: ['xlsx'],
                exportButtons: false,        // (top, bottom), position of the caption element relative to table, (default: 'bottom')
                ignoreRows: ignoreRows,             // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
                ignoreCols: ignoreCols,
                trimWhitespace: true
            });
            /* default charset encoding (UTF-8) */
            $.fn.tableExport.charset = "charset=utf-8";

            const exportData = instance.getExportData()['zoneImprimable']['xlsx'];
            instance.export2file(exportData.data, exportData.mimeType, name, exportData.fileExtension);
        };
    }


})();
