'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:log
 * @description
 */

angular.module('cirqlApp')
    .factory('log', ['$q','fbutil',
        function($q,fbutil) {

            var log = {

                event: function(event) {

                    if (!event.user) {
                        console.log('LOG ERROR: user missing');
                    }
                    else if (!event.resident) {
                        console.log('LOG ERROR: resident missing');
                    }
                    else {
                        fbutil.ref('homes/' + event.user + '/log').push(event);
                    }


                    

                }
            };

            return log;
        }
    ]);