'use strict';

angular.module('cirqlApp').service('geo2', ['$q', '$log', 'simpleLogin', 'fbutil',
    function($q, $log, simpleLogin, fbutil) {

        var user = simpleLogin.getUser();
        var fbHome = fbutil.syncObject('homes/' + user.uid + '/homelocation');
        var fbRegions = null;
        if (user.uid !== null && user.uid !== undefined) {
            if (user.residentId !== null && user.residentId !== undefined) {
                fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
                console.log('TEST2: homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
            }
        }
        var radius = [250, 7500, 15000, 30000, 45000, 60000, 75000, 90000, 150000];
        var initStarted = false;
        var monitorStarted = false;
        var receiveStarted = false;

        var service = {
            init: function() {
                var deferred = $q.defer();
                if (initStarted === false) {
                    initStarted = true;

                    window.geofence.initialize();

                    console.log('Cowbell Geofencing initialized');
                }
                return deferred.promise;
            },

            receiveTransitions: function() {
                if (receiveStarted === false) {
                    if (fbRegions) {
                        receiveStarted = true;
                        console.log('Region Transition callback is set now');
                        window.geofence.receiveTransition = function(geofences) {
                            console.log('------RECEIVED-------');
                            console.log(geofences);
                            var date = new Date();
                            date = date + '';
                            var regionId = null;
                            var isInside = false;

                            geofences.forEach(function(geo) {
                                var geoStr = geo.id;
                                regionId = parseInt(geoStr.substring(0, geoStr.indexOf('-')));
                                if (regionId) {
                                    console.log('parsed regionId: ' + regionId);
                                    if (geo.transitionType === 1) {
                                        isInside = true;
                                    } else {
                                        isInside = false;
                                    }
                                    if (radius[regionId - 1]) {
                                        fbRegions['reg' + regionId] = {
                                            'isInside': isInside,
                                            'radius': radius[regionId - 1],
                                            'date': date
                                        };
                                        fbRegions.$save();
                                        console.log('Saved to fbRegions');
                                    }
                                }
                                console.log('Geofence transition detected', geo);
                            });
                        };
                    }
                }
            },

            monitorRegion: function() {
                var deferred = $q.defer();
                if (monitorStarted === false) {
                    if (fbRegions) {
                        monitorStarted = true;
                        fbHome.$loaded(function(data) {
                            var regionsURL = 'homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions';
                            if (data.hasOwnProperty('lat') && data.hasOwnProperty('lng')) {
                                var lat = data.lat + '';
                                var lng = data.lng + '';
                                console.log('HomeRegion set to lat: ' + lat + ' and lng: ' + lng);

                                console.log('Regions will be set now: ');
                                var geofences = [];
                                for (var i = 1; i <= radius.length; i++) {

                                    var enterId = i + "-enter";
                                    var geofence1 = {
                                        id: enterId,
                                        latitude: lat,
                                        longitude: lng,
                                        radius: radius[i - 1],
                                        transitionType: TransitionType.ENTER,
                                        notification: {
                                            id: i,
                                            title: radius[i - 1]+"-enter",
                                            text: regionsURL,
                                            openAppOnClick: false
                                        }
                                    }
                                    geofences.push(geofence1);

                                    var exitId = i + "-exit";
                                    var geofence2 = {
                                        id: exitId,
                                        latitude: lat,
                                        longitude: lng,
                                        radius: radius[i - 1],
                                        transitionType: TransitionType.EXIT,
                                        notification: {
                                            id: i,
                                            title: radius[i - 1]+"-exit",
                                            text: regionsURL,
                                            openAppOnClick: false
                                        }
                                    }
                                    geofences.push(geofence2);
                                }
                                window.geofence.addOrUpdate(geofences).then(function() {
                                    console.log('Geofences successfully added');
                                }, function(reason) {
                                    console.log('Adding geofences failed', reason);
                                });


                            } else {
                                console.log('HomeRegion could not be set');
                                console.log('Regions can not be set');
                                monitorStarted = false;
                            }

                        });
                        console.log('Geo: return promise');
                    } else {
                        if (fbRegions === null) {
                            user = simpleLogin.getUser();
                            if (user.uid !== null && user.uid !== undefined) {
                                if (user.residentId !== null && user.residentId !== undefined) {
                                    fbRegions = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
                                    console.log('homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions');
                                }
                            }
                        }
                    }
                }
                return deferred.promise;

            }

        };

        return service;

    }
]);
