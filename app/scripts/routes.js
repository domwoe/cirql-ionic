'use strict';
/**
 * @ngdoc overview
 * @name cirqlApp:routes
 * @description
 * # routes.js
 */
angular.module('cirqlApp')

.config(function($stateProvider, $urlRouterProvider) {
  var resolve = {
    auth: function($q, $timeout, Auth, User) {
      var defer = $q.defer();
      var state = this;

      Auth.getCurrentUser().then(function() {
        User.loadCurrentUser().then(function() {
          if (state.name === 'change-password') {
            defer.resolve();
          } else {
            if (User.hasChangedPassword()) {
              defer.resolve();
            } else {
              defer.reject('change-password');
            }
          }
        });
      }, function() {
        $timeout(function() { // See: http://stackoverflow.com/q/24945731/247243
          defer.reject('login');
        }, 250);
      });

      return defer.promise;
    }
  };
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'SideMenuCtrl'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('create', {
      url: '/create',
      templateUrl: 'templates/create.html',
      controller: 'CreateCtrl'
    })

    .state('create.user', {
      url: '/user',
      views: {
        'menuContent' :{
          templateUrl: 'templates/create_user.html'
        }
      }
    })

    .state('app.home', {
      url: '/home',
      views: {
        'menuContent' :{
          templateUrl: 'templates/home.html'
        }
      }
    })
    .state('app.room', {
      url: '/rooms/:roomId',
      views: {
        'menuContent' :{
          templateUrl: 'templates/room.html',
          controller: 'RoomCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
})
