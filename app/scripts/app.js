'use strict';

angular.module('cirqlApp', [
    'ionic',
    'config',
    'simpleLogin',
    'firebase.utils',
    'ngStorage',
    'pascalprecht.translate'
])

.run(function($ionicPlatform, $translate, discovery, geo) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

    
     if (window.plugins && window.plugins.DGGeofencing) {
            
            geo.init()

            geo.monitorRegion();

            geo.startMonitoringSignificantLocationChanges();
      }

        if (typeof navigator.globalization !== 'undefined') {
            navigator.globalization.getPreferredLanguage(function(language) {
                $translate.use((language.value).split('-')[0]).then(function(data) {
                    console.log('SUCCESS -> ' + data);
                }, function(error) {
                    console.log('ERROR -> ' + error);
                });
            }, null);
        }


    });
});