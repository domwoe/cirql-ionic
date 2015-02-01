
'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('ChatCtrl', ['$scope', 'user', '$firebase', 'fbutil', '$state', '$ionicSideMenuDelegate', '$ionicScrollDelegate',
            function($scope, user, $firebase, fbutil, $state, $ionicSideMenuDelegate, $ionicScrollDelegate) {

                //disable menu
                $ionicSideMenuDelegate.canDragContent(false);

                var username = $scope.residents.$getRecord(user.residentId).name;
                $scope.messages = fbutil.syncArray('chat/' + user.uid + '/messages');
                var messageCount = $firebase(fbutil.ref('chat/' + user.uid + '/messageCount'));
                $scope.state = fbutil.syncObject('chat/' + user.uid + '/state/' + user.residentId);
                $scope.residentId = user.residentId;

                $scope.messages.$loaded()
                    .then(function(){
                        $ionicScrollDelegate.$getByHandle('chat').scrollBottom(false);
                        $scope.state.lastRead = $scope.messages.$keyAt($scope.messages.length - 1);
                        $scope.state.numberOfRead = $scope.messages.length;
                        $scope.state.$save();
                        $scope.messages.$watch(function(event) {
                            $ionicScrollDelegate.$getByHandle('chat').scrollBottom(true);
                            $scope.state.lastRead = $scope.messages.$keyAt($scope.messages.length - 1);
                            $scope.state.numberOfRead = $scope.messages.length;
                            $scope.state.$save();
                        });
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
                        $scope.messages.$add({
                            username: username,
                            residentId: user.residentId,
                            content: $scope.newMessage
                        });
                        $scope.newMessage = '';
                        // Increment the message count by 1
                        messageCount.$transaction(function(currentCount) {
                            if (!currentCount) return 1;   // Initial value for counter.
                                if (currentCount < 0) return;  // Return undefined to abort transaction.
                                return currentCount + 1;       // Increment the count by 1.
                        }).then(function(snapshot) {
                                if (snapshot === null) {
                                    // Handle aborted transaction.
                                } else {
                                    // Do something.
                                }
                            }, function(error) {
                                console.log("Error:", error);
                            });
                    }
                    else{
                        alert('Can\'t be empty');
                    }
                };

                /**
                 * Go back to home screen
                 */
                $scope.goBack = function() {
                    $ionicSideMenuDelegate.canDragContent(true);
                    //destroy syncing of messages
                    //TODO might not be enough when navigating with android back button
                    $scope.messages.$destroy();
                    $state.go('app.home');
                };


                console.log(messageCount);


            }
]);
