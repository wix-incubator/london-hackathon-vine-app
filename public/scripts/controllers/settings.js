'use strict';

angular.module('vineApp')
    .controller('SettingsCtrl', function ($scope, $sce, Wixservice, FirebaseService) {
       FirebaseService.get('keyword', function(value) {
            Wixservice.uiLibInit({
                keyword: value
            });
        });
        
        $scope.save = function () {
            FirebaseService.set('keyword');
            Wix.Settings.refreshAppByCompIds(Wix.Utils.getOrigCompId());
        };
    });
