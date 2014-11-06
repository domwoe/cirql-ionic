'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:NetatmoCtrl
 * @description
 * # NetatmoCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('NetatmoCtrl', ['$scope', '$state', 'user', 'fbutil', 'netatmoService',
        function($scope, $state, user, fbutil, netatmoService) {

            var room;

            if ($state.params.hasOwnProperty('roomId')) {
                room = $state.params.roomId;
            }

            netatmoService.getNetatmo(room).then(function(netatmo) {
              $scope.netatmo = netatmo;
            });

            netatmoService.getAvailable().then(function(netatmos) {
              $scope.netatmos = netatmos;
            });


            $scope.toggleGroup = function(group) {
                if ($scope.isGroupShown(group)) {
                    $scope.shownGroup = null;
                } else {
                    $scope.shownGroup = group;
                }
            };
            $scope.isGroupShown = function(group) {
                return $scope.shownGroup === group;
            };



            $scope.addNetatmo = function(stationId, moduleId) {

                var roomUrl = 'homes/' + user.uid + '/rooms/' + room + '/sensors';
                var roomObj = fbutil.syncObject(roomUrl);

                var netatmoUrl = 'homes/' + user.uid + '/sensors/netatmo/stations/' +
                    stationId + '/modules/' + moduleId;
                var netatmoObj = fbutil.syncObject(netatmoUrl);

                console.log('here');

                // Add Netatmo reference to room
                roomObj.netatmo = {
                    station: stationId,
                    module: moduleId
                };
                //roomObj.station = stationId;
                //roomObj.module = moduleId;
                roomObj.$save();

                // Add room reference to Netatmo
                netatmoObj.$loaded().then(function() {
                    console.log(netatmoObj);
                    netatmoObj.room = room;
                    netatmoObj.$save();
                });
                $state.go('app.netatmo', {
                    roomId: room
                });
            }

            $scope.delNetatmo = function() {

                var roomUrl = 'homes/' + user.uid + '/rooms/' + room + '/sensors';
                var roomObj = fbutil.syncObject(roomUrl);

                var netatmoUrl = 'homes/' + user.uid + '/sensors/netatmo/stations/' +
                    $scope.netatmo.station.id + '/modules/' + $scope.netatmo.module.id;
                var netatmoObj = fbutil.syncObject(netatmoUrl);

                roomObj.$loaded().then(function() {
                    delete roomObj.netatmo;
                    roomObj.$save();
                });
                netatmoObj.$loaded().then(function() {
                    delete netatmoObj.room;
                    netatmoObj.$save();
                });

                $state.go('app.addNetatmo', {
                    roomId: room
                });
            }




        }
    ]);