'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ScheduleCtrl
 * @description
 * # ScheduleCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
  .controller('ScheduleCtrl', ['$scope', 'user', 'fbutil', '$state','$ionicSideMenuDelegate',
  	function($scope, user, fbutil, $state, $ionicSideMenuDelegate) {

  	$ionicSideMenuDelegate.canDragContent(false);

  	$scope.dayview = false;

 	var room = $state.params.roomId;
	var roomUrl = 'homes/' + user.uid + '/rooms/' + room;
	//$scope.roomValues = fbutil.syncObject(roomUrl);


  var activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + room + '/raw');

  var scheduleObj = fbutil.syncArray(roomUrl + '/schedule/');
  scheduleObj.$loaded().then(function(schedule) {
    $scope.schedule = schedule;
  })
	$scope.roomId = room;
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

  		if (window.screen.hasOwnProperty('lockOrientation')) {
        	window.screen.lockOrientation('portrait');
        }
        $ionicSideMenuDelegate.canDragContent(true);
		$state.go('app.room', {roomId: room});
    };

    $scope.reload = function(changedDay) {
       console.log('SCHEDULE CHANGED: ' + changedDay);

      if (changedDay) {

        addRawActivity({
          type: 'change-schedule',
          day: changedDay
        });

      }

    	$state.go($state.current, {}, {reload: true});
    };
}]);