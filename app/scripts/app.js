'use strict';

angular.module('cirqlApp', [
    'ionic',
    'config',
    'simpleLogin',
    'firebase.utils',
    'ngStorage',
    'pascalprecht.translate',
    'ng.deviceDetector',
    'ngCordova',
    'highcharts-ng'
])

.run(function($ionicPlatform, deviceDetector, $ionicLoading, simpleLogin, fbutil, $translate, $rootScope, $cordovaSplashscreen, $cordovaGeolocation, $timeout, $state, geo, $window) {

    $ionicPlatform.ready(function() {

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)

        if (window.screen.hasOwnProperty('lockOrientation')) {
            window.screen.lockOrientation('portrait');
        }

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }

        // if (window.plugins && window.plugins.DGGeofencing) {
        //     console.log('Radshag Geofencing plugin for IOS is available');
        // }

        // if (window.geofence) {
        //     console.log('Cowbell Geofencing plugin for Android is available');
        // }

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

        fbutil.ref('.info/connected').on('value', function(snap) {
            if (snap.val() !== true) {
                console.log('Firebase connection lost. Re-establish connection...');
                $window.Firebase.goOnline();
            }
        });


        function checkFirebaseConnection() {
            console.log(' Check Firebase Connection '); 
            fbutil.ref('.info/connected').once('value', function(snap) {
                if (snap.val() !== true) {
                    console.log('Firebase connection lost. Re-establish connection...');
                    $window.Firebase.goOnline();
                }
                else {
                    console.log('Firebase connection seems to be still active ' + snap.val());
                }
            });


        }


        function alertDismissed() {}

        $rootScope.getLocationAndCheckPermission = function() {
            console.log('GetLocationAndCheckPermission  is called');
            if (deviceDetector.os === 'ios' || deviceDetector.os === 'android') {
                var posOptions = {
                    timeout: 10000,
                    enableHighAccuracy: false
                };
                simpleLogin.getUser().then(function(user) {
                    if (user !== null && user !== undefined) {
                        if (user.uid !== null && user.uid !== undefined) {
                            if (user.residentId !== null && user.residentId !== undefined && user.residentId !== 'undefined') {
                                fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/allowsGeolocation').once('value', function(fbAllowsGeo) {
                                    if (fbAllowsGeo.val() === true) {
                                        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {

                                                $rootScope.geoPermission = true;
                                                var lat = position.coords.latitude;
                                                var long = position.coords.longitude;
                                                var currDate = new Date();
                                                currDate = currDate + '';
                                                //console.log('Current position is: ' + lat + ' and ' + long);

                                                fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocationByUser').set({
                                                    lat: lat,
                                                    lng: long,
                                                    date: currDate
                                                });

                                            },
                                            function(err) {
                                                console.log('Cordova Geolocation failed with error code: ' + err.code + ' and message: ' + err.message);
                                                if (err.code === 1) {
                                                    $rootScope.geoPermission = false;
                                                    navigator.notification.alert(
                                                        'Bitte erlaube Cirql die Standortdienste zu nutzen oder schalte die Abwesenheitserkennung in den Benutzereinstellungen aus', // message
                                                        alertDismissed, // callback
                                                        'Cirql', // title
                                                        'OK' // buttonName
                                                    );
                                                } else {
                                                    $rootScope.geoPermission = true;
                                                }

                                            });
                                        if ($rootScope.geoInitialized !== true) {
                                            geo.init();
                                        }
                                    }

                                });
                            }

                        }
                    }

                });
            }
        };


        $timeout($rootScope.getLocationAndCheckPermission, 3000);

        //getLocationAndCheckPermission()

        $ionicPlatform.on('resume', function() {

            checkFirebaseConnection();
            $rootScope.getLocationAndCheckPermission();
        });

    });
});