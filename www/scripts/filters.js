'use strict';

angular.module('cirqlApp')
    .filter('toDate', function() {
        return function(input) {
            return new Date(input);
        };
    })

.filter('toDay', function() {
    return function(input) {
        var date = new Date(input);
        var d = new Date();
        var d1 = new Date();
        d1.setDate(d1.getDate() - 1);

        if (d.toDateString() === date.toDateString()) {
            return 'TODAY';
        } else if (d1.toDateString() === date.toDateString()) {
            return 'YESTERDAY';
        } else {
            return date.toDateString();
        }
    };
});