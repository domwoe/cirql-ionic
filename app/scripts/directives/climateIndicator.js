'use strict';

angular.module('cirqlApp')
    .directive('climateindicator', ['timeutils',

        function(timeutils) {
            return {
                restrict: 'EA',
                replace: true,
                scope: {
                    type: '@',
                    value: '=',
                    thresholds: '=',
                    date: '=',
                    cssclass: '@'
                },
                link: function(scope, element) {

                    var icon;

                    function findState(value, thresholds, cb) {
                        for (var color in thresholds) {
                            thresholds[color].forEach(function(range) {
                                if (value >= range.start && value < range.end) {
                                    cb(color);
                                }
                            });
                        }
                    }

                    var svgAir = '<svg id="air-quality" class="' + scope.cssclass + '" width="71px" height="70px" viewBox="0 0 71 70" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                        '<g id="Page-25" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
                        '<g id="Portrait-10" transform="translate(-91.000000, -768.000000)">' +
                        '<g id="AirQuality" transform="translate(92.000000, 768.000000)">' +
                        '<ellipse id="bg_Circle" fill-opacity="0" fill="#D0011B" cx="34.8578741" cy="34.9836262" rx="34.9702336" ry="34.9836262"></ellipse>' +
                        '<path d="M27.119419,38.0871089 C32.7557415,38.0871089 37.3248836,33.5098684 37.3248836,27.8635562 C37.3248836,22.2172439 32.7557415,17.6400034 27.119419,17.6400034 C21.4830965,17.6400034 16.9139543,22.2172439 16.9139543,27.8635562 C16.9139543,33.5098684 21.4830965,38.0871089 27.119419,38.0871089 Z M34.4090366,54.1526917 C37.6297923,54.1526917 40.2407307,51.5371257 40.2407307,48.3106616 C40.2407307,45.0841974 37.6297923,42.4686315 34.4090366,42.4686315 C31.1882809,42.4686315 28.5773425,45.0841974 28.5773425,48.3106616 C28.5773425,51.5371257 31.1882809,54.1526917 34.4090366,54.1526917 Z M46.0724247,43.929139 C50.0983694,43.929139 53.3620423,40.6596815 53.3620423,36.6266013 C53.3620423,32.5935212 50.0983694,29.3240637 46.0724247,29.3240637 C42.0464801,29.3240637 38.7828071,32.5935212 38.7828071,36.6266013 C38.7828071,40.6596815 42.0464801,43.929139 46.0724247,43.929139 Z" stroke="#FFFFFF" stroke-width="2"></path>' +
                        '</g>' +
                        '</g>' +
                        '</g>' +
                        '</svg>';

                    var svgHumidity = '<svg id="humidity" class="' + scope.cssclass + '" width="71px" height="70px" viewBox="0 0 71 70" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                        '<g id="Page-25" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
                        '<g id="Portrait-10" transform="translate(-91.000000, -853.000000)">' +
                        '<g id="Humidity" transform="translate(92.000000, 853.000000)">' +
                        '<ellipse id="bg_Circle" fill-opacity="0" fill="#7ED321" cx="34.8578741" cy="34.9836262" rx="34.9702336" ry="34.9836262"></ellipse>' +
                        '<g id="Drop" transform="translate(22.000000, 17.000000)" fill="#FFFFFF">' +
                        '<path d="M12.6128049,0.272017544 L12.195122,-0.24622807 L11.777439,0.272017544 C11.2841463,0.884210526 -0.286585366,15.3060526 -0.286585366,22.0635088 C-0.286585366,28.9935088 5.31280488,34.632807 12.1945122,34.632807 C19.0762195,34.632807 24.6762195,28.9935088 24.6762195,22.0635088 C24.6768293,15.3042105 13.104878,0.883596491 12.6128049,0.272017544 L12.6128049,0.272017544 Z M8.56341463,29.592807 L8.40121951,29.5154386 C4.40609756,27.6002632 3.07621951,22.4251754 4.33658537,18.7925439 L4.39634146,18.6230702 L5.41219512,18.9792105 L5.35304878,19.1505263 C4.26707317,22.2741228 5.44207317,26.8965789 8.86341463,28.5391228 L9.02560976,28.6164912 L8.56341463,29.592807 L8.56341463,29.592807 Z"></path>' +
                        '</g>' +
                        '</g>' +
                        '</g>' +
                        '</g>' +
                        '</svg>';

                    if (scope.type === 'airquality') {

                        icon = svgAir;

                    } else if (scope.type === 'humidity') {

                        icon = svgHumidity;

                    }
                    element.append(icon);

                    scope.$watch('value', function(newValue) {

                        if (!timeutils.isOld(scope.date)) {
                            findState(newValue, scope.thresholds, function(state) {
                                var cssClass = state + '-bg';

                                element.addClass(cssClass);

                            });
                        }
                        else {
                            element.addClass('old-bg');
                        }    

                    });
                }



            };
        }
    ]);