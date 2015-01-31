'use strict';
/**
 * @ngdoc overview
 * @name cirqlApp:routes
 * @description
 * # routes.js
 */
angular.module('cirqlApp')

.config(function($stateProvider, $urlRouterProvider, $translateProvider) {
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
            'user': ['simpleLogin',
                function(simpleLogin) {
                    // simpleLogin refers to our $firebaseSimpleLogin wrapper in the example above
                    // since $getCurrentUser returns a promise resolved when auth is initialized,
                    // we can simple return that here to ensure the controller waits for auth before
                    // loading
                    return simpleLogin.getUser();
                }
            ]
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
            'user': ['simpleLogin',
                function(simpleLogin) {
                    // simpleLogin refers to our $firebaseSimpleLogin wrapper in the example above
                    // since $getCurrentUser returns a promise resolved when auth is initialized,
                    // we can simple return that here to ensure the controller waits for auth before
                    // loading
                    return simpleLogin.getUser();
                }
            ]
        }
    })

    .state('app.home', {
        url: '/home',
        views: {
            'menuContent': {
                templateUrl: 'templates/home.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('app.home_settings', {
        url: '/settings',
        views: {
            'menuContent': {
                templateUrl: 'templates/home_settings.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('app.resident', {
        url: '/resident',
        views: {
            'menuContent': {
                templateUrl: 'templates/resident.html',
                controller: 'ResidentCtrl'
            }
        }
    })

    .state('app.resident_settings', {
        url: '/user',
        views: {
            'menuContent': {
                templateUrl: 'templates/resident_settings.html',
                controller: 'ResidentCtrl'
            }
        }
    })

    .state('app.gateway', {
        url: '/gateway/:home',
        views: {
            'menuContent': {
                templateUrl: 'templates/gateway.html',
                controller: 'GatewayCtrl'
            }
        }
    })

    .state('app.addRoom', {
        url: '/rooms/add',
        views: {
            'menuContent': {
                templateUrl: 'templates/add_room.html',
                controller: 'WizardCtrl'
            }
        }
    })

    .state('app.room', {
        url: '/rooms/:roomId',
        views: {
            'menuContent': {
                templateUrl: 'templates/room.html',
                controller: 'RoomCtrl'
            }
        }
    })

    .state('app.activity', {
        url: '/rooms/:roomId/activity',
        views: {
            'menuContent': {
                templateUrl: 'templates/activity.html',
                controller: 'ActivityCtrl'
            }
        }
    })

    .state('app.room_settings', {
        url: '/rooms/:roomId/settings',
        views: {
            'menuContent': {
                templateUrl: 'templates/room_settings.html',
                controller: 'RoomCtrl'
            }
        }
    })

    .state('app.schedule', {
        url: '/rooms/:roomId/schedule',
        views: {
            'menuContent': {
                templateUrl: 'templates/schedule.html',
                controller: 'ScheduleCtrl'
            }
        }
    })

    .state('app.thermostats', {
        url: '/rooms/:roomId/thermostats/:fromRoom',
        views: {
            'menuContent': {
                templateUrl: 'templates/thermostats.html',
                controller: 'ThermostatsCtrl'
            }
        }
    })

    .state('app.netatmo', {
        url: '/rooms/:roomId/netatmo',
        views: {
            'menuContent': {
                templateUrl: 'templates/netatmo.html',
                controller: 'NetatmoCtrl'
            }
        }
    })

    .state('app.addNetatmo', {
        url: '/rooms/:roomId/netatmo/add',
        views: {
            'menuContent': {
                templateUrl: 'templates/add_netatmo.html',
                controller: 'NetatmoCtrl'
            }
        }
    })

    .state('app.chat', {
        url: '/chat',
        views: {
            'menuContent': {
                templateUrl: 'templates/chat.html',
                controller: 'ChatCtrl'
            }
        }
    });
    // if none of the above states are matched, use this as the fallback
    //$urlRouterProvider.otherwise('/app/home');

    $translateProvider.translations('en', {
        ROOM: 'Room',
        BACK: 'Back',
        NEXT: 'Next',
        SAVE: 'Save',
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
        GIVE_ROOM_NAME: 'Room name',
        CATEGORY: 'Category',
        ADD_ROOM: 'Add Room',
        CREATE_ACCOUNT_TITLE: 'Create account',
        CREATE_ACCOUNT_HEADER: 'Create your account',
        PASSWORD: 'Password',
        RETYPE_PASSWORD: 'Retype Password',
        ABOUT_YOUR_HOME: 'Tell us about your home',
        GIVE_HOME_NAME: 'Give your home a name',
        HOME_ADDRESS: 'Address',
        HOME_CITY: 'City',
        HOME_POSTCODE: 'Postcode',
        HOME_COUNTRY: 'Country',
        HOME_SETTINGS: 'Home Settings',
        ENTER_GATEWAY_ID: 'Enter your Gateway id to connect it with your account',
        ADD_GATEWAY: 'Add Gateway',
        CIRQL_HEADER: 'Connected intelligent room climate',
        OR: 'OR',
        CREATE_NEW_ACCOUNT: 'Create New Account',
        SELECT_USER: 'Select User',
        NEW_DEVICE_MSG: 'It seems you logged in from a new device. Please select your user',
        CREATE_NEW_USER: 'Create a new user',
        ENTER_NAME: 'Enter your name',
        SCHEDULE: 'Schedule',
        THERMOSTATS: 'Thermostats',
        LOGOUT: 'Log Out',
        ROOM_SETTINGS: 'Room Settings',
        SETTINGS: 'Settings',
        REMOVE_ROOM: 'Remove Room',
        REMOVE_ROOM_CONFIRM_TEXT: 'Are you sure you want to remove this room from your account?',
        RESIDENT_BINDING_MSG: 'Select users whose location should be considered in AutoAway mode',
        SORRY: 'Sorry',
        NO_GEO_ALERT: "doesn't share the location.",
        ACTIVITY: 'Activity',
        BATH_ROOM: 'bath room',
        BEDROOM: 'bedroom',
        LIVINGROOM: 'livingroom',
        OFFICE: 'office',
        RESIDENT_SETTINGS: 'User Settings',
        RESIDENT_SETTINGS_HEADER: 'Your User',
        SELECT_AVATAR: 'select your avatar',
        ALLOW_GEO_TEXT: 'Let Cirql detect if you are away and save energy',
        TODAY: 'Today',
        YESTERDAY: 'Yesterday',
        MORE: 'more',
        MANUAL: 'MANUAL',
        SCHEDULEMODE: 'SCHEDULE',
        NO_AUTOAWAY_BECAUSE_MANU_ALERT: 'AutoAway is only possible in schedule mode',
        NO_AUTOAWAY_BECAUSE_NO_RESIDENT_ALERT: 'No user bound to this room',
        ME: 'me',
        CHAT: 'Chat',
        TYPE_MESSAGE: 'Type your message'



    });
    $translateProvider.translations('de', {
        ROOM: 'Raum',
        BACK: 'Zurück',
        NEXT: 'Weiter',
        SAVE: 'Speichern',
        CANCEL: 'Abbruch',
        HOME: 'Übersicht',
        LOADING: 'Lädt',
        OFFLINE: "Du bist leider nicht mit dem Internet verbunden!",
        REMOVE: 'Entferne',
        REMOVE_FROM: 'Entferne aus',
        ADD_TO: 'Hinzufügen zu',
        NO_THERMOSTATS: 'Es sind keine nicht verbundenen Thermostate verfügbar',
        ADD_THERMOSTAT: 'Thermostat hinzufügen',
        PAIR_THERMOSTAT: 'Neues Thermostat verbinden',
        AIR_QUALITY: 'Luftqualität',
        HUMIDITY: 'Luftfeuchtigkeit',
        ADD_ROOM_TITLE: 'Raum anlegen',
        ADD_ROOM_HEADER: 'Lege einen neuen Raum an',
        GIVE_ROOM_NAME: 'Raumname',
        CATEGORY: 'Kategorie',
        ADD_ROOM: 'Raum anlegen',
        CREATE_ACCOUNT_TITLE: 'Neues Konto',
        CREATE_ACCOUNT_HEADER: 'Lege ein neues Konto an',
        PASSWORD: 'Passwort',
        RETYPE_PASSWORD: 'Wiederhole Passwort',
        ABOUT_YOUR_HOME: 'Wo bist du zuhause?',
        GIVE_HOME_NAME: 'Gib deinem Zuhause einen Namen',
        HOME_ADDRESS: 'Strasse und Hausnummer',
        HOME_CITY: 'Ort',
        HOME_POSTCODE: 'PLZ',
        HOME_COUNTRY: 'Land',
        HOME_SETTINGS: 'Zuhause einstellen',
        ENTER_GATEWAY_ID: 'Gib deine Gateway Id ein um dein Gateway mit deinem Konto zu verbinden',
        ADD_GATEWAY: 'Füge Gateway hinzu',
        CIRQL_HEADER: 'Dein intelligentes Raumklima',
        OR: 'ODER',
        CREATE_NEW_ACCOUNT: 'Neues Konto anlegen',
        SELECT_USER: 'Benutzer auswählen',
        NEW_DEVICE_MSG: 'Du hast dich mit einem unbekannten Gerät angemeldet. Bitte wähle deinen Nutzer aus.',
        CREATE_NEW_USER: 'Neuen Nutzer anlegen',
        ENTER_NAME: 'Gib deinen Namen ein',
        SCHEDULE: 'Zeitplan',
        THERMOSTATS: 'Thermostate',
        LOGOUT: 'Abmelden',
        ROOM_SETTINGS: 'Raumeinstellungen',
        SETTINGS: 'Einstellungen',
        REMOVE_ROOM: 'Raum löschen',
        REMOVE_ROOM_CONFIRM_TEXT: 'Bist du sicher, dass du diesen Raum löschen möchtest?',
        RESIDENT_BINDING_MSG: 'Wähle aus, von welchen Nutzern die Anwesenheitsdaten einbezogen werden, wenn AutoAway aktiviert ist',
        SORRY: 'Entschuldige',
        NO_GEO_ALERT: 'hat die Anwesenheitsdaten leider nicht verfügbar gemacht.',
        ACTIVITY: 'Aktivitäten',
        BATH_ROOM: 'Badezimmer',
        BEDROOM: 'Schlafzimmer',
        LIVINGROOM: 'Wohnzimmer',
        OFFICE: 'Büro',
        RESIDENT_SETTINGS: 'Benutzereinstellungen',
        RESIDENT_SETTINGS_HEADER: 'Dein Benutzer',
        SELECT_AVATAR: 'Wähle dein Avatar',
        ALLOW_GEO_TEXT: 'Erlaube Cirql festzustellen wenn du nicht zuhause bist und spare Energie',
        TODAY: 'Heute',
        YESTERDAY: 'Gestern',
        MORE: 'mehr',
        MANUAL: 'MANUELL',
        SCHEDULEMODE: 'ZEITPLAN',
        NO_AUTOAWAY_BECAUSE_MANU_ALERT: 'AutoAway ist nur im Zeitplan-Modus möglich',
        NO_AUTOAWAY_BECAUSE_NO_RESIDENT_ALERT: 'Diesem Raum ist kein Nutzer zugeordnet',
        ME: 'Ich',
        CHAT: 'Chat',
        TYPE_MESSAGE: 'Schreib eine Nachricht'
    });

    $translateProvider.preferredLanguage('de');
    $translateProvider.fallbackLanguage('en');

});
