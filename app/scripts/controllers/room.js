'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

.controller('RoomCtrl', ['$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$ionicPopup', '$filter',
    function($scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $ionicPopup, $filter) {

        if (window.screen.hasOwnProperty('lockOrientation')) {
            window.screen.lockOrientation('portrait');
        }

        var room = $stateParams.roomId;
        var homeUrl = 'homes/' + user.uid;
        var roomUrl = homeUrl + '/rooms/' + room;
        var modeUrl = homeUrl + '/rooms/' + room + '/mode';
        //var sensorUrl = roomUrl + '/sensors/netatmo';
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

        var activities = fbutil.syncArray(homeUrl + '/activity/' + room + '/raw');

        var trvObj = fbutil.syncObject(trvUrl);

        $scope.hasThermostats = null;

        trvObj.$loaded(function(trvs) {
            if (trvs.hasOwnProperty('$value') && trvs.$value === null) {
                $scope.hasThermostats = false;
                console.log($scope.hasThermostats);
            } else {

                $scope.hasThermostats = true;
            }
        });

        $scope.showNextTarget = function() {
            if ($scope.roomValues) {
                return $scope.roomValues.mode === 'auto' && !($scope.roomValues.usesAutoAway && $scope.roomValues.isAway);
            } else {
                return false;
            }

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

            $scope.addRawActivity({type: 'change-mode'});
        }


        var $translate = $filter('translate');

        $scope.openAirQualityPopover = function($event) {
            //$scope.airQualityPopover.show($event);
            $ionicPopup.alert({
                title: $translate('AIR_QUALITY'),
                template: $scope.roomValues.airQualityMsg
            });
        };
        
        $scope.openHumidityPopover = function($event) {
            //$scope.humidityPopover.show($event);
            $ionicPopup.alert({
                title: $translate('HUMIDITY'),
                template: $scope.roomValues.humidityMsg
            });
        };

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
            roomObj.$destroy();
            templates.$destroy();
            trvObj.$destroy();
            activities.$destroy();
            $state.go('app.home', null, {
                reload: true
            });
        };

        $scope.isBoundResident = function(resident) {
            return resident.rooms[room] && resident.allowsGeolocation;
        };

        $scope.toggleBoundResident = function(resident) {
            if (roomObj.residents === undefined) {
                roomObj.residents = {};
            } else {

                if (resident.rooms != undefined) {

                    if (!resident.allowsGeolocation && !resident.rooms[room]) {

                        $ionicPopup.alert({
                            template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                        });

                    }

                    else {

                        if (resident.rooms[room] != undefined) {
                            resident.rooms[room] = !resident.rooms[room];
                        } else {
                            resident.rooms[room] = true;
                        }

                    }

                    
                } else {
                    if (resident.allowsGeolocation) {
                        resident['rooms'] = {};
                        resident.rooms[room] = true;
                    }    
                }
                residents.$save(resident);
                roomObj.residents[resident.$id] = resident.rooms[room];
                roomObj.$save();

            }

        };

        $scope.showConfirm = function() {
            $ionicPopup.show({
                template: '<p>Are you sure you want to remove this room from your account?</p>',
                title: 'Remove Room',
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: 'Cancel',
                    type: 'button-block button-dark transparent',
                }, {
                    text: 'Remove',
                    type: 'button-block button-assertive transparent',
                    onTap: function() {
                        deleteRoom();
                    }
                }]
            });
        };

        /**
         * deleteRoom
         * @description
         * deletes room and all references in residents
         * @return {undefined}
         */
        function deleteRoom() {
            //delete all room references in residents
            var roomId = roomObj.$id;
            angular.forEach(residents, function(resident) {
                if (resident.rooms != undefined && resident.rooms[roomId] != undefined) {
                    resident.rooms[roomId] = null;
                    residents.$save(resident);
                }
            });
            //TODO: clean up Netatmo and Thermostats references
            //
            //delete room
            fbutil.ref(roomUrl).remove();
            //TODO change code to below after update to angularfire v0.9.0
            //roomObj.$remove();
            $state.go('app.home');
        };


        $scope.addRawActivity = function(obj) {
            if (obj.type === 'set-target') {

                if ($scope.roomValues.mode === 'manu') {
                    obj.type = 'manual-target';
                }
                else {
                    obj.type = 'schedule-override';
                }


            } 
            else if (obj.type === 'change-mode') {
                obj.value = $scope.roomValues.mode;
            } 
            var date = new Date();
            obj.date = date.toString();
            obj.name = $scope.residents.$getRecord(user.residentId).name;
            activities.$add(obj);
            console.log('Activity added:' +JSON.stringify(obj));
        }

        $scope.goToRoom = function() {
            $ionicSideMenuDelegate.canDragContent(true);
            $state.go('app.room', {
                roomId: room
            });
        };

        $scope.goToActivity = function() {
            $state.go('app.activity', {
                roomId: room
            });
        };

    }
]);