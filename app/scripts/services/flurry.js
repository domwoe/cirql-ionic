'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:flurry
 * @description
 */

angular.module('cirqlApp')
    .factory('flurry', ['$q', 'deviceDetector',
        function($q, deviceDetector) {

            var flurryAnalytics = null;

            var flurry = {

                init: function(options) {
                    var deferred = $q.defer();
                    if (window.Flurry) {
                        console.log('Flurry constructor available');

                        var key = null;
                        flurryAnalytics = new window.FlurryAnalytics();

                        if (deviceDetector.os === 'ios') {

                            key = 'ZQ8G944BMC99JZHF7DHR';
                        }
                        else if (deviceDetector.os === 'android') {
                            key = 'RXTY2NF2S7HDFFKVZBRH';
                        }

                        if (key !== null) {

                            flurryAnalytics.init(key, options, function() {
                                console.log('Flurry initialized');
                                deferred.resolve(true);
                            }, function(err) {
                                console.error(['Flurry initialization error', err]);
                                deferred.resolve(false);
                            });
                        }
                        else {
                            console.log('Flurry no API Key because OS: '+deviceDetector.os);
                            deferred.reject();
                        }    
                    } else {
                        console.log('Flurry constructor not available');
                        deferred.resolve(false);


                        return deferred.promise;
                    }    

                },

                logEvent: function(event, params) {
                    flurryAnalytics.logEvent(event, params, function() {
                        console.log('Flurry logEvent successful!');
                    }, function(err) {
                        console.error(['Flurry logEvent error', err]);
                    });
                },

                logError: function(error) {
                    flurryAnalytics.logError('Error', error, function() {
                        console.log('Flurry logError successful!');
                    }, function(err) {
                        console.error(['Flurry logError error', err]);
                    });
                },

                logPageView: function() {
                    flurryAnalytics.logPageView(function() {
                        console.log('Flurry logPageView successful!');
                    }, function(err) {
                        console.error(['Flurry logPageView error', err]);
                    });
                },


            };

            return flurry;
        }
    ]);