'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

.controller('RoomCtrl', ['$rootScope', '$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$ionicPopup', '$filter', '$translate', '$ionicSideMenuDelegate', 'log', '$ionicLoading', 'timeutils',
    function($rootScope, $scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $ionicPopup, $filter, $translate, $ionicSideMenuDelegate, log, $ionicLoading, timeutils) {

        if (!$rootScope.room) {
            $rootScope.room = $state.params.roomId;
        }

        function showLoading() {
            $ionicLoading.show({
                template: '<div class="sk-spinner sk-spinner-circle">' +
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

        $scope.resident = user.residentId;

        $ionicSideMenuDelegate.canDragContent(true);

        log.event({
            homeid: user.uid,
            residentid: user.residentId,
            type: 'view',
            view: 'room',
            roomid: $rootScope.room
        });

        $scope.finishedloading = false;
        if (window.screen && window.screen.lockOrientation) {
            window.screen.lockOrientation('portrait');
        }

        $timeout($ionicLoading.hide, 500);

        var translate = $filter('translate');
        var language = $translate.use();
        if (language !== 'de') {
            language = 'en';
        }

        $scope.isOld = function(date) {
            if (timeutils.isOld(date)) {
                return 'darken';
            } else {
                return '';
            }
        };

        if (user.uid && $rootScope.room) {

            var homeUrl = 'homes/' + user.uid;
            var roomUrl = homeUrl + '/rooms/' + $rootScope.room;

            $scope.roomValues = fbutil.syncObject(roomUrl);
        } else {
            console.log('Failed to load user.uid ' + user.uid + ' or ' + $rootScope.room);
        }



        $scope.nextTargetDate = function(dateString) {
            return new Date(dateString);
        };

        var templates = fbutil.syncArray('templates');
        $scope.categories = templates;

        $scope.showNextTarget = function() {
            if ($scope.roomValues) {
                return $scope.roomValues.mode === 'auto' && !($scope.roomValues.usesAutoAway && $scope.roomValues.isAway);
            } else {
                return false;
            }

        };


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
                if ($scope.roomValues.mode === 'auto') {
                    return;
                }
                $scope.roomValues.mode = 'auto';
            } else {
                if ($scope.roomValues.mode === 'manu') {
                    return;
                }
                $scope.roomValues.mode = 'manu';
            }

            $scope.roomValues.$save();

            $scope.addRawActivity({
                type: 'change-mode'
            });
        };

        $scope.openAirQualityPopover = function() {
            var msg = (function() {
                if ($scope.isOld($scope.roomValues.lastExternalSensorUpdate)) {
                    return translate('VALUES_TOO_OLD')+ '<br>'+new Date($scope.roomValues.lastExternalSensorUpdate);
                } else {
                    return $scope.roomValues.msg[language].airQualityMsg;
                }
            })();
            $ionicPopup.alert({
                title: translate('AIR_QUALITY'),
                template: msg
            });
        };

        $scope.openHumidityPopover = function() {
            var msg = (function() {
                if ($scope.isOld($scope.roomValues.lastExternalSensorUpdate)) {
                    return translate('VALUES_TOO_OLD')+ '<br> '+new Date($scope.roomValues.lastExternalSensorUpdate);
                } else {
                    return $scope.roomValues.msg[language].humidityMsg;
                }
            })();
            $ionicPopup.alert({
                title: translate('HUMIDITY'),
                template: msg
            });
        };

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
            //$scope.roomValues.$destroy();
            //templates.$destroy();
            //trvObj.$destroy();
            $state.go('app.home', null, {
                reload: false
            });
        };

        $scope.isBoundResident = function(resident) {
            return resident.rooms[$rootScope.room] && resident.allowsGeolocation;
        };

        $scope.toggleBoundResident = function(resident) {
            if ($scope.roomValues.residents === undefined) {
                $scope.roomValues.residents = {};
            } else {

                if (resident.rooms !== undefined) {

                    if (!resident.allowsGeolocation && !resident.rooms[$rootScope.room]) {

                        $ionicPopup.alert({
                            template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                        });

                    } else {

                        if (resident.rooms[$rootScope.room] !== undefined) {
                            resident.rooms[$rootScope.room] = !resident.rooms[$rootScope.room];
                        } else {
                            resident.rooms[$rootScope.room] = true;
                        }

                    }


                } else {
                    if (resident.allowsGeolocation) {
                        resident.rooms = {};
                        resident.rooms[$rootScope.room] = true;
                    }
                }
                $scope.residents.$save(resident);
                $scope.roomValues.residents[resident.$id] = resident.rooms[$rootScope.room];
                $scope.roomValues.$save();

            }

        };

        $scope.toggleRoomclimateNotifications = function() {

            var residentid  = user.residentId;

            // if ($scope.roomValues.notifications[residentid] === undefined) {
            //     $scope.roomValues.notifications[residentid] = false;
            // } 

            $scope.roomValues.$save();


        }

        $scope.save = function() {
            $scope.roomValues.$save().then(function() {
                $state.go('app.room', {
                    roomId: $rootScope.room
                });
            });
        };

        $scope.showConfirm = function() {
            $ionicPopup.show({
                template: '<p>' + translate('REMOVE_ROOM_CONFIRM_TEXT') + '</p>',
                title: translate('REMOVE_ROOM'),
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: translate('CANCEL'),
                    type: 'button-block button-dark transparent',
                }, {
                    text: translate('REMOVE_ROOM'),
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
            var roomId = $rootScope.room;
            angular.forEach($scope.residents, function(resident) {
                if (resident.rooms !== undefined && resident.rooms[roomId] !== undefined) {
                    resident.rooms[roomId] = null;
                    $scope.residents.$save(resident);
                }
            });
            var thermostats = fbutil.syncArray(homeUrl + '/thermostats');
            //set room reference in thermostats to 'null'
            thermostats.$loaded().then(function() {
                angular.forEach(thermostats, function(thermostat) {
                    if (thermostat.room !== undefined && thermostat.room === roomId) {
                        thermostat.room = 'null';
                        thermostats.$save(thermostat);
                    }
                });
            });

            var sensors = fbutil.syncObject(homeUrl + '/sensors');
            //delete room reference in netatm
            sensors.$loaded().then(function() {
                if (sensors.netatmo !== undefined) {
                    for (var station in sensors.netatmo.stations) {
                        for (var module in station.modules) {
                            if (module.room !== undefined && module.room === roomId) {
                                module.room = null;
                            }
                        }
                    }
                    sensors.$save();
                }
            });

            //delete room
            fbutil.ref(roomUrl).remove();
            //TODO change code to below after update to angularfire v0.9.0
            //$scope.roomValues.$remove();
            $state.go('app.home');
        }

        $scope.addRawActivity = function(obj) {

            if (obj.type === 'set-target') {

                $scope.roomValues.virtualTarget = obj.target;

                $scope.roomValues.$save();

                if ($scope.roomValues.mode === 'manu') {
                    obj.type = 'manual-target';
                } else {
                    obj.type = 'schedule-override';
                }


            } else if (obj.type === 'change-mode') {
                obj.value = $scope.roomValues.mode;
            }
            var date = new Date();
            obj.date = date.toString();
            obj.name = $scope.residents.$getRecord(user.residentId).name;
            fbutil.ref(homeUrl + '/activity/' + $rootScope.room + '/raw').push(obj);
            console.log('Activity added:' + JSON.stringify(obj));
        };

        $scope.goToActivity = function() {
            $state.go('app.activity', {
                roomId: $rootScope.room
            });
        };

        $scope.goToHistory = function() {
            showLoading();
            $state.go('app.history', {
                roomId: $rootScope.room
            });

        };

        $scope.goBack = function() {
            //$ionicSideMenuDelegate.canDragContent(true);
            $state.go('app.room', {
                roomId: $rootScope.room
            });
        };

    }
]);