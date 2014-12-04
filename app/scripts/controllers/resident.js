'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ResidentCtrl
 * @description
 * # ResidentCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('ResidentCtrl', ['$scope', '$localStorage', 'user', 'fbutil', '$state', '$ionicLoading',
  function ($scope, $localStorage, user, fbutil, $state, $ionicLoading) {

    // hide Loading in case one arrives at this state
    // with a loading screen
    $ionicLoading.hide();

    if(user) {
      $scope.user = user;
    } else {
      $state.go('login');
    }

    function loadResidents(user) {
      if( $scope.home ) {
        $scope.home.$destroy();
      }
      var residents = fbutil.syncArray('homes/'+user.uid+'/residents');
      $scope.residents = residents;
    }
    loadResidents(user);

    $scope.select = function(resident) {
      $localStorage.user.residentId = resident.$id;
      $state.go('app.home');
    };

    $scope.name = '';
    $scope.create = function(name) {
      $scope.residents.$add({name: name, isAway: false, allowsGeolocation: true})
      .then(function(ref) {
        console.log(ref.name());
        $localStorage.user.residentId = ref.name();
      })
      .then(function(){
        $state.go('app.home');
      });
    };
  }]);
