'use strict';

angular.module('cirqlApp').service('geo', ['$q', '$log',
    function($q, $log) {

        var service = {
            init: function() {
            	var deferred = $q.defer();

                window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(), 
                	function(result) {
	                        $log.debug('Geo: init callback for monitoring');
	                        deferred.resolve(result);
	                    },
	                    function(error) {
	                        $log.debug("Geo: error");
	                        deferred.reject(error);

	                    });

	            $log.debug("Geo: return promise");
	            return deferred.promise;  
            },

            monitorRegion: function(params) {
                var deferred = $q.defer();

                window.plugins.DGGeofencing.startMonitoringRegion(params,
                    function(result) {
                        $log.debug('Geo: added Location ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        $log.debug("Geo: error");
                        deferred.reject(error);

                    });

                $log.debug("Geo: return promise");
                return deferred.promise;

            },

            removeRegion: function(params) {
            	var deferred = $q.defer();

            	window.plugins.DGGeofencing.stoptMonitoringRegion(params,
                    function(result) {
                        $log.debug('Geo: removed Location ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        $log.debug("Geo: error");
                        deferred.reject(error);

                    });

                $log.debug("Geo: return promise");
                return deferred.promise;


            },

            startMonitoringSignificantLocationChanges: function() {
            	window.plugins.DGGeofencing.stoptMonitoringSignificantLocationChanges(
	            	 function(result) {
	                        $log.debug('Geo: start monitoring significant location changes');
	                        deferred.resolve(result);
	                    },
	                    function(error) {
	                        $log.debug("Geo: error");
	                        deferred.reject(error);

	                    });

	            $log.debug("Geo: return promise");
	            return deferred.promise;  
            },

            stopMonitoringSignificantLocationChanges: function() {
            	window.plugins.DGGeofencing.stoptMonitoringSignificantLocationChanges(
	            	 function(result) {
	                        $log.debug('Geo: start monitoring significant location changes');
	                        deferred.resolve(result);
	                    },
	                    function(error) {
	                        $log.debug("Geo: error");
	                        deferred.reject(error);

	                    });

	            $log.debug("Geo: return promise");
	            return deferred.promise;   
            }
        }

    return service;
   	
}]);