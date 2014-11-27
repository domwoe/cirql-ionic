'use strict';

angular.module('cirqlApp').service('geo', ['$q', '$log', 'simpleLogin', 'fbutil',
    function($q, $log, simpleLogin, fbutil) {

    	var user = simpleLogin.getUser();
        var fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');

        var service = {
            init: function() {
            	var deferred = $q.defer();

                window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(), 
                	function(result) {
	                        console.log('Geo: init callback for monitoring');
	                        //deferred.resolve(result);
	                        var date = new Date();
                			fbLocation.date = date + '';
                			fbLocation.msg = result;
                			fbLocation.$save();
	                    },
	                    function(error) {
	                        console.log('Geo: error');
	                        deferred.reject(error);

	                    });

	            console.log('Geo: return promise');
	            return deferred.promise;  
            },

            monitorRegion: function(params) {
                var deferred = $q.defer();

                window.plugins.DGGeofencing.startMonitoringRegion(params,
                    function(result) {
                        console.log('Geo: added Location ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Geo: error');
                        deferred.reject(error);

                    });

                console.log('Geo: return promise');
                return deferred.promise;

            },

            removeRegion: function(params) {
            	var deferred = $q.defer();

            	window.plugins.DGGeofencing.stopMonitoringRegion(params,
                    function(result) {
                        console.log('Geo: removed Location ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Geo: error');
                        deferred.reject(error);

                    });

                console.log('Geo: return promise');
                return deferred.promise;


            },

            startMonitoringSignificantLocationChanges: function() {
            	var deferred = $q.defer();
            	window.plugins.DGGeofencing.startMonitoringSignificantLocationChanges(
	            	 function(result) {
	                        console.log('Geo: start monitoring significant location changes');
	                        deferred.resolve(result);
	                    },
	                    function(error) {
	                        console.log('Geo: error');
	                        deferred.reject(error);

	                    });

	            $log.debug('Geo: return promise');
	            return deferred.promise;  
            },

            stopMonitoringSignificantLocationChanges: function() {
            	var deferred = $q.defer();
            	window.plugins.DGGeofencing.stopMonitoringSignificantLocationChanges(
	            	 function(result) {
	                        console.log('Geo: start monitoring significant location changes');
	                        deferred.resolve(result);
	                    },
	                    function(error) {
	                        console.log('Geo: error');
	                        deferred.reject(error);

	                    });

	            console.log('Geo: return promise');
	            return deferred.promise;   
            }
        };

    return service;
   	
}]);