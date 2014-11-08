'use strict';

angular.module('vineApp')
    .controller('MainCtrl', function ($scope, $window, $sce, $routeParams, $timeout, Wixservice, DataService, config, Search, FirebaseService) {
        $scope.search = function (q) {
            var keyword = q || config.query;
            if(!config.standAlone){
                Wixservice.getStyleParam('numbers', 'numberOfVideos', function(size) {
                    doSearch(keyword, size);
                });
            } else {
                doSearch(keyword, config.size || 6);
            }
        };

        var doSearch = function (keyword, size) {
            $scope.keyword = keyword + ": getting " + size + " results";
            Search.query({term: keyword, size: size}, function (data) {
                var videos = data;
                _.each(videos, function (video) {
                    video.videoUrl = $sce.trustAsResourceUrl(video.videoUrl);
                    video.avatarUrl = $sce.trustAsResourceUrl(video.avatarUrl);
                });
                $scope.videos = videos;
                DataService.videos = videos;
                DataService.keyword = keyword;
                DataService.size = size;
                $scope.keyword = keyword + ": showing " + size + " results";
                $scope.height = $window.innerHeight;


                if(!config.standAlone){
                    $timeout(function () {
                        Wixservice.setHeight($("body[ng-app='vineApp']").height() + 20);
                    }, 3000);
                }
            });
        };

        if ($routeParams.q) {
            $scope.search($routeParams.q);
        } else {
            FirebaseService.get('keyword', function(value) {
                $scope.search(value);
            });
        }
    });