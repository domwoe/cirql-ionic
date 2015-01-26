'use strict';

angular.module('cirqlApp')
    .directive('roomTemperature', ['$timeout', '$ionicLoading', '$ionicSideMenuDelegate',
        function($timeout, $ionicLoading, $ionicSideMenuDelegate) {

            var targetTimer = null;
            var target = null;

            var polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
                var angleInRadians = (angleInDegrees - 230) * Math.PI / 180.0;

                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            };

            var drawArc = function(arc, start, end, min, max, R, size, targetColor) {
                if (!size) {
                    return;
                }
                var end = end >= max ? max - 0.00001 : end,
                    type = 279.9999,
                    perc = (start - min) / (max - min) * type,
                    perc_end = (end - min) / (max - min) * type,
                    x = size / 2,
                    startCart = polarToCartesian(x, x, R, perc),
                    endCart = polarToCartesian(x, x, R, perc_end);

                var d = d3.svg.arc()
                    .innerRadius(R)
                    .outerRadius(R)
                    .startAngle((perc - 140) * 2 * Math.PI / 360)
                    .endAngle((perc_end - 140) * 2 * Math.PI / 360);

                arc.attr('d', d)
                    .attr('transform', 'translate(' + x + ',' + x + ')')
                    .attr('stroke', targetColor)
                    .attr('stroke-opacity', '0.8')
                //.attr('stroke-width', '5')
                .attr('stroke-linecap', 'round');
                //.attr('stroke-dasharray', '1,10');
                return [startCart, endCart];
            };


            function colorForTemperature(temperature) {

                if (temperature < 16) {
                    return '#1F3A93';
                } else if (temperature < 18) {
                    return '#22A7F0';
                } else if (temperature < 19) {
                    return '#F9BF3B';
                } else if (temperature < 21) {
                    return '#F39C12';
                } else if (temperature < 22) {
                    return '#F9690E';
                } else if (temperature < 24) {
                    return '#F22613';
                } else if (temperature >= 24) {
                    return '#CF000F';
                } else {
                    return '#000';
                }
            }

            var updateMeasuredArc = function(arc, start, end, min, max, R, size, ishome, roomid) {

                var color = colorForTemperature(end);
                //color = '#FFF';
                var carts = drawArc(arc, start, end, min, max, R, size, '#FFF');
                var endCart = carts[1];
                var icon = d3.select('#thermoIcon' + ishome + roomid);
                icon.attr(
                    'transform', 'translate(' + (endCart.x - 20.5) + ',' + (endCart.y - 21) + ')');
                icon.select('#bgCircle').attr('fill', color);
                icon.select('#tempDrawer' + ishome + roomid)
                    .select('rect')
                    .attr('fill', color);
            };

            var updateTargetArc = function(arc, start, end, mustHeat, min, max, R, size, ishome, roomid) {
                var targetColor = mustHeat ? '#F9690E' : '#3498DB';
                targetColor = '#000';

                var targetColor = colorForTemperature(mustHeat ? end : start);
                var measuredColor = colorForTemperature(mustHeat ? start : end);

                var colorBegin = mustHeat ? measuredColor : targetColor;
                var colorEnd = mustHeat ? targetColor : measuredColor;

                var gradient = d3.select('#gradient' + ishome + roomid)
                    .selectAll('stop')
                    .data([colorBegin, colorEnd])
                    .attr('stop-color', function(d) {
                        return d;
                    });





                //var carts = drawArc(arc, start, end, min, max, R, size, targetColor);
                //
                //$timeout(function() {

                var carts = drawArc(arc, start, end, min, max, R, size, 'url(#gradient' + ishome + roomid + ')');
                var targetCart = mustHeat ? carts[1] : carts[0];




                var bgTarget = d3.select('#bgTargetHandle' + ishome + roomid);
                bgTarget.attr({
                    'cx': targetCart.x,
                    'cy': targetCart.y
                });

                var bgicon = d3.select('#bgTargetIcon' + ishome + roomid);
                bgicon.attr({
                    'cx': targetCart.x,
                    'cy': targetCart.y
                })
                    .attr('fill', targetColor);



                var icon = d3.select('#targetIcon' + ishome + roomid);
                icon.attr(
                    'transform',
                    'translate(' + (targetCart.x - 20.5) + ',' + (targetCart.y - 21) + ') scale(0.6)'
                );

                //});

            };

            return {
                restrict: 'EA',
                scope: {
                    displaytarget: '=',
                    hasthermostats: '=',
                    finishedloading: '=',
                    isaway: '=',
                    ishome: '@',
                    mode: '=',
                    usesautoaway: '=',
                    roomid: '=',
                    targettemp: '=',
                    measuredtemp: '=',
                    valve: '=',
                    scale: '@',
                    min: '=',
                    max: '=',
                    radius: '@',
                    color: '@',
                    bgcolor: '@',
                    stroke: '@',
                    addactivityfn: '&'
                },
                link: function(scope, element, attrs) {
                    var ring_background = element.find('circle'),
                        size;

                    var mouseDragCallback = function() {
                        function roundHalf(num) {
                            num = Math.round(num * 2) / 2;
                            return num;
                        }

                        var coords = [0, 0];
                        coords = d3.mouse(this);
                        var phi = Math.atan2(coords[1] - 125, coords[0] - 125);
                        phi = (phi * 360 / (2 * Math.PI) + 230) % 360;



                        target = roundHalf(phi * (scope.max - scope.min) / 270) + scope.min;

                        if (target > scope.max) {
                            target = scope.max;
                        } else if (target < scope.min) {
                            target = scope.min;
                        }

                        // draw arcs
                        renderState(target, null);

                        //scope.targettemp = target;

                    };

                    var radius = scope.radius,
                        stroke = scope.stroke;

                    size = radius * 2 + parseInt(stroke) * 2;

                    var isAutoAway = null;

                    var renderCircle = function() {
                        $timeout(function() {

                            var scalingContainer = d3.select('#scaling' + scope.ishome + scope.roomid),
                                measured_ring = d3.select('#measured_path' + scope.ishome + scope.roomid),
                                thermoIcon = d3.select('#thermoIcon' + scope.ishome + scope.roomid),
                                tempDrawer = d3.select('#tempDrawer' + scope.ishome + scope.roomid),
                                bgTargetHandle = d3.select('#bgTargetHandle' + scope.ishome + scope.roomid),
                                bgTargetIcon = d3.select('#bgTargetIcon' + scope.ishome + scope.roomid),
                                ring = d3.select('#target_path' + scope.ishome + scope.roomid),
                                targetIcon = d3.select('#targetIcon' + scope.ishome + scope.roomid),
                                flame = d3.select('#flame' + scope.ishome + scope.roomid);

                            if (scope.displaytarget) {
                                bgTargetHandle.call(d3.behavior.drag()
                                    .on('dragstart', function() {
                                        event.stopPropagation();
                                        event.preventDefault();
                                        //d3.selectAll('.info').remove();
                                        $ionicSideMenuDelegate.canDragContent(false);
                                        //mouseDragCallback();
                                        clearTimeout(targetTimer);
                                    })
                                    .on('drag', mouseDragCallback)
                                    .on('dragend', function() {
                                        $ionicSideMenuDelegate.canDragContent(true);
                                        // Set target in scope (and firebase) 1s after
                                        // releasing the icon
                                        if (!isNaN(parseFloat(target))) {
                                            targetTimer = setTimeout(function() {
                                                scope.targettemp = target;
                                                scope.addactivityfn({
                                                    activity: {
                                                        type: 'set-target',
                                                        target: target
                                                    }
                                                });
                                            }, 500);
                                        }
                                    }));

                            } else {
                                //targetIcon.style('visibility', 'hidden');
                                //bgTargetIcon.style('visibility', 'hidden');
                                bgTargetHandle.style('visibility', 'hidden');
                            }

                            thermoIcon.on('click', function() {
                                var visibility = tempDrawer.style('visibility');
                                if (visibility === 'hidden') {
                                    tempDrawer.style('visibility', 'visible');
                                } else {
                                    tempDrawer.style('visibility', 'hidden');
                                }
                            });

                            scalingContainer.attr({
                                'transform': 'scale(' + scope.scale + ')'
                            });

                            element.attr({
                                'width': size,
                                'height': size,
                            });

                            measured_ring.attr({
                                'stroke-width': stroke,
                                'stroke-opacity': 1,
                            });

                            // if (!scope.displaytarget) {
                            //     ring.style('visibility', 'hidden');
                            // }
                            ring.attr({
                                'stroke-width': stroke
                            });

                            ring_background.attr({
                                'cx': radius,
                                'cy': radius,
                                'transform': 'translate(' + stroke + ', ' + stroke + ')',
                                'r': radius,
                                'fill': scope.bgcolor,
                                'fill-opacity': 0.3
                            });

                            // Show UI info
                            // ring_background.on('click', function() {
                            //     d3.selectAll('.info').remove();
                            //     var x = bgTargetIcon.attr('cx');
                            //     var y = bgTargetIcon.attr('cy');
                            //     // Show only if not currently away
                            //     if (!(scope.isaway && scope.mode === 'auto' && scope.usesautoaway)) {
                            //         scalingContainer.append('text')
                            //             .text('Move me!')
                            //             .attr('font-weight', 600)
                            //             .attr('fill', '#ffffff')
                            //             .attr('class', 'info target')
                            //             .attr('x', x)
                            //             .attr('y', y - 20)
                            //             .attr('text-anchor', 'middle');
                            //     }
                            //     scalingContainer.append('text')
                            //         .text('Swipe me!')
                            //         .attr('font-weight', 600)
                            //         .attr('fill', '#ffffff')
                            //         .attr('class', 'info')
                            //         .attr('x', 125)
                            //         .attr('y', 170)
                            //         .attr('text-anchor', 'middle');

                            //     d3.selectAll('.info')
                            //         .transition()
                            //         .style('opacity', 0)
                            //         .duration(1000)
                            //         .delay(1500);

                            // });

                            flame.select('rect')
                                .on('click', function() {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    console.log('click on flame');
                                    d3.selectAll('.info').remove();
                                    flame.append('text')
                                        .text(scope.valve + '%')
                                        .attr('font-size', '12px')
                                        .attr('font-weight', 600)
                                        .attr('fill', '#fff')
                                        .attr('class', 'info valve');

                                    d3.selectAll('.info')
                                        .transition()
                                        .style('opacity', 0)
                                        .duration(1000)
                                        .delay(1500);
                                });

                            renderState(scope.targettemp, scope.targettemp);

                        });
                    };

                    var renderState = function(newValue, oldValue) {

                        if (scope.targettemp) {
                            if (!angular.isDefined(newValue)) {
                                return false;
                            }
                            if (newValue > scope.max) {
                                if (oldValue >= scope.max) {
                                    return scope.targettemp = scope.max;
                                } else {
                                    return scope.targettemp = scope.min;
                                }
                            }

                            if (newValue < scope.min) {
                                // if (oldValue >= scope.max) {
                                //     return scope.targettemp = scope.max;
                                // } else {
                                return scope.targettemp = scope.min;
                                // }
                            }


                            if (newValue < 21 && !isAutoAway) {
                                scope.leafVisibility = 'visible';
                            } else {
                                scope.leafVisibility = 'hidden';
                            }


                            scope.temp = Math.floor(newValue);
                            if (newValue * 10 == (newValue.toFixed(0)) * 10) {
                                scope.dotTemp = 0;
                            } else {
                                scope.dotTemp = 5;
                            }

                            if (scope.measuredtemp >= newValue) {
                                var startTemp = newValue;
                                var endTemp = scope.measuredtemp;
                                var mustHeat = false;
                            } else {
                                var endTemp = newValue;
                                var startTemp = scope.measuredtemp;
                                var mustHeat = true;
                            }

                            //if (scope.displaytarget) {
                            var ring = d3.select('#target_path' + scope.ishome + scope.roomid);
                            updateTargetArc(
                                ring,
                                startTemp,
                                endTemp,
                                mustHeat,
                                scope.min,
                                scope.max,
                                scope.radius - 5,
                                size,
                                scope.ishome,
                                scope.roomid
                            );
                            //}
                            //
                            $ionicLoading.hide();

                            //$timeout(function() {
                            //scope.$apply();
                            scope.finishedloading = true;

                            //});
                        }
                    };

                    var renderThermoIcon = function(temp) {
                        if (temp) {
                            d3.select('#thermoIcon' + scope.ishome + scope.roomid)
                                .style('visibility', 'visible');
                        } else {
                            d3.select('#thermoIcon' + scope.ishome + scope.roomid)
                                .style('visibility', 'hidden');
                        }

                        $timeout(function() {
                            var measured_ring = d3.select('#measured_path' + scope.ishome + scope.roomid);
                            if (scope.measuredtemp) {
                                updateMeasuredArc(
                                    measured_ring,
                                    scope.min,
                                    scope.measuredtemp,
                                    scope.min,
                                    scope.max,
                                    scope.radius - 5,
                                    size,
                                    scope.ishome,
                                    scope.roomid
                                );
                                renderState(scope.targettemp, scope.targettemp);
                            }
                        });
                    };

                    function showWarning(msg) {

                        d3.select('#scaling' + scope.ishome + scope.roomid)
                            .append('text')
                            .attr('class', 'warning')
                            .attr('fill', '#FFF')
                            .attr('font-weight', '600')
                            .append('tspan')
                            .attr('x', '125')
                            .attr('y', '180')
                            .attr('text-anchor', 'middle')
                            .text(msg)

                        $timeout(scope.$apply);

                    }

                    function showAwayOrTarget() {
                        if (scope.isaway && scope.usesautoaway) {
                            d3.selectAll('.target' + scope.ishome + scope.roomid).style('visibility', 'hidden');
                            d3.select('#labelaway' + scope.ishome + scope.roomid).style('visibility', 'visible');
                            isAutoAway = true;
                            scope.leafVisibility = 'hidden';
                            d3.select('#flame' + scope.ishome + scope.roomid).style('visibility', 'hidden');

                        } else {
                            d3.selectAll('.target' + scope.ishome + scope.roomid).style('visibility', 'visible');
                            d3.select('#labelaway' + scope.ishome + scope.roomid).style('visibility', 'hidden');
                            isAutoAway = false;
                            d3.select('#flame' + scope.ishome + scope.roomid).style('visibility', 'visible');

                            if (scope.targettemp < 21) {
                                scope.leafVisibility = 'visible';
                            } else {
                                scope.leafVisibility = 'hidden';
                            }
                        }
                    }

                    function colorFlame(newValue, oldValue) {

                        if (newValue) {
                            var flame = d3.select('#flame' + scope.ishome + scope.roomid);
                            var low = flame.select('#low');
                            var medium = flame.select('#medium');
                            var high = flame.select('#high')

                            if (newValue === 0 || newValue === 'null') {
                                low.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');
                                medium.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');
                                high.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');
                            } else if (newValue < 40) {
                                low.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');
                                medium.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');
                                high.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');

                            } else if (newValue < 80) {
                                low.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');
                                medium.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');
                                high.attr('fill', '#fff')
                                    .attr('fill-opacity', '0.4');

                            } else {
                                low.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');
                                medium.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');
                                high.attr('fill', '#F9690E')
                                    .attr('fill-opacity', '1');

                            }
                        }

                    }

                    scope.$watch('targettemp', renderState);
                    scope.$watch('measuredtemp', renderThermoIcon);
                    // scope.$watch('hasthermostats',
                    //     function(hasThermostats) {
                    //         //console.log(hasThermostats);
                    //         if (hasThermostats === false) {
                    //             showWarning('No Thermostats!');
                    //         } else if (hasThermostats === true) {
                    //             d3.select('#scaling' + scope.ishome + scope.roomid + '.warning').remove();
                    //         }
                    //     }
                    // );

                    scope.$watch('isaway', showAwayOrTarget);
                    scope.$watch('mode', showAwayOrTarget);
                    scope.$watch('usesautoaway', showAwayOrTarget);
                    scope.$watch('valve', colorFlame);

                    renderCircle();

                },
                replace: true,
                template: '\
                <svg id="room-temperature" width="100%" height="100%" overflow:"visible" viewBox="0 -5 250 250" preserveAspectRatio="xMidYMin" xmlns="http://www.w3.org/2000/svg" >\
                    <defs>\
                        <linearGradient id="gradient{{ishome}}{{roomid}}" x1="0%" y1="0%" x2="100%" y2="0%">\
                            <stop offset="0%"></stop>\
                            <stop offset="100%"></stop>\
                        </linearGradient>\
                    </defs>\
                    <g id="scaling{{ishome}}{{roomid}}">\
                        <circle fill="none"/>\
                        <g id="label" fill="#FFF" font-weight="normal">\
                            <text id="labelaway{{ishome}}{{roomid}}" font-size="48">\
                                <tspan text-anchor="middle" x="132" y="130">AWAY</tspan>\
                            </text>\
                            <text class="target{{ishome}}{{roomid}}" font-size="64">\
                                <tspan text-anchor="end" x="177" y="130">{{temp}}°</tspan>\
                            </text>\
                            <text class="target{{ishome}}{{roomid}}" font-size="28" fill="#FFFFFF">\
                                <tspan  x="150" y="130">.{{dotTemp}}</tspan>\
                            </text>\
                        </g>\
                        <g id="leaf" visibility={{leafVisibility}} transform="translate(60,105)" fill="#26A65B">\
                            <path d="M11.9412,-0.0695918367 C11.9412,-0.0695918367 10.3218,1.53346939 8.5706,2.17979592 C-4.3978,6.96632653 1.0716,16.2938776 1.25,16.3244898 C1.25,16.3244898 1.9772,15.0322449 2.9596,14.2953061 C9.1932,9.61918367 10.4602,4.23673469 10.4602,4.23673469 C10.4602,4.23673469 9.0612,10.7134694 3.5156,14.7434694 C2.2908,15.6332653 1.4614,17.8236735 1.1104,20.0128571 C1.1104,20.0128571 1.9786,19.655102 2.352,19.5579592 C2.4976,18.5885714 2.802,17.6602041 3.3166,16.8310204 C11.0674,17.7726531 13.6058,11.3997959 13.9374,9.17755102 C14.72,3.92918367 11.9412,-0.0695918367 11.9412,-0.0695918367 L11.9412,-0.0695918367 Z"></path>\
                        </g>\
                        <g id="flame{{ishome}}{{roomid}}" fill="#FFF" fill-opacity="0.4" transform="translate(112,190) scale(2)">\
                            <path d="M10.167,10.778 C10.084,9.648 9.624,8.635 8.924,7.849 C7.806,6.589 7.345,5.281 7.345,2.904 C6.668,3.675 6.407,4.399 6.182,5.133 C6.213,6.231 6.298,7.33 6.527,8.404 C6.676,9.1 6.854,9.79 7.099,10.457 C7.346,11.133 7.73,11.804 7.858,12.518 C8.098,13.861 7.498,14.892 6.767,15.884 C6.971,15.817 7.16,15.735 7.325,15.635 C8.53,14.913 10.326,12.893 10.167,10.778 L10.167,10.778 Z" id="high"></path>\
                            <path d="M6.212,16.019 C6.517,15.627 6.815,15.231 7.069,14.806 C7.836,13.518 7.479,12.474 6.968,11.161 C6.157,9.075 5.867,6.944 5.805,4.74 C5.453,3.013 4.779,1.413 3.848,0 C3.912,0.331 3.956,1.074 3.984,1.416 C4.145,3.588 3.719,5.136 2.321,7.035 C2.924,8.962 3.945,10.563 4.397,12.554 C4.666,13.739 4.724,14.908 4.64,16.073 C5.164,16.128 5.712,16.11 6.212,16.019 L6.212,16.019 Z" id="medium"></path>\
                            <path d="M3.885,12.071 C3.385,10.405 1.647,6.621 1.103,4.988 C1.103,6.288 0.972,7.376 0.846,7.899 C0.545,9.154 0.265,10.457 0.265,11.518 C0.265,13.362 2.005,15.003 3.084,15.622 C3.411,15.81 3.829,15.943 4.282,16.022 C4.376,14.704 4.281,13.386 3.885,12.071 L3.885,12.071 Z" id="low"></path>\
                            <rect x="-5" y="-3" width="20" height="24" fill-opacity="0">\
                        </g>\
                        <g id="arcGroup">\
                            <path id="measured_path{{ishome}}{{roomid}}"/>\
                            <path id="target_path{{ishome}}{{roomid}}" class="target{{ishome}}{{roomid}}"/>\
                            <g id="thermoIcon{{ishome}}{{roomid}}">\
                                <g id="tempDrawer{{ishome}}{{roomid}}">\
                                    <rect id="Rectangle-7" fill-opacity="0.5" fill="#FFFFFF" x="0" y="0" width="90" height="35" rx="20"></rect>\
                                     <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF">\
                                        <tspan x="34" y="25">{{measuredtemp}}°</tspan>\
                                    </text>\
                                </g>\
                                <ellipse id="bgCircle" fill="#FFFFFF" fill-opacity="1" cx="16.8578741" cy="16.9670933" rx="16.9702336" ry="16.9670933"></ellipse>\
                                <g id="Thermometer" fill="#FFFFFF" transform="translate(12, 5) scale(0.75)">\
                                    <path d="M9.17602996,19.8825764 L9.17602996,3.69998611 C9.17602996,1.65603472 7.52893258,0 5.50561798,0 C3.47863296,0 1.83520599,1.65049306 1.83520599,3.69998611 L1.83520599,19.8825764 C0.708389513,20.897625 0,22.3726319 0,24.0138889 C0,27.0728889 2.46559925,29.5555556 5.50561798,29.5555556 C8.5447191,29.5555556 11.011236,27.0728889 11.011236,24.0138889 C11.011236,22.3726319 10.303764,20.897625 9.17602996,19.8825764 L9.17602996,19.8825764 Z M5.50561798,27.7083333 C3.47863296,27.7083333 1.83520599,26.0541458 1.83520599,24.0138889 C1.83520599,22.6469444 2.5738764,21.4527153 3.67041199,20.8135764 L3.67041199,3.6990625 C3.67041199,2.67570139 4.49258427,1.84722222 5.50561798,1.84722222 C6.52507491,1.84722222 7.34082397,2.67570139 7.34082397,3.6990625 L7.34082397,20.8135764 C8.43735955,21.4517917 9.17602996,22.6460208 9.17602996,24.0138889 C9.17602996,26.0541458 7.532603,27.7083333 5.50561798,27.7083333 L5.50561798,27.7083333 Z" id="Shape"></path>\
                                    <path d="M6.40853933,21.396375 C6.41863296,21.3455764 6.42322097,21.2938542 6.42322097,21.2402847 L6.42322097,12.0097153 C6.42322097,11.4980347 6.01672285,11.0833333 5.50561798,11.0833333 C4.99818352,11.0833333 4.58801498,11.5045 4.58801498,12.0097153 L4.58801498,21.2402847 C4.58801498,21.2938542 4.592603,21.3455764 4.60086142,21.396375 C3.52543071,21.7722847 2.75280899,22.8021111 2.75280899,24.0138889 C2.75280899,25.5443125 3.98514981,26.7847222 5.50561798,26.7847222 C7.02608614,26.7847222 8.25842697,25.5443125 8.25842697,24.0138889 C8.25842697,22.8021111 7.48580524,21.7722847 6.40853933,21.396375 L6.40853933,21.396375 Z" id="Shape"></path>\
                                </g>\
                            </g>\
                        </g>\
                        <ellipse id="bgTargetIcon{{ishome}}{{roomid}}" class="target{{ishome}}{{roomid}}" fill="#000000" cx="16" cy="16" rx="17" ry="17"></ellipse>\
                        <g id="targetIcon{{ishome}}{{roomid}}" class="target{{ishome}}{{roomid}}" transform="scale(0.6)">\
                            <path d="M34.17748,48.2729852 L34,48.43866 L33.82048,48.2729852 C25.738646,40.7478615 20.4,35.7777919 20.4,30.7424988 C20.4,27.2602413 22.957463,24.6386905 26.35,24.6386905 C28.963546,24.6386905 31.51528,26.3826357 32.41288,28.7530933 L35.58508,28.7530933 C36.48268,26.3826357 39.03438,24.6386905 41.65,24.6386905 C45.05,24.6386905 47.6,27.2602413 47.6,30.7424988 C47.6,35.7777919 42.25928,40.7478615 34.17748,48.2729852 L34.17748,48.2729852 Z M41.65,21.1508 C38.68928,21.1508 35.85368,22.5550945 34,24.785583 C32.14428,22.5550945 29.308663,21.1508 26.35,21.1508 C21.106129,21.1508 17,25.3611198 17,30.7424988 C17,37.3229274 22.78238,42.706312 31.53568,50.8559425 L34,53.1508 L36.46228,50.8559425 C45.21558,42.706312 51,37.3229274 51,30.7424988 C51,25.3611198 46.89178,21.1508 41.65,21.1508 L41.65,21.1508 Z" fill="#FFFFFF"></path>\
                        </g>\
                        <ellipse id="bgTargetHandle{{ishome}}{{roomid}}" class="target{{ishome}}{{roomid}}" fill="#000000" fill-opacity="0" cx="16" cy="16" rx="30" ry="30"></ellipse>\
                    </g>\
                </svg>'
            };
        }
    ]);