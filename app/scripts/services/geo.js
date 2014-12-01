'use strict';

angular.module('cirqlApp').service('geo', ['$q', '$log', 'simpleLogin', 'fbutil',
    function($q, $log, simpleLogin, fbutil) {

        var user = simpleLogin.getUser();
        var fbHome = fbutil.syncObject('homes/' + user.uid + '/homelocation');
        var fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');

        var service = {
            init: function() {
                var deferred = $q.defer();

                window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(),
                    function(result) {
                        console.log('Geo: init callback for monitoring');

                        var callbacktype = result.callbacktype;

                        var date = new Date();
                        date = date + '';

                        if (callbacktype === 'initmonitor') {

                            console.log('initmonitor');

                        } else if (callbacktype === 'locationupdate') { // monitor for region with id fid removed

                            console.log('locationupdate');

                            fbLocation.date = date;
                            fbLocation.timestamp = result.new_timestamp;
                            fbLocation.speed = result.new_speed;
                            fbLocation.verticalAccuracy = result.new_verticalAccuracy;
                            fbLocation.horizontalAccuracy = result.new_horizontalAccuracy;
                            fbLocation.altitude = result.new_altitude;
                            fbLocation.lat = result.new_latitude;
                            fbLocation.lng = result.new_longitude;
                            fbLocation.lastMsg = {
                                'type': 'locationupdate',
                                'date': date
                            };

                        } else if (callbacktype ==='monitorremoved') { // monitor for region with id fid removed

                            console.log('monitorfail');
                            fbLocation.lastMsg = {
                                'type': 'monitorremoved',
                                'date': date
                            };

                        } else if (callbacktype === 'monitorfail') { // monitor for region with id fid failed

                            console.log('monitorfail');
                            fbLocation.lastMsg = {
                                'type': 'monitorfail',
                                'date': date
                            };

                        } else if (callbacktype === 'monitorstart') { // monitor for region with id fid succeeded

                            console.log('monitorstart');
                            fbLocation.lastMsg = {
                                'type': 'monitorstart',
                                'date': date
                            };

                        } else if (callbacktype === 'enter') {

                        	console.log('enter');
                            fbLocation.lastMsg = {
                                'type': 'enter',
                                'date': date
                            };

                            fbLocation.homeregion = true;

                        } else if (callbacktype === 'exit') {

                        	console.log('exit');
                            fbLocation.lastMsg = {
                                'type': 'exit',
                                'date': date
                            };

                            fbLocation.homeregion = false;

                        }

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

                var lat = '41.1';
                var lng = '-73.2';
                var radius = 750;

                console.log('isLat: ' + fbHome.hasOwnProperty('lat') );

                fbHome.$loaded(function(data) {

                if ( data.hasOwnProperty('lat') && data.hasOwnProperty('lng') ) {
                	lat = data.lat + '';
                	lng = data.lng + '';
                    console.log('HomeRegion set to lat: ' + lat + ' and lng: ' + lng);
                }
                else {
                    console.log('HomeRegion not set with lat ' + data.lat);
                }

                var params = ['1',lat,lng,radius];

                window.plugins.DGGeofencing.startMonitoringRegion(params,
                    function(result) {
                        console.log('Geo: added Location ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Geo: error');
                        deferred.reject(error);

                    });

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

    }
]);