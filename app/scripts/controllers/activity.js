'use strict';

angular.module('cirqlApp')
    .controller('ActivityCtrl', ['$scope', 'user', 'fbutil', '$state', '$ionicLoading','$translate',
        function($scope, user, fbutil, $state, $ionicLoading, $translate) {

        	var language = $translate.use();
     
            // Get roomId
            if ($state.params.hasOwnProperty('roomId')) {
                $scope.room = $state.params.roomId;
            }

            $scope.goToRoom = function() {
            	if ($scope.activities && $scope.activities.hasOwnProperty('$destroy')) {
            		$scope.activities.$destroy();
            	}
                $state.go('app.room', {
                    roomId: $scope.room
                });
            };


            // Loading 
            $ionicLoading.show({
                template: '{{"LOADING" | translate}}...<div class="sk-spinner sk-spinner-circle">' +
                    '<div class="sk-circle1 sk-circle"></div>' +
                    '<div class="sk-circle2 sk-circle"></div>' +
                    '<div class="sk-circle3 sk-circle"></div>' +
                    '<div class="sk-circle4 sk-circle"></div>' +
                    '<div class="sk-circle5 sk-circle"></div>' +
                    '<div class="sk-circle6 sk-circle"></div>' +
                    '<div class="sk-circle7 sk-circle"></div>' +
                    '<div class="sk-circle8 sk-circle"></div>' +
                    '<div class="sk-circle9 sk-circle"></div>' +
                    '<div class="sk-circle10 sk-circle"></div>' +
                    '<div class="sk-circle11 sk-circle"></div>' +
                    '<div class="sk-circle12 sk-circle"></div>' +
                    '</div>'
            });


            // Get activities of room from Firebase
            $scope.activities = fbutil.syncArray('homes/' + user.uid + '/activity/rooms/' + $scope.room + '/' + language);

            // Hide Loading
            $scope.activities.$loaded(function() {
            	$ionicLoading.hide();
            });
        }


    ]);