'use strict';

angular.module('vineApp')
    .service('FirebaseService', function Wixservice(Wixservice) {
        var myFirebaseRef = new Firebase("https://blinding-fire-1325.firebaseio.com");
        return {
            set: function (key) {
                var value = {};
                value[key] = Wixservice.get(key);
                myFirebaseRef.set(value);
            },
            get: function (key, callback) {
                myFirebaseRef.child(key).on("value", function(snapshot) {
                    callback(snapshot.val());
                });
            }
        };
    });
