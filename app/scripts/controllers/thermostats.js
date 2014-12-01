'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:NetatmoCtrl
 * @description
 * # NetatmoCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ThermostatsCtrl', ['$scope', '$state', 'user', 'fbutil', '$ionicModal',
        function($scope, $state, user, fbutil, $ionicModal) {

            var room;

            if ($state.params.hasOwnProperty('roomId')) {
                room = $state.params.roomId;
                $scope.room = room;
            }

            var trvUrl = 'homes/' + user.uid + '/rooms/' + room + '/thermostats';

            var trvArray = fbutil.syncArray(trvUrl);

            var thermostats = fbutil.syncArray('homes/' + user.uid + '/thermostats');

            $scope.thermostats = thermostats;

            trvArray.$loaded(function(trvs) {

                if (trvs.length > 0) {

                    $scope.hasThermostat = true;
                    $scope.isAddView = false;
                    $scope.thermostatFilter = {
                        room: room
                    };


                } else {
                    $scope.hasThermostat = false;
                    $scope.isAddView = true;
                    $scope.thermostatFilter = {
                        room: 'null'
                    };
                }


            });

            $scope.pairNewThermostat = function() {

                $scope.modal.show();

                thermostats.$watch(function(event) {
                    console.log(event);
                    if ( event.event === 'child_added' ) {
                        $scope.modal.hide();

                    }
                });

                var gatewayIdObj = fbutil.syncObject('homes/' + user.uid + '/gateway');

                gatewayIdObj.$loaded(function(gatewayId) {

                    var gatewayId = gatewayId.$value;

                    var gatewayObj = fbutil.syncObject('gateways/' + gatewayId);

                    $scope.gateway = gatewayObj;

                    gatewayObj.$loaded(function(gateway) {

                        console.log(gateway);

                        gateway.activatePairing = true;
                        gateway.$save();

                        console.log(gateway);


                    });

                });

            };


            $scope.addThermostat = function(thermostat) {

                // Add room reference  to thermostat object
                thermostat.room = room;

                $scope.thermostats.$save(thermostat);

                // Add thermostat reference to room object
                var roomObjPromise = fbutil.syncObject('homes/' + user.uid + '/rooms/' + room);

                roomObjPromise.$loaded(function(roomObj) {
                    if (roomObj.hasOwnProperty('thermostats')) {
                        roomObj.thermostats[thermostat.$id] = true;
                    } else {
                        roomObj.thermostats = {};
                        roomObj.thermostats[thermostat.$id] = true;

                    }
                    roomObj.$save();


                });

                //$scope.isAddView = false;

            };

            $scope.delThermostat = function(thermostat) {

                // Delete room reference from thermostat object

                thermostat.room = 'null';
                $scope.thermostats.$save(thermostat);

                // Delete thermostat reference from room object

                var trvObj = fbutil.syncObject('homes/' + user.uid + '/rooms/' + room + '/thermostats');

                trvObj.$loaded(function(trvs) {

                    delete trvs[thermostat.$id];
                    trvs.$save();

                });


            };


            $scope.addThermostatView = function() {
                $scope.isAddView = true;
                $scope.thermostatFilter = {
                    room: 'null'
                };

            };

            $scope.lastSeen = function(timeString) {
                var timestamp = Date.parse(timeString)-5000;
                var now = Date.now();

                var diff = now - timestamp;

                if (diff < 15 * 60 * 1000) {

                    if (diff > 60 * 1000) {

                        $scope.alert = false;
                        return Math.round(diff / 60 / 1000) + ' minutes ago';

                    } else {

                        $scope.alert = false;
                        return 'Just now';

                    }
                } else {
                    $scope.alert = true;
                    return timeString;
                }
            }


            $ionicModal.fromTemplateUrl('templates/pairing.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modal.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function() {
                $scope.modal.remove();
            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function() {
                // Execute action
            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function() {
                // Execute action
            });



            /**
             * Go back to room screen
             */
            $scope.goToRoom = function() {
                $state.go('app.room', {
                    roomId: room
                });
            };


        }
    ]);
