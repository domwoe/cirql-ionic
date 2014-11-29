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

 	var room = $stateParams.roomId;
	var roomUrl = 'homes/' + user.uid + '/rooms/' + room;
	var roomObj = fbutil.syncObject(roomUrl);

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

  	$scope.goBack = function(room) {
  		var cordova = cordova || null;
  		if (cordova) {
			var so = cordova.plugins.screenorientation;
        	so.setOrientation('portrait');
        }
		$state.go('app.room', {roomId: room});
    };
}]);