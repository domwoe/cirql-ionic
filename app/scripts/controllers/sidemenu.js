'use strict';

angular.module('cirqlApp')
.controller('SideMenuCtrl', ['$scope', 'user', '$state', '$window', 'simpleLogin', 'netatmoService',
    function($scope, user, $state, $window, simpleLogin, netatmoService) {

        $scope.logout = function() {
            simpleLogin.logout();
            $state.go('login');
        };

        $scope.room = $state.params.roomId;

        $scope.goToSchedule = function() {
            var cordova = cordova || null;
            if (cordova) {
                var so = cordova.plugins.screenorientation;
                so.setOrientation('landscape');
            }    
            $state.go('app.schedule', {roomId: $state.params.roomId} );
        }; 

        $scope.netatmo = function() {
            if ($state.params.hasOwnProperty('roomId')) {


                var room = $state.params.roomId;
                
                var promise = netatmoService.getNetatmo(room,user.uid);

                promise.then(function(hasNetatmo) {

                    console.log('hasNetatmo: '+hasNetatmo);

                    if ( hasNetatmo ) {
                        $state.go('app.netatmo', {roomId: $state.params.roomId});
                    }
                    else {
                        var isConPromise = netatmoService.isConnected(user.uid);
                        isConPromise.then(function(isConnected) {
                            console.log('isConnected: ' + isConnected);
                            if ( isConnected ) {
                                $state.go('app.addNetatmo', {roomId: $state.params.roomId});
                            }
                        },
                        function(reject) {
                            console.log('reject');
                            $window(netatmoService.authorizeUrl(user.uid));

                        });
                    }    
                });              
                    
            }

        };

        $scope.isRoom = function() {
           if ( $state.current.name === 'app.room' ) {
            return true;
           }
           return false;
        }

        $scope.isHome = function() {
           if ( $state.current.name === 'app.home' ) {
            return true;
           }
           return false;
        }



}]);