'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ScheduleCtrl
 * @description
 * # ScheduleCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ScheduleCtrl', ['$rootScope', '$scope', 'user', 'fbutil', '$state', '$ionicSideMenuDelegate', 'log',
        function($rootScope, $scope, user, fbutil, $state, $ionicSideMenuDelegate, log) {

            $ionicSideMenuDelegate.canDragContent(false);

            log.event({
                homeid: user.uid,
                residentid: user.residentId,
                type: 'view',
                view: 'schedule',
                roomid: $rootScope.room
            });

            $scope.dayview = false;

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

                console.log('SCHEDULE CHANGED: ' + changedDay);

                if (changedDay) {

                    addRawActivity({
                        type: 'change-schedule',
                        day: changedDay
                    });

                }

                if (window.screen && window.screen.lockOrientation) {
                    window.screen.lockOrientation('portrait');
                }

                $ionicSideMenuDelegate.canDragContent(true);
                $state.go('app.room', {
                    roomId: room
                });
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