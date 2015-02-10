'use strict';

angular.module('cirqlApp')
    .controller('HistoryCtrl', ['$rootScope', '$scope', 'user', 'fbutil', '$state', '$ionicLoading', 'log', '$ionicSideMenuDelegate', '$filter', '$translate', '$timeout',
        function($rootScope, $scope, user, fbutil, $state, $ionicLoading, log, $ionicSideMenuDelegate, $filter, $translate, $timeout) {

            if (window.screen && window.screen.lockOrientation) {
                window.screen.lockOrientation('landscape');
            }

            $timeout($ionicLoading.hide, 2000);

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
                $ionicLoading.show({
                    template: '<div class="sk-spinner sk-spinner-circle">' +
                        '<div class="sk-circle1 sk-circle"></div>' +
                        '<div class="sk-circle2 sk-circle"></div>' +
                        '<div class="sk-circle3 sk-circle"></div>' +
                        '<div class="sk-circle4 sk-circle"></div>' +
                        '<div class="sk-circle5 sk-circle"></div>' +
                        '<div class="sk-circle6 sk-circle"></div>' +
                        '<div class="sk-circle7 sk-circle"></div>' +
                        '<div class="sk-circle8 sk-circle"></div>' +
                        '<div class="sk-circle9 sk-circle"></div>' +
                        '<div class="sk-circle10 sk-circle"></div>' +
                        '<div class="sk-circle11 sk-circle"></div>' +
                        '<div class="sk-circle12 sk-circle"></div>' +
                        '</div>'
                });

                $timeout(function() {
                    $state.go('app.room', {
                        roomId: $rootScope.room
                    });
                }, 300);
            };

            var translate = $filter('translate');
            var language = $translate.use();
            if (language !== 'de') {
                language = 'en';
            }

            var fbHistoryRef = 'homes/' + user.uid + '/histories/' + $rootScope.room;

            Highcharts.setOptions({
                // lang: {
                //     months: ["Januar,Februar,März,April,Mayi,Juni,Juli,August,September,Oktober,November,DeZember"],
                //     weekdays: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Frietag', 'Samstag', 'Sonntag']
                // }
                global: {
                    useUTC: false
                }    
            });

            var getData = function(cb) {
                fbutil.ref(fbHistoryRef).once('value', function(fbData) {

                    var series = [];

                    fbData.forEach(function(fbMeasure) {

                        if (fbMeasure.val()) {
                            var name;
                            var yAxis;

                            if (fbMeasure.key() === 'co2') {
                                name = translate('AIR_QUALITY');
                                yAxis = 2;
                            } else if (fbMeasure.key() === 'humidity') {
                                name = translate('HUMIDITY');
                                yAxis = 1;
                            } else if (fbMeasure.key() === 'temperature') {
                                name = translate('TEMPERATURE');
                                yAxis = 0;
                            } else if (fbMeasure.key() === 'target') {
                                name = translate('TARGET');
                                yAxis = 0;
                            } else if (fbMeasure.key() === 'valve') {
                                name = translate('VALVE');
                                yAxis = 1;
                            }

                            series.push({
                                name: name,
                                data: [],
                                type: name === translate('TARGET') ? 'line' : 'spline',
                                step: name === translate('TARGET') ? true : false,
                                visible: name === translate('TEMPERATURE') ? true : false,
                                yAxis: yAxis
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
                        yAxis: [{ // Primary yAxis
                            minTickInterval: 0.5,
                            labels: {
                                format: '{value}°C',
                                style: {
                                    color: Highcharts.getOptions().colors[3]
                                }
                            },
                            title: {
                                text: translate('TEMPERATURE'),
                                style: {
                                    color: Highcharts.getOptions().colors[3]
                                }
                            },
                            opposite: false

                        }, { // Secondary yAxis
                            gridLineWidth: 0,
                            title: {
                                text: translate('HUMIDITY'),
                                style: {
                                    color: Highcharts.getOptions().colors[1]
                                }
                            },
                            labels: {
                                format: '{value} %',
                                style: {
                                    color: Highcharts.getOptions().colors[1]
                                }
                            },
                            opposite: true

                        }, { // Tertiary yAxis
                            gridLineWidth: 0,
                            min: 350,
                            //max: 3000,
                            title: {
                                text: 'CO2',
                                style: {
                                    color: Highcharts.getOptions().colors[0]
                                }
                            },
                            labels: {
                                format: '{value} ppm',
                                style: {
                                    color: Highcharts.getOptions().colors[0]
                                }
                            },
                            opposite: false
                        }, { // Tertiary yAxis
                            gridLineWidth: 0,
                            min: 0,
                            max: 100,
                            title: {
                                text: translate('VALVE'),
                                style: {
                                    color: Highcharts.getOptions().colors[0]
                                }
                            },
                            labels: {
                                format: '{value} %',
                                style: {
                                    color: Highcharts.getOptions().colors[0]
                                }
                            },
                            opposite: true
                        }],
                        exporting: {
                            enabled: false
                        },
                        credits: {
                            enabled: false
                        },
                        plotOptions: {
                            spline: {
                                marker: {
                                    enabled: false
                                }
                            },
                            line: {
                                marker: {
                                    enabled: false
                                }
                            }
                        }
                    },
                    series: data
                };
                $ionicLoading.hide();
            });








        }


    ]);