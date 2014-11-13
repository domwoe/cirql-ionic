'use strict';

angular.module('cirqlApp')
    .directive('roomTemperature', ['$timeout', '$ionicSideMenuDelegate', function($timeout,$ionicSideMenuDelegate) {

            var targetTimer = null;
            var target = null;

            var polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
                var angleInRadians = (angleInDegrees - 230) * Math.PI / 180.0;

                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            }

            var drawArc = function(arc, start, end, max, R, size, targetColor) {
                 if (!size) {
                    return;
                }
                var end       = end >= max ? max - 0.00001 : end,
                    type      = 279.9999,
                    perc      = start/max*type,
                    perc_end  = end/max*type,
                    x         = size/2,
                    startCart = polarToCartesian(x, x, R, perc),
                    endCart   = polarToCartesian(x, x, R, perc_end);
                    
                var d = d3.svg.arc()
                    .innerRadius(R)
                    .outerRadius(R)
                    .startAngle((perc - 140)*2*Math.PI/360)
                    .endAngle((perc_end - 140)*2*Math.PI/360);

                arc.attr('d', d)
                   .attr('transform', 'translate(' + x + ',' + x + ')')
                   .attr('stroke', targetColor);
                return [startCart, endCart];
            }

            var updateMeasuredArc = function(arc, start, end, max, R, size, roomid) {
                var carts = drawArc(arc, start, end, max, R, size, "#FFF");
                var endCart = carts[1];
                var icon = d3.select("#thermoIcon" + roomid);
                icon.attr(
                    'transform', 'translate(' + (endCart.x - 20.5) + ',' + (endCart.y - 21) + ')'
                );
            };

            var updateTargetArc = function(arc, start, end, mustHeat, min, max, R, size, roomid) {
                var targetColor = mustHeat ? '#F9690E' : '#3498DB';
                var carts = drawArc(arc, start, end, max, R, size, targetColor);
                var targetCart = mustHeat? carts[1]: carts[0];

                var bgicon = d3.select("#bgTargetIcon" + roomid);
                bgicon.attr({
                    'cx': targetCart.x,
                    'cy': targetCart.y
                    })
                    .attr('fill',targetColor);
          
                var icon = d3.select("#targetIcon" + roomid); 
                icon.attr(
                    'transform', 
                    'translate(' + (targetCart.x - 20.5) + ',' + (targetCart.y - 21) + ') scale(0.6)'
                );
            };

            return {
                restrict: 'EA',
                scope: {
                    displaytarget:  "=",
                    roomid:         "=",
                    targettemp:     "=",
                    measuredtemp:   "=",
                    mode:           "=",
                    scale:          "=",
                    min:            "=",
                    max:            "=",
                    radius:         "@",
                    color:          "@",
                    bgcolor:        "@",
                    stroke:         "@"
                },
                link: function (scope, element, attrs) {
                    var ring_background     = element.find('circle'),
                        size;

                    var mouseDragCallback = function() {
                        function roundHalf(num) {
                            num = Math.round(num*2)/2;
                            return num;
                        }

                        var coords = [0,0];
                        coords = d3.mouse(this);
                        var phi = Math.atan2(coords[1] - 125, coords[0] - 125);
                        phi = (phi*360/(2*Math.PI) + 230)%360 ;

                        target = roundHalf(phi*scope.max/270);

                        // draw arcs
                        renderState(target);

                        //scope.targettemp = target;

                    };

                    var heartbeat = function() {
                        var heart = d3.select('#heart' + scope.roomid);
                        console.log(heart);
                        heart.classed('heart-beat', true);
                        setTimeout(function() {
                             heart.classed('heart-beat', false);    
                        }, 2000);
                    };

                    var radius           = scope.radius,
                        stroke           = scope.stroke;

                    size = radius*2 + parseInt(stroke)*2;

                    var renderCircle = function() {
                        $timeout(function() {
                           
                            var scalingContainer    = d3.select('#scaling' + scope.roomid),
                                measured_ring       = d3.select('#measured_path' + scope.roomid),
                                thermoIcon          = d3.select('#thermoIcon' + scope.roomid),
                                tempDrawer          = d3.select('#tempDrawer' + scope.roomid),
                                bgTargetIcon        = d3.select('#bgTargetIcon' + scope.roomid),
                                ring                = d3.select('#target_path' + scope.roomid),
                                targetIcon          = d3.select('#targetIcon' + scope.roomid);

                            if (scope.displaytarget) {
                                bgTargetIcon.call(d3.behavior.drag()
                                    .on('dragstart', function() {
                                        $ionicSideMenuDelegate.canDragContent(false);
                                        mouseDragCallback();
                                        clearTimeout(targetTimer);
                                    })
                                    .on('drag', mouseDragCallback)
                                    .on('dragend', function() {
                                        $ionicSideMenuDelegate.canDragContent(true);
                                        // Set target in scope (and firebase) 1s after
                                        // releasing the icon
                                        targetTimer = setTimeout( function() {
                                            scope.targettemp = target;
                                        },1000);   
                                        //heartbeat();
                                    }));
                            } else {
                                targetIcon.style("visibility", 'hidden');
                                bgTargetIcon.style("visibility", 'hidden');
                            }

                            thermoIcon.on('click', function() {
                                var visibility = tempDrawer.style("visibility");
                                if (visibility === 'hidden') {
                                    tempDrawer.style("visibility", 'visible');
                                }
                                else {
                                    tempDrawer.style("visibility", 'hidden');
                                }
                            });

                            scalingContainer.attr({
                                "transform":    "scale(" + scope.scale + ")"
                            });

                            element.attr({
                                "width":        size,
                                "height":       size,
                            });

                            measured_ring.attr({
                                "stroke-width": stroke,
                                "stroke-opacity": 0.65,
                            });

                            if (!scope.displaytarget) {
                                ring.style("visibility", 'hidden');
                            }
                            ring.attr({
                                "stroke-width": stroke
                            });

                            ring_background.attr({
                                "cx":           radius,
                                "cy":           radius,
                                "transform":    "translate("+ stroke +", "+ stroke +")",
                                "r":            radius,
                                "fill":         scope.bgcolor, 
                                "fill-opacity": 0.3
                            });

                            renderState(scope.targettemp, scope.targettemp);
                        });
                    };

                    var renderState = function (newValue, oldValue) {

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

                            scope.temp = Math.floor(newValue);
                            if (newValue*10 == (newValue.toFixed(0))*10) {
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

                            if (scope.displaytarget) {
                                var ring = d3.select('#target_path' + scope.roomid);
                                updateTargetArc(
                                    ring,
                                    startTemp,
                                    endTemp,
                                    mustHeat,
                                    scope.min, 
                                    scope.max,
                                    scope.radius - 5,
                                    size,
                                    scope.roomid
                                );
                            }
                        }                   
                    };

                    var renderThermoIcon = function () {
                        $timeout(function() {
                            var measured_ring = d3.select('#measured_path' + scope.roomid);
                            if (scope.measuredtemp) {
                                updateMeasuredArc(
                                    measured_ring,
                                    scope.min,
                                    scope.measuredtemp, 
                                    scope.max,
                                    scope.radius - 5, 
                                    size,
                                    scope.roomid
                                );
                                renderState(scope.targettemp, scope.targettemp);
                            }
                        });
                    };   

                    scope.$watch('targettemp', renderState);
                    scope.$watch('measuredtemp', renderThermoIcon);

                    renderCircle();
                    //heartbeat();
                    
                },
                replace:true,
                template:'\
                <svg id="room-temperature" overflow="visible" width="100%" height="100%" viewBox="0 0 250 250" preserveAspectRatio="xMidYMin" xmlns="http://www.w3.org/2000/svg">\
                    <g id="scaling{{roomid}}">\
                        <g id="label" fill="#FFF" font-weight="normal">\
                            <circle fill="none"/>\
                            <g id="heart{{roomid}}" visibility="hidden" transform="translate(35,75) scale(0.6)">\
                                <path d="M34.17748,48.2729852 L34,48.43866 L33.82048,48.2729852 C25.738646,40.7478615 20.4,35.7777919 20.4,30.7424988 C20.4,27.2602413 22.957463,24.6386905 26.35,24.6386905 C28.963546,24.6386905 31.51528,26.3826357 32.41288,28.7530933 L35.58508,28.7530933 C36.48268,26.3826357 39.03438,24.6386905 41.65,24.6386905 C45.05,24.6386905 47.6,27.2602413 47.6,30.7424988 C47.6,35.7777919 42.25928,40.7478615 34.17748,48.2729852 L34.17748,48.2729852 Z M41.65,21.1508 C38.68928,21.1508 35.85368,22.5550945 34,24.785583 C32.14428,22.5550945 29.308663,21.1508 26.35,21.1508 C21.106129,21.1508 17,25.3611198 17,30.7424988 C17,37.3229274 22.78238,42.706312 31.53568,50.8559425 L34,53.1508 L36.46228,50.8559425 C45.21558,42.706312 51,37.3229274 51,30.7424988 C51,25.3611198 46.89178,21.1508 41.65,21.1508 L41.65,21.1508 Z" fill="#FFFFFF"></path>\
                            </g>\
                            <text font-size="64">\
                                <tspan text-anchor="end" x="177" y="130">{{temp}}°</tspan>\
                            </text>\
                            <text font-size="28" fill="#FFFFFF">\
                                <tspan x="150" y="130">.{{dotTemp}}</tspan>\
                            </text>\
                        </g>\
                        <text id="mode" font-size="24" fill="#FFFFFF">\
                            <tspan text-anchor="middle" x="130" y="150">{{mode}}</tspan>\
                        </text>\
                        <g id="arcGroup">\
                            <path id="measured_path{{roomid}}" fill="none" />\
                            <path id="target_path{{roomid}}" fill="none" />\
                            <g id="thermoIcon{{roomid}}">\
                                <g id="tempDrawer{{roomid}}" visibility="visible">\
                                    <rect id="Rectangle-7" fill-opacity="0.75" fill="#FFFFFF" x="0" y="0" width="90" height="35" rx="20"></rect>\
                                     <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#000000">\
                                        <tspan x="34" y="25">{{measuredtemp}}°</tspan>\
                                    </text>\
                                </g>\
                                <ellipse id="bgCircle" fill="#FFFFFF" fill-opacity="0.8" cx="16.8578741" cy="16.9670933" rx="16.9702336" ry="16.9670933"></ellipse>\
                                <g id="Thermometer" fill="#000000" transform="translate(12, 5) scale(0.75)">\
                                    <path d="M9.17602996,19.8825764 L9.17602996,3.69998611 C9.17602996,1.65603472 7.52893258,0 5.50561798,0 C3.47863296,0 1.83520599,1.65049306 1.83520599,3.69998611 L1.83520599,19.8825764 C0.708389513,20.897625 0,22.3726319 0,24.0138889 C0,27.0728889 2.46559925,29.5555556 5.50561798,29.5555556 C8.5447191,29.5555556 11.011236,27.0728889 11.011236,24.0138889 C11.011236,22.3726319 10.303764,20.897625 9.17602996,19.8825764 L9.17602996,19.8825764 Z M5.50561798,27.7083333 C3.47863296,27.7083333 1.83520599,26.0541458 1.83520599,24.0138889 C1.83520599,22.6469444 2.5738764,21.4527153 3.67041199,20.8135764 L3.67041199,3.6990625 C3.67041199,2.67570139 4.49258427,1.84722222 5.50561798,1.84722222 C6.52507491,1.84722222 7.34082397,2.67570139 7.34082397,3.6990625 L7.34082397,20.8135764 C8.43735955,21.4517917 9.17602996,22.6460208 9.17602996,24.0138889 C9.17602996,26.0541458 7.532603,27.7083333 5.50561798,27.7083333 L5.50561798,27.7083333 Z" id="Shape"></path>\
                                    <path d="M6.40853933,21.396375 C6.41863296,21.3455764 6.42322097,21.2938542 6.42322097,21.2402847 L6.42322097,12.0097153 C6.42322097,11.4980347 6.01672285,11.0833333 5.50561798,11.0833333 C4.99818352,11.0833333 4.58801498,11.5045 4.58801498,12.0097153 L4.58801498,21.2402847 C4.58801498,21.2938542 4.592603,21.3455764 4.60086142,21.396375 C3.52543071,21.7722847 2.75280899,22.8021111 2.75280899,24.0138889 C2.75280899,25.5443125 3.98514981,26.7847222 5.50561798,26.7847222 C7.02608614,26.7847222 8.25842697,25.5443125 8.25842697,24.0138889 C8.25842697,22.8021111 7.48580524,21.7722847 6.40853933,21.396375 L6.40853933,21.396375 Z" id="Shape"></path>\
                                </g>\
                            </g>\
                        </g>\
                        <ellipse id="bgTargetIcon{{roomid}}" fill="#000000" cx="16" cy="16" rx="17" ry="17"></ellipse>\
                        <g id="targetIcon{{roomid}}" transform="scale(0.6)">\
                            <path d="M34.17748,48.2729852 L34,48.43866 L33.82048,48.2729852 C25.738646,40.7478615 20.4,35.7777919 20.4,30.7424988 C20.4,27.2602413 22.957463,24.6386905 26.35,24.6386905 C28.963546,24.6386905 31.51528,26.3826357 32.41288,28.7530933 L35.58508,28.7530933 C36.48268,26.3826357 39.03438,24.6386905 41.65,24.6386905 C45.05,24.6386905 47.6,27.2602413 47.6,30.7424988 C47.6,35.7777919 42.25928,40.7478615 34.17748,48.2729852 L34.17748,48.2729852 Z M41.65,21.1508 C38.68928,21.1508 35.85368,22.5550945 34,24.785583 C32.14428,22.5550945 29.308663,21.1508 26.35,21.1508 C21.106129,21.1508 17,25.3611198 17,30.7424988 C17,37.3229274 22.78238,42.706312 31.53568,50.8559425 L34,53.1508 L36.46228,50.8559425 C45.21558,42.706312 51,37.3229274 51,30.7424988 C51,25.3611198 46.89178,21.1508 41.65,21.1508 L41.65,21.1508 Z" fill="#FFFFFF"></path>\
                        </g>\
                    </g>\
                </svg>'
            }; 
    }]);
