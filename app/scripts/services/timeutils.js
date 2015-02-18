'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:timeutils
 * @description
 * # time utilities
 */

angular.module('cirqlApp').factory('timeutils', function() {
    return {
        isOld: function(date) {
            var now = Date.now();
            var timestamp = (new Date(date)).getTime();
            return (now - timestamp) >= 30 * 60 * 1000;

        }
    }
});