'use strict';

angular.module('cirqlApp')
    .controller('SideMenuCtrl', ['$rootScope', '$scope', 'user', '$state', 'simpleLogin', 'netatmoService', 'fbutil', '$ionicPopup',
        function($rootScope, $scope, user, $state, simpleLogin, netatmoService, fbutil, $ionicPopup) {

            $scope.logout = function() {
                simpleLogin.logout();
                $state.go('login');
            };


            var usesAutoAway = null;
            var residents = null;
            var boundResidents = null;


            $scope.room = $state.params.roomId;

            $rootScope.$watch('room', function(room) {

                $scope.room = room;


                if (room) {
                    if ($scope.usesAutoAway) {
                        $scope.usesAutoAway.$destroy();
                    }
                    if ($scope.mode) {
                        $scope.mode.$destroy();
                    }
                    if ($scope.residents) {
                         $scope.residents.$destroy();
                    }
                    if ($scope.boundResidents) {
                        $scope.boundResidents.$destroy();

                    }





                    $scope.usesAutoAway = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/usesAutoAway');

                    $scope.mode = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/mode');


                    residents = fbutil.syncArray('homes/' + user.uid + '/residents');
                    $scope.residents = residents;

                    boundResidents = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/residents');
                    $scope.boundResidents = boundResidents;


                }
            });

            $scope.showWhyAutoAwayIsDisabled = function() {

                if ($scope.mode.$value === 'manu') {

                    $ionicPopup.alert({
                        template: '{{"NO_AUTOAWAY_BECAUSE_MANU_ALERT" | translate}}'
                    });
                } else if (!$scope.hasBoundResidents()) {

                    $ionicPopup.alert({
                        template: '{{"NO_AUTOAWAY_BECAUSE_NO_RESIDENT_ALERT" | translate}}'
                    });
                }

            };


            function disableAutoAway() {
                if ($scope.usesAutoAway && $scope.usesAutoAway.$value) {
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
            }

            $scope.toggleBoundResident = function(resident) {

                if (boundResidents === undefined) {
                    boundResidents = {};
                } else {

                    if (resident.rooms != undefined) {

                        if (!resident.allowsGeolocation && !resident.rooms[$scope.room]) {

                            $ionicPopup.alert({
                                template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                            });

                        } else {

                            if (resident.rooms[$scope.room] != undefined) {
                                resident.rooms[$scope.room] = !resident.rooms[$scope.room];
                            } else {
                                resident.rooms[$scope.room] = true;
                            }

                        }


                    } else {
                        if (resident.allowsGeolocation) {
                            resident['rooms'] = {};
                            resident.rooms[$scope.room] = true;
                        }
                    }

                    if (!$scope.hasBoundResidents()) {
                        disableAutoAway();
                    }
                    residents.$save(resident);
                    boundResidents[resident.$id] = resident.rooms[$scope.room];
                    boundResidents.$save();

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

                fbutil.ref('homes/' + user.uid + '/activity/' + $scope.room + '/raw').push(activity);
                console.log('Activity added:' + JSON.stringify(activity));
            };


            $scope.changeAutoAway = function() {

                // sync autoAway with firebase 
                $scope.usesAutoAway.$save();

                // write to activity log
                addRawActivity();

            }

            
            $scope.goToSchedule = function() {
                if (window.screen.hasOwnProperty('lockOrientation')) {
                    window.screen.lockOrientation('landscape');
                }
                $state.go('app.schedule', {
                    roomId: $scope.room
                });
            };

            $scope.netatmo = function() {


                var promise = netatmoService.getNetatmo($scope.room, user.uid);

                promise.then(function(hasNetatmo) {

                    console.log('hasNetatmo: ' + hasNetatmo);

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
                            function(reject) {
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
            }

            $scope.isHome = function() {
                if ($state.current.name === 'app.home') {
                    return true;
                }
                return false;
            }



        }
    ]);