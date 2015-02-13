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
    var regions = [];
    var geofences = [];
    var regionsURL = null;


    function fbInit(deferred) {

        fbutil.ref('homes/' + user.uid + '/homelocation').once('value', function(fbHome) {
            if (fbHome.val()) {
                console.log('GEO SERVICE: Got Homelocation');
                home = fbHome.val();
            }
        });

        var regionsURL = 'homes/' + user.uid + '/residents/' + user.residentId + '/lastRegions';

        fbLocation = fbutil.syncObject('homes/' + user.uid + '/residents/' + user.residentId + '/lastLocation');
        fbRegions = fbutil.syncObject(regionsURL);

        fbutil.ref('homes/' + user.uid + '/residents/' + user.residentId + '/allowsGeolocation').on('value', function(fbAllowsGeo) {

            console.log('GEO SERVICE: Geolocation allowed is set to ' + fbAllowsGeo.val());
            if (fbAllowsGeo.val() === true) {

                allowsGeo = true;

                if (deviceDetector.os === 'ios') {

                    window.plugins.DGGeofencing.initCallbackForRegionMonitoring(new Array(),
                        function(result) {
                            
                            var callbacktype = result.callbacktype;
                            //var regionId = result.regionId;

                            if (callbacktype === 'initmonitor') {

                                console.log('initmonitor');

                            } else if (callbacktype === 'locationupdate') { 

                            } else if (callbacktype === 'monitorremoved') { 
                                console.log('monitorremoved');
             
                            } else if (callbacktype === 'monitorfail') { 

                                console.log('monitorfail');
         
                            } else if (callbacktype === 'monitorstart') {
                                regionMonitoringStarted = true;
                                console.log('monitorstart');
  
                            } else if (callbacktype === 'enter') {
                               

                            } else if (callbacktype === 'exit') {
                               
                            }

                        },
                        function(error) {
                            console.log('GEO SERVICE: Failed with error '+error);
                            signStarted = false;
                            monitorStarted = false;
                            deferred.reject();

                        });

                    signStarted = true;
                    window.plugins.DGGeofencing.startMonitoringSignificantLocationChanges(
                        function() {
                            console.log('GEO SERVICE: start monitoring significant location changes');

                        },
                        function(error) {
                            console.log('GEO SERVICE: Error when starting significant location changes monitoring with error: ' + error);
                            signStarted = false;
                            deferred.reject();

                        });
                }


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

                        if (deviceDetector.os === 'ios') {
                            removeRegion(fbRegion);
                        }

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

        if (home && home.lat && home.lng && region.child('radius').val()) {

            

            var radius = parseInt(region.child('radius').val());

            console.log('GEO SERVICE: Region Id:' + region.key());
            console.log('GEO SERVICE: Latitude:' + home.lat);
            console.log('GEO SERVICE: Longitude:' + home.lng);
            console.log('GEO SERVICE: Radius:' + radius);
            console.log('----------------------------');

            if (deviceDetector.os === 'ios') {

                var params = [region.key(), home.lat, home.lng, radius];

                window.plugins.DGGeofencing.startMonitoringRegion(params,
                    function(result) {
                        console.log('Geo: added new region ' + params);
                        deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Monitor-Geo: error with ' + params);
                        deferred.reject(error);
                    });
            } else if (deviceDetector.os === 'android') {

                var reg = new RegExp('^[0-9]+$');
                var id = reg.match(region.key());

                var enterId = id + '-enter';
                var geofence1 = {
                    id: enterId,
                    latitude: home.lat,
                    longitude: home.lng,
                    radius: radius,
                    transitionType: 'TransitionType.ENTER',
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
                    transitionType: 'TransitionType.EXIT',
                    notification: {
                        id: id,
                        title: radius + "-exit",
                        text: regionsURL,
                        openAppOnClick: false
                    }
                };
                geofences.push(geofence2);

                window.geofence.addOrUpdate(geofences).then(function() {
                    console.log('Geofences successfully added');
                    deferred.resolve();
                }, function(reason) {
                    console.log('Adding geofences failed', reason);
                    deferred.reject(reason);
                });
            }

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

        });

        $rootScope.geo = true;

        return deferred.promise;

    }
};


return service;


}]);