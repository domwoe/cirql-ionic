'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:thermostatService
 * @description
 */

angular.module('cirqlApp')
    .factory('thermostatService', ['fbutil', '$q',
        function(fbutil, $q) {

            var thermostat = {

                watchForNewThermostat: function(user) {
                    var deferred = $q.defer();
                    fbutil.ref('homes/' + user.uid + '/thermostats').on('child_added', function(fbThermostat) {
                        if (fbThermostat.child('room') === 'null') {
                            fbutil.ref('homes/' + user.uid + '/thermostats').off();
                            deferred.resolve(fbThermostat.key());
                        }
                        return deferred.promise;
                    });
                },

                addToRoom: function(user, thermostat, room) {

                    var deferred = $q.defer();

                    fbutil.ref('homes/' + user.uid + '/thermostats/' + thermostat).child('room').set(room, function(error) {
                        if (error) {
                            console.log('Something went wrong adding the thermostat to the room');
                            deferred.reject();

                        } else {

                            fbutil.ref('homes/' + user.uid + '/rooms/' + room + '/thermostats/').child(thermostat).set(true, function(error) {

                                if (error) {

                                    fbutil.ref('homes/' + user.uid + '/thermostats/' + thermostat).child('room').set('null');
                                    console.log('Something went wrong adding the thermostat to the room');
                                    deferred.reject();
                                } else {
                                    console.log('Adding thermostat successful');
                                    deferred.resolve(true);
                                }

                            });
                        }
                    });

                    return deferred.promise;
                },

                deleteFromRoom: function(user, thermostat, room) {

                    var deferred = $q.defer();

                    fbutil.ref('homes/' + user.uid + '/thermostats/' + thermostat).child('room').set('null', function(error) {
                        if (error) {
                            console.log('Something went wrong deleting the thermostat to the room');
                            deferred.reject();
                        } else {

                            fbutil.ref('homes/' + user.uid + '/rooms/' + room + '/thermostats/').child(thermostat).set(null, function(error) {
                                if (error) {
                                    console.log('Something went wrong deleting the thermostat to the room');
                                    deferred.reject();
                                } else {
                                    console.log('Removing thermostat successful');
                                    deferred.resolve(true);
                                }
                            });

                        }


                    });
                    return deferred.promise;

                }
            };

            return thermostat;
        }
    ]);