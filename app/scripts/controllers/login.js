'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
    .controller('LoginCtrl', ['$scope', '$localStorage', '$state', '$ionicLoading', 'simpleLogin', '$cordovaSplashscreen', '$timeout', '$ionicPopup', '$translate','$filter',
        function($scope, $localStorage, $state, $ionicLoading, simpleLogin, $cordovaSplashscreen, $timeout, $ionicPopup, $translate, $filter) {

            if ($localStorage.user) {
                console.log('Redirect to home');
                $state.go('app.home');
            }

            if (navigator.splashscreen) {
                if (navigator.splashscreen) {
                    $timeout(function() {
                        $cordovaSplashscreen.hide();
                    }, 500);
                }
            }




            $scope.user = {
                email: 'test',
                password: '',
                confirm: '' 
            };



            $scope.errorMessage = null;

            $scope.login = function() {
                $scope.errorMessage = null;

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
                setTimeout($ionicLoading.hide,5000);



                simpleLogin.login($scope.user.email, $scope.user.password)
                    .then(function() {
                        $state.go('resident');
                    })
                    .catch(handleLoginError);
            };

            $scope.createAccount = function() {
                $scope.errorMessage = null;
                if (!$scope.user.email || !$scope.user.password) {
                    $scope.errorMessage = 'Please enter email and password';
                } else if ($scope.user.password !== $scope.user.confirm) {
                    $scope.errorMessage = 'Passwords do not match';
                } else {
                    $ionicLoading.show({
                        template: 'Please wait...'
                    });

                    simpleLogin.createAccount(
                        $scope.user.email,
                        $scope.user.password
                    )
                        .then(function() {
                            $state.go('wizard.resident');
                        })
                        .catch(handleCreationError);
                }
            };

            function handleLoginError(error) {
                switch (error.code) {
                    case 'INVALID_EMAIL':
                    case 'INVALID_PASSWORD':
                    case 'INVALID_USER':
                        $scope.errorMessage = 'Email or password is incorrect';
                        break;
                    default:
                        $scope.errorMessage = 'Error: [' + error.code + ']';
                }
                $ionicLoading.hide();
            }

            function handleCreationError(error) {
                console.log(error.code);
                switch (error.code) {
                    case 'EMAIL_TAKEN':
                        $scope.errorMessage = 'Email is already taken';
                        break;
                    case 'INVALID_EMAIL':
                        $scope.errorMessage = 'Email is incorrect';
                        break;
                    case 'INVALID_PASSWORD':
                        $scope.errorMessage = 'Password is incorrect';
                        break;
                    default:
                        $scope.errorMessage = 'Error: [' + error.code + ']';
                }
                $ionicLoading.hide();
            }

            $scope.resetPassword = function(email) {
                simpleLogin.resetPassword(email)
                    .then(function() {
                        $scope.showConfirm();
                    })
                    .catch(handleCreationError);
            };

            var translate = $filter('translate');
            var language = $translate.use();
            if (language !== 'de') {
                language = 'en';
            }

            $scope.showConfirm = function() {
                $ionicPopup.show({
                    template: '<p>' + translate('EMAIL_SENT_TEXT') + '</p>',
                    title: translate('EMAIL_SENT'),
                    subTitle: '',
                    scope: $scope,
                    buttons: [{
                        text: 'OK',
                        type: 'button-block button-dark transparent',
                    }]
                });
            };

            $scope.goBack = function() {
                $state.go('login');
            };
        }
    ]);
