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
                console.log(netatmoService.hasNetatmo(room))

                if (netatmoService.hasNetatmo(room)) {
                    $state.go('app.room.netatmo');
                } else if (netatmoService.isConnected()) {
                    $state.go('app.room.addNetatmo');
                } else {
                    $window(netatmoService.authorizeUrl);
                }

            }

        }


}]);