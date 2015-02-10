'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:colorForTemperature
 * @description
 * # colorForTemperature
 * Service of cirqlApp to determine color based on temperature
 */

angular.module('cirqlApp').factory('colorForTemperature', function() {
	return {
		get: function(temperature) {
			if (temperature < 16) {
				return '#1F3A93';
			} else if (temperature < 18) {
				return '#22A7F0';
			} else if (temperature < 19) {
				return '#F9BF3B';
			} else if (temperature < 21) {
				return '#F39C12';
			} else if (temperature < 22) {
				return '#F9690E';
			} else if (temperature < 24) {
				return '#F22613';
			} else if (temperature >= 24) {
				return '#CF000F';
			} else {
				return '#000';
			}
		}
	}
});