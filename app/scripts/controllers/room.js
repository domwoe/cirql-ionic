'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

    .controller('RoomCtrl', ['$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$rootScope', '$ionicSideMenuDelegate',
        function($scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $rootScope, $ionicSideMenuDelegate) {

            var room = $stateParams.roomId;
            var homeUrl = 'homes/' + user.uid;
            var roomUrl = homeUrl + '/rooms/' + room;
            var sensorUrl = roomUrl + '/sensors/netatmo';

            var roomObj = fbutil.syncObject(roomUrl);
            var sensorObj = fbutil.syncObject(sensorUrl);

            roomObj.$loaded().then(function() {
                roomObj.$bindTo($scope, 'roomValues');
            });

            sensorObj.$loaded()
                .then(function() {
                    var sensorStation = sensorObj.station;
                    var sensorModule = sensorObj.module;
                    var netatmoUrl = homeUrl + '/sensors/netatmo/stations/' +
                        sensorStation + '/modules/' + sensorModule;
                    var netatmoObj = fbutil.syncObject(netatmoUrl);
                    return netatmoObj;
                }).then(function(netatmoObj) {
                    netatmoObj.$loaded().then(function() {
                        netatmoObj.$bindTo($scope, 'sensor');
                    });
                });

            $scope.goToSchedule = function(room) {
                console.log("Render schedule for ", room);
                $state.go('app.schedule', {roomId: room});
            };

            $scope.changeMode = function(direction) {

            //     switch ($scope.roomValues.mode) {
            //         case 'schedule':
            //             if (direction === 'left') {
            //                 $scope.roomValues.mode = 'manual';
            //             } else {
            //                 $scope.roomValues.mode = 'autoaway';
            //             }
            //             break;

            //         case 'manual':
            //             if (direction === 'left') {
            //                 $scope.roomValues.mode = 'autoaway';
            //             } else {
            //                 $scope.roomValues.mode = 'schedule';
            //             }
            //             break;

            //         case 'autoaway':
            //             if (direction === 'left') {
            //                 $scope.roomValues.mode = 'schedule';
            //             } else {
            //                 $scope.roomValues.mode = 'manual';
            //             }
            //             break;

            //         default:
            //             break;
            //     }
            // };

            switch ($scope.roomValues.mode) {
                    case 'manu':
                        if (direction === 'left') {
                            $scope.roomValues.mode = 'auto';
                        } else {
                            $scope.roomValues.mode = 'auto';
                        }
                        break;

                    case 'auto':
                        if (direction === 'left') {
                            $scope.roomValues.mode = 'manu';
                        } else {
                            $scope.roomValues.mode = 'manu';
                        }
                        break;

                    default:
                        break;
                }
            };

            $scope.roomId = room;
            $scope.user = user;
            $scope.logout = simpleLogin.logout;
            $scope.min = 0;
            $scope.max = 30;
            $scope.stroke = 12;
            $scope.radius = 110;
            $scope.currentColor = '#FFFFFF';
            $scope.bgColor = '#000000';

            /**
             * Go back to home screen
             */
            $scope.goToHome = function() {
                $state.go('app.home', null, {reload: true});
            };

        }
    ]);