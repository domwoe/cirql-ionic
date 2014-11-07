'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:CreateCtrl
 * @description
 * # CreateCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('CreateCtrl', ['$scope', '$state', '$rootScope', 'user', 'simpleLogin', '$location', 'fbutil', function ($scope, $state, $rootScope, user, simpleLogin, $location, fbutil) {
    //deactivate menu
    $rootScope.menu = false;
    $scope.user = user;
    $scope.logout = simpleLogin.logout;

    $scope.goToHome = function() {
              $state.go('app.home');
            };

    $scope.createResident = function(name){
      if(name) {
        $scope.residents.$add({name: name});
        $scope.user.name = name;
        console.log(name + ' added');
        $location.path('/create/home');
      } else {
        $scope.err = 'Please enter a name';
      }
    };
    $scope.createHome = function(){
        $location.path('/create/room');
    };
    $scope.createRoom = function(name, category){
      $scope.err = null;
      if( !name ) {
        $scope.err = 'Please enter a name';
      } else if ( !category ) {
        $scope.err = 'Please select a category';
      } else {
          $scope.rooms.$add({name: name, category: category});
          console.log(name + ' added');
          $location.path('/home');
      }
    };
    function loadHome(user) {
      if( $scope.home ) {
        $scope.home.$destroy();
      }
      var home = fbutil.syncObject('homes/'+user.uid);
      home.$bindTo($scope, 'home');

      var rooms = fbutil.syncArray('homes/'+user.uid+'/rooms');
      $scope.rooms = rooms;

      var residents = fbutil.syncArray('homes/'+user.uid+'/residents');
      $scope.residents = residents;

      console.log('home data loaded for user', user.uid);
      console.log('home', home);
      console.log('rooms', rooms);
      console.log('residents', residents);
    }

    if(user) {
      loadHome(user);
    }

    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }]);
