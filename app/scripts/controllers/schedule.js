'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ScheduleCtrl
 * @description
 * # ScheduleCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ScheduleCtrl', ['$rootScope', '$scope', 'user', 'fbutil', '$state', '$ionicSideMenuDelegate', 'log', '$ionicLoading','$timeout',
        function($rootScope, $scope, user, fbutil, $state, $ionicSideMenuDelegate, log, $ionicLoading,$timeout) {

            $ionicSideMenuDelegate.canDragContent(false);


            if (window.screen && window.screen.lockOrientation) {
                window.screen.lockOrientation('landscape');
            }


            log.event({
                homeid: user.uid,
                residentid: user.residentId,
                type: 'view',
                view: 'schedule',
                roomid: $rootScope.room
            });


            // Use rootscope to inject in directive and back to schedule.html template
            $rootScope.dayView = false;

            $scope.hideloader = function() {
                $ionicLoading.hide();
            };

            var room = $rootScope.room;
            var roomUrl = 'homes/' + user.uid + '/rooms/' + room;
            //$scope.roomValues = fbutil.syncObject(roomUrl);

            var activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + room + '/raw');

            var scheduleObj = fbutil.syncArray(roomUrl + '/schedule/');
            scheduleObj.$loaded().then(function(schedule) {
                $scope.schedule = schedule;
            });
            $scope.roomId = $rootScope.room;
            $scope.radius = 14;

            function addRawActivity(obj) {
                var date = new Date();
                obj.date = date.toString();
                obj.name = $scope.residents.$getRecord(user.residentId).name;
                activities.$add(obj);
                console.log('Activity added:' + JSON.stringify(obj));
            }

            $scope.goback = function(room, changedDay) {

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

                console.log('SCHEDULE CHANGED: ' + changedDay);

                if (changedDay) {

                    addRawActivity({
                        type: 'change-schedule',
                        day: changedDay
                    });

                }

                $timeout(function() {
                    $state.go('app.room', {
                        roomId: room
                    });
                },300);    
            };

            $scope.reload = function(changedDay) {
                console.log('SCHEDULE CHANGED: ' + changedDay);

                if (changedDay) {

                    addRawActivity({
                        type: 'change-schedule',
                        day: changedDay
                    });

                }

                $state.go($state.current, {}, {
                    reload: true
                });
            };
        }
    ]);