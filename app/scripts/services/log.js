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

                    if (!event.homeid || event.homeid == undefined) {
                        console.log('LOG ERROR: user missing');
                    }
                    else if (!event.residentid || event.residentid == undefined) {
                        console.log('LOG ERROR: resident missing');
                    }
                    else {
                        fbutil.ref('homes/' + event.homeid + '/log').push(event);
                    }


                    

                }
            };

            return log;
        }
    ]);