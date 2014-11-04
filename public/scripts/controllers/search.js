'use strict';

angular.module('vineApp')
  .controller('SearchCtrl', function ($scope, $routeParams, $sce, Wixservice, Video, DataService, Search, config) {
        var keyword = $routeParams.q || config.query;
        var size = $routeParams.size || config.size;
        if(!config.standAlone){
            Wixservice.addEventListener(Wix.Events.STATE_CHANGED, function (data) {
                debugger;

            });
        }
        $scope.keyword = keyword + ": getting " +  size + " results";
        Search.query({term: keyword, size: size}, function(data){
            var videos = data;
            _.each(videos, function (video) {
                video.videoUrl = $sce.trustAsResourceUrl(video.videoUrl);
                video.avatarUrl = $sce.trustAsResourceUrl(video.avatarUrl);
            })
            $scope.videos = videos;
            DataService.videos = videos;
            $scope.keyword = keyword + ": showing " + size + " results";
        });
  });
