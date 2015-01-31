
'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('ChatCtrl', ['$rootScope', '$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$ionicLoading', 'deviceDetector',
            'geo', 'geo2', '$ionicNavBarDelegate', '$timeout', '$cordovaSplashscreen', '$ionicSideMenuDelegate','$ionicScrollDelegate',
            function($rootScope, $scope, user, simpleLogin, fbutil, $state, $ionicLoading, deviceDetector, geo, geo2, $ionicNavBarDelegate, $timeout, $cordovaSplashscreen, $ionicSideMenuDelegate, $ionicScrollDelegate) {

                //disable menu
                $ionicSideMenuDelegate.canDragContent(false);

                var username = $scope.residents.$getRecord(user.residentId).name;
                $scope.messages = fbutil.syncArray('chat/' + user.uid + '/messages');
                $scope.state = fbutil.syncObject('chat/' + user.uid + '/state/' + user.residentId);
                $scope.residentId = user.residentId;

                $scope.messages.$loaded()
                    .then(function(){
                        $ionicScrollDelegate.scrollBottom(true);
                    });
                $scope.messages.$watch(function(event) {
                    $ionicScrollDelegate.scrollBottom(true);
                });
                $scope.$watch('newMessage', function(newValue, oldValue) {
                    if(typeof newValue != 'undefined'){
                        if(newValue != ''){
                            //Chat.typing();
                        }
                        else{
                            //Chat.stopTyping();
                        }
                    }
                });

                $scope.sendMessage = function() {
                    if($scope.newMessage){
                        //Chat.sendMessage($scope.newMessage);
                        $scope.messages.$add({
                            username: username,
                            residentId: user.residentId,
                            content: $scope.newMessage
                        });
                        $scope.newMessage = '';
                        $ionicScrollDelegate.scrollBottom(true);
                    }
                    else{
                        alert('Can\'t be empty');
                    }
                };
            }
]);
