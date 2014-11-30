'use strict';

angular.module('cirqlApp').service('discovery',
    function($q) {

        var service = {
            identify: function(params) {
                var deferred = $q.defer();

                window.Discovery.identify(
                    function(result) {
                        console.log('Identify: Service found:' + result);
                        //deferred.resolve(result);
                    },
                    function(error) {
                        console.log('Identify error');
                        deferred.reject(error);

                    }, params);

                return deferred.promise;
            }
        };

        return service;
    });