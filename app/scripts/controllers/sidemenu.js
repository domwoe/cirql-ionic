'use strict';

angular.module('cirqlApp')
    .controller('SideMenuCtrl', ['$scope', 'user', '$state', 'simpleLogin', 'netatmoService', 'fbutil', '$ionicPopup',
        function($scope, user, $state, simpleLogin, netatmoService, fbutil, $ionicPopup) {

            $scope.logout = function() {
                simpleLogin.logout();
                $state.go('login');
            };

            $scope.room = $state.params.roomId;

            if ($scope.room) {
                var usesAutoAway = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/usesAutoAway');
                usesAutoAway.$bindTo($scope, 'usesAutoAway');

                var mode = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/mode');
                mode.$bindTo($scope, 'mode');

                var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
                $scope.residents = residents;

                var boundResidents = fbutil.syncObject('homes/' + user.uid + '/rooms/' + $scope.room + '/residents');
                $scope.boundResidents = boundResidents;

                 var activities = fbutil.syncArray('homes/' + user.uid + '/activity/' + $scope.room + '/raw');
            }

            function disableAutoAway() {
                if ($scope.usesAutoAway && $scope.usesAutoAway.$value) {
                    $scope.usesAutoAway.$value = false;
                }
            }

            $scope.isBoundResident = function(resident) {
                return resident.rooms[$scope.room] && resident.allowsGeolocation;
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

            $scope.addRawActivity = function() {

                var date = new Date();
               
                var activity = {
                    date: date.toString(),
                    type: 'auto-away',
                    value: $scope.usesAutoAway.$value,
                    name: $scope.residents.$getRecord(user.residentId).name
                };

                activities.$add(activity);
                console.log('Activity added:' +JSON.stringify(activity));
            };

            $scope.goToSchedule = function() {
                if (window.screen.hasOwnProperty('lockOrientation')) {
                    window.screen.lockOrientation('landscape');
                }
                $state.go('app.schedule', {
                    roomId: $state.params.roomId
                });
            };

            $scope.netatmo = function() {
                if ($state.params.hasOwnProperty('roomId')) {


                    var room = $state.params.roomId;

                    var promise = netatmoService.getNetatmo(room, user.uid);

                    promise.then(function(hasNetatmo) {

                        console.log('hasNetatmo: ' + hasNetatmo);

                        if (hasNetatmo) {
                            $state.go('app.netatmo', {
                                roomId: $state.params.roomId
                            });
                        } else {
                            var isConPromise = netatmoService.isConnected(user.uid);
                            isConPromise.then(function(isConnected) {
                                    console.log('isConnected: ' + isConnected);
                                    if (isConnected) {
                                        $state.go('app.addNetatmo', {
                                            roomId: $state.params.roomId
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

                }

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