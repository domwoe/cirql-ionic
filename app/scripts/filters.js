'use strict';

angular.module('cirqlApp')
    .filter( 'customTime', function() {
	return function( input ) {
		var date = new Date(input);
		var hour = date.getHours();
		var min = date.getMinutes();
		return hour+':'+min;
	};
});