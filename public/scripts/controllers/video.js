'use strict';

angular.module('vineApp')
    .controller('VideoCtrl', function ($scope, $routeParams, $sce, $timeout, $location, Video, DataService, Wixservice, config) {
        $scope.video = _.find(DataService.videos, function (video) {
            return video.id === $routeParams.id
        });

        if (_.isUndefined($scope.video)) {
            Video.get({videoId: $routeParams.id}, function (video) {
                video.videoUrl = $sce.trustAsResourceUrl(video.videoUrl);
                video.avatarUrl = $sce.trustAsResourceUrl(video.avatarUrl);
                $scope.video = video;

                if(!config.standAlone){
                    Wixservice.setHeight($("body[ng-app='vineApp']").height() + 20);
                }
            });
        } else {
            if(!config.standAlone){
                $timeout(function () {
                    Wixservice.setHeight($("body[ng-app='vineApp']").height() + 20);
                }, 3000);
            }
        }

        $scope.back = function () {
            $location.path('/search/' + DataService.keyword + '/' + DataService.size);
        }
    });
