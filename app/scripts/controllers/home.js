'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('HomeCtrl', ['$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$ionicLoading', 'datePicker', '$ionicNavBarDelegate',
        function($scope, user, simpleLogin, fbutil, $state, $ionicLoading, datePicker, $ionicNavBarDelegate) {

            if (window.screen.hasOwnProperty('lockOrientation')) {
                window.screen.lockOrientation('portrait');
            }

            $ionicLoading.show({
                template: '{{"LOADING" | translate}}...<div class="sk-spinner sk-spinner-circle">' +
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

            if (user) {
                $scope.user = user;
                // redirect to select resident if not set
                if (!user.residentId) {
                    $state.go('app.resident');
                }
                // redirect to login if no user available
            } else {
                $state.go('login');
            }


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

            function loadHome(user) {
                // var home = fbutil.syncObject('homes/' + user.uid);
                // $scope.home = home;

                var rooms = fbutil.syncArray('homes/' + user.uid + '/rooms');
                $scope.rooms = rooms;

                var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
                $scope.residents = residents;

                rooms.$loaded().then(function() {
                    $ionicLoading.hide();
                });

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
