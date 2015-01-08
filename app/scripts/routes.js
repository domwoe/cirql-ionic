'use strict';
/**
 * @ngdoc overview
 * @name cirqlApp:routes
 * @description
 * # routes.js
 */
angular.module('cirqlApp')

.config(function($stateProvider, $urlRouterProvider,$translateProvider) {
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

    .state('app.holiday', {
      url: '/holiday',
      views: {
        'menuContent' :{
          templateUrl: 'templates/holiday.html',
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
      url: '/gateway/:home',
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
          controller: 'WizardCtrl'
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

    .state('app.room_settings', {
      url: '/rooms/:roomId/settings',
      views: {
        'menuContent' :{
          templateUrl: 'templates/room_settings.html',
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
      url: '/rooms/:roomId/thermostats:/fromRoom',
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

  $translateProvider.translations('en', {
    ROOM: 'Room',
    BACK: 'Back',
    NEXT: 'Next',
    CANCEL: 'Cancel',
    HOME: 'Home',
    LOADING: 'Loading',
    OFFLINE: "You're not connected to the Internet!",
    REMOVE: 'Remove',
    REMOVE_FROM: 'Remove from',
    ADD_TO: 'Add to',
    NO_THERMOSTATS: 'There are no unassigned paired thermostats available',
    ADD_THERMOSTAT: 'Add Thermostat',
    PAIR_THERMOSTAT: 'Pair new Thermostat',
    AIR_QUALITY: 'Air Quality',
    HUMIDITY: 'Humidity',
    ADD_ROOM_TITLE: 'Add Room',
    ADD_ROOM_HEADER: 'Add a room to your home',
    GIVE_ROOM_NAME: 'Give your room a name',
    CATEGORY: 'Category',
    ADD_ROOM: 'Add Room',
    CREATE_ACCOUNT_TITLE: 'Create account',
    CREATE_ACCOUNT_HEADER: 'Create your account',
    PASSWORD: 'Password',
    RETYPE_PASSWORD: 'Retype Password',
    ENTER_GATEWAY_ID: 'Enter your Gateway id to connect it with your account',
    ADD_GATEWAY: 'Add Gateway',
    CIRQL_HEADER: 'Connected intelligent room climate',
    OR: 'OR',
    CREATE_NEW_ACCOUNT: 'Create New Account',
    NEW_DEVICE_MSG: 'It seems you logged in from a new device. Please select your user',
    CREATE_NEW_USER: 'Create a new user',
    ENTER_NAME: 'Enter your name',
    SCHEDULE: 'Schedule',
    THERMOSTATS: 'Thermostats',
    LOGOUT: 'Log Out',
    ROOM_SETTINGS: 'Room Settings',
    REMOVE_ROOM: 'Remove Room',
    RESIDENT_BINDING_MSG: 'Select users whose location should be considered in AutoAway mode',
    SORRY: 'Sorry',
    NO_GEO_ALERT: "doesn't share the location."

  });
  $translateProvider.translations('de', {
    ROOM: 'Raum',
    BACK: 'Zurück',
    NEXT: 'Weiter',
    CANCEL: 'Abbruch',
    HOME: 'Übersicht',
    LOADING: 'Lädt',
    OFFLINE: "Du bist leider nicht mit dem Internet verbunden!",
    REMOVE: 'Entferne',
    REMOVE_FROM: 'Entferne aus',
    ADD_TO: 'Hinzufügen zu',
    NO_THERMOSTATS: 'Es sind keine nicht-verbundene Thermostate verfügbar',
    ADD_THERMOSTAT: 'Thermostat hinzufügen',
    PAIR_THERMOSTAT: 'Neues Thermostat verbinden',
    AIR_QUALITY: 'Luftqualität',
    HUMIDITY: 'Luftfeuchtigkeit',
    ADD_ROOM_TITLE: 'Raum anlegen',
    ADD_ROOM_HEADER: 'Lege einen neuen Raum an',
    GIVE_ROOM_NAME: 'Gib deinem Raum einen Namen',
    CATEGORY: 'Kategorie',
    ADD_ROOM: 'Raum hinzufügen',
    CREATE_ACCOUNT_TITLE: 'Neues Konto',
    CREATE_ACCOUNT_HEADER: 'Lege ein neues Konto an',
    PASSWORD: 'Passwort',
    RETYPE_PASSWORD: 'Wiederhole Passwort',
    ENTER_GATEWAY_ID: 'Gib deine Gateway Id ein um dein Gateway mit deinem Konto zu verbinden',
    ADD_GATEWAY: 'Füge Gateway hinzu',
    CIRQL_HEADER: 'Dein intelligentes Raumklima',
    OR: 'ODER',
    CREATE_NEW_ACCOUNT: 'Neues Konto anlegen',
    NEW_DEVICE_MSG: 'Du hast dich mit einem unbekannten Gerät angemeldet. Bitte wählen deinen Nutzer aus',
    CREATE_NEW_USER: 'Neuen Nutzer anlegen',
    ENTER_NAME: 'Gib deinen Namen ein',
    SCHEDULE: 'Zeitplan',
    THERMOSTATS: 'Thermostate',
    LOGOUT: 'Abmelden',
    ROOM_SETTINGS: 'Raumeinstellungen',
    REMOVE_ROOM: 'Raum löschen',
    RESIDENT_BINDING_MSG: 'Wähle aus, von welchen Nutzern die Anwesenheitsdaten einbezogen werden, wenn AutoAway aktiviert ist',
    SORRY: 'Entschuldige',
    NO_GEO_ALERT: 'hat die Anwesenheitsdaten leider nicht verfügbar gemacht.'
  });

  $translateProvider.preferredLanguage('de');
  $translateProvider.fallbackLanguage('en');
});
