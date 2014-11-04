'use strict';

angular.module('vineApp')
  .controller('PopularCtrl', function ($scope, $sce, $routeParams, Popular, DataService) {
    Popular.query({size: $routeParams.size || 4}, function (data) {
      var videos = data;
      _.each(videos, function (video) {
        video.videoUrl = $sce.trustAsResourceUrl(video.videoUrl);
        video.avatarUrl = $sce.trustAsResourceUrl(video.avatarUrl);
      })
      $scope.videos = videos;
      DataService.videos = videos;
    });
  });
