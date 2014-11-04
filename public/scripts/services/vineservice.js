'use strict';
var services = angular.module('vineApp.services', ['ngResource']);

services.factory('Search', ['$http', '$resource', function($http, $resource){
    return $resource('/vine/search/:term/:size');
}]);

services.factory('Popular', ['$http', '$resource', function($http, $resource){
    return $resource('/vine/popular/:size');
}]);

services.factory('Video', ['$http', '$resource', function($http, $resource){
    return $resource('/vine/:videoId');
}]);

services.factory('DataService', function () {
    return {};
});