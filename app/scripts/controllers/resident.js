'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:ResidentCtrl
 * @description
 * # ResidentCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('ResidentCtrl', ['$scope', '$localStorage', 'user', 'fbutil', '$state', '$ionicLoading', '$cordovaSplashscreen', '$timeout',
        function($scope, $localStorage, user, fbutil, $state, $ionicLoading, $cordovaSplashscreen, $timeout) {

            // hide Loading in case one arrives at this state
            // with a loading screen
            // 
            if (navigator.splashscreen) {
                $timeout(function() {
                    $cordovaSplashscreen.hide();
                });
            } 

            $ionicLoading.hide();

            if (user) {
                $scope.user = user;

            } else {
                $state.go('login');
            }

            function loadResidents(user) {
                if ($scope.home) {
                    $scope.home.$destroy();
                }
                var residents = fbutil.syncArray('homes/' + user.uid + '/residents');
                $scope.residents = residents;
            }
            loadResidents(user);

            function loadResident() {
                if ($localStorage.user.residentId) {
                    var id = $localStorage.user.residentId;
                    var resident = fbutil.syncObject('homes/' + user.uid + '/residents/' + id);
                    $scope.resident = resident;
                }
            }
            loadResident();
            console.log($scope.resident);



            $scope.select = function(resident) {
                $localStorage.user.residentId = resident.$id;
                $state.go('app.home');
            };

            $scope.selectAvatar = function(avatar) {
                $scope.resident.avatar = avatar;
            };

            $scope.isSelected = function(avatar) {
                return $scope.resident.avatar == avatar;
            };

            $scope.name = '';
            $scope.create = function(name) {
                $scope.residents.$add({
                    name: name,
                    isAway: false,
                    allowsGeolocation: true
                })
                    .then(function(ref) {
                        console.log(ref.name());
                        $localStorage.user.residentId = ref.name();
                    })
                    .then(function() {
                        $state.go('app.home');
                    });
            };

            $scope.save = function() {
                $scope.resident.$save()
                    .then(function() {
                        $state.go('app.home');
                    });
            };
        }
    ]);