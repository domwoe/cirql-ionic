'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
.controller('LoginCtrl', ['$scope', '$rootScope', 'simpleLogin', '$state', function($scope, $rootScope, simpleLogin, $state) {
  //deactivate menu
  $rootScope.menu = false;

  //redirect to home if user is already logged in
  if(simpleLogin.user) {
    $state.go('home');
  }

  $scope.awesomeThings = [
    'HTML5 Boilerplate',
    'AngularJS',
    'Karma'
  ];
  $scope.oauthlogin = function(provider) {
    login(provider, {
      rememberMe: true
    });
  };

  $scope.passwordLogin = function(email, pass) {
    $rootScope.user = {uid: 'simplelogin:15'};
    $state.go('home');
    // login('password', {
    //   email: email,
    //   password: pass,
    //   rememberMe: true
    // });
  };

  $scope.create = function() {
    $state.go('create');
  };

  $scope.createAccount = function(email, pass, confirm) {
    $scope.err = null;
    if( !pass ) {
      $scope.err = 'Please enter a password';
    }
    else if( pass !== confirm ) {
      $scope.err = 'Passwords do not match';
    }
    else {
      simpleLogin.createAccount(email, pass/*, name*/)
      .then(function() {
        $state.go('create_user');
      }, function(err) {
        $scope.err = err;
      });
    }
  };

  function login(provider, opts) {
    $scope.err = null;
    simpleLogin.login(provider, opts).then(
      function() {
      $state.go('home');
    },
    function(err) {
      $scope.err = err;
    }
    );
  }
}]);
