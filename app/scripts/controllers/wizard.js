'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:WizardCtrl
 * @description
 * # WizardCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('WizardCtrl', ['$scope', 'user', 'simpleLogin', 'fbutil', '$state', '$ionicLoading', '$ionicPopup',
        function($scope, user, simpleLogin, fbutil, $state, $ionicLoading, $ionicPopup) {

            $scope.user = user;
            $scope.name = '';
            $scope.resident = {
                name: '',
                avatar: '0',
                allowsGeolocation: false
            };
            $scope.boundResidents = {};
            $scope.logout = simpleLogin.logout;


            if ($scope.home && $scope.home.$destroy) {
                $scope.home.$destroy();
            }


            // If you got to add new room after being in room view $scope.room is populated and can't
            // be edited. This leads to a non responding input field
            if ($scope.room) {
                $scope.room = null;
            }

            var homeSettings = fbutil.syncObject('homes/' + user.uid + '/settings');
            homeSettings.$bindTo($scope, 'homeSettings');

            var rooms = fbutil.syncArray('homes/' + user.uid + '/rooms');
            $scope.rooms = rooms;

            var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
            $scope.residents = residents;

            var templates = fbutil.syncArray('templates');

            $scope.categories = templates;

            rooms.$loaded().then(function() {
                $ionicLoading.hide();

            });

            $scope.selectAvatar = function(avatar) {
              $scope.resident.avatar = avatar;
            };

            $scope.isSelected = function(avatar) {
              return $scope.resident.avatar === avatar;
            };

            $scope.createResident = function() {
                if ($scope.resident.name) {
                    $scope.residents.$add($scope.resident);
                    $scope.user.name = name;
                    console.log(name + ' added');
                    $state.go('wizard.home');
                } else {
                    $scope.errorMessage = 'Please enter a name';
                }
            };

            $scope.createHome = function() {
                $state.go('wizard.room');
            };

            $scope.toggleBoundResident = function(resident) {
                if (!resident.allowsGeolocation) {

                    $ionicPopup.alert({
                        template: resident.name + ' {{"NO_GEO_ALERT" | translate}}'
                    });

                } else {
                    if ($scope.boundResidents[resident.$id] !== undefined) {
                        $scope.boundResidents[resident.$id] = !$scope.boundResidents[resident.$id];
                    } else {
                        $scope.boundResidents[resident.$id] = true;
                    }
                }

            };

            $scope.createRoom = function(name, category, boundResidents) {
                $scope.errorMessage = null;
                if (!name) {
                    $scope.errorMessage = 'Please enter a name';
                } else if (!category) {
                    $scope.errorMessage = 'Please select a category';
                } else {
                    $scope.rooms.$add({
                        name: name,
                        category: category,
                        residents: boundResidents
                    }).then(function(ref) {
                        // save bound room in resident object
                        console.log(ref);
                        console.log(ref.name());
                        for (var residentId in boundResidents) {
                            var resident = residents.$getRecord(residentId);
                            if (resident.rooms === undefined) {
                                resident.rooms = {};
                            }
                            resident.rooms[ref.name()] = boundResidents[residentId];
                            residents.$save(resident);
                        }
                    });
                    console.log(name + ' added');
                    $state.go('app.home');
                }
            };

            // $scope.addThermostat = function() {
            //         $scope.rooms.$add({
            //             name: 'null',
            //             category: 'null'
            //         }).then(function(ref) {
            //             console.log($scope.rooms.$indexFor(ref));
            //             //newRoomId = ref.key();
            //             //console.log(newRoomId);
            //             $state.go('app.thermostats', {roomId: newRoomId});
            //         });


            // };
            /**
             * Go back to home screen
             */
            $scope.goToHome = function() {
                // if (newRoomId && $scope.rooms[newRoomId].name === 'null') {
                //     $scope.rooms.$remove(newRoomId);
                // }
                $state.go('app.home');
            };

        }
    ]);
