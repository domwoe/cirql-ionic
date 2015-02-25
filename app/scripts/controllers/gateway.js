'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:GatewayCtrl
 * @description
 * # GatewayCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('GatewayCtrl', ['$scope', '$state', 'user', 'fbutil', '$ionicLoading', '$ionicPopup', '$ionicNavBarDelegate',
        function($scope, $state, user, fbutil, $ionicLoading, $ionicPopup, $ionicNavBarDelegate) {

            $scope.hasGateway = false;

            $scope.cirql = true;


            // Get GatewayId
            var gatewayIdObj = fbutil.syncObject('homes/' + user.uid + '/gateway');
            gatewayIdObj.$loaded(
                function() {

                    if (gatewayIdObj.$value !== null) {


                        var gatewayId = gatewayIdObj.$value;

                        $scope.hasGateway = true;

                        // Get Gateway object
                        $scope.gateway = fbutil.syncObject('gateways/' + gatewayId);
                        $scope.gateway.$loaded(function(gateway) {
                        });


                    } else {
                        $scope.hasGateway = false;
                    }


                }
            );

            var nefitObj = fbutil.syncObject('homes/' + user.uid + '/nefit');
            nefitObj.$loaded(
                function(nefit) {
                    if (nefit.$value !== null) {
                        $scope.hasGateway = true;
                        $scope.gateway = nefitObj;

                    }
                }
            );

            $scope.addNefit = function(nefit) {
                fbutil.ref('homes/' + user.uid + '/nefit').set(nefit, function(error) {
                    if (error) {
                        console.log(error);
                    } else {
                        $scope.hasGateway = true;
                        $scope.gateway = nefit;

                    }
                });
            };


            $scope.testConnection = function() {

                fbutil.ref('homes/' + user.uid + '/nefit').child('initiateTest').set(true);

            };


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


            function delGateway() {

                // Delete Gateway reference from Home object
                gatewayIdObj.$value = null;
                gatewayIdObj.$save();

                // Delete home reference from room object
                var gateway = $scope.gateway;

                delete gateway.homeId;

                gateway.$save();

                $scope.hasGateway = false;

            }

            $scope.showConfirm = function() {

                $ionicPopup.show({
                    template: '<p>Are you sure you want to remove this gateway from your account?</p>' +
                        '<p>The system won\'t work without a gateway!</p>',
                    title: 'Remove Gateway',
                    subTitle: '',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel',
                        type: 'button-block button-dark transparent',
                    }, {
                        text: 'Disconnect',
                        type: 'button-block button-assertive transparent',
                        onTap: function() {
                            delGateway();
                        }
                    }]
                });
            };

            $scope.lastSeen = function(timeString) {

                var timestamp = Date.parse(timeString);
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
                    return new Date(timestamp).toLocaleString();
                }
            };


            $scope.goBack = function() {

                // Coming from home via sidemenu
                // 
                if ($state.params.home === 'true') {
                    $state.go('app.home');
                }
                $ionicNavBarDelegate.back();
            };


            /**
             * Go back to home screen
             */
            // $scope.goToHome = function() {//     $state.go('app.home'); // }; 
        }
    ]);