'use strict';

angular.module('vineApp')
    .service('Wixservice', function Wixservice() {
        return {
            setHeight: function (height) {
                Wix.setHeight(height);
            },
            pushState: function (state) {
                Wix.pushState(state);
            },
            uiLibInit: function (obj) {
                Wix.UI.initialize(obj);
            },
            addEventListener: function (name, callback) {
                Wix.addEventListener(name, callback);
            },
            getStyleParam: function (type, key, callback) {
                var type = type;
                var key = key;
                Wix.Styles.getStyleParams(function (data) {
                    if (data && data[type] && data[type][key]) {
                        callback(data[type][key])
                    } else {
                        callback(6);
                    }
                });
            },
            get: function (val) {
                return Wix.UI.get(val);
            }
        };
    });
