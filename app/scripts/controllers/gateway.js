'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:GatewayCtrl
 * @description
 * # GatewayCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('GatewayCtrl', ['$scope', '$state', 'user', 'fbutil',
        function($scope, $state, user, fbutil) {

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


                }
            );

            $scope.addGateway = function(gatewayId) {
                
                var gateway = fbutil.syncObject('gateways/' + gatewayId);

                gateway.$loaded(function() {
                    
                    if (gateway.$value !== null)
                    {
                        gateway.homeId = user.uid;
                        gateway.$save();

                        gatewayIdObj.$value = gatewayId;
                        gatewayIdObj.$save();

                        $scope.gateway = gateway;

                        $scope.hasGateway = true;

                    }
                    else {

                        $scope.errorMsg = 'There is no Gateway with id '+ gatewayId;

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





            /**
             * Go back to home screen
             */
            $scope.goToHome = function() {
                $state.go('app.home');
            };


        }
    ]);