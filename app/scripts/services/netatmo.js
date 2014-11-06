'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:netatmoService
 * @description
 * # netatmoService
 * Service to get netamo data
 */

angular.module('cirqlApp')
	.factory('netatmoService', ['fbutil',
	    function(fbutil) {

	    	var user = {}
	    	user.uid = 'simplelogin:15';

	        var netatmos = fbutil.syncArray('homes/' + user.uid + '/sensors/netatmo/stations');

	        function loadNetatmoOauth() {
	            var netatmoOauth = fbutil.syncObject('netatmo/oauth');
	            return netatmoOauth;
	        }

	        
	        var netatmo = {

	            authorizeUrl: function() {	

	                var netatmoOauth = loadNetatmoOauth();
	                var state = user.uid;
	                netatmoOauth.$loaded(function(data) {
	                    var url = data.authorize_url +
	                        '?client_id=' + data.client_id +
	                        '&redirect_uri=' + data.redirect_uri +
	                        '&state=' + state;
	                    return url;
	                });
	            },

	            getAvailable: function() {

	                for (var i = 0; i < netatmos.length; i++) {

	                    for (var j = 0; j < netatmos[i].modules.length; j++) {

	                        if (netatmos[i].modules[j].hasOwnProperty('room')) {

	                            delete netatmos[i].modules[j];

	                            if (!netatmos[i].hasOwnProperty('modules')) {

	                                delete netatmos[i];
	                            }

	                        }
	                    }
	                }

	                return netatmos;
	            },

	            hasNetatmo: function(room) {

	                for (var i = 0; i < netatmos.length; i++) {

	                	var modules = netatmos[i].modules;

	                    for (var key in modules) {

	                        if (modules[key].hasOwnProperty('room') && modules[key].room === room) {
	                            return true;
	                        }
	                    }
	                }
	                return false;
	            },

	            isConnected: function() {

	                if (netatmos[0]) {
	                    return true;
	                }
	                return false;
	            }
	        };

	        return netatmo;
	    }
	]);