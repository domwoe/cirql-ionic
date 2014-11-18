'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('HomeCtrl', ['$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$cordovaBackgroundGeolocation',
        function($scope, user, simpleLogin, fbutil, $state, $cordovaBackgroundGeolocation) {


            $scope.user = user;

            $scope.min = 0;
            $scope.max = 30;
            $scope.stroke = 12;
            $scope.radius = 110;
            $scope.currentColor = '#FFFFFF';
            $scope.bgColor = '#000000';

            $scope.goToRoom = function(room) {
                $state.go('app.room', {
                    roomId: room
                }, {
                    reload: true
                });
            };

            var fbLocation = fbutil.syncArray('homes/' + user.uid + '/location');

            var options = {
                url: 'http://only.for.android.com/update_location.json', // <-- Android ONLY:  your server url to send locations to
                params: {
                    auth_token: 'user_secret_auth_token', //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
                    foo: 'bar' //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
                },
                headers: { // <-- Android ONLY:  Optional HTTP headers sent to your configured #url when persisting locations
                    "X-Foo": "BAR"
                },
                desiredAccuracy: 100,
                stationaryRadius: 100,
                distanceFilter: 30,
                notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
                notificationText: 'ENABLED', // <-- android only, customize the text of the notification
                activityType: 'AutomotiveNavigation',
                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
                stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
            };

            // `configure` calls `start` internally
            // $cordovaBackgroundGeolocation.configure(options).then(function(location) {
            //     fbLocation.$add(location);
            //     console.log(location);
            // }, function(err) {
            //     console.error(err);
            // });

            $scope.stopBackgroundGeolocation = function() {
                $cordovaBackgroundGeolocation.stop();
            };

            $scope.startBackgroundGeolocation = function() {
                $cordovaBackgroundGeolocation.start();
            };


            function loadHome(user) {
                if ($scope.home) {
                    $scope.home.$destroy();
                }
                // var home = fbutil.syncObject('homes/'+user.uid);
                // home.$bindTo($scope, 'home');

                var rooms = fbutil.syncArray('homes/' + user.uid + '/rooms');
                $scope.rooms = rooms;

                // var residents = fbutil.syncArray('homes/'+user.uid+'/residents');
                // $scope.residents = residents;

                // console.log("home data loaded for user", user.uid);
                // console.log("home", home);
                // console.log("rooms", rooms);
                // console.log("residents", residents);
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
        }
    ]);