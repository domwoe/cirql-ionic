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
                        if (pairingPopup.hasOwnProperty('close')) {
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
                    template: '<p>Insert the batteries into the thermostat and hold the ' +
                        '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="25px" height="25px" viewBox="0 -10 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">' +
                        '<g>' +
                        '<path d="M16.328,15.722c-0.361,0.417-0.316,1.049,0.101,1.411c0.189,0.164,0.422,0.244,0.654,0.244c0.28,0,0.559-0.117,0.756-0.345' +
                        'c0.155-0.179,3.762-4.417,1.027-7.859c-1.517-1.91-0.396-3.02-0.152-3.227c0.424-0.345,0.493-0.969,0.151-1.398' +
                        'c-0.344-0.432-0.973-0.502-1.405-0.159c-1.048,0.835-2.431,3.169-0.16,6.028C19.003,12.559,16.354,15.692,16.328,15.722z"/>' +
                        '<path d="M25.078,15.722c-0.361,0.417-0.316,1.049,0.101,1.411c0.189,0.164,0.422,0.244,0.654,0.244c0.28,0,0.559-0.117,0.756-0.345' +
                        'c0.155-0.179,3.762-4.417,1.027-7.859c-1.517-1.91-0.396-3.02-0.152-3.227c0.424-0.345,0.493-0.969,0.151-1.398' +
                        'c-0.344-0.432-0.973-0.502-1.405-0.159c-1.048,0.835-2.431,3.169-0.16,6.028C27.753,12.559,25.104,15.692,25.078,15.722z"/>' +
                        '<path d="M33.828,15.722c-0.361,0.417-0.316,1.049,0.101,1.411c0.189,0.164,0.422,0.244,0.654,0.244c0.28,0,0.559-0.117,0.756-0.345' +
                        'c0.155-0.179,3.762-4.417,1.027-7.859c-1.517-1.91-0.396-3.02-0.152-3.227c0.424-0.345,0.493-0.969,0.151-1.398' +
                        'c-0.344-0.432-0.973-0.502-1.405-0.159c-1.048,0.835-2.431,3.169-0.16,6.028C36.503,12.559,33.854,15.692,33.828,15.722z"/>' +
                        '<path d="M42.578,15.722c-0.361,0.417-0.316,1.049,0.101,1.411c0.189,0.164,0.422,0.244,0.654,0.244c0.28,0,0.559-0.117,0.756-0.345' +
                        'c0.155-0.179,3.762-4.417,1.027-7.859c-1.517-1.91-0.396-3.02-0.152-3.227c0.424-0.345,0.493-0.969,0.151-1.398' +
                        'c-0.344-0.432-0.973-0.502-1.405-0.159c-1.048,0.835-2.431,3.169-0.16,6.028C45.253,12.559,42.604,15.692,42.578,15.722z"/>' +
                        '<path d="M13.967,56.264c1.657,0,3-1.343,3-3V24.053c0-1.657-1.343-3-3-3s-3,1.343-3,3v29.211' +
                        'C10.967,54.92,12.31,56.264,13.967,56.264z"/>' +
                        '<path d="M17.8,24.01v29.211c0,1.657,1.343,3,3,3s3-1.343,3-3V24.01c0-1.657-1.343-3-3-3S17.8,22.353,17.8,24.01z"/>' +
                        '<path d="M27.634,56.178c1.657,0,3-1.343,3-3V23.967c0-1.657-1.343-3-3-3s-3,1.343-3,3v29.211' +
                        'C24.634,54.834,25.977,56.178,27.634,56.178z"/>' +
                        '<path d="M34.467,56.135c1.657,0,3-1.343,3-3V23.924c0-1.657-1.343-3-3-3c-1.657,0-3,1.343-3,3v29.211' +
                        'C31.467,54.792,32.81,56.135,34.467,56.135z"/>' +
                        '<path d="M41.301,56.092c1.657,0,3-1.343,3-3V23.881c0-1.657-1.343-3-3-3c-1.657,0-3,1.343-3,3v29.211' +
                        'C38.301,54.749,39.644,56.092,41.301,56.092z"/>' +
                        '<path d="M45.134,23.838v29.211c0,1.657,1.343,3,3,3c1.657,0,3-1.343,3-3V33.582h0.458c1.357,0,2.458-1.716,2.458-3.833' +
                        'c0-2.117-1.101-3.833-2.458-3.833c-0.157,0-0.309,0-0.458,0v-2.078c0-1.657-1.343-3-3-3C46.477,20.838,45.134,22.182,45.134,23.838' +
                        'z"/>' +
                        '</g>' +
                        '</svg>' +
                        'button for at least 3 seconds.</p>' + '<p>The pairing mode on the thermostat is activated when a countdown begins from 30 until "AC" confirms the pairing</p>',
                    title: 'Pairing new thermostat',
                    subTitle: '',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel',
                        type: 'button-block button-assertive transparent',
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