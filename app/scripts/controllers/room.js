'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

    .controller('RoomCtrl', ['$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$rootScope',
        function($scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $rootScope) {

            if (window.screen.hasOwnProperty('lockOrientation')) {
                window.screen.lockOrientation('portrait');
            }

            var room = $stateParams.roomId;
            var homeUrl = 'homes/' + user.uid;
            var roomUrl = homeUrl + '/rooms/' + room;
            var modeUrl = homeUrl + '/rooms/' + room + '/mode';
            var sensorUrl = roomUrl + '/sensors/netatmo';
            var trvUrl = roomUrl + '/thermostats';

            var roomObj = fbutil.syncObject(roomUrl);
            roomObj.$bindTo($scope, 'roomValues');

            var trvObj = fbutil.syncObject(trvUrl);

            $scope.hasThermostats = null;

            trvObj.$loaded(function(trvs) {
                console.log(trvs);
                if (trvs.hasOwnProperty('$value') && trvs.$value === null) {
                    $scope.hasThermostats = false;
                    console.log($scope.hasThermostats);
                }
                else {

                    $scope.hasThermostats = true;
                    console.log($scope.hasThermostats);

                }
            });


            var modeIndex = null;

        
            /**
             * Return index for mode slide box
             * @param  {string} mode auto/manu
             * @return {int}    index of slide
             */
            $scope.modeToIndex = function(mode) {
                if (mode === 'auto' ) {
                    return modeIndex || 0;
                }
                else {
                    return modeIndex || 1;
                }
            };

            /**
             * Change mode in Firebase based on mode
             * slide box index
             * @param  {int}  index of slide
             */
            $scope.changeMode = function($index) {
                modeIndex = $index;

                if ($index % 2 === 0) {
                    $scope.roomValues.mode = 'auto';
                }
                else {
                    $scope.roomValues.mode = 'manu';
                }
            }

           

            var sensorObj = fbutil.syncObject(sensorUrl);
            $scope.hasRoomclimate = false;


            sensorObj.$loaded()
                .then(function() {
                    console.log(sensorObj)
                    if (sensorObj.hasOwnProperty('station')) {
                        $scope.hasRoomclimate = true;
                    }
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


            $scope.roomId = room;
            $scope.user = user;
            $scope.logout = simpleLogin.logout;
            $scope.min = 10;
            $scope.max = 28;
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