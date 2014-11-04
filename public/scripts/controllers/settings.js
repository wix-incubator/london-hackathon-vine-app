'use strict';

angular.module('vineApp')
  .controller('SettingsCtrl', function ($scope, $sce, Wixservice) {
      Wixservice.uiLibInit({});
  });
