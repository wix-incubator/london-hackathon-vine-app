'use strict';

angular.module('vineApp')
  .directive('metavideo', function () {
    return {
        templateUrl: '/views/metaVideo.html',
        restrict: 'E',
        link: function(scope, elem, attrs) {
        }
    };
  });
