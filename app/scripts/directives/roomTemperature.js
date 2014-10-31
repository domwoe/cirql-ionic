'use strict';

angular.module('cirqlApp')
    .directive('roomTemperature', ['$timeout', function($timeout) {

            var polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
                var angleInRadians = (angleInDegrees - 230) * Math.PI / 180.0;

                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            }

            var updateState = function(value, total, measured, R, ring, size) {
                if(!size){
                    return;
                };

                console.log("measured ", measured);
                console.log("size ", size);

                var value       = value >= total ? total - 0.00001 : value,
                    type        = 279.9999,
                    perc        = (value/total)*type,
                    perc_end    = (measured/total)*type,
                    x           = size/2,
                    start       = polarToCartesian(x, x, R, perc),
                    end         = polarToCartesian(x, x, R, measured),
                    arcSweep    = (perc <= 180 ? "0" : "1"),
                    d = [
                        "M", start.x, start.y, 
                        "A", R, R, 0, arcSweep, 0, end.x, end.y
                    ].join(" ");

                ring.attr('d', d);

                
                if (measured != 0) {
                    var icon = d3.select("#thermoIcon");
                    var px = start.x - 15;
                    var py = start.y - 15;
                    console.log("TR: ", px, py);
                    icon.attr('transform', 'translate(' + px + ',' + py + ')');
                }

                
                
                if (measured === 0) {
                    var icon = d3.select("#targetIcon");
                    var px = start.x - 15;
                    var py = start.y - 15;
                    console.log("TR: ", px, py);
                    icon.attr('transform', 'translate(' + px + ',' + py + ')');
                }    
            };

            return {
                restrict:'EA',
                scope:{
                    targettemp:     "=",
                    measuredtemp:   "=",
                    mode:           "=",
                    max:            "=",
                    radius:         "@",
                    color:          "@",
                    bgcolor:        "@",
                    stroke:         "@"
                },
                link: function (scope, element, attrs) {
                    var ring        = d3.select('#target_path'),
                        measured_ring = d3.select('#measured_path'),
                        ring_background  = element.find('circle'),
                        thermoIcon  = d3.select('#thermoIcon'),
                        tempDrawer = d3.select('#tempDrawer'),
                        arcGroup = d3.select('#arcGroup'),
                        targetIcon = d3.select('#targetIcon'),
                        //mode = d3.select('#mode'),
                        size,
                        resetValue;

                    var mouseDragCallback = function() {
                        function roundHalf(num) {
                            num = Math.round(num*2)/2;
                            return num;
                        }

                        var coords = [0,0];
                        coords = d3.mouse(this);
                        var phi = Math.atan2(coords[1] - 130, coords[0] - 130);
                        phi = (phi*360/(2*Math.PI) + 230)%360 ;

                        var target = roundHalf(phi*scope.max/(270));

                        scope.targettemp = target;
                        //scope.$apply();
                        updateState(
                                        target,
                                        scope.max,
                                        0,
                                        scope.radius - 5,
                                        ring,
                                        size
                                    );
                    };

                    targetIcon.call(d3.behavior.drag()
                        .on('dragstart', mouseDragCallback)
                        .on('drag', mouseDragCallback));

                    thermoIcon.on('click', function() {
                        var visibility = tempDrawer.style("visibility");
                        if (visibility === 'hidden') {
                            tempDrawer.style("visibility",'visible');
                        }
                        else {
                            tempDrawer.style("visibility",'hidden');
                        }
                    });

                    var renderCircle = function() {
                        $timeout(function() {
                            var radius       = scope.radius,
                            stroke           = scope.stroke;

                            size = radius*2 + parseInt(stroke)*2;

                            element.attr({
                                "width":        size,
                                "height":       size,
                            });

                            measured_ring.attr({
                                "stroke":       scope.color,
                                "stroke-width": stroke,
                                "transform": ''
                            });

                            ring.attr({
                                "stroke":       "#0000FF",
                                "stroke-width": stroke,
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

                            scope.temp = Math.floor(scope.targettemp);
                            if (scope.targettemp*10 == (scope.targettemp.toFixed(0))*10) {
                                scope.dotTemp = 0;
                            } else {
                                scope.dotTemp = 5;
                            }

                            if (!angular.isDefined(newValue)) {
                                return false;
                            };

                            if (newValue < 0) {
                                resetValue = oldValue;
                                return scope.targettemp = 0;
                            };

                            if(newValue > scope.max){
                                resetValue = oldValue;
                                return scope.targettemp = scope.max;
                            };

                            var max             = scope.max,
                            radius              = scope.radius,
                            start               = oldValue || 0,
                            val                 = newValue - start,
                            currentIteration    = 0,
                            totalIterations     = scope.max;

                            (function animation() {
                                if (currentIteration <= totalIterations) {
                                    updateState(
                                        scope.measuredtemp, 
                                        max,
                                        1, 
                                        radius, 
                                        measured_ring,
                                        size
                                    );
                                    updateState(
                                        newValue,
                                        max,
                                        0,
                                        radius - 5,
                                        ring,
                                        size
                                    );
                                    currentIteration++;
                                };
                            })();  
                        }                      
                    };


                    scope.$on('renderCircle', renderCircle);
                    scope.$watch('targettemp', renderState);

                    renderCircle();

                },
                replace:true,
                template:'\
                <svg id="room-temperature" width="180px" height="180px" viewBox="-10 -10 260 260" xmlns="http://www.w3.org/2000/svg">\
                    <g id="label" fill="#FFF" font-weight="normal">\
                        <circle fill="none"/>\
                        <text font-size="64">\
                            <tspan x="70" y="130">{{temp}}°</tspan>\
                        </text>\
                        <text font-size="28" fill="#FFFFFF">\
                            <tspan x="140" y="130">.{{dotTemp}}</tspan>\
                        </text>\
                    </g>\
                    <text id="mode" font-size="32" fill="#FFFFFF">\
                        <tspan text-anchor="middle" x="115" y="160">{{mode}}</tspan>\
                    </text>\
                    <g id="arcGroup">\
                        <path id="target_path" fill="none" />\
                        <path id="measured_path" fill="none" />\
                        <g id="thermoIcon">\
                             <g id="tempDrawer" visibility="hidden">\
                                <text font-family="Helvetica Neue" font-size="24" font-weight="300" fill="#000000">\
                                    <tspan x="34" y="25">{{measuredtemp}}°</tspan>\
                                </text>\
                                <rect id="Rectangle-7" fill-opacity="0.4" fill="#FFFFFF" sketch:type="MSShapeGroup" x="0" y="0" width="79" height="35" rx="20"></rect>\
                            </g>\
                            <ellipse id="bgCircle" fill="#CDE900" cx="16.8578741" cy="16.9670933" rx="16.9702336" ry="16.9670933"></ellipse>\
                            <g id="Thermometer" fill="#FFFFFF" transform="translate(12, 5) scale(0.75)">\
                                <path d="M9.17602996,19.8825764 L9.17602996,3.69998611 C9.17602996,1.65603472 7.52893258,0 5.50561798,0 C3.47863296,0 1.83520599,1.65049306 1.83520599,3.69998611 L1.83520599,19.8825764 C0.708389513,20.897625 0,22.3726319 0,24.0138889 C0,27.0728889 2.46559925,29.5555556 5.50561798,29.5555556 C8.5447191,29.5555556 11.011236,27.0728889 11.011236,24.0138889 C11.011236,22.3726319 10.303764,20.897625 9.17602996,19.8825764 L9.17602996,19.8825764 Z M5.50561798,27.7083333 C3.47863296,27.7083333 1.83520599,26.0541458 1.83520599,24.0138889 C1.83520599,22.6469444 2.5738764,21.4527153 3.67041199,20.8135764 L3.67041199,3.6990625 C3.67041199,2.67570139 4.49258427,1.84722222 5.50561798,1.84722222 C6.52507491,1.84722222 7.34082397,2.67570139 7.34082397,3.6990625 L7.34082397,20.8135764 C8.43735955,21.4517917 9.17602996,22.6460208 9.17602996,24.0138889 C9.17602996,26.0541458 7.532603,27.7083333 5.50561798,27.7083333 L5.50561798,27.7083333 Z" id="Shape"></path>\
                                <path d="M6.40853933,21.396375 C6.41863296,21.3455764 6.42322097,21.2938542 6.42322097,21.2402847 L6.42322097,12.0097153 C6.42322097,11.4980347 6.01672285,11.0833333 5.50561798,11.0833333 C4.99818352,11.0833333 4.58801498,11.5045 4.58801498,12.0097153 L4.58801498,21.2402847 C4.58801498,21.2938542 4.592603,21.3455764 4.60086142,21.396375 C3.52543071,21.7722847 2.75280899,22.8021111 2.75280899,24.0138889 C2.75280899,25.5443125 3.98514981,26.7847222 5.50561798,26.7847222 C7.02608614,26.7847222 8.25842697,25.5443125 8.25842697,24.0138889 C8.25842697,22.8021111 7.48580524,21.7722847 6.40853933,21.396375 L6.40853933,21.396375 Z" id="Shape"></path>\
                            </g>\
                        </g>\
                    </g>\
                    <g id="targetIcon">\
                        <ellipse fill="#000000" cx="16" cy="16" rx="17" ry="17"></ellipse>\
                    </g>\
                </svg>'
            }; 
    }]);