'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:NetatmoCtrl
 * @description
 * # NetatmoCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ThermostatsCtrl', ['$scope', '$state', 'user', 'fbutil', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicPopup',
        function($scope, $state, user, fbutil, $ionicSideMenuDelegate, $ionicLoading, $ionicPopup) {

            $scope.hasThermostat = true;
            $ionicLoading.show({
                template: 'Loading...'
            });

            $ionicSideMenuDelegate.canDragContent(false);

            var room;
            var pairingPopup;

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

                $ionicLoading.hide();


            });

            $scope.pairNewThermostat = function() {

                $scope.showPopup();

                thermostats.$watch(function(event) {
                    console.log(event);
                    if (event.event === 'child_added') {
                        console.log(pairingPopup);
                        if ( pairingPopup.hasOwnProperty('close') ) {
                            pairingPopup.close();
                        }
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
                var timestamp = Date.parse(timeString) - 5000;
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
            };


            // $ionicModal.fromTemplateUrl('templates/pairing.html', {
            //     scope: $scope,
            //     animation: 'slide-in-up'
            // }).then(function(modal) {
            //     $scope.modal = modal;
            // });
            // $scope.openModal = function() {
            //     $scope.modal.show();
            // };
            // $scope.closeModal = function() {
            //     $scope.modal.hide();
            // };
            // //Cleanup the modal when we're done with it!
            // $scope.$on('$destroy', function() {
            //     $scope.modal.remove();
            // });
            // // Execute action on hide modal
            // $scope.$on('modal.hidden', function() {
            //     // Execute action
            // });
            // // Execute action on remove modal
            // $scope.$on('modal.removed', function() {
            //     // Execute action
            // });

            $scope.showPopup = function() {
                pairingPopup = $ionicPopup.show({
                    template: '<p>Insert the batteries into the thermostat and hold the <img src="images/icon-pairing.png"> button for at least 3 seconds.</p>' + '<p>The pairing mode on the thermostat is activated when a countdown begins from 30 until "AC" confirms the pairing</p>',
                    title: 'Pairing new thermostat',
                    subTitle: '',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel',
                        type: 'button-block button-assertive',
                    }]
                });
            };



            /**
             * Go back to room screen
             */
            $scope.goToRoom = function() {
                $ionicSideMenuDelegate.canDragContent(true);
                $state.go('app.room', {
                    roomId: room
                });
            };


        }
    ]);