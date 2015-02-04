'use strict';

angular.module('cirqlApp').service('geo', ['$q', '$log', 'simpleLogin', 'fbutil',
    function($q, $log, simpleLogin, fbutil) {

        fbutil.ref('test').on('child_added', function(fbTest) {
            console.log('FIREBASE TEST: '+JSON.stringify(fbTest.val()));
        });
        var user = null;
        var fbHome = null;
        var fbLocation = null;
        var fbRegions = null;
        var radius = [400, 3000, 7500, 10000, 15000, 25000, 35000, 45000, 55000, 70000, 90000, 120000, 150000, 200000];
        var initStarted = false;
        var monitorStarted = false;
        var removeStarted = false;
        var signStarted = false;

        var service = {
            init: function() {
                var deferred = $q.defer();
                if (!initStarted) {
                    initStarted = true;

                    window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(),
                        function(result) {
                            //console.log('RESULTS: ' + JSON.stringify(result));
                            console.log('Radshag Geo initialized');

                            var callbacktype = result.callbacktype;
                            var regionId = result.regionId;

                            var date = new Date();
                            date = date + '';

                            if (callbacktype === 'initmonitor') {

                                console.log('initmonitor');

                            } else if (callbacktype === 'locationupdate') { // monitor for region with id fid removed

                                if (fbLocation !== null) {
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
                                }

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
                                if (fbRegions) {
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
                                }

                            } else if (callbacktype === 'exit') {
                                if (fbRegions) {
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

                            }

                        },
                        function(error) {
                            console.log('Init-Geo: Error');
                            signStarted = false;
                            monitorStarted = false;
                            deferred.reject(error);


                        });

                    console.log('Geo:  callback return promise');
                }
                return deferred.promise;
            },

            monitorRegion: function(params) {
                var deferred = $q.defer();
                if (monitorStarted === false) {
                    if (fbRegions === null) {
                        user = simpleLogin.getUserObject();
                        console.log('User: ' + JSON.stringify(user));
                        if (user.uid !== null && user.uid !== undefined) {
                            console.log('residentid: ' + user.residentId);
                            if (user.residentId !== null && user.residentId !== undefined) {
                                fbHome = fbutil.syncObject('homes/' + user.uid + '/homelocation');
                                fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
                                fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
                                console.log('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
                            }
                        }
                    }
                    if (fbRegions !== null) {

                        fbHome.$loaded(function(data) {

                            if (data.hasOwnProperty('lat') && data.hasOwnProperty('lng')) {
                                var lat = data.lat + '';
                                var lng = data.lng + '';
                                console.log('HomeRegion set to lat: ' + lat + ' and lng: ' + lng);
                                monitorStarted = true;

                                console.log('Regions will be set now: ');
                                for (var i = 1; i <= radius.length; i++) {

                                    var params = ['' + i, lat, lng, radius[i - 1]];

                                    window.plugins.DGGeofencing.startMonitoringRegion(params,
                                        function(result) {
                                            console.log('Geo: added new region ' + params);
                                            deferred.resolve(result);
                                        },
                                        function(error) {
                                            console.log('Monitor-Geo: error with ' + params);
                                            deferred.reject(error);
                                        });
                                }

                            } else {
                                console.log('HomeRegion could not be set');
                                console.log('Regions can not be set');
                                monitorStarted = false;
                            }

                        });
                        console.log('Geo: monitorregion return promise');
                    }
                }
                return deferred.promise;

            },

            removeRegion: function(params) {
                var deferred = $q.defer();

                // if (removeStarted === false) {
                //     if (fbRegions) {
                //         fbHome.$loaded(function(data) {

                //             if (data.hasOwnProperty('lat') && data.hasOwnProperty('lng')) {
                //                 var lat = data.lat + '';
                //                 var lng = data.lng + '';
                //                 console.log('HomeRegion set to lat: ' + lat + ' and lng: ' + lng);
                //                 removeStarted = true;

                //                 console.log('Regions will be set now: ');
                //                 for (var i = 1; i <= radius.length; i++) {

                //                     var params = ['' + i, lat, lng, radius[i - 1]];

                //                     window.plugins.DGGeofencing.stopMonitoringRegion(params,
                //                         function(result) {
                //                             console.log('Geo: removed new region ' + params);
                //                             deferred.resolve(result);
                //                         },
                //                         function(error) {
                //                             console.log('Remove-Geo: error with ' + params);
                //                             deferred.reject(error);
                //                         });
                //                 }

                //             } else {
                //                 console.log('RemoveOperation: HomeRegion could not be set');
                //                 console.log('RemoveOperation: Regions could not be set');
                //             }

                //         });
                //         console.log('Geo: removeregion return promise');
                //     }
                // }
                return deferred.promise;

            },

            startMonitoringSignificantLocationChanges: function() {
                var deferred = $q.defer();
                if (!signStarted) {
                    if (fbLocation === null) {
                        user = simpleLogin.getUserObject();
                        if (user.uid !== null && user.uid !== undefined) {
                            if (user.residentId !== null && user.residentId !== undefined) {
                                fbHome = fbutil.syncObject('homes/' + user.uid + '/homelocation');
                                fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
                                fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
                                console.log('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
                            }
                        }
                    }
                    if (fbLocation !== null) {
                        console.log('Significant-Geo: ready');
                        signStarted = true;
                        window.plugins.DGGeofencing.startMonitoringSignificantLocationChanges(
                            function(result) {
                                console.log('Geo: start monitoring significant location changes');
                                deferred.resolve(result);

                            },
                            function(error) {
                                console.log('Significant-Geo: error');
                                signStarted = false;
                                deferred.reject(error);

                            });

                    }
                }
                return deferred.promise;
            },

            stopMonitoringSignificantLocationChanges: function() {
                var deferred = $q.defer();
                if (fbLocation !== null) {
                    console.log('Stop significant geo');
                    signStarted = false;
                    window.plugins.DGGeofencing.stopMonitoringSignificantLocationChanges(
                        function(result) {
                            console.log('Geo: start monitoring significant location changes');
                            deferred.resolve(result);
                        },
                        function(error) {
                            console.log(' Geo: error');
                            signStarted = false;
                            deferred.reject(error);

                        });

                    console.log('Geo: return promise');
                }
                return deferred.promise;
            }
        };

        return service;

    }
]);
