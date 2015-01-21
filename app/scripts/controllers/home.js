'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('HomeCtrl', ['$rootScope', '$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$ionicLoading', 'geo', 'datePicker', '$ionicNavBarDelegate','$timeout','$cordovaSplashscreen','roomDetailService',
        function($rootScope, $scope, user, simpleLogin, fbutil, $state, $ionicLoading, geo, datePicker, $ionicNavBarDelegate,$timeout,$cordovaSplashscreen,roomDetailService) {

            $scope.finishedloading = false;

            if (window.screen.hasOwnProperty('lockOrientation')) {
                window.screen.lockOrientation('portrait');
            }

            // $ionicLoading.show({
            //     templateUrl: 'loading.html'
            // });

            if (user) {
                $scope.user = user;
                // redirect to select resident if not set
                if (!user.residentId) {
                    $state.go('app.resident');
                    console.log('go to resident');
                }
                else {
                    console.log('Home')
                    
                }
                // redirect to login if no user available
            } else {
                $state.go('login');
                console.log('go to login');
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
                // var home = fbutil.syncObject('homes/' + user.uid);
                // $scope.home = home;

                var rooms = fbutil.syncArray('homes/' + user.uid + '/rooms');
                $scope.rooms = rooms;

                var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
                $scope.residents = residents;

                rooms.$loaded().then(function() {
                    if (navigator.splashscreen) {
                        $timeout(function() {
                            $cordovaSplashscreen.hide();
                        },100);
                    }
                });

                if (user.uid !== null && user.uid !== undefined) {
                    if (user.residentId !== null && user.residentId !== undefined && user.residentId !== 'undefined') {
                        //if (!$rootScope.isGeoStarted) {
                            console.log('trigger geolocation service');
                            if (window.plugins && window.plugins.DGGeofencing) {

                                geo.init()

                                geo.monitorRegion();

                                geo.startMonitoringSignificantLocationChanges();

                                $rootScope.isGeoStarted = true;
                            }
                        //}
                        else {
                            console.log('Geolocation service already started');
                        }    
                    } else {
                        console.log('user.residentId is not nto found');
                    }
                } else {
                    console.log('user.uid is not nto found');
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

            // $scope.showDatePicker = function() {
            //     var options = {
            //         date: new Date(),
            //         mode: 'date'
            //     };
            //     //var options = {date: new Date(), mode: 'time'}; for time
            //     //
            //     datePicker.show(options).then(function(date) {
            //         alert(date);
            //     });
            // };

            $scope.goBack = function() {
                $ionicNavBarDelegate.back();
            };

            $scope.saveHome = function(home) {
                home.$save();
                $state.go('app.home');
            };
        }
    ]);
