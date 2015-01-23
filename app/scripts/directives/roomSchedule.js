'use strict';

angular.module('cirqlApp')
    .directive('roomSchedule', ['$timeout',
        function($timeout) {

            return {
                restrict: 'EA',
                scope: {
                    schedule: "=",
                    radius: "=",
                    sync: "=",
                    roomid: "=",
                    hour: "@",
                    minute: "@",
                    goback: "&",
                    reload: "&",
                    dayview: "="
                },
                link: function(scope, element, attrs) {

                    function roundHalf(num) {
                        num = Math.round(num * 2) / 2;
                        return num;
                    }

                    var Schedule = function() {

                        this.rendered = false;
                        this.nextId = 0;
                        this.defaultTemperature = 20;
                        this.maxTemp = 30;
                        this.minTemp = 5;
                        this.totalTime = 1425;
                        this.selectedDay = null;
                        this.selectedEntry = null;
                        this.entriesToCopy = null;
                        this.weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        this.localSchedule = {};
                        this.dragging = false;
                        this.lockOnHorizontalDrag = false;
                        this.lockOnVerticalDrag = false;
                        this.changed = false;

                        scope.sync = this.localSchedule;

                        var rec = d3.select('#r1');
                        var recWidth = parseInt(rec.attr('width'));
                        var recHeight = parseInt(rec.attr('height'));

                        this.radius = scope.radius;
                        this.leftBound = parseInt(rec.attr('x')) + this.radius + 1;
                        this.rightBound = this.leftBound + recWidth - 2 * (this.radius + 1);
                        this.width = this.rightBound - this.leftBound;
                        this.height = recHeight;
                        this.self = this;

                        this.pad = function(num, size) {
                            var s = num + "";
                            while (s.length < size) s = "0" + s;
                            return s;
                        }

                        this.timeToPixelOffset = function(hours, minutes) {
                            var time = hours * 60 + minutes;
                            return this.leftBound + time * this.width / this.totalTime;
                        }

                        this.pixelOffsetToTime = function(xpos) {
                            var time = (xpos - this.leftBound) * this.totalTime / (this.width);
                            return [
                                Math.floor(time / 60),
                                15 * Math.floor(time % 60 / 15)
                            ];
                        }

                        this.tempToPixelOffset = function(temp, height) {
                            return this.radius + 1 +
                                (temp - this.minTemp) * (height - 2 * (this.radius + 1)) /
                                (this.maxTemp - this.minTemp);
                        }

                        this.pixelOffsetToTemp = function(ypos, height) {
                            return (this.minTemp +
                                (ypos - this.radius - 1) * (this.maxTemp - this.minTemp) /
                                (height - 2 * (this.radius + 1)));
                        }

                        this.isPointWithinBounds = function(recPath, pX, pY) {
                            var x = parseInt(recPath.attr('x'));
                            var y = parseInt(recPath.attr('y'));
                            var width = parseInt(recPath.attr('width'));
                            var height = parseInt(recPath.attr('height'));
                            console.log("X: ", x);
                            console.log("Y: ", y);
                            console.log("W: ", width);
                            console.log("H: ", height);

                            return (
                                pX >= x &&
                                x <= pX + width &&
                                pY >= y &&
                                y <= pY + height
                            );
                        }

                        this.mouseDragCallback = function(ev, d) {

                            var m = d3.mouse(ev);

                            if (!this.lockOnHorizontalDrag && !this.lockOnVerticalDrag) {
                                if (Math.abs(m[0] - d.dragstart[0]) > Math.abs(m[1] - d.dragstart[1]) + 4) {
                                    this.lockOnHorizontalDrag = true;
                                    d3.select('#vpath').style('visibility', 'hidden');
                                    console.log("LOCK ON HORIZONTAL");
                                } else if (Math.abs(m[0] - d.dragstart[0]) + 4 < Math.abs(m[1] - d.dragstart[1])) {
                                    this.lockOnVerticalDrag = true;
                                    d3.select('#hpath').style('visibility', 'hidden');
                                    console.log("LOCK ON VERTICAL");
                                }
                            } else {
                                if (this.lockOnHorizontalDrag) {
                                    d.x += m[0] - d.dragstart[0];
                                } else {
                                    d.y += m[1] - d.dragstart[1];
                                }

                                var circle = d3.select(ev);
                                var group = d3.select(circle.node().parentNode);

                                var currentX = parseInt(circle.attr('cx'));
                                var currentY = parseInt(circle.attr('cy'));
                                var newposX = d.x + currentX;
                                var newposY = d.y + currentY;

                                if (this.lockOnHorizontalDrag) {
                                    if (newposX < this.leftBound) {
                                        newposX = this.leftBound;
                                        d.x = newposX - currentX;
                                    } else if (newposX > this.rightBound) {
                                        newposX = this.rightBound;
                                        d.x = newposX - currentX;
                                    }
                                } else if (this.lockOnVerticalDrag) {
                                    if (newposY - this.radius < 0) {
                                        newposY = this.radius;
                                        d.y = newposY - currentY;
                                    } else if (newposY > 7 * this.height - this.radius) {
                                        newposY = 7 * this.height - this.radius;
                                        d.y = newposY - currentY;
                                    }
                                }

                                console.log("MX: ", m[0]);
                                console.log("MY: ", m[1]);
                                console.log("DX: ", d.x);
                                console.log("DY: ", d.y);
                                console.log("NX: ", newposX);
                                console.log("NY: ", newposY);
                                console.log("\n");

                                group.attr('transform', 'translate(' + d.x + ', ' + d.y + ')');

                                if (this.lockOnHorizontalDrag) {
                                    console.log("Move horizontally");
                                    var getY = d3.transform(group.attr("transform")).translate[1];
                                    group.attr('transform', 'translate(' + d.x + ', ' + getY + ')');

                                } else if (this.lockOnVerticalDrag) {
                                    console.log("Move vertically");
                                    var getX = d3.transform(group.attr("transform")).translate[0];
                                    group.attr('transform', 'translate(' + getX + ', ' + d.y + ')');
                                }

                                var circleIndex = group.attr('id');

                                if (this.lockOnHorizontalDrag) {

                                    // Update time
                                    var time = this.pixelOffsetToTime(newposX);
                                    scope.hour = this.pad(time[0], 2);
                                    scope.minute = this.pad(time[1], 2);

                                    // Update the times in the local schedule
                                    var entry = this.localSchedule[circleIndex];
                                    entry.hour = time[0];
                                    entry.minute = time[1];

                                    // Flag for schedule change
                                    this.changed = this.weekDays[entry.weekday+1];

                                } else if (this.lockOnVerticalDrag) {

                                    // Update temperature
                                    var newTemp = roundHalf(this.pixelOffsetToTemp(newposY, 210));
                                    var target = Math.floor(newTemp);
                                    var dotTarget;

                                    if (newTemp - target <= 0.5) {
                                        dotTarget = '0';
                                    } else {
                                        dotTarget = '5';
                                    }

                                    

                                    console.log("NEW TEMP: ", newTemp);

                                    var targetTspan = group.select('tspan');
                                    var dotTargetTspan = group.select('g').select('tspan');

                                    if (target + 0.1 * dotTarget >= this.minTemp && target + 0.1 * dotTarget <= this.maxTemp) {
                                        targetTspan.text(target);
                                        dotTargetTspan.text(dotTarget);
                                        this.localSchedule[circleIndex].target = newTemp;
                                         // Flag for schedule change
                                        this.changed = this.weekDays[this.localSchedule[circleIndex].weekday+1];
                                    }
                                }
                            }
                        }

                        d3.selection.prototype.moveToFront = function() {
                            return this.each(function() {
                                this.parentNode.appendChild(this);
                            });
                        }

                        this.selectDay = function(day) {
                            scope.dayview = true;
                            scope.$apply();
                            console.log("SELECTED DAY");
                            var weekdays = d3.select('#weekdays');
                            var weekCol = weekdays.append('rect')
                                .attr('id', 'week_column')
                                .attr('fill', '#483e37')
                                .attr('fill-opacity', 1)
                                .attr('stroke', '#FFFFFF')
                                .attr('stroke-width', 1)
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('height', 210)
                                .attr('width', 95);
                            var scheduleCol = weekdays.append('rect')
                                .attr('id', 'schedule_column')
                                .attr('fill', '#b3b3b3')
                                .attr('fill-opacity', 1)
                                .attr('stroke', '#FFFFFF')
                                .attr('stroke-width', 1)
                                .attr('x', 95)
                                .attr('y', 0)
                                .attr('height', 210)
                                .attr('width', 650);

                            var dayGroup = d3.select(day);
                            var rectangles = dayGroup.selectAll('rect')[0];
                            var rec1 = d3.select(rectangles[0]);
                            var rec2 = d3.select(rectangles[1]);
                            rec1.attr('fill-opacity', 1);
                            rec2.attr('fill-opacity', 1);
                            rec2.attr('stroke-width', 0);

                            var scheduleEntries = dayGroup.selectAll('g.entry');
                            if (scheduleEntries[0]) {
                                for (var i = 0; i < scheduleEntries[0].length; i++) {
                                    var currEntry = d3.select(scheduleEntries[0][i]);
                                    var index = currEntry.attr('id');
                                    //    console.log("INDEX: ", index);
                                    //    console.log("SCH: ", this.localSchedule);

                                    var tempOffset = this.tempToPixelOffset(
                                        this.localSchedule[index].target,
                                        weekCol.attr('height')
                                    );

                                    var circle = currEntry.select('circle');
                                    var posX = parseInt(circle.attr('cx'));
                                    var offsetY = tempOffset - parseInt(circle.attr('cy'));

                                    console.log("CURR ENTRY: ", currEntry);

                                    currEntry.remove();
                                    // TODO: Write function to update entry positions instead
                                    this.addEntry(dayGroup, index, posX, tempOffset, this.localSchedule[index].target);
                                }
                            }

                            // Move to front
                            dayGroup.moveToFront();
                        }

                        this.deselectDay = function() {
                            var previousRec = d3.select(this.selectedDay).selectAll('rect')[0];
                            var previousRec1 = d3.select(previousRec[0]);
                            var previousRec2 = d3.select(previousRec[1]);
                            previousRec1.attr('fill-opacity', 0.6);
                            previousRec2.attr('fill-opacity', 0.6);
                        }

                        this.daySelector = function(day) {
                            if (this.selectedDay != null) {
                                if (this.selectedDay !== day) {
                                    this.deselectEntry();
                                }
                                this.deselectDay();
                            }
                            if (this.selectedDay !== day) {
                                this.selectDay(day);
                                this.selectedDay = day;
                            }
                        }

                        this.deselectEntry = function() {
                            if (this.selectedEntry != null) {
                                this.selectedEntry.select('circle')
                                    .attr('fill', 'red')
                                    .attr('r', this.radius);
                                this.selectedEntry.selectAll('path')
                                    .style('visibility', 'hidden');
                                this.selectedEntry.selectAll('rect')
                                    .style('visibility', 'hidden');
                                this.selectedEntry = null;
                                d3.select('#label').style('visibility', 'hidden');
                            }
                        }

                        this.entrySelector = function(self, entry) {
                            var group = d3.select(entry);

                            this.deselectEntry();
                            var selection = group.select('circle')
                                .attr('fill', 'black')
                                .attr('r', this.radius + 15);

                            var circleIndex = group.attr('id');
                            var entry = self.localSchedule[circleIndex];

                            scope.hour = self.pad(entry.hour, 2);
                            scope.minute = self.pad(entry.minute, 2);

                            //         group.selectAll('path')
                            //             .style('visibility', 'visible');

                            //          group.selectAll('rect')
                            //             .style('visibility','visible');
                            this.selectedEntry = group;

                            d3.select('#label').style('visibility', 'visible');


                        }

                        // true for increase, false for decrease
                        this.updateTemp = function(obj, increaseOrDecrease) {
                            var recObj = d3.select(obj);
                            var parentNode = d3.select(recObj.node().parentNode);
                            var targetTspan = parentNode.select('tspan');

                            var dotTargetTspan = parentNode.select('g').select('tspan');

                            var currentTemp = parseInt(targetTspan.text());
                            var currentDotTemp = parseInt(dotTargetTspan.text());
                            var newTemp = 0;
                            var newDotTemp;

                            if (increaseOrDecrease) {
                                if (currentDotTemp === 5) {
                                    newTemp = currentTemp + 1;
                                    newDotTemp = 0;
                                } else if (currentDotTemp === 0) {
                                    newDotTemp = 5;
                                    newTemp = currentTemp;
                                }
                            } else {
                                if (currentDotTemp === 0) {
                                    newTemp = currentTemp - 1;
                                    newDotTemp = 5;
                                } else if (currentDotTemp === 5) {
                                    newDotTemp = 0;
                                    newTemp = currentTemp;
                                }

                            }

                            newTemp = newTemp + 0.1 * newDotTemp;

                            console.log(newTemp);

                            if (newTemp >= this.minTemp && newTemp <= this.maxTemp) {
                                targetTspan.text(Math.floor(newTemp));
                                dotTargetTspan.text(newDotTemp);
                                var index = parentNode.attr('id');
                                this.localSchedule[index].target = newTemp;
                            }
                        }

                        this.decrementTemp = function(obj) {
                            this.updateTemp(obj, false);
                        }

                        this.incrementTemp = function(obj) {
                            this.updateTemp(obj, true);
                        }

                        this.addEntry = function(dayGroup, id, xpos, ypos, target) {

                            var numTarget = parseFloat(target);
                            var dotTarget;

                            if (numTarget * 10 === (numTarget.toFixed(0)) * 10) {
                                dotTarget = '0';
                            } else {
                                dotTarget = '5';
                            }

                            var self = this;
                            var entryGroup = dayGroup.append('g')
                                .attr('id', id)
                                .attr('class', 'entry')
                                .data([{
                                    x: 0,
                                    y: 0,
                                }]);

                            var circle = entryGroup.append('circle')
                                .attr('cx', xpos)
                                .attr('cy', ypos)
                                .attr('r', this.radius)
                                .attr('fill', 'red');

                            var text = entryGroup.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 14)
                                .attr('font-weight', 600)
                                .attr('fill', '#FFFFFF');

                            var tspan = text.append('tspan')
                                .attr('text-anchor', 'middle')
                                .attr('x', xpos - 3)
                                .attr('y', ypos + (this.radius / 2) * 0.8)
                                .text(Math.floor(numTarget));

                            var entryGroup2 = entryGroup.append('g');

                            var text2 = entryGroup2.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 9)
                                .attr('font-weight', 600)
                                .attr('fill', '#FFFFFF');

                            var tspan2 = text2.append('tspan')
                                .attr('text-anchor', 'middle')
                                .attr('x', xpos + 8)
                                .attr('y', ypos + (this.radius / 2) * 0.8)
                                .text(dotTarget);

                            var pathDecr = entryGroup.append('path')
                                .attr('class', 'arrowDecrement')
                                .attr('fill', '#FFFFFF')
                                .attr('transform', 'translate(' + (xpos - this.radius + 3.5) + ',' + (ypos + this.radius - 6) + ') scale(0.2)')
                                .attr('d', 'M50,71.276c-1.338,0-2.676-0.511-3.696-1.53l-32.099-32.1c-2.042-2.042-2.042-5.352,0-7.393 \
						c2.041-2.041,5.351-2.041,7.393,0L50,58.656l28.402-28.402c2.042-2.041,5.352-2.041,7.393,0c2.042,2.041,2.042,5.351,0,7.393 \
						l-32.099,32.1C52.676,70.766,51.338,71.276,50,71.276z')
                                .style('visibility', 'hidden');

                            var pathIncr = entryGroup.append('path')
                                .attr('class', 'arrowIncrement')
                                .attr('fill', '#FFFFFF')
                                .attr('transform', 'translate(' + (xpos - this.radius + 3.5) + ',' + (ypos - 2 * this.radius + 3) + ') scale(0.2)')
                                .attr('d', 'M53.696,30.254l32.099,32.1c2.042,2.042,2.042,5.352,0,7.393c-2.041,2.041-5.352,2.041-7.393,0L50,41.344L21.598,69.746 \
						c-2.042,2.041-5.352,2.041-7.393,0c-2.042-2.041-2.042-5.351,0-7.393l32.099-32.1c1.021-1.02,2.358-1.53,3.696-1.53 \
						S52.676,29.234,53.696,30.254z')
                                .style('visibility', 'hidden');

                            var back = entryGroup.append('circle')
                                .attr('cx', xpos)
                                .attr('cy', ypos)
                                .attr('r', this.radius)
                                .attr('fill-opacity', 0)
                                .call(d3.behavior.drag()
                                    .on('dragstart', function(d) {
                                        d3.event.sourceEvent.preventDefault();
                                        d3.event.sourceEvent.stopPropagation();

                                        var parentNode = d3.select(this).node().parentNode;
                                        var secondAncestor = d3.select(parentNode).node().parentNode;
                                        self.daySelector(secondAncestor);
                                        self.entrySelector(self, parentNode);
                                        self.dragging = true;

                                        var group = d3.select(parentNode);
                                        var selection = group.select('circle');

                                        var trX = d3.transform(group.attr("transform")).translate[0];
                                        var trY = d3.transform(group.attr("transform")).translate[1];

                                        d.dragstart = d3.mouse(this); // store this

                                        var xpos = parseInt(selection.attr('cx')) + trX;
                                        var ypos = parseInt(selection.attr('cy')) + trY;

                                        var dayGroup = d3.select(secondAncestor);
                                        dayGroup.insert('rect', 'g.entry')
                                            .attr('id', 'vpath')
                                            .attr('x', xpos - self.radius)
                                            .attr('y', 0)
                                            .attr('width', 2 * self.radius)
                                            .attr('height', 7 * self.height)
                                            .attr('fill-opacity', 0.5);
                                        dayGroup.insert('rect', 'g.entry')
                                            .attr('id', 'hpath')
                                            .attr('x', 95)
                                            .attr('y', ypos - self.radius)
                                            .attr('width', 650)
                                            .attr('height', 2 * self.radius)
                                            .attr('fill-opacity', 0.5);
                                    })
                                    .on('drag', function(d) {
                                        if (self.dragging) {
                                            //console.log("DRAGGING ", this);
                                            self.mouseDragCallback(this, d);
                                            /*                                            var m = d3.mouse(this);
                                            console.log("M: ", m);

                                            d.x += m[0] - d.dragstart[0];
                                            d.y += m[1] - d.dragstart[1];

                                            var circle = d3.select(this);
                                            var group = d3.select(circle.node().parentNode);

                                            group.attr("transform", "translate(" + [d.x, d.y] + ")");*/
                                        }
                                    })
                                    .on('dragend', function(d) {
                                        console.log("DRAG END");
                                        self.dragging = false;
                                        self.lockOnVerticalDrag = false;
                                        self.lockOnHorizontalDrag = false;
                                        // Remove path rectangles
                                        d3.select('#vpath').remove();
                                        d3.select('#hpath').remove();
                                        delete d.dragstart;
                                    })
                                );

                            var recIncr = entryGroup.append('rect')
                                .attr('x', xpos - 3 * this.radius)
                                .attr('y', ypos - 4.9 * this.radius)
                                .attr('width', 6 * this.radius)
                                .attr('height', 4 * this.radius)
                                .attr('fill-opacity', 0.25)
                                .style('visibility', 'hidden')
                                .on('click', function() {
                                    self.incrementTemp(this);
                                });

                            var recDecr = entryGroup.append('rect')
                                .attr('x', xpos - 3 * this.radius)
                                .attr('y', ypos + this.radius)
                                .attr('width', 6 * this.radius)
                                .attr('height', 4 * this.radius)
                                .attr('fill-opacity', 0.25)
                                .style('visibility', 'hidden')
                                .on('click', function() {
                                    self.decrementTemp(this);
                                });

                        }

                        this.renderScheduleEntries = function() {

                            for (var i = 0; i < scope.schedule.length; i++) {
                                var deepCopy = angular.copy(scope.schedule[i]);

                                this.updateSchedule(
                                    deepCopy.$id,
                                    deepCopy.hour,
                                    deepCopy.minute,
                                    deepCopy.target,
                                    deepCopy.weekday
                                );
                            }

                            for (var index in this.localSchedule) {
                                if (!this.localSchedule.hasOwnProperty(index)) {
                                    continue;
                                }
                                var entry = this.localSchedule[index];
                                var xpos = this.timeToPixelOffset(entry.hour, entry.minute);
                                var ypos = this.height * (entry.weekday - 1) + this.height / 2;
                                var groupId = this.weekDays[entry.weekday - 1];
                                var dayGroup = d3.select('#' + groupId);
                                this.addEntry(dayGroup, index, xpos, ypos, entry.target);
                            }
                        }

                        this.updateSchedule = function(id, hour, minute, target, weekday) {
                            this.localSchedule[id] = {
                                'hour': hour,
                                'minute': minute,
                                'target': target,
                                'weekday': weekday
                            };
                            // console.log("CREATED ", this.localSchedule[id]);
                        }

                        this.addEntryCallback = function(self) {
                            //   console.log("CLICK ON ADD");
                            if (self.selectedDay != null) {
                                //    console.log("Adding entry callback");
                                var dayGroup = d3.select(self.selectedDay);
                                var index = self.weekDays.indexOf(dayGroup.attr('id'));
                                var groupId = this.weekDays[index];
                                var ypos = self.height * index + self.height / 2;
                                var id = 'c' + self.nextId;

                                // Update local schedule
                                self.updateSchedule(id, 0, 0, self.defaultTemperature, index + 1);
                                self.nextId++;

                                self.addEntry(dayGroup, id, self.leftBound, ypos, self.defaultTemperature);
                                self.entrySelector(self, '#' + id);
                            }
                        }

                        this.copySchedule = function(self, dest) {
                            var destDay = d3.select(dest);

                            // First remove everything from destination day and local schedule
                            var destDayEntries = destDay.selectAll('g.entry');
                            destDayEntries.remove();

                            if (destDayEntries[0]) {
                                for (var i = 0; i < destDayEntries[0].length; i++) {
                                    var idToDel = d3.select(destDayEntries[0][i]).attr('id');
                                    delete self.localSchedule[idToDel];
                                }
                            }

                            self.entriesToCopy.each(function() {

                                var entry = d3.select(this);
                                var index = entry.attr('id');
                                var schEntry = self.localSchedule[index];

                                var factor = self.weekDays.indexOf(destDay.attr('id'));
                                var id = 'c' + self.nextId;

                                var target = parseInt(entry.select('tspan').text());

                                var xpos = self.timeToPixelOffset(schEntry.hour, schEntry.minute);
                                var ypos = self.height * factor + self.height / 2;
                                self.addEntry(destDay, id, xpos, ypos, target);

                                // Update local schedule
                                self.updateSchedule(id, schEntry.hour, schEntry.minute, schEntry.target, factor + 1);
                                self.nextId++;
                            });
                            self.deselectEntry();
                            destDay.moveToFront();
                        }

                        this.copyScheduleCallback = function(self) {
                            if (self.selectedDay != null) {
                                self.entriesToCopy = d3.select(self.selectedDay).selectAll('g');
                            }
                        }

                        this.deleteEntryCallback = function(self) {
                            if (self.selectedEntry != null) {
                                var index = this.selectedEntry.attr('id');
                                delete self.localSchedule[index];
                                this.selectedEntry.remove();
                                self.selectedEntry = null;
                            }
                        }

                        this.syncFirebase = function() {

                            // Check what we have to delete first
                            for (var i = 0; i < scope.schedule.length; i++) {
                                var entry = scope.schedule[i];
                                if (!(entry.$id in this.localSchedule)) {
                                    scope.schedule.$remove(entry);
                                }
                            }

                            // Push or update rest
                            for (var key in this.localSchedule) {
                                var found = false;
                                for (var i = 0; i < scope.schedule.length; i++) {
                                    var entry = scope.schedule[i];
                                    if (key === entry.$id) {
                                        scope.schedule[i].hour = this.localSchedule[key].hour;
                                        scope.schedule[i].minute = this.localSchedule[key].minute;
                                        scope.schedule[i].target = this.localSchedule[key].target;
                                        scope.schedule.$save(scope.schedule[i]);
                                        found = true;
                                    }
                                }
                                if (!found) {
                                    scope.schedule.$add(this.localSchedule[key]);
                                }
                            }

                            scope.$apply();
                        }

                        this.save = function(self) {

                        console.log(self.changed);
                      
                        self.syncFirebase();
                        scope.goback({room: scope.roomid, changedDay: self.changed});
                        }

                        this.cancel = function() {
                            scope.goback({
                                room: scope.roomid
                            });
                        }

                        this.backToWeek = function(self) {
                            console.log('BACK TO WEEK');
                            self.syncFirebase();
                             console.log(self.changed);
                            scope.reload({changedDay: self.changed});


                        }

                        this.attachListeners = function() {
                            console.log("Attaching listeners");
                            var self = this;
                            var allDays = d3.selectAll('g.parent');
                            allDays.on('click', function() {
                                if (self.entriesToCopy != null && this !== self.selectedDay) {
                                    self.copySchedule(self, this);
                                    self.entriesToCopy = null;
                                } else {
                                    self.daySelector(this);
                                }

                            });

                            var addButton = d3.select('#add');
                            console.log("Add button: ", addButton);
                            addButton.on('click', function() {
                                self.addEntryCallback(self);
                            });

                            var weekButton = d3.select('#week');
                            console.log("Add button: ", addButton);
                            weekButton.on('click', function() {
                                self.backToWeek(self);
                            });

                            var copyButton = d3.select('#copy');
                            copyButton.on('click', function() {
                                console.log('clicked on cancel');
                                self.copyScheduleCallback(self);
                            });

                            var deleteButton = d3.select('#delete');
                            deleteButton.on('click', function() {
                                self.deleteEntryCallback(self);
                            });

                            var saveButton = d3.select('#save');
                            saveButton.on('click', function() {
                                console.log('save');
                                self.save(self);
                            });

                            var cancelButton = d3.select('#cancel');
                            cancelButton.on('click', function() {
                                console.log('clicked on cancel');
                                self.cancel();
                            });
                        }
                    }

                    var scheduler = new Schedule();

                    var renderState = function() {
                        if (scope.schedule && !scheduler.rendered) {
                            scheduler.renderScheduleEntries();
                            scheduler.attachListeners();
                            scheduler.rendered = true;
                        }
                    };

                    var sync = function() {
                        if (scope.schedule && scheduler.rendered) {
                            schedule.syncFirebase();
                        }
                    }

                    scope.$watch('schedule', renderState);

                },
                replace: false,
                template: '\
                <ion-content scroll="false"> \
                    <div class="schedule-block"> \
                        <svg id="room-schedule" overflow="visible" width="100%" height="95%" viewBox="-3 -100 752 330" preserveAspectRatio="xMidYMin" xmlns="http://www.w3.org/2000/svg">\
                            <g id="weekdays"> \
                                <g id="monday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="0" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="25">Monday</tspan> \
                                    </text> \
                                    <rect id="r1" fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="0" /> \
                                </g> \
                                <g id="tuesday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="30" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="30" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="55">Tuesday</tspan> \
                                    </text> \
                                </g> \
                                <g id="wednesday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="60" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="60" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="85">Wednesday</tspan> \
                                    </text> \
                                </g> \
                                <g id="thursday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="90" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="90" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="115">Thursday</tspan> \
                                    </text> \
                                </g> \
                                <g id="friday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="120" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="120" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="145">Friday</tspan> \
                                    </text> \
                                </g> \
                                <g id="saturday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="150" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="150" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="175">Saturday</tspan> \
                                    </text> \
                                </g> \
                                <g id="sunday" class="parent"> \
                                    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="180" /> \
                                    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="180" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="205">Sunday</tspan> \
                                    </text> \
                                </g> \
                            </g> \
                            <g id="label" visibility="hidden"> \
                                <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                                    <tspan text-anchor="middle" x="47.5" y="230">{{hour}}:{{minute}}</tspan> \
                                </text> \
                            </g> \
                        </svg> \
                </ion-content> \
                <ion-footer-bar class="bar-footer"> \
                    <div class="row">\
                        <div class="col">\
                            <button ng-show="dayview" id="week" class="button button-light button-block transparent padding ">Week</button> \
                        </div>\
                        <div class="col col-offset-50">\
                            <button ng-show="dayview" id="add" class="button  button-light button-block transparent padding">Add</button> \
                        </div>\
                        <div class="col">\
                            <button ng-show="dayview" id="delete" class="button button-light button-block transparent padding">Delete</button> \
                        </div>\
                    </div>\
                </ion-footer-bar>'
            };
        }
    ]);