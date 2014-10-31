'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('RoomCtrl', ['$scope', 'user', 'simpleLogin', 'fbutil', '$timeout', '$routeParams', '$rootScope',
  function ($scope, user, simpleLogin, fbutil, $timeout, $routeParams, $rootScope) {

    var room = $routeParams.room;
    var homeUrl = 'homes/' + user.uid;
    var roomUrl = homeUrl +'/rooms/' + room;
    var sensorUrl = roomUrl + '/sensors/netatmo';

    var roomObj = fbutil.syncObject(roomUrl);
    var sensorObj = fbutil.syncObject(sensorUrl);

    roomObj.$loaded().then(function() {
        roomObj.$bindTo($scope, 'roomValues');
    });

    sensorObj.$loaded()
        .then(function() {
            var sensorStation = sensorObj.station;
            var sensorModule = sensorObj.module;
            var netatmoUrl = homeUrl + '/sensors/netatmo/stations/' + 
                             sensorStation + '/modules/' + sensorModule;
            var netatmoObj = fbutil.syncObject(netatmoUrl);
            return netatmoObj;
        }).then(function(netatmoObj) {
            netatmoObj.$loaded().then(function() {
            netatmoObj.$bindTo($scope, 'sensor');
        });
    });

    $scope.user = user;
    $scope.logout = simpleLogin.logout;
    $scope.start = 0;
    $scope.max = 30;
    $scope.stroke = 5;
    $scope.radius = 110;
    $scope.currentColor = '#00FF00';
    $scope.bgColor = '#000000';

    //$scope.$watchCollection('[max, stroke, radius, currentColor, bgColor, roomValues]', function(newValue, oldValue) {
    //    $rootScope.$broadcast('renderCircle');
    //});
}]);