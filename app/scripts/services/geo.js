'use strict';

angular.module('cirqlApp').service('geo', ['$rootScope', '$q', 'simpleLogin', 'fbutil', 'deviceDetector',
    function($rootScope, $q, simpleLogin, fbutil, deviceDetector) {

        var user = null;
        var home = null;
        var fbLocation = null;
        var fbRegions = null;
        var monitorStarted = false;
        var signStarted = false;
        var allowsGeo = null;
        var regionMonitoringStarted = false;
        var geofences = [];
        var regionsURL = null;


        function fbInit(deferred) {

            fbutil.ref('homes/' + user.uid + '/homelocation').once('value', function(fbHome) {
                if (fbHome.val()) {
                    console.log('GEO SERVICE: Got Homelocation');
                    home = fbHome.val();
                }
            });

            regionsURL = 'homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions';

            fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
            fbRegions = fbutil.syncObject(regionsURL);

            fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/allowsGeolocation').on('value', function(fbAllowsGeo) {

                console.log('GEO SERVICE: Geolocation allowed is set to ' + fbAllowsGeo.val());
                if (fbAllowsGeo.val() === true) {
                    allowsGeo = true;

                    var fbRefRegions = fbutil.ref('geolocation/regions');

                    fbRefRegions.on('value', function(fbRegions) {
                        if (fbRegions.val()) {
                            // Remove all!
                            if (window.geofence) {
                                window.geofence.removeAll()
                                    .then(function() {
                                        console.log('GEO SERVICE: All geofences successfully removed.');
                                        addRegions(fbRegions.val(), function() {
                                            if (geofences.length !== 0) {
                                                window.geofence.addOrUpdate(geofences).then(function() {
                                                    console.log('Geofences successfully added');
                                                      deferred.resolve();
                                                }, function(reason) {
                                                    console.log('Adding geofences failed', reason);
                                                      deferred.reject(reason);
                                                });
                                            } else {
                                                console.log('No geofences found');
                                            }
                                        });
                                    }, function(reason) {
                                        console.log('GEO SERVICE: Removing geofences failed', reason);
                                    });
                            } else {
                                console.log('Geofence plugin not ready');
                            }
                        }
                    });

                    // Stop Everything
                } else if (fbAllowsGeo.val() === false) {

                    allowsGeo = false;

                    window.geofence.removeAll()
                        .then(function() {
                            console.log('GEO SERVICE: All geofences successfully removed.');
                        }, function(reason) {
                            console.log('GEO SERVICE: Removing geofences failed', reason);
                        });
                }
            });

        }

        function addRegions(regions, cb) {
            console.log('----------------------------');
            console.log('GEO SERVICE: Adding regions: ' + JSON.stringify(regions));

            for (var regionKey in regions) {
                var region = regions[regionKey];
                console.log('region: ' + JSON.stringify(region));
                if (home && home.lat && home.lng && region.radius) {

                    var radius = parseInt(region.radius);

                    console.log('GEO SERVICE: Region Id:' + regionKey);
                    console.log('GEO SERVICE: Latitude:' + home.lat);
                    console.log('GEO SERVICE: Longitude:' + home.lng);
                    console.log('GEO SERVICE: Radius:' + radius);
                    console.log('----------------------------');

                    var tempreg = regionKey;
                    var id = null;
                    if (tempreg) {
                        id = tempreg.substr(tempreg.indexOf("reg") + 3);
                    }

                    if (id !== null) {

                        var enterId = id + '-enter';
                        var geofence1 = {
                            id: enterId,
                            latitude: home.lat,
                            longitude: home.lng,
                            radius: radius,
                            transitionType: TransitionType.ENTER,
                            notification: {
                                id: id,
                                title: radius + '-enter',
                                text: regionsURL,
                                openAppOnClick: false
                            }
                        };
                        geofences.push(geofence1);

                        var exitId = id + "-exit";
                        var geofence2 = {
                            id: exitId,
                            latitude: home.lat,
                            longitude: home.lng,
                            radius: radius,
                            transitionType: TransitionType.EXIT,
                            notification: {
                                id: id,
                                title: radius + "-exit",
                                text: regionsURL,
                                openAppOnClick: false
                            }
                        };
                        geofences.push(geofence2);


                    } else {
                        console.log('Region Id could not parsed');
                    }


                }
            }

            cb();
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

                if (deviceDetector.os === 'android') {
                    if (window.geofence && window.geofence.initialize) {

                        console.log('GEO SERVICE: Initializing...');

                        window.geofence.initialize();
                    } else {

                        console.log('GEO SERVICE: Android Geofencing plugin not found');

                    }
                }

                initUser().then(function(cUser) {

                    user = cUser;

                    fbInit(deferred);

                    $rootScope.geoInitialized = true;

                });

                return deferred.promise;

            }
        };


        return service;


    }
]);
