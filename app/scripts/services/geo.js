'use strict';

angular.module('cirqlApp').service('geo', ['$q', '$log', 'simpleLogin', 'fbutil',
    function($q, $log, simpleLogin, fbutil) {

        var user = simpleLogin.getUser();
        var fbHome = fbutil.syncObject('homes/' + user.uid + '/homelocation');
        var fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
        var fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
        var radius = [250, 7500, 15000, 30000, 45000, 60000, 75000, 90000, 150000];

        var service = {
            init: function() {
                var deferred = $q.defer();

                window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(),
                    function(result) {
                        console.log('RESULTS: ' + JSON.stringify(result));
                        console.log('Geo: init callback for monitoring');

                        var callbacktype = result.callbacktype;
                        var regionId = result.regionId;

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
                            fbLocation.$save();

                        } else if (callbacktype === 'monitorremoved') { // monitor for region with id fid removed

                            console.log('monitorfail');
                            // fbRegions.lastMsg = {
                            //     'type': 'monitorremoved',
                            //     'date': date
                            // };
                            // fbRegions.$save();

                        } else if (callbacktype === 'monitorfail') { // monitor for region with id fid failed

                            console.log('monitorfail');
                            // fbRegions.lastMsg = {
                            //     'type': 'monitorfail',
                            //     'date': date
                            // };
                            // fbRegions.$save();

                        } else if (callbacktype === 'monitorstart') { // monitor for region with id fid succeeded

                            console.log('monitorstart');
                            // fbRegions.lastMsg = {
                            //     'type': 'monitorstart',
                            //     'date': date
                            // };
                            // fbRegions.$save();

                        } else if (callbacktype === 'enter') {
                            console.log('enter region ' + regionId);
                            if (regionId) {
                                if (radius[regionId - 1]) {
                                    fbRegions['reg' + regionId] = {
                                        'isInside': true,
                                        'radius': radius[regionId - 1],
                                        'date': date
                                    };

                                    fbRegions.$save();
                                } else {
                                    console.log('something wrong here1');
                                }
                            }

                        } else if (callbacktype === 'exit') {
                            console.log('exit region ' + regionId);
                            if (regionId) {
                                if (radius[regionId - 1]) {
                                    fbRegions['reg' + regionId] = {
                                        'isInside': false,
                                        'radius': radius[regionId - 1],
                                        'date': date
                                    };

                                    fbRegions.$save();
                                } else {
                                    console.log('something wrong here2');
                                }
                            }
                        }

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

                console.log('isLat: ' + fbHome.hasOwnProperty('lat'));

                fbHome.$loaded(function(data) {

                    if (data.hasOwnProperty('lat') && data.hasOwnProperty('lng')) {
                        lat = data.lat + '';
                        lng = data.lng + '';
                        console.log('HomeRegion set to lat: ' + lat + ' and lng: ' + lng);
                    } else {
                        console.log('HomeRegion not set with lat ' + data.lat);
                    }
                    console.log('length: ' + radius.length);
                    for (var i = 1; i <= radius.length; i++) {

                        var params = ['' + i, lat, lng, radius[i - 1]];

                        window.plugins.DGGeofencing.startMonitoringRegion(params,
                            function(result) {
                                console.log('Geo: added new region ' + params);
                                deferred.resolve(result);
                            },
                            function(error) {
                                console.log('Geo: error with ' + params);
                                deferred.reject(error);
                            });
                    }
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