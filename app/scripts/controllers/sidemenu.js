'use strict';

angular.module('cirqlApp')
.controller('SideMenuCtrl', ['$scope', '$state', '$window', 'simpleLogin', 'netatmoService',
    function($scope, $state, $window, simpleLogin, netatmoService) {

        $scope.logout = function() {
            simpleLogin.logout();
            $state.go('login');
        };

        $scope.netatmo = function() {
            if ($state.params.hasOwnProperty('roomId')) {

                console.log()

                var room = $state.params.roomId;
                
                var promise = netatmoService.getNetatmo(room);

                promise.then(function(hasNetatmo) {

                    console.log('hasNetatmo: '+hasNetatmo);

                    if ( hasNetatmo ) {
                        $state.go('app.netatmo', {roomId: $state.params.roomId});
                    }
                    else {
                        var isConPromise = netatmoService.isConnected();
                        isConPromise.then(function(isConnected) {
                            console.log('isConnected: ' + isConnected);
                            if ( isConnected ) {
                                 $state.go('app.addNetatmo', {roomId: $state.params.roomId});
                            }
                        },
                        function(reject) {
                            console.log('reject');
                            $window(netatmoService.authorizeUrl);

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