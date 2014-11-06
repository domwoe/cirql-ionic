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

                var room = $state.params.roomId;
                
                var promise = netatmoService.getNetatmo(room);

                promise.then(function(hasNetatmo) {

                    if ( hasNetatmo ) {
                        $state.go('app.netatmo', {roomId: $state.params.roomId});
                    }
                    else if (netatmoService.isConnected()) {
                        $state.go('app.addNetatmo', {roomId: $state.params.roomId});
                    } else {
                        // $window(netatmoService.authorizeUrl);
                    }

                });
                
                    

            }

        };


}]);