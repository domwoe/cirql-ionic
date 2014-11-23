'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('HomeCtrl', ['$scope', 'user', 'simpleLogin', 'fbutil', '$state', 
  function ($scope, user, simpleLogin, fbutil, $state) {


    $scope.user = user;

    $scope.min = 0;
    $scope.max = 30;
    $scope.stroke = 12;
    $scope.radius = 110;
    $scope.currentColor = '#FFFFFF';
    $scope.bgColor = '#000000';

    $scope.goToRoom = function(room) {
      $state.go('app.room',{roomId: room}, {reload: true});
    };

    
    function loadHome(user) {
      if( $scope.home ) {
        $scope.home.$destroy();
      }
      // var home = fbutil.syncObject('homes/'+user.uid);
      // home.$bindTo($scope, 'home');

      var rooms = fbutil.syncArray('homes/'+user.uid+'/rooms');
      $scope.rooms = rooms;

      var residents = fbutil.syncArray('homes/'+user.uid+'/residents');
      $scope.residents = residents;

      // console.log("home data loaded for user", user.uid);
      // console.log("home", home);
      // console.log("rooms", rooms);
      // console.log("residents", residents);
    }
    loadHome(user);

    $scope.changePassword = function(oldPass, newPass, confirm) {
      $scope.err = null;
      if( !oldPass || !newPass ) {
        error('Please enter all fields');
      }
      else if( newPass !== confirm ) {
        error('Passwords do not match');
      }
      else {
        simpleLogin.changePassword(user.email, oldPass, newPass)
          .then(function() {
            success('Password changed');
          }, error);
      }
    };

    $scope.changeEmail = function(pass, newEmail) {
      $scope.err = null;
      simpleLogin.changeEmail(pass, newEmail)
        .then(function(user) {
          loadHome(user);
          success('Email changed');
        })
        .catch(error);
    };
  }]);
