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
        'geo', 'geo2', '$timeout', '$cordovaSplashscreen', '$ionicSideMenuDelegate','log',
        function($rootScope, $scope, user, simpleLogin, fbutil, $state, $ionicLoading, deviceDetector, geo, geo2, $timeout, $cordovaSplashscreen, $ionicSideMenuDelegate,log) {

            $scope.finishedloading = false;

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
                            if (window.plugins && window.plugins.DGGeofencing) {
                                console.log('trigger geolocation service for iOS');

                                geo.init();

                                //geo.removeRegion();
                                geo.monitorRegion();

                                //geo.stopMonitoringSignificantLocationChanges();
                                geo.startMonitoringSignificantLocationChanges();
                            }
                        } else if (deviceDetector.os === 'android') {
                            if (window.geofence) {
                                console.log('trigger geolocation service for Android');

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

            $scope.saveHome = function(home) {
                home.$save();
                $state.go('app.home');
            };
        }
    ]);