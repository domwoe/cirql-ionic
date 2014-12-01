'use strict';
/**
 * @ngdoc overview
 * @name cirqlApp:routes
 * @description
 * # routes.js
 */
angular.module('cirqlApp')

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('create', {
      url: '/create',
      templateUrl: 'templates/create.html',
      controller: 'LoginCtrl'
    })

    .state('wizard', {
      url: '/wizard',
      abstract: true,
      template: '<ion-nav-view/>',
      controller: 'WizardCtrl',
      resolve: {
        // controller will not be invoked until getCurrentUser resolves
        'user': ['simpleLogin', function(simpleLogin) {
          // simpleLogin refers to our $firebaseSimpleLogin wrapper in the example above
          // since $getCurrentUser returns a promise resolved when auth is initialized,
          // we can simple return that here to ensure the controller waits for auth before
          // loading
          return simpleLogin.getUser();
        }]
      }
    })

    .state('wizard.resident', {
      url: '/resident',
      templateUrl: 'templates/wizard_resident.html',
      controller: 'WizardCtrl'
    })

    .state('wizard.home', {
      url: '/home',
      templateUrl: 'templates/wizard_home.html',
      controller: 'WizardCtrl'
    })

    .state('wizard.room', {
      url: '/room',
      templateUrl: 'templates/wizard_room.html',
      controller: 'WizardCtrl'
    })

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'SideMenuCtrl',
      resolve: {
        // controller will not be invoked until getCurrentUser resolves
        'user': ['simpleLogin', function(simpleLogin) {
          // simpleLogin refers to our $firebaseSimpleLogin wrapper in the example above
          // since $getCurrentUser returns a promise resolved when auth is initialized,
          // we can simple return that here to ensure the controller waits for auth before
          // loading
          return simpleLogin.getUser();
        }]
      }
    })

    .state('app.home', {
      url: '/home',
      views: {
        'menuContent' :{
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl'
        }
      }
    })

    .state('app.user', {
      url: '/user',
      views: {
        'menuContent' :{
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl'
        }
      }
    })

    .state('app.resident', {
      url: '/resident',
      views: {
        'menuContent' :{
          templateUrl: 'templates/resident.html',
          controller: 'ResidentCtrl'
        }
      }
    })

    .state('app.gateway', {
      url: '/gateway',
      views: {
        'menuContent' :{
          templateUrl: 'templates/gateway.html',
          controller: 'GatewayCtrl'
        }
      }
    })

    .state('app.addRoom', {
      url: '/rooms/add',
      views: {
        'menuContent' :{
          templateUrl: 'templates/add_room.html',
          controller: 'RoomCtrl'
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
    })

    .state('app.schedule', {
      url: '/rooms/:roomId/schedule',
      views: {
        'menuContent' :{
          templateUrl: 'templates/schedule.html',
          controller: 'ScheduleCtrl'
        }
      }
    })

    .state('app.thermostats', {
      url: '/rooms/:roomId/thermostats',
      views: {
        'menuContent' :{
          templateUrl: 'templates/thermostats.html',
          controller: 'ThermostatsCtrl'
        }
      }
    })

    .state('app.netatmo', {
      url: '/rooms/:roomId/netatmo',
      views: {
        'menuContent' :{
          templateUrl: 'templates/netatmo.html',
          controller: 'NetatmoCtrl'
        }
      }
    })

    .state('app.addNetatmo', {
      url: '/rooms/:roomId/netatmo/add',
      views: {
        'menuContent' :{
          templateUrl: 'templates/add_netatmo.html',
          controller: 'NetatmoCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
