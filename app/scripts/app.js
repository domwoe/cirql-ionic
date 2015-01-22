'use strict';

angular.module('cirqlApp', [
    'ionic',
    'config',
    'simpleLogin',
    'changeEmail',
    'firebase.utils',
    'ngStorage',
    'pascalprecht.translate',
    'nsPopover',
    'ngCordova'
])

.run(function($ionicPlatform, $ionicLoading, $translate, $rootScope) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        // 
        $rootScope.isGeoStarted = false;
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

    
        if (window.plugins && window.plugins.DGGeofencing) {
            console.log('Geofencing plugin available');
        }
            
     //        geo.init()

     //        geo.monitorRegion();

     //        geo.startMonitoringSignificantLocationChanges();
     //  }

        if (typeof navigator.globalization !== 'undefined') {
            navigator.globalization.getPreferredLanguage(function(language) {
                $translate.use((language.value).split('-')[0]).then(function(data) {
                    console.log('SUCCESS -> ' +  data);
                }, function(error) {
                    console.log('ERROR -> ' + error);
                });
            }, null);
        }

        function showOffline() {
            console.log('Offline');
            $ionicLoading.show({
                template: '{{"OFFLINE" | translate}}...<div class="sk-spinner sk-spinner-circle">' +
                    '<div class="sk-circle1 sk-circle"></div>' +
                    '<div class="sk-circle2 sk-circle"></div>' +
                    '<div class="sk-circle3 sk-circle"></div>' +
                    '<div class="sk-circle4 sk-circle"></div>' +
                    '<div class="sk-circle5 sk-circle"></div>' +
                    '<div class="sk-circle6 sk-circle"></div>' +
                    '<div class="sk-circle7 sk-circle"></div>' +
                    '<div class="sk-circle8 sk-circle"></div>' +
                    '<div class="sk-circle9 sk-circle"></div>' +
                    '<div class="sk-circle10 sk-circle"></div>' +
                    '<div class="sk-circle11 sk-circle"></div>' +
                    '<div class="sk-circle12 sk-circle"></div>' +
                    '</div>'
            });
        }

        function hideOffline() {
            console.log('Online');
            $ionicLoading.hide();
        }


        document.addEventListener('offline', showOffline, false);
        document.addEventListener('online', hideOffline, false);

        $ionicPlatform.on('offline', showOffline);


        $ionicPlatform.on('online', hideOffline);


    });
});