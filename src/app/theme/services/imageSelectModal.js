/**
 * @author Sébastien Lizotte
 *
 * toastr.success('Your information has been saved successfully!');
 * toastr.info("You've got a new email!", 'Information');
 * toastr.error("Your information hasn't been saved!", 'Error');
 * toastr.warning('Your computer is about to explode!', 'Warning');
 *
 */
(function () {
  'use strict';

  angular.module('i2sFinance.theme')
  /*
     Ouvrir la fenêtre modale de sélection d'image. Voici les paramètres d'appel:

        okButton        Texte du bouton Ok
        cancelButton    Texte du bouton Annuler
        title           Titre de la fenêtre (Tooltip)
        imageCourante   Image actuelle
        typeMessage     Type de l'image actuelle
     */
    .service('imageSelectModal', ['$uibModal', function($uibModal) {
        return function (okButton, cancelButton, title, imageCourante, typeImageCourante) {
            // setup default values for buttons
            // if a button value is set to false, then that button won't be included
            okButton = okButton===false ? false : (okButton || 'Confirm');
            cancelButton = cancelButton===false ? false : (cancelButton || 'Cancel');

            // setup the Controller to watch the click
            var ModalInstanceCtrl = function ($scope, $filter, $uibModalInstance, settings, listeGlossyBusinessIcons) {

                $scope.currentPage = 0;
                $scope.pageSize = 48;
                $scope.typeGlossy = 'glossy';
                $scope.imagePath = "";
                $scope.imageSelect = "";
                $scope.typeImageSelect = "";

                if (typeof(settings.imageSelect) != "undefined") {
                  $scope.imageSelect = settings.imageSelect;
                  $scope.typeImageSelect = settings.typeImageSelect;
                }

                $scope.icons = {
                  glossyBusinessIcons: listeGlossyBusinessIcons
                };

                // add settings to scope
                angular.extend($scope, settings);

                // ok button clicked
                $scope.ok = function () {
                  $uibModalInstance.close({
                    source: $scope.imagePath,
                    image: $scope.imageSelect ,
                    typeImage: $scope.typeImageSelect
                  });
                };

                // cancel button clicked
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };

                // Sélectionne l'image
                $scope.selectionneImage = function (image, typeImage) {
                  if (typeImage == "glossy"){
                    $scope.imagePath = $filter('glossyBusinessImg')(image);
                  }
                  $scope.imageSelect = image;
                  $scope.typeImageSelect = typeImage;
                };

                $scope.numberOfPages=function(){
                    return Math.ceil($scope.icons.glossyBusinessIcons.length/$scope.pageSize);
                }
            };

            // open modal and return the instance (which will resolve the promise on ok/cancel clicks)
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: false,
                size: 'md', //Grandeur de la fenêtre ('md','lg','sm')
                template: '<div class="modal-content"> \
                    <div class="modal-header"> \
                      <button ng-attr-type="button" class="close" ng-click="$dismiss()" aria-label="Close"> \
                        <em class="ion-ios-close-empty sn-link-close"></em> \
                      </button> \
                      <h4 class="modal-title">{{modalTitle}}</h4> \
                      <center><img ng-src="{{ imageSelect | glossyBusinessImg }}" style="width:48px; height:48px; margin-top:20px; border-radius:5px; border:solid 2px #787878;" ng-if="imageSelect && typeImageSelect==typeGlossy"></center> \
                    </div> \
                    <div class="modal-body" style="padding: 15px 10px 150px 0px;"> \
                      <div ng-repeat="icon in icons.glossyBusinessIcons | paginationDepart:currentPage*pageSize | limitTo:pageSize"> \
                        <div class="col-md-1"><a href=""><img ng-src="{{:: (icon.img | glossyBusinessImg )}}" ng-click="selectionneImage(icon.img, typeGlossy)" ng-style="{ width: 30, height: 30 }"></a></div> \
                      </div> \
                      <span style="padding-bottom:20px;"></span>\
                    </div> \
                    <div class="modal-footer"> \
                    <center>\
                      <button class="btn btn-primary btn-xs" ng-disabled="currentPage == 0" ng-click="currentPage=currentPage-1"><\
                      </button>&nbsp;&nbsp;{{currentPage+1}}/{{numberOfPages()}}\
                      <button class="btn btn-primary btn-xs" ng-disabled="currentPage >= icons.glossyBusinessIcons.length/pageSize - 1" ng-click="currentPage=currentPage+1">>\
                      </button> \
                    </center> \
                    <span style="padding-bottom:40px;"></span>\
                        <button class="btn btn-primary" ng-click="ok()" ng-show="okButton">{{okButton}}</button> \
                        <button class="btn btn-default" ng-click="cancel()" ng-show="cancelButton">{{cancelButton}}</button> \
                    </div> \
                </div>',
                controller: ModalInstanceCtrl,
                resolve: {
                    settings: function() {
                        return {
                            modalTitle: title,
                            modalBody: "",
                            imageSelect: imageCourante,
                            typeImageSelect: typeImageCourante,
                            okButton: okButton,
                            cancelButton: cancelButton
                        };
                    }
                }
            });
            // return the modal instance
            return modalInstance;
        }
    }])
})();
