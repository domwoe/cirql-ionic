'use strict';

angular.module('cirqlApp')
    .controller('ActivityCtrl', ['$rootScope', '$scope', 'user', 'fbutil', '$state', '$ionicLoading', '$translate', 'log',
        function($rootScope, $scope, user, fbutil, $state, $ionicLoading, $translate, log) {

            if (!$rootScope.room) {
                $rootScope.room = $state.params.roomId;
            }

            var language = $translate.use();

            log.event({
                homeid: user.uid,
                residentid: user.residentId,
                type: 'view',
                view: 'activity',
                roomid: $rootScope.room
            });

            // Get roomId
            // if ($state.params.hasOwnProperty('roomId')) {
            //     $rootScope.room = $state.params.roomId;
            // }

            $scope.goToRoom = function() {
                if ($scope.activities && $scope.activities.hasOwnProperty('$destroy')) {
                    $scope.activities.$destroy();
                }
                $state.go('app.room', {
                    roomId: $rootScope.room
                });
            };


            $scope.toDate = function(obj) {
                return new Date(obj.date);
            };


            // Get activities of room from Firebase
            // 
            var limit = 10;

            $scope.loadActivites = function(more) {

                // Loading 
                $ionicLoading.show({
                    template: '<div class="sk-spinner sk-spinner-circle">' +
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

                limit = limit + more;

                if (language === 'de') {
                    $scope.activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + $rootScope.room + '/de', {
                        limitToLast: limit
                    });
                } else {
                    $scope.activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + $rootScope.room + '/en', {
                        limitToLast: limit
                    });
                }

                // Hide Loading
                $scope.activities.$loaded(function() {
                    $ionicLoading.hide();
                });

            };

            $scope.loadActivites(0);



        }


    ]);