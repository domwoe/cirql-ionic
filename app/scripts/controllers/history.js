'use strict';

angular.module('cirqlApp')
    .controller('HistoryCtrl', ['$rootScope', '$scope', 'user', 'fbutil', '$state', '$ionicLoading', 'log', '$ionicSideMenuDelegate', '$filter', '$translate',
        function($rootScope, $scope, user, fbutil, $state, $ionicLoading, log, $ionicSideMenuDelegate, $filter, $translate) {

            if (window.screen && window.screen.lockOrientation) {
                window.screen.lockOrientation('landscape');
            }


            $ionicSideMenuDelegate.canDragContent(false);

            log.event({
                homeid: user.uid,
                residentid: user.residentId,
                type: 'view',
                view: 'history',
                roomid: $rootScope.room
            });

            $scope.goToRoom = function() {
                // if ($scope.activities && $scope.activities.hasOwnProperty('$destroy')) {
                //     $scope.activities.$destroy();
                // }
                $state.go('app.room', {
                    roomId: $rootScope.room
                });
            };

            var translate = $filter('translate');
            var language = $translate.use();
            if (language !== 'de') {
                language = 'en';
            }

            var fbHistoryRef = 'homes/' + user.uid + '/histories/' + $rootScope.room;

            var getData = function(cb) {
                fbutil.ref(fbHistoryRef).once('value', function(fbData) {

                    var series = [];

                    fbData.forEach(function(fbMeasure) {

                        if (fbMeasure.val()) {
                            var name;
                            if (fbMeasure.key() === 'co2') {
                                name = translate('AIR_QUALITY');
                            } else if (fbMeasure.key() === 'humidity') {
                                name = translate('HUMIDITY');
                            } else if (fbMeasure.key() === 'temperature') {
                                name = translate('TEMPERATURE');
                            } else if (fbMeasure.key() === 'target') {
                                name = translate('TARGET');
                            } else if (fbMeasure.key() === 'valve') {
                                name = translate('VALVE');
                            }

                            series.push({
                                name: name,
                                data: []
                            });
                            var index = series.length - 1;

                            fbMeasure.forEach(function(fbDataPoint) {

                                if (fbDataPoint.val()) {
                                    var dataPoint = fbDataPoint.val();
                                    series[index].data.push([dataPoint.timestamp, dataPoint.value]);
                                }

                            });


                        }

                        cb(series);
                        $ionicLoading.hide();
                    });

                });
            };

            getData(function(data) {

                $scope.chartConfig = {
                    options: {
                        chart: {
                            type: 'spline',
                            zoomType: 'x'
                        },
                        title: {
                            text: ''
                        },
                        xAxis: {
                            type: 'datetime'
                        },
                        exporting: {
                            enabled: false
                        },
                        credits: {
                            enabled: false
                        }
                    },
                    series: data
                };
            });








        }


    ]);