'use strict';

angular.module('cirqlApp').controller('SideMenuCtrl', 
  function($scope, $state, simpleLogin) {
    $scope.logout = function() {
      simpleLogin.logout();
      $state.go('login');
    };
  });
