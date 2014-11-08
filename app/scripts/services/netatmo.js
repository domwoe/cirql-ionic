'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:netatmoService
 * @description
 * # netatmoService
 * Service to get netamo data
 */

angular.module('cirqlApp')
    .factory('netatmoService', ['fbutil', '$q',
        function(fbutil, $q) {


            function loadNetatmoOauth() {
                var netatmoOauth = fbutil.syncObject('netatmo/oauth');
                return netatmoOauth;
            }


            var netatmo = {

                authorizeUrl: function(user) {

                    var netatmoOauth = loadNetatmoOauth();
                    var state = user;
                    netatmoOauth.$loaded(function(data) {
                        var url = data.authorize_url +
                            '?client_id=' + data.client_id +
                            '&redirect_uri=' + data.redirect_uri +
                            '&state=' + state;
                        return url;
                    });
                },

                getAvailable: function(user) {

                	var netatmosObj = fbutil.syncArray('homes/' + user + '/sensors/netatmo/stations');

                	var deferred = $q.defer();

                    netatmosObj.$loaded(function(obj) {

                        for (var i = 0; i < obj.length; i++) {

                            var modules = obj[i].modules;

                            for (var key in modules) {

                                if (modules[key].hasOwnProperty('room')) {

                                    delete modules[key];

                                    if (!obj[i].hasOwnProperty('modules')) {

                                        delete obj[i];
                                    }

                                }
                            }
                        }
                        deferred.resolve(obj);
                        
                    });

                    return deferred.promise;
                },

                /**
                 * Get netatmo of a particular romm
                 * @param  {string} room the roomId
                 * @return {[promise} returns a promise that resolves to an object containing the station and module of the room. 
                 */
                getNetatmo: function(room,user) {

                	var netatmosObj = fbutil.syncArray('homes/' + user + '/sensors/netatmo/stations');

                	var deferred = $q.defer();

                	netatmosObj.$loaded(function(netatmos) {

		                    	for (var i = 0; i < netatmos.length; i++) {

			                        var modules = netatmos[i].modules;

			                        for (var key in modules) {

			                            if (modules[key].hasOwnProperty('room') && modules[key].room === room) {

			                            	var data = {
			                                    station: {
			                                        id: netatmos.$keyAt(i),
			                                        name: netatmos[i].name

			                                    },
			                                    module: {
			                                        id: key,
			                                        obj: modules[key]
			                                    }
			                                };

			                                deferred.resolve(data);
			                            }
			                        }
			                    }
			                    if ( i === netatmos.length ) {
			                    	deferred.resolve(false);
			                    }
			   
		      
                    		
                    });	
					return deferred.promise; 

                },

                isConnected: function(user) {

                	var netatmosObj = fbutil.syncArray('homes/' + user + '/sensors/netatmo/stations');

                	var deferred = $q.defer();

                	netatmosObj.$loaded(function(netatmos) {

	                    if (netatmos[0]) {
	                        deferred.resolve(true);
	                    }
	                    deferred.reject();
	                });

	                return deferred.promise;    
                }
            };

            return netatmo;
        }
    ]);
