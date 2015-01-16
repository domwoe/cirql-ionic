'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')

.controller('RoomCtrl', ['$scope', '$state', 'user', 'simpleLogin', 'fbutil', '$timeout', '$stateParams', '$ionicPopup', '$filter', 'toastr', '$translate', '$ionicLoading','roomDetailService',
    function($scope, $state, user, simpleLogin, fbutil, $timeout, $stateParams, $ionicPopup, $filter, toastr, $translate, $ionicLoading,roomDetailService) {

        var room = $stateParams.roomId;

    
        $scope.finishedloading = false;
        if (window.screen.hasOwnProperty('lockOrientation')) {
            window.screen.lockOrientation('portrait');
        }

        var language = $translate.use();

        if (language !== 'de') {
            language = 'en';
        }
       
        var homeUrl = 'homes/' + user.uid;
        var roomUrl = homeUrl + '/rooms/' + room;

        //var trvUrl = roomUrl + '/thermostats';

         var roomObj = fbutil.syncObject(roomUrl);
        roomObj.$bindTo($scope,'roomValues').then(function(unbind) {
            $scope.unbindRoom = unbind;
        });

        $scope.roomValues = roomObj;

        $scope.nextTargetDate = function(dateString) {
            return new Date(dateString);
        };

        var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
        $scope.residents = residents;

        var templates = fbutil.syncArray('templates');
        $scope.categories = templates;

        //var activities = fbutil.syncArray(homeUrl + '/activity/' + room + '/raw');

        //var trvObj = fbutil.syncObject(trvUrl);

        //$scope.hasThermostats = null;

        //var trvIds = [];


        // trvObj.$loaded(function(trvs) {
        //     if (trvs.hasOwnProperty('$value') && trvs.$value === null) {
        //         $scope.hasThermostats = false;
        //         console.log($scope.hasThermostats);
        //     } else {

        //         angular.forEach(trvs, function(value, key) {

        //             trvIds.push(key);

        //         });

        //         $scope.hasThermostats = true;

        //     }
        // });



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

            //console.log(modeIndex);

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

            $scope.addRawActivity({
                type: 'change-mode'
            });
        };


        var translate = $filter('translate');

        $scope.openAirQualityPopover = function() {
            $ionicPopup.alert({
                title: translate('AIR_QUALITY'),
                template: $scope.roomValues.msg[language].airQualityMsg
            });
        };

        $scope.openHumidityPopover = function() {
            $ionicPopup.alert({
                title: translate('HUMIDITY'),
                template: $scope.roomValues.msg[language].humidityMsg
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
            // $ionicLoading.show({
            //     templateUrl: 'loading.html'
            // });
             $scope.unbindRoom();
             roomObj.$destroy();
             templates.$destroy();
             //trvObj.$destroy();
            $state.go('app.home', null, {
                reload: false
            });
        };

        $scope.isBoundResident = function(resident) {
            return resident.rooms[room] && resident.allowsGeolocation;
        };

        $scope.toggleBoundResident = function(resident) {
            if ($scope.roomValues.residents === undefined) {
                $scope.roomValues.residents = {};
            } else {

                if (resident.rooms !== undefined) {

                    if (!resident.allowsGeolocation && !resident.rooms[room]) {

                        $ionicPopup.alert({
                            template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                        });

                    } else {

                        if (resident.rooms[room] !== undefined) {
                            resident.rooms[room] = !resident.rooms[room];
                        } else {
                            resident.rooms[room] = true;
                        }

                    }


                } else {
                    if (resident.allowsGeolocation) {
                        resident.rooms = {};
                        resident.rooms[room] = true;
                    }
                }
                residents.$save(resident);
                $scope.roomValues.residents[resident.$id] = resident.rooms[room];
                $scope.roomValues.$save();

            }

        };

        $scope.showConfirm = function() {
            $ionicPopup.show({
                template: '<p>' + $translate('REMOVE_ROOM_CONFIRM_TEXT') + '</p>',
                title: $translate('REMOVE_ROOM'),
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: $translate('CANCEL'),
                    type: 'button-block button-dark transparent',
                }, {
                    text: $translate('REMOVE_ROOM'),
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
                if (resident.rooms !== undefined && resident.rooms[roomId] !== undefined) {
                    resident.rooms[roomId] = null;
                    residents.$save(resident);
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
                for (var station in sensors.netatmo.stations) {
                    for (module in station.modules) {
                        if (module.room !== undefined && module.room === roomId) {
                            module.room = null;
                        }
                    }
                }
                sensors.$save();
            });

            //delete room
            fbutil.ref(roomUrl).remove();
            //TODO change code to below after update to angularfire v0.9.0
            //roomObj.$remove();
            $state.go('app.home');
        }




        function listenForSuccess() {


            for (var i = 0, j = trvIds.length; i < j; i++) {

                fbutil.syncObject(homeUrl + '/thermostats/' + trvIds[i]).$loaded(function(trv) {
                    //toastr.success('Thermostat: '+ trv.status);
                    if (trv.status === 'success' && trv['fhem_desired-temp'] === $scope.roomValues.virtualTarget) {
                        //toaster.pop('success', 'Thermostat', trv.status);
                        toastr.success('Thermostat: ' + trv.status);
                    } else {
                        (function() {
                            var unwatch = fbutil.syncObject(homeUrl + '/thermostats/' + trvIds[i]).$watch(function(status) {
                                if (status === 'success' && trv['fhem_desired-temp'] === $scope.roomValues.virtualTarget) {
                                    unwatch();
                                    //toaster.pop('success', 'Thermostat', status);
                                    toastr.success('Thermostat: ' + status);
                                }
                            });
                        })();
                    }
                });



            }


        }


        $scope.addRawActivity = function(obj) {
            //roomObj.$save();
            if (obj.type === 'set-target') {

                //listenForSuccess();

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
            //activities.$add(obj);
            //fbutil.ref.child(homeUrl + '/activity/' + room + '/raw').push(obj);
            fbutil.ref(homeUrl + '/activity/' + room + '/raw').push(obj);
            console.log('Activity added:' + JSON.stringify(obj));
        };

        $scope.goToRoom = function() {
            //$ionicSideMenuDelegate.canDragContent(true);
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