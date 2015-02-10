'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:roomDetailService
 * @description
 * # roomDetailService
 * Serviec of cirqlApp to pass down room which has been selected from home view
 */

angular.module('cirqlApp').service('roomDetailService',function() {
    var room;
    return {
        getRoom: function() {
            return room;
        },
        setRoom: function(value) {
            room = value;
        }
    };
});