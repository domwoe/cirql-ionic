'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ScheduleCtrl
 * @description
 * # ScheduleCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
  .controller('ScheduleCtrl', ['$scope', 'user', 'fbutil', '$stateParams', '$state','$ionicSideMenuDelegate',
  	function($scope, user, fbutil, $stateParams, $state, $ionicSideMenuDelegate) {

  	$ionicSideMenuDelegate.canDragContent(false);

  	$scope.dayview = false;

 	var room = $stateParams.roomId;
	var roomUrl = 'homes/' + user.uid + '/rooms/' + room;
	var roomObj = fbutil.syncObject(roomUrl);

  var residents = fbutil.syncArray('homes/' + user.uid + '/residents');

  var activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + room + '/raw');

	roomObj.$loaded().then(function() {
		roomObj.$bindTo($scope, 'roomValues');
		//console.log("ROOMVAL: ", roomObj);

	});

	var scheduleObj = fbutil.syncArray(roomUrl + '/schedule/');
	scheduleObj.$loaded().then(function() {
		$scope.schedule = scheduleObj;
	});

	$scope.roomId = room;
	$scope.radius = 14;

  function addRawActivity(obj) {
            var date = new Date();
            obj.date = date.toString();
            obj.name = residents.$getRecord(user.residentId).name;
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