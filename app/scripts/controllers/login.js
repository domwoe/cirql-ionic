'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('LoginCtrl',
  function($scope, $state, $ionicLoading, simpleLogin, resident) {
    $scope.user = {
      email: '',
      password: ''
    };
    $scope.errorMessage = null;

    $scope.login = function() {
      $scope.errorMessage = null;

      $ionicLoading.show({
        template: 'Please wait...'
      });

      simpleLogin.login('password', {
        email: $scope.user.email,
        password: $scope.user.password
      })
      .then(redirectBasedOnStatus)
      .catch(handleError);
    };

    function redirectBasedOnStatus() {
      $ionicLoading.hide();
      $state.go('app.home');
    }

    function handleError(error) {
      switch (error.code) {
        case 'INVALID_EMAIL':
        case 'INVALID_PASSWORD':
        case 'INVALID_USER':
          $scope.errorMessage = 'Email or password is incorrect';
          break;
        default:
          $scope.errorMessage = 'Error: [' + error.code + ']';
      }

      $ionicLoading.hide();
    }
  });
