'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('HomeCtrl', ['$rootScope', '$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$ionicLoading', 'deviceDetector',
        'geo', 'geo2', '$ionicNavBarDelegate', '$timeout', '$cordovaSplashscreen', '$ionicSideMenuDelegate', 'flurry','log',
        function($rootScope, $scope, user, simpleLogin, fbutil, $state, $ionicLoading, deviceDetector, geo, geo2, $ionicNavBarDelegate, $timeout, $cordovaSplashscreen, $ionicSideMenuDelegate, flurry,log) {

            $scope.finishedloading = false;

            if ($rootScope.flurry === true) {
                flurry.logPageView();
                flurry.logEvent('view', {
                    view: 'home'
                });
            }

            log.event({
                homeid: user.uid,
                residentid: user.residentId,
                type: 'view',
                view: 'home',
                roomid: null
            });

            $ionicSideMenuDelegate.canDragContent(true);

            if (window.screen.hasOwnProperty('lockOrientation')) {
                window.screen.lockOrientation('portrait');
            }
            if (user) {
                $scope.user = user;
                // redirect to select resident if not set
                if (!user.residentId) {
                    $state.go('app.resident');
                    console.log('go to resident');
                } else {


                }
                // redirect to login if no user available
            } else {
                console.log('go to login');
                $state.go('login');

            }

            $rootScope.$watch('splashTimeout', function(timeout) {
                //console.log('CANCEL SPLASH TIMEOUT');
                $timeout.cancel(timeout);
            });

            if ($rootScope.flurry !== true) {
                console.log('INIT FLURRY');
                var options = {
                    userId: user.residentId,
                    enableLogging: true, // defaults to false
                    enableEventLogging: true, // should every event show up the app's log, defaults to true
                    enableCrashReporting: true, // should app crashes be recorded in flurry, defaults to false, iOS only
                    enableBackgroundSessions: true, // should the session continue when the app is the background, defaults to false, iOS only
                    reportSessionsOnClose: true, // should data be pushed to flurry when the app closes, defaults to true, iOS only
                    reportSessionsOnPause: true // should data be pushed to flurry when the app is paused, defaults to true, iOS only
                };
                flurry.init(options).then(function(hasStarted) {
                    $rootScope.flurry = hasStarted;
                });
            }



            $ionicLoading.hide();

            $scope.min = 5;
            $scope.max = 30;
            $scope.stroke = 12;
            $scope.radius = 110;
            $scope.currentColor = '#FFFFFF';
            $scope.bgColor = '#000000';

            $scope.goToRoom = function(room) {

                $rootScope.room = room;
                // $ionicLoading.show({
                //     templateUrl: 'loading.html'
                // });
                $state.go('app.room', {
                    roomId: room
                }, {
                    reload: false
                });
            };

            function loadHome(user) {
                $scope.homeSettings = fbutil.syncObject('homes/' + user.uid + '/settings');

                $scope.rooms = fbutil.syncArray('homes/' + user.uid + '/rooms');

                //$scope.residents = fbutil.syncArray('homes/' + user.uid + '/residents');


                $scope.rooms.$loaded().then(function() {
                    if (navigator.splashscreen) {
                        $timeout(function() {
                            $cordovaSplashscreen.hide();
                        }, 500);
                    }
                });

                if (user.uid !== null && user.uid !== undefined) {
                    if (user.residentId !== null && user.residentId !== undefined && user.residentId !== 'undefined') {
                        //if (!$rootScope.isGeoStarted) {
                        if (deviceDetector.os === 'ios') {
                            console.log('trigger geolocation service for iOS');
                            if (window.plugins && window.plugins.DGGeofencing) {

                                geo.init();

                                geo.monitorRegion();

                                geo.startMonitoringSignificantLocationChanges();
                            }
                        } else if (deviceDetector.os === 'android') {
                            console.log('trigger geolocation service for Android');
                            if (window.geofence) {
                                geo2.init();

                                geo2.monitorRegion();
                            }
                        } else {
                            console.log('Othero OS: ' + deviceDetector.os);
                        }

                    } else {
                        console.log('user.residentId is not found');
                    }
                } else {
                    console.log('user.uid is not found');
                }
            }
            loadHome(user);

            $scope.changePassword = function(oldPass, newPass, confirm) {
                $scope.err = null;
                if (!oldPass || !newPass) {
                    error('Please enter all fields');
                } else if (newPass !== confirm) {
                    error('Passwords do not match');
                } else {
                    simpleLogin.changePassword(user.email, oldPass, newPass)
                        .then(function() {
                            success('Password changed');
                        }, error);
                }
            };

            $scope.changeEmail = function(pass, newEmail) {
                $scope.err = null;
                simpleLogin.changeEmail(pass, newEmail)
                    .then(function(user) {
                        loadHome(user);
                        success('Email changed');
                    })
                    .catch(error);
            };


            $scope.goBack = function() {
                $ionicNavBarDelegate.back();
            };

            $scope.saveHome = function(home) {
                home.$save();
                $state.go('app.home');
            };
        }
    ]);