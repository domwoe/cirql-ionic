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
            }

            var trvUrl = 'homes/' + user.uid + '/rooms/' + room + '/thermostats';

            var trvArray = fbutil.syncArray(trvUrl);

            trvArray.$loaded(function(trvs) {
                
                if (trvs) {

                    $scope.hasThermostat = true;

                    for (var i = 0; i < trvs.length; i++) {

                        getThermostat(trvs.$keyAt(i));
                    }    


                } else {
                    $scope.hasThermostat = false;
                }


            });


            $scope.thermostats = [];

            function getThermostat(id) {

                var trvObj = fbutil.syncObject('homes/' + user.uid + '/thermostats/' + id);
                trvObj.$loaded(function(trv) {
                    console.log(trv);
                });
                $scope.thermostats = $scope.thermostats.concat(trvObj);


            }








        }
    ]);