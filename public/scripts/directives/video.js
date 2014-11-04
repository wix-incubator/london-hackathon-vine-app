'use strict';

angular.module('vineApp')
  .directive('vinevideo', function ($location) {
    return {
      templateUrl: '/views/video.html',
      restrict: 'E',
        link: function(scope, elem, attrs) {
            if(!_.isUndefined(attrs.meta)){
                scope.showMetaTop = true;
            }
            scope.fullPage = function(video) {
              $location.path('/video/' + video.id);              
            }
        }
    };
  });
