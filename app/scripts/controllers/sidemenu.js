'use strict';

angular.module('cirqlApp')
    .controller('SideMenuCtrl', ['$rootScope', '$scope', 'user', '$state', 'simpleLogin', 'netatmoService', 'fbutil', '$ionicPopup', '$ionicLoading', '$timeout', '$ionicSideMenuDelegate', 'deviceDetector', '$cordovaPush', '$translate',
        function($rootScope, $scope, user, $state, simpleLogin, netatmoService, fbutil, $ionicPopup, $ionicLoading, $timeout, $ionicSideMenuDelegate, deviceDetector, $cordovaPush, $translate) {

            $scope.logout = function() {
                simpleLogin.logout();
                $state.go('login');
            };

            function showLoading() {
                $ionicLoading.show({
                    template: '<div class="sk-spinner sk-spinner-circle">' +
                        '<div class="sk-circle1 sk-circle"></div>' +
                        '<div class="sk-circle2 sk-circle"></div>' +
                        '<div class="sk-circle3 sk-circle"></div>' +
                        '<div class="sk-circle4 sk-circle"></div>' +
                        '<div class="sk-circle5 sk-circle"></div>' +
                        '<div class="sk-circle6 sk-circle"></div>' +
                        '<div class="sk-circle7 sk-circle"></div>' +
                        '<div class="sk-circle8 sk-circle"></div>' +
                        '<div class="sk-circle9 sk-circle"></div>' +
                        '<div class="sk-circle10 sk-circle"></div>' +
                        '<div class="sk-circle11 sk-circle"></div>' +
                        '<div class="sk-circle12 sk-circle"></div>' +
                        '</div>'
                });
            }


            if (user) {
                $scope.user = user;
                // redirect to select resident if not set
                if (!user.residentId) {
                    $state.go('resident');
                    console.log('go to resident');
                } else {
                    //initialize counter for unread messages
                    $scope.messageCount = fbutil.syncObject('chat/' + user.uid + '/messageCount');
                    $scope.messageRead = fbutil.syncObject('chat/' + user.uid + '/state/' + user.residentId + '/numberOfRead');
                }
                $scope.residents = fbutil.syncArray('homes/' + user.uid + '/residents');

                $scope.resident = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId);

                $scope.room = $state.params.roomId;

                fbutil.ref('homes/' + user.uid + '/isSuperuser').once('value', function(fbIsSuperuser) {
                    if (fbIsSuperuser.val() === true) {

                        $rootScope.isSuperuser = true;

                    } else {

                        $rootScope.isSuperuser = false;
                    }
                });

                fbutil.ref('homes/' + user.uid + '/disabledAnalytics').once('value', function(fbDisabledAnalytics) {
                    if (fbDisabledAnalytics.val() === true) {

                        $rootScope.disabledAnalytics = true;

                    } else {

                        $rootScope.disabledAnalytics = false;
                    }
                });



                $rootScope.$watch('room', function(room) {

                    if (room) {

                        $scope.room = room;


                        if (room) {
                            if ($scope.usesAutoAway) {
                                $scope.usesAutoAway.$destroy();
                            }
                            if ($scope.mode) {
                                $scope.mode.$destroy();
                            }

                            if ($scope.boundResidents) {
                                $scope.boundResidents.$destroy();

                            }

                            $scope.usesAutoAway = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/usesAutoAway');

                            $scope.mode = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/mode');

                            boundResidents = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/residents');
                            $scope.boundResidents = boundResidents;


                        }
                    }
                });
            } else {
                $state.go('login');
            }

            var boundResidents = null;

            $scope.showWhyAutoAwayIsDisabled = function() {

                // if ($scope.mode.$value === 'manu') {

                //     $ionicPopup.alert({
                //         template: '{{"NO_AUTOAWAY_BECAUSE_MANU_ALERT" | translate}}'
                //     });
                if (!$scope.hasBoundResidents()) {

                    $ionicPopup.alert({
                        template: '{{"NO_AUTOAWAY_BECAUSE_NO_RESIDENT_ALERT" | translate}}'
                    });
                }

            };


            function disableAutoAway() {
                if ($scope.usesAutoAway && $scope.usesAutoAway.$value === true) {
                    $scope.usesAutoAway.$value = false;
                    $scope.usesAutoAway.$save();
                }
            }

            $scope.isBoundResident = function(resident) {
                return resident.rooms && resident.rooms[$scope.room] && resident.allowsGeolocation;
            };

            $scope.hasBoundResidents = function() {
                var hasBoundResidents = false;

                for (var resident in boundResidents) {
                    if (boundResidents[resident] === true || boundResidents[resident] === false) {

                        hasBoundResidents = hasBoundResidents || boundResidents[resident];


                    }
                }

                return hasBoundResidents;
            };

            $scope.toggleBoundResident = function(resident) {

                if (boundResidents === undefined) {
                    boundResidents = {};
                } else {

                    if (resident.rooms !== undefined) {

                        if (!resident.allowsGeolocation && !resident.rooms[$scope.room]) {

                            $ionicPopup.alert({
                                template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                            });

                        } else {

                            if (resident.rooms[$scope.room] !== undefined) {
                                resident.rooms[$scope.room] = !resident.rooms[$scope.room];
                            } else {
                                resident.rooms[$scope.room] = true;
                            }

                        }


                    } else {
                        if (resident.allowsGeolocation) {
                            resident.rooms = {};
                            resident.rooms[$scope.room] = true;
                        }
                    }

                    $scope.residents.$save(resident);
                    boundResidents[resident.$id] = resident.rooms[$scope.room];
                    boundResidents.$save();

                    if ($scope.hasBoundResidents() === false) {
                        console.log($scope.hasBoundResidents());
                        disableAutoAway();
                    }

                }

            };

            function addRawActivity() {

                var date = new Date();

                var activity = {
                    date: date.toString(),
                    type: 'auto-away',
                    value: $scope.usesAutoAway.$value,
                    name: $scope.residents.$getRecord(user.residentId).name
                };

                if ($scope.room) {

                    fbutil.ref('homes/' + user.uid + '/activity/' + $scope.room + '/raw').push(activity);
                    console.log('Activity added:' + JSON.stringify(activity));
                }
            }

            $scope.changeAutoAway = function() {

                // sync autoAway with firebase
                // 
                console.log($scope.usesAutoAway);

                if ($scope.usesAutoAway.hasOwnProperty('$value') && ($scope.usesAutoAway.$value === true || $scope.usesAutoAway.$value === false)) {
                    $scope.usesAutoAway.$save();
                }

                // write to activity log
                addRawActivity();

            };

            $scope.goToSchedule = function() {
                showLoading();
                $ionicSideMenuDelegate.toggleLeft();
                $timeout(function() {
                    $state.go('app.schedule', {
                        roomId: $scope.room
                    });
                }, 300);
            };

            $scope.netatmo = function() {


                var promise = netatmoService.getNetatmo($scope.room, user.uid);

                promise.then(function(hasNetatmo) {

                    if (hasNetatmo) {
                        $state.go('app.netatmo', {
                            roomId: $scope.room
                        });
                    } else {
                        var isConPromise = netatmoService.isConnected(user.uid);
                        isConPromise.then(function(isConnected) {
                                console.log('isConnected: ' + isConnected);
                                if (isConnected) {
                                    $state.go('app.addNetatmo', {
                                        roomId: $scope.room
                                    });
                                }
                            },
                            // No Netato account connected
                            function() {
                                netatmoService.authorizeUrl(user.uid).then(function(url) {
                                    window.open(url, '_blank', 'location=yes');
                                });


                            });
                    }
                });



            };

            $scope.isRoom = function() {
                if ($state.current.name === 'app.room') {
                    return true;
                }
                return false;
            };

            $scope.isHome = function() {
                if ($state.current.name === 'app.home') {
                    return true;
                }
                return false;
            };

            function registerDeviceForPushNotifications(config) {

                console.log('Register device for push notifications');

                // Register device to receive push notifications
                $cordovaPush.register(config).then(function(deviceToken) {

                    // LE.log({
                    //     homeid: user.uid,
                    //     residentid: user.residentId,
                    //     device: $rootScope.device,
                    //     obj: 'cordovaPush',
                    //     method: 'register',
                    //     deviceToken: deviceToken
                    // });
                    console.log('Token: ' + deviceToken);

                    //var translate = $filter('translate');
                    var language = $translate.use();
                    if (language !== 'de') {
                        language = 'en';
                    }

                    if (deviceToken && deviceToken.length > 0) {

                        // Store device and deviceToken

                        fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/notification/devices/' + deviceDetector.os + '/token').set(deviceToken);
                        fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/notification/devices/' + deviceDetector.os + '/language').set(language);
                    }


                }, function(err) {

                    // LE.log({
                    //     homeid: user.uid,
                    //     residentid: user.residentId,
                    //     device: $rootScope.device,
                    //     obj: 'cordovaPush',
                    //     method: 'register',
                    //     error: err
                    // });

                    console.log(err);

                });
            }


            if (deviceDetector.os === 'ios') {

                var config = {
                    badge: false,
                    sound: true,
                    alert: true
                };
                registerDeviceForPushNotifications(config);

            } else if (deviceDetector.os === 'android') {

                var config = {
                    senderID: 'AIzaSyBJvwczrzvZU9lu8istqgkV-IWXJea7SIA'
                };
                registerDeviceForPushNotifications(config);
            }



        }
    ]);