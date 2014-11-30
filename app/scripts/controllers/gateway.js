'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:GatewayCtrl
 * @description
 * # GatewayCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('GatewayCtrl', ['$scope', '$state', 'user', 'fbutil', '$ionicLoading',
        function($scope, $state, user, fbutil, $ionicLoading) {

            $scope.hasGateway = true;

            $ionicLoading.show({
                template: 'Loading...'
            });


            // Get GatewayId
            var gatewayIdObj = fbutil.syncObject('homes/' + user.uid + '/gateway')
            gatewayIdObj.$loaded(
                function() {

                    if (gatewayIdObj.$value !== null) {


                        var gatewayId = gatewayIdObj.$value;

                        $scope.hasGateway = true;

                        // Get Gateway object
                        $scope.gateway = fbutil.syncObject('gateways/' + gatewayId);


                    } else {
                        $scope.hasGateway = false;
                    }

                    $ionicLoading.hide();

                }
            );

            $scope.addGateway = function(gatewayId) {

                var gateway = fbutil.syncObject('gateways/' + gatewayId);

                gateway.$loaded(function() {

                    if (gateway.$value !== null) {
                        gateway.homeId = user.uid;
                        gateway.$save();

                        gatewayIdObj.$value = gatewayId;
                        gatewayIdObj.$save();

                        $scope.gateway = gateway;

                        $scope.hasGateway = true;

                    } else {

                        $scope.errorMsg = 'There is no Gateway with id ' + gatewayId;

                    }

                });


            };


            $scope.delGateway = function() {

                // Delete Gateway reference from Home object
                gatewayIdObj.$value = null;
                gatewayIdObj.$save();

                // Delete home reference from room object
                var gateway = $scope.gateway;

                delete gateway.homeId;

                gateway.$save();

                $scope.hasGateway = false;

            };

            $scope.lastSeen = function(timeString) {

                var timestamp = Date.parse(timeString);
                var now = new Date;

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
                    return Date(timestamp).toLocaleString();
                }
            }





            /**
             * Go back to home screen
             */
            $scope.goToHome = function() {
                $state.go('app.home');
            };


        }
    ]);