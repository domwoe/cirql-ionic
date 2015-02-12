'use strict';

angular.module('cirqlApp').service('geo', ['$rootScope', '$q', '$log', 'simpleLogin', 'fbutil',
    function($rootScope, $q, $log, simpleLogin, fbutil) {

        var user = null;
        var home = null;
        var fbLocation = null;
        var fbRegions = null;
        var radius = null;
        var monitorStarted = false;
        var signStarted = false;
        var allowsGeo = null;
        var regionMonitoringStarted = false;
        var regions = [];


        function fbInit(deferred) {

            console.log('GEO SERVICE: Initializing...');

            fbutil.ref('homes/' + user.uid + '/homelocation').once('value', function(fbHome) {
                if (fbHome.val()) {
                    console.log('GEO SERVICE: Got Homelocation');
                    home = fbHome.val();
                }
            });

            fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
            fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');

            fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/allowsGeolocation').on('value', function(fbAllowsGeo) {

                console.log('GEO SERVICE: Geolocation allowed is set to ' + fbAllowsGeo.val());
                if (fbAllowsGeo.val() === true) {

                    allowsGeo = true;

                    window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(),
                        function(result) {
                            //console.log('RESULTS: ' + JSON.stringify(result));

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

                                console.log('monitorremoved');
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
                                regionMonitoringStarted = true;
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
                            deferred.reject();

                        });

                    signStarted = true;
                    window.plugins.DGGeofencing.startMonitoringSignificantLocationChanges(
                        function(result) {
                            console.log('GEO SERVICE: start monitoring significant location changes');

                        },
                        function(error) {
                            console.log('GEO SERVICE: Error when starting significant location changes monitoring with error: ' + error);
                            signStarted = false;
                            deferred.reject();

                        });


                    var fbRefRegions = fbutil.ref('geolocation/regions');

                    fbRefRegions.on('child_added', function(fbRegion) {

                        if (fbRegion.val()) {

                            regions.push(fbRegion);

                            //console.log(fbRegion.val());

                            addRegion(fbRegion);

                        }


                    });

                    fbRefRegions.on('child_changed', function(fbRegion) {

                        console.log('child_changed');

                        if (fbRegion.val()) {

                            removeRegion(fbRegion);
                            addRegion(fbRegion);

                        }


                    });


                } else if (fbAllowsGeo.val() === false) {

                    allowsGeo = false;

                    if (signStarted) {

                        window.plugins.DGGeofencing.stopMonitoringSignificantLocationChanges(
                            function(result) {
                                console.log('Geo: Stop monitoring significant location changes');

                            },
                            function(error) {
                                console.log(' Geo: error');

                            });
                    }

                    if (regionMonitoringStarted) {

                        for (var i = 0, j = regions.length; i < j; i++) {

                            removeRegion(regions[i]);
                            regions[i] = null;
                        }

                        //console.log(fbRegion.val());
                    }


                }
            });

        }

        function addRegion(region) {
            console.log('----------------------------');
            console.log('GEO SERVICE: Adding region');

            var deferred = $q.defer();

            if (home && home.lat && home.lng) {

                console.log('GEO SERVICE: Region Id:' + region.key());
                console.log('GEO SERVICE: Latitude:' + home.lat);
                console.log('GEO SERVICE: Longitude:' + home.lng);
                console.log('GEO SERVICE: Radius:' + region.child('radius').val());
                console.log('----------------------------');

                var params = [region.key(), home.lat, home.lng, region.child('radius').val()];

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

            return deferred.promise;

        }

        function removeRegion(region) {

            var deferred = $q.defer();

            if (home && home.lat && home.lng) {

                var params = [region.key(), home.lat, home.lng];

                window.plugins.DGGeofencing.stopMonitoringRegion(params,
                    function(result) {
                        console.log('Geo: removed region ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Monitor-Geo: error with ' + params);
                        deferred.reject(error);
                    });
            }

            return deferred.promise;

        }

        function initUser() {

            var deferred = $q.defer();

            simpleLogin.getUser().then(function(user) {



                console.log('GEO SERVICE: User resolved');

                if (user && user.uid) {
                    if (user.residentId) {

                        console.log('GEO SERVICE: User: ' + user.uid);
                        console.log('GEO SERVICE: User: ' + user.residentId);

                        deferred.resolve(user);

                    } else {
                        console.log('GEO SERVICE: No residentId');
                        deferred.reject();
                    }



                    // fbRef.on('child_added', function(fbTest) {
                    //     console.log('FIREBASE TEST');
                    // });

                } else {
                    console.log('GEO SERVICE: No userId');
                    deferred.reject();
                }

            });

            return deferred.promise;
        }




        var service = {
            init: function() {

                var deferred = $q.defer();

                initUser().then(function(cUser) {

                    user = cUser;

                    fbInit(deferred);

                });

                $rootScope.geo = true;

                return deferred.promise;

            }
        };


        return service;

    }
]);