'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:flurry
 * @description
 */

angular.module('cirqlApp')
    .factory('flurry', ['$q',
        function($q) {

            var f = null;

            function s(method) {
                console.log('FLURRY '+method+ 'successful!');
            }

            function e(err) {
                console.log('FLURRY error: '+err);
            }

            var flurry = {

                init: function(userid) {
                    var deferred = $q.defer();
                    if (window.Flurry) {
                        console.log('Flurry constructor available');

                        f = new window.FlurryAnalytics();



                        f.setUserID(userid,s,e);
                        f.setAppVersion(1,s, e);
                        f.setShowErrorInLogEnabled('Yes',s, e);
                        f.setEventLoggingEnabled('Yes',s, e);
                        f.setDebugLogEnabled('Yes',s, e);
                        f.setSecureTransportEnabled('No',s, e);
                        f.setSessionContinueSeconds(60,s, e);
                        f.setCrashReportingEnabled('Yes',s, e);

                        f.startSession('ZQ8G944BMC99JZHF7DHR',
                            function(res) {
                                s(res);
                                deferred.resolve(true);
                            },
                            function(err) { 
                                e(err);
                                deferred.resolve(false);
                            }
                        );

                        return deferred.promise;
                    }    

                },

                logEvent: function(event, params) {
                    f.logEvent(event, params, function() {
                        console.log('Flurry logEvent successful!');
                    }, function(err) {
                        console.error(['Flurry logEvent error', err]);
                    });
                },

                logError: function(error) {
                    f.logError('Error', error, function() {
                        console.log('Flurry logError successful!');
                    }, function(err) {
                        console.error(['Flurry logError error', err]);
                    });
                },

                logPageView: function() {
                    f.logPageView(function() {
                        console.log('Flurry logPageView successful!');
                    }, function(err) {
                        console.error(['Flurry logPageView error', err]);
                    });
                },


            };

            return flurry;
        }
    ]);