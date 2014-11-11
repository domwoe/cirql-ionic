'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:NetatmoCtrl
 * @description
 * # NetatmoCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ThermostatsCtrl', ['$scope', '$state', 'user', 'fbutil',
        function($scope, $state, user, fbutil) {

            var room;

            if ($state.params.hasOwnProperty('roomId')) {
                room = $state.params.roomId;
                $scope.room = room;
            }

            var trvUrl = 'homes/' + user.uid + '/rooms/' + room + '/thermostats';

            var trvArray = fbutil.syncArray(trvUrl);

            $scope.thermostats = fbutil.syncArray('homes/' + user.uid + '/thermostats');

            trvArray.$loaded(function(trvs) {
                
                if (trvs.length > 0) {

                    $scope.hasThermostat = true;
                    $scope.isAddView = false;
                    $scope.thermostatFilter = {room: room};
  

                } else {
                    $scope.hasThermostat = false;
                    $scope.isAddView = true;
                    $scope.thermostatFilter = {room: 'null'};
                }


            });

            $scope.pairNewThermostat = function() {
                
                var gatewayIdObj = fbutil.syncObject('homes/' + user.uid + '/gateway');

                gatewayIdObj.$loaded(function(gatewayId) {

                    var gatewayId = gatewayId.$value;

                    var gatewayObj = fbutil.syncObject('gateways/' + gatewayId);

                    $scope.gateway = gatewayObj;

                    gatewayObj.$loaded(function(gateway) {

                        gateway.activatePairing = true;
                        gateway.$save();

                    
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
                    }
                    else {
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
                $scope.thermostatFilter = {room: 'null'};

            };

            

            /**
             * Go back to room screen
             */
            $scope.goToRoom = function() {
              $state.go('app.room', {roomId: room});
            };


        }
    ]);