'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.service:activityService
 * @description
 * # activityService
 *
 */

angular.module('cirqlApp')
    .factory('activityService', [

        function() {


            var activity = {

                addActivity: function(fbArray, activityObj) {

                    if (obj.type === 'set-target') {

                        if ($scope.roomValues.mode === 'manu') {
                            obj.type = 'manual-target';
                        } else {
                            obj.type = 'schedule-override';
                        }


                    }

                    fbArray.$add(activityObj);

                },
            };

            return activity;
        }
    ]);