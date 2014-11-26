'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ScheduleCtrl
 * @description
 * # ScheduleCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
  .controller('ScheduleCtrl', ['$scope', 'user', 'fbutil', '$stateParams', '$state',
  	function($scope, user, fbutil, $stateParams, $state) {

 	var room = $stateParams.roomId;
	var roomUrl = 'homes/' + user.uid + '/rooms/' + room;
	var roomObj = fbutil.syncObject(roomUrl);

	roomObj.$loaded().then(function() {
		roomObj.$bindTo($scope, 'roomValues');
	});

	$scope.roomId = room;
	var sch1 = {'hour': 14, 'minute': 15, 'target': 17, 'weekday': 2};
	var sch2 = {'hour': 10, 'minute': 45, 'target': 22, 'weekday': 4};
	var sch3 = {'hour': 12, 'minute': 30, 'target': 21, 'weekday': 4};
	$scope.schedule = {
		'0': sch1, 
		'1': sch2, 
		'2': sch3
	};
	$scope.radius = 14;

  	$scope.goToRoom = function(room) {
		console.log("back");
		$state.go('app.room', {roomId: room});
    };
}]);