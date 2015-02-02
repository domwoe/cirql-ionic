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
    'ng.deviceDetector',
    'ngCordova'
])

.run(function($ionicPlatform, $ionicLoading, $translate, $rootScope, $cordovaSplashscreen, $timeout, $state) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        // 


        if (window.screen.hasOwnProperty('lockOrientation')) {
            window.screen.lockOrientation('portrait');
        }

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }


        if (window.plugins && window.plugins.DGGeofencing) {
            console.log('Radshag Geofencing plugin for IOS is available');
        }

         if (window.geofence) {
            console.log('Cowbell Geofencing plugin for Android is available');
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

        $rootScope.splashTimeout = $timeout(function() {
            $cordovaSplashscreen.hide();
        }, 1000);

        $state.go('app.home');

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