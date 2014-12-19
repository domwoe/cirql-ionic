'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

.controller('RoomCtrl', ['$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$ionicPopover',
    function($scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $ionicPopover) {

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

        $scope.nextTargetDate = function(dateString) {
            return new Date(dateString);
        };    

        var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
        $scope.residents = residents;

        var templates = fbutil.syncArray('templates');
        $scope.categories = templates;

        var trvObj = fbutil.syncObject(trvUrl);

        $scope.hasThermostats = null;

        trvObj.$loaded(function(trvs) {
            console.log(trvs);
            if (trvs.hasOwnProperty('$value') && trvs.$value === null) {
                $scope.hasThermostats = false;
                console.log($scope.hasThermostats);
            } else {

                $scope.hasThermostats = true;
                console.log($scope.hasThermostats);

            }
        });

        $scope.showNextTarget = function() {

            return $scope.roomValues.mode === 'auto' && !($scope.roomValues.usesAutoAway && $scope.roomValues.isAway);

        }


        var modeIndex = null;


        /**
         * Return index for mode slide box
         * @param  {string} mode auto/manu
         * @return {int}    index of slide
         */
        $scope.modeToIndex = function(mode) {
            if (mode === 'auto') {
                return modeIndex || 0;
            } else {
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
            } else {
                $scope.roomValues.mode = 'manu';
            }
        }



        var sensorObj = fbutil.syncObject(sensorUrl);
        $scope.hasRoomclimate = false;


        sensorObj.$loaded()
            .then(function() {
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


        $ionicPopover.fromTemplateUrl('airquality.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.airQualityPopover = popover;
        });
        $scope.openAirQualityPopover = function($event) {
            $scope.airQualityPopover.show($event);
        };
        $scope.closeAirQualityPopover = function() {
            $scope.airQualityPopover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.airQualityPopover.remove();
        });

        $ionicPopover.fromTemplateUrl('humidity.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.humidityPopover = popover;
        });
        $scope.openHumidityPopover = function($event) {
            $scope.humidityPopover.show($event);
        };
        $scope.closeHumidityPopover = function() {
            $scope.humidityPopover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.humidityPopover.remove();
        });

        $scope.roomId = room;
        $scope.user = user;
        $scope.logout = simpleLogin.logout;
        $scope.min = 5;
        $scope.max = 30;
        $scope.stroke = 12;
        $scope.radius = 110;
        $scope.currentColor = '#FFFFFF';
        $scope.bgColor = '#000000';

        /**
         * Go back to home screen
         */
        $scope.goToHome = function() {
            $state.go('app.home', null, {
                reload: true
            });
        };

        $scope.isBoundResident = function(resident) {
            return resident.rooms[room]
        }

        $scope.toggleBoundResident = function(resident) {
            if (roomObj.residents === undefined) {
                roomObj.residents = {};
            }
            if (resident.rooms != undefined) {
                if (resident.rooms[room] != undefined) {
                    resident.rooms[room] = !resident.rooms[room];
                } else {
                    resident.rooms[room] = true;
                }
            } else {
                resident['rooms'] = {};
                resident.rooms[room] = true;
            }
            residents.$save(resident);
            roomObj.residents[resident.$id] = resident.rooms[room];
            roomObj.$save();
        }

    }
]);