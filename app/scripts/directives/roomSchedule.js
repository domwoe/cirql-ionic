    'use strict';

    angular.module('cirqlApp')
        .directive('roomSchedule', ['$rootScope', '$timeout', 'colorForTemperature',
            function($rootScope, $timeout, colorForTemperature) {
                return {
                    restrict: 'EA',
                    scope: {
                        schedule: "=",
                        radius: "=",
                        sync: "=",
                        roomid: "=",
                        goback: "&",
                        addrawactivity: "&",
                        hideloader: "&"
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
                            this.dayScheduleBuffer = {};
                            this.dragging = false;
                            this.lockOnHorizontalDrag = false;
                            this.lockOnVerticalDrag = false;
                            this.changed = false;
                            this.inDetailedView = false;
                            this.isClickValid = true;
                            this.inContextMenu = false;
                            this.contextSelectedDay = null;
                            this.contextMenuSwitch = false;
                            this.inDeleteView = false;

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
                                while (s.length < size) {
                                    s = "0" + s;
                                }
                                return s;
                            };

                            this.timeToPixelOffset = function(hours, minutes) {
                                var time = hours * 60 + minutes;
                                return this.leftBound + time * this.width / this.totalTime;
                            };

                            this.pixelOffsetToTime = function(xpos) {
                                var time = (xpos - this.leftBound) * this.totalTime / (this.width);
                                return [
                                    Math.floor(time / 60),
                                    15 * Math.floor(time % 60 / 15)
                                ];
                            };

                            this.tempToPixelOffset = function(temp, height) {
                                var redH = height - 2 * (this.radius + 1);
                                return redH + this.radius + 1 - (temp - this.minTemp) * redH / (this.maxTemp - this.minTemp);
                            };

                            this.pixelOffsetToTemp = function(ypos, height) {
                                var redH = height - 2 * (this.radius + 1);
                                return this.minTemp + (redH + this.radius + 1 - ypos) * (this.maxTemp - this.minTemp) / redH;
                            };

                            this.mouseDragCallback = function(ev, d) {

                                var m = d3.mouse(ev);

                                if (!this.lockOnHorizontalDrag && !this.lockOnVerticalDrag) {
                                    if (Math.abs(m[0] - d.dragstart[0]) > Math.abs(m[1] - d.dragstart[1]) + 4) {
                                        this.lockOnHorizontalDrag = true;
                                        d3.select('#vpath').style('visibility', 'hidden');
                                    } else if (Math.abs(m[0] - d.dragstart[0]) + 4 < Math.abs(m[1] - d.dragstart[1])) {
                                        this.lockOnVerticalDrag = true;
                                        d3.select('#hpath').style('visibility', 'hidden');
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
                                        } else if (newposY > 7 * this.height - this.radius - 1) {
                                            newposY = 7 * this.height - this.radius - 1;
                                            d.y = newposY - currentY;
                                        }
                                    }

                                    group.attr('transform', 'translate(' + d.x + ', ' + d.y + ')');

                                    if (this.lockOnHorizontalDrag) {
                                        var getY = d3.transform(group.attr("transform")).translate[1];
                                        group.attr('transform', 'translate(' + d.x + ', ' + getY + ')');

                                    } else if (this.lockOnVerticalDrag) {
                                        var getX = d3.transform(group.attr("transform")).translate[0];
                                        group.attr('transform', 'translate(' + getX + ', ' + d.y + ')');
                                    }

                                    var circleIndex = group.attr('id');

                                    if (this.lockOnHorizontalDrag) {
                                        // Update time
                                        var time = this.pixelOffsetToTime(newposX);

                                        // Update the times in the day schedule buffer
                                        var entry = this.dayScheduleBuffer[circleIndex];
                                        entry.hour = time[0];
                                        entry.minute = time[1];

                                        // Show the time in the label
                                        group.select('text.label').select('tspan').text(
                                            this.pad(entry.hour, 2) + ":" +
                                            this.pad(entry.minute, 2)
                                        );

                                        // Update the hidden time label
                                        group.select('g.time').select('tspan').text(
                                            this.pad(entry.hour, 2) + ":" +
                                            this.pad(entry.minute, 2)
                                        );

                                        // Flag for schedule change
                                        this.changed = this.weekDays[entry.weekday - 1];

                                    } else if (this.lockOnVerticalDrag) {
                                        // Update temperature
                                        var newTemp = roundHalf(this.pixelOffsetToTemp(newposY, 210));
                                        if (newTemp >= this.minTemp && newTemp <= this.maxTemp) {
                                            // Show the temp in the label
                                            group.select('text.label').select('tspan').text(newTemp);
                                            // Update the color
                                            var color = colorForTemperature.get(newTemp);
                                            group.select('circle').attr('fill', color);
                                            group.select('circle.label_back').attr('fill', color);
                                            // Update the hidden temp labels
                                            var target = Math.floor(newTemp);
                                            var dotTarget = (newTemp - target < 0.5) ? 0 : 5;
                                            group.select('tspan.target').text(target);
                                            group.select('tspan.dot_target').text(dotTarget);
                                            this.dayScheduleBuffer[circleIndex].target = newTemp;
                                            // Flag for schedule change
                                            this.changed = this.weekDays[this.dayScheduleBuffer[circleIndex].weekday - 1];
                                        }
                                    }
                                }
                            };

                            d3.selection.prototype.moveToFront = function() {
                                return this.each(function() {
                                    this.parentNode.appendChild(this);
                                });
                            };

                            this.addDetailedEntry = function(dayGroup, id, xpos, ypos, target, addNewEntry) {
                                this.addEntry(dayGroup, id, xpos, ypos, target);
                                var entryGroup = dayGroup.select('#' + id);
                                var textGroup = entryGroup.append('g')
                                    .attr('class', 'time');

                                var text = textGroup.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 12)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#483e37');

                                var entry = addNewEntry ? this.dayScheduleBuffer[id]: this.localSchedule[id];

                                var tspan = text.append('tspan')
                                    .attr('text-anchor', 'middle')
                                    .attr('x', xpos)
                                    .attr('y', ypos + 1.75 * this.radius)
                                    .text(
                                        this.pad(entry.hour, 2) + ':' +
                                        this.pad(entry.minute, 2)
                                    );
                            };

                            this.selectDay = function(day) {

                                if (day !== this.selectedDay) {
                                    $rootScope.dayView = true;
                                    $rootScope.$apply();
                                    var weekdays = d3.select('#weekdays');
                                    var weekCol = weekdays.append('rect')
                                        .attr('id', 'week_column')
                                        .attr('fill', '#483e37')
                                        .attr('x', 0)
                                        .attr('y', 0)
                                        .attr('height', 210)
                                        .attr('width', 95);
                                    var scheduleCol = weekdays.append('rect')
                                        .attr('id', 'schedule_column')
                                        .attr('fill', '#FFFFFF')
                                        .attr('x', 95)
                                        .attr('y', 0)
                                        .attr('height', 210)
                                        .attr('width', 650);

                                    var self = this;

                                    var scheduleColumnCallback = function() {
                                        self.closeDeleteView();
                                    };

                                    scheduleCol.on('touchstart', scheduleColumnCallback);
                                    scheduleCol.on('mousedown', scheduleColumnCallback);

                                    var dayGroup = d3.select(day);
                                    var rectangles = dayGroup.selectAll('rect')[0];
                                    var recSchedule = d3.select(rectangles[1]);
                                    recSchedule.style('visibility', 'hidden');

                                    // Reset the day schedule buffer when selecting new day
                                    this.dayScheduleBuffer = {};

                                    var scheduleEntries = dayGroup.selectAll('g.entry');
                                    if (scheduleEntries[0]) {
                                        for (var i = 0; i < scheduleEntries[0].length; i++) {
                                            var currEntry = d3.select(scheduleEntries[0][i]);
                                            var index = currEntry.attr('id');
                                            var schEntry = this.localSchedule[index];

                                            var tempOffset = this.tempToPixelOffset(
                                                this.localSchedule[index].target,
                                                parseInt(weekCol.attr('height'))
                                            );

                                            var circle = currEntry.select('circle');
                                            var posX = parseInt(circle.attr('cx'));
                                            var offsetY = tempOffset - parseInt(circle.attr('cy'));

                                            currEntry.remove();
                                            this.addDetailedEntry(
                                                dayGroup,
                                                index,
                                                posX,
                                                tempOffset,
                                                schEntry.target,
                                                false
                                            );

                                            this.updateSchedule(
                                                this.dayScheduleBuffer,
                                                index,
                                                schEntry.hour,
                                                schEntry.minute,
                                                schEntry.target,
                                                schEntry.weekday
                                            );
                                        }
                                    }
                                    // Move to front
                                    dayGroup.moveToFront();
                                    this.selectedDay = day;
                               }
                            };

                            this.deselectDay = function() {
                                if (this.selectedDay !== null) {
                                    var previousRec = d3.select(this.selectedDay).selectAll('rect')[0];
                                    var previousRec1 = d3.select(previousRec[0]);
                                    var previousRec2 = d3.select(previousRec[1]);
                                    previousRec1.attr('fill', '#483e37');
                                    previousRec2.attr('fill', '#FFFFFF');

                                    d3.select('#week_column').remove();
                                    d3.select('#schedule_column').remove();

                                    var dayGroup = d3.select(this.selectedDay);
                                    var rectangles = dayGroup.selectAll('rect')[0];
                                    var recSchedule = d3.select(rectangles[1]);
                                    recSchedule.style('visibility', 'visible');
    
                                    var scheduleEntries = dayGroup.selectAll('g.entry');
                                    scheduleEntries.remove();

                                    if (scheduleEntries[0]) {
                                        for (var i = 0; i < scheduleEntries[0].length; i++) {
                                            var entryNode = d3.select(scheduleEntries[0][i]);
                                            var index = entryNode.attr('id');
                                            var entry = this.localSchedule[index];
                                            var xpos = this.timeToPixelOffset(entry.hour, entry.minute);
                                            var ypos = this.height * (entry.weekday - 1) + this.height / 2;
                                            this.addEntry(dayGroup, index, xpos, ypos, entry.target);
                                        }
                                    }

                                    this.selectedDay = null;
                                }
                            };

                            this.deselectEntry = function() {
                                if (this.selectedEntry !== null) {
                                    this.selectedEntry.select('g.time').attr('visibility', 'visible');
                                    this.selectedEntry.select('g.temp').attr('visibility', 'visible');
                                    this.selectedEntry.select('circle.label_back').remove();
                                    this.selectedEntry.select('text.label').remove();
                                    this.selectedEntry = null;
                                    d3.select('#label').style('visibility', 'hidden');
                                }
                            };

                            this.entrySelector = function(self, entry) {
                                var group = d3.select(entry);
                                var selection = group.select('circle');

                                var label_back = group.append('circle')
                                    .attr('class', 'label_back')
                                    .attr('fill', colorForTemperature.get(
                                        self.dayScheduleBuffer[group.attr('id')].target))
                                    .attr('stroke', '#FFFFFF')
                                    .attr('stroke-width', 2)
                                    .attr('r', this.radius * 1.7)
                                    .attr('cx', selection.attr('cx'))
                                    .attr('cy', selection.attr('cy') - 4.0 * this.radius);

                                var xpos = label_back.attr('cx');
                                var ypos = label_back.attr('cy');

                                var text = group.append('text')
                                    .attr('class', 'label')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 14)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#FFFFFF');

                                var tspan = text.append('tspan')
                                    .attr('text-anchor', 'middle')
                                    .attr('x', xpos)
                                    .attr('y', parseInt(ypos) + this.radius / 2 - 2);

                                // Hide the time and temperature
                                group.select('g.time').attr('visibility', 'hidden');
                                group.select('g.temp').attr('visibility', 'hidden');

                                this.selectedEntry = group;
                            };

                            this.closeDeleteView = function() {
                                d3.select('#schedule_column').attr('fill', '#FFFFFF');
                                d3.selectAll('rect.schedule-col').attr('fill', '#FFFFFF');
                                d3.select('#timeline_back').attr('fill', '#FFFFFF');
                                this.selectedEntry = null;
                                this.inDeleteView = false;
                            }

                            this.deleteSelectedEntry = function(parentNode) {
                                var selectedEntry = d3.select(parentNode);
                                var index = selectedEntry.attr('id');
                                this.changed = this.dayScheduleBuffer[index].weekday;
                                // Mark for deletion in buffer
                                this.dayScheduleBuffer[index].del = true;
                                selectedEntry.remove();
                                this.closeDeleteView();
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
                                    .attr('fill', colorForTemperature.get(target));

                                var textGroup = entryGroup.append('g')
                                    .attr('class', 'temp');

                                var text = textGroup.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 14)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#FFFFFF');

                                var tspan = text.append('tspan')
                                    .attr('class', 'target')
                                    .attr('text-anchor', 'middle')
                                    .attr('x', xpos - 3)
                                    .attr('y', ypos + (this.radius / 2) * 0.8)
                                    .text(Math.floor(numTarget));

                                var text2 = textGroup.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 9)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#FFFFFF');

                                var tspan2 = text2.append('tspan')
                                    .attr('class', 'dot_target')
                                    .attr('text-anchor', 'middle')
                                    .attr('x', xpos + 8)
                                    .attr('y', ypos + (this.radius / 2) * 0.8)
                                    .text(dotTarget);

                                var dragStartCallback = function(d, obj) {
                                    var selectedNode = d3.select(obj);
                                    var parentNode = selectedNode.node().parentNode;
                                    var secondAncestor = d3.select(parentNode).node().parentNode;

                                    if (self.inDeleteView) {
                                        self.deleteSelectedEntry(parentNode);
                                    } else {
                                        if (self.inDetailedView) {
                                            self.selectDay(secondAncestor);
                                            self.entrySelector(self, parentNode);
                                            self.dragging = true;

                                            var group = d3.select(parentNode);
                                            var selection = group.select('circle');

                                            var trX = d3.transform(group.attr("transform")).translate[0];
                                            var trY = d3.transform(group.attr("transform")).translate[1];

                                            d.dragstart = d3.mouse(obj); // store this

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
                                        } else {
                                            self.selectDay(secondAncestor);
                                            self.inDetailedView = true;
                                        }
                                    }
                                };

                                var dragEndCallback = function() {
                                    if (!self.inDeleteView) {
                                        self.dragging = false;
                                        self.lockOnVerticalDrag = false;
                                        self.lockOnHorizontalDrag = false;
                                        // Remove path rectangles
                                        d3.select('#vpath').remove();
                                        d3.select('#hpath').remove();
                                        // Deselect entry
                                        self.deselectEntry();
                                    }
                                };

                                var back = entryGroup.append('circle')
                                    .attr('cx', xpos)
                                    .attr('cy', ypos)
                                    .attr('r', 2.0 * this.radius)
                                    .attr('fill-opacity', 0)
                                    .call(d3.behavior.drag()
                                        .on('dragstart', function(d) {
                                            d3.event.sourceEvent.preventDefault();
                                            d3.event.sourceEvent.stopPropagation();
                                            dragStartCallback(d, this);
                                        })
                                        .on('drag', function(d) {
                                            if (self.dragging) {
                                                self.mouseDragCallback(this, d);
                                            }
                                        })
                                        .on('dragend', function(d) {
                                            dragEndCallback();
                                        })
                                    )
                                    .on('mouseup', function() {
                                        dragEndCallback();
                                    });
                            };
                            
                            this.renderTimeline = function() {
                                var weekGroup = d3.select('#weekdays');

                                var timelineGroup = weekGroup.append('g')
                                    .attr('id', 'timelineGroup');

                                var timelineRect = timelineGroup.append('rect')
                                    .attr('id', 'timeline_back')
                                    .attr('fill', '#FFFFFF')
                                    .attr('fill-opacity', 1)
                                    .attr('stroke', '#BFBFBF')
                                    .attr('stroke-width', 1)
                                    .attr('x', 95)
                                    .attr('y', 210)
                                    .attr('height', 20)
                                    .attr('width', 650);

                                var text = timelineGroup.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 12)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#483e37');

                                var ypos = 225;
                                var step = 650 / 24;
                                var xpos = 100;

                                for (var i = 0; i < 24; i++) {
                                    text.append('tspan')
                                        .attr('text-anchor', 'middle')
                                        .attr('x', xpos)
                                        .attr('y', ypos)
                                        .text(i);
                                    xpos += step;
                                }
                            };

                            this.renderScheduleEntries = function() {

                                for (var i = 0; i < scope.schedule.length; i++) {
                                    var deepCopy = angular.copy(scope.schedule[i]);

                                    this.updateSchedule(
                                        this.localSchedule,
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
                            };

                            this.updateSchedule = function(schedule, id, hour, minute, target, weekday) {
                                schedule[id] = {
                                    'hour': hour,
                                    'minute': minute,
                                    'target': target,
                                    'weekday': weekday
                                };
                            };

                            this.addEntryCallback = function(self) {
                                if (self.selectedDay !== null) {
                                    var dayGroup = d3.select(self.selectedDay);
                                    var index = self.weekDays.indexOf(dayGroup.attr('id'));
                                    var ypos = this.tempToPixelOffset(self.defaultTemperature, 210);
                                    var id = 'c' + self.nextId;

                                    // Update local schedule
                                    self.updateSchedule(self.dayScheduleBuffer, id, 0, 0, self.defaultTemperature, index + 1);
                                    self.nextId++;

                                    self.addDetailedEntry(dayGroup, id, self.leftBound, ypos, self.defaultTemperature, true);
                                }
                            };

                            this.clearDay = function(dayGroup) {
                                var destDayEntries = dayGroup.selectAll('g.entry');
                                destDayEntries.remove();
                                if (destDayEntries[0]) {
                                    for (var i = 0; i < destDayEntries[0].length; i++) {
                                        var idToDel = d3.select(destDayEntries[0][i]).attr('id');
                                        delete this.localSchedule[idToDel];
                                    }
                                }
                            };

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
                                    var target = schEntry.target;

                                    var factor = self.weekDays.indexOf(destDay.attr('id'));
                                    var id = 'c' + self.nextId;

                                    var xpos = self.timeToPixelOffset(schEntry.hour, schEntry.minute);
                                    var ypos = self.height * factor + self.height / 2;
                                    self.addEntry(destDay, id, xpos, ypos, target);

                                    // Update local schedule
                                    self.updateSchedule(self.localSchedule, id, schEntry.hour, schEntry.minute, schEntry.target, factor + 1);
                                    self.nextId++;
                                });
                                self.deselectEntry();
                                destDay.moveToFront();
                                self.changed = destDay.attr('id');
                            };

                            this.switchToDeleteView = function(self) {
                                if (self.inDetailedView) {
                                    self.inDeleteView = true;
                                    d3.select('#schedule_column').attr('fill', '#C0C0C0');
                                    d3.selectAll('rect.schedule-col').attr('fill', '#C0C0C0');
                                    d3.select('#timeline_back').attr('fill', '#C0C0C0');
                                }
                            };

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
                                    for (var j = 0; j < scope.schedule.length; j++) {
                                        var scheduleEntry = scope.schedule[j];
                                        if (key === scheduleEntry.$id) {
                                            scope.schedule[j].hour = this.localSchedule[key].hour;
                                            scope.schedule[j].minute = this.localSchedule[key].minute;
                                            scope.schedule[j].target = this.localSchedule[key].target;
                                            scope.schedule.$save(scope.schedule[j]);
                                            found = true;
                                        }
                                    }
                                    if (!found) {
                                        scope.schedule.$add(this.localSchedule[key]);
                                    }
                                }
                                scope.$apply();
                            };

                            this.addRawActivity = function() {
                                console.log("Calling raw");
                                console.log("this.changed: ", this.changed);
                                if (this.changed) {
                                    var obj = {
                                        type: "change-schedule",
                                        day: this.changed
                                    };
                                    console.log("OBJ: ", obj);
                                    scope.addrawactivity({
                                        object: obj
                                    });
                                }
                            };

                            this.save = function() {
                                this.syncFirebase();
                                this.addRawActivity();
                                scope.goback({
                                    room: scope.roomid
                                });
                            };

                            this.cancel = function() {
                                console.log("Called Cancel");
                                this.deselectDay();
                                this.inDetailedView = false;
                                $rootScope.dayView = false;
                                $rootScope.$apply();
                            };

                            this.updateScheduleFromBuffer = function() {
                                for (var key in this.dayScheduleBuffer) {
                                    if (this.dayScheduleBuffer.hasOwnProperty(key)) {
                                        var buffEntry = this.dayScheduleBuffer[key];
                                        if (buffEntry.del) { // Delete entry
                                            delete this.localSchedule[key];
                                        } else { // Update entry
                                            this.localSchedule[key] = buffEntry;
                                        }
                                    }
                                }
                            };

                            this.backToWeek = function() {
                                this.addRawActivity();
                                this.updateScheduleFromBuffer();
                                this.syncFirebase();
                                this.deselectDay();
                                this.inDetailedView = false;
                                this.changed = false;
                                $rootScope.dayView = false;
                                $rootScope.$apply();
                            };

                            this.getIndexForDay = function(day) {
                                return this.weekDays.indexOf(d3.select(day).attr('id'));
                            };

                            this.closeContextMenu = function() {
                                // Delete copy and clear buttons
                                var group = d3.select('g.copy-paste');
                                group.remove();
                                // Remove day highlight
                                var dayGroup = d3.select(this.contextSelectedDay);
                                // Remove highlight
                                dayGroup.selectAll('rect.label-col')
                                    .attr('fill', '#483e37');
                                dayGroup.selectAll('rect.schedule-col')
                                    .attr('fill', '#FFFFFF');
                                dayGroup.selectAll('text')
                                    .attr('fill', '#FFFFFF');

                                this.contextSelectedDay = null;
                                this.isClickValid = true;
                                this.inContextMenu = false;
                                this.contextMenuSwitch = false;
                            };

                            this.renderCopyPasteButtons = function(day) {
                                var self = this;
                                var dayGroup = d3.select(day);
                                dayGroup.moveToFront();

                                var parentNode = d3.select(dayGroup.node().parentNode);
                                var copyPasteButtons = parentNode.append('g')
                                    .attr('class', 'copy-paste');

                                // Highlight the day
                                dayGroup.selectAll('rect')
                                    .attr('fill', '#ecf0f1');
                                dayGroup.selectAll('text')
                                    .attr('fill', '#483e37');

                                var idx = this.getIndexForDay(day);
                                var needOffset = false;
                                if (idx === 0 || idx === 1) {
                                    idx++;
                                    needOffset = true;
                                } else if (idx === 6) {
                                    idx = 5;
                                } else {
                                    idx--;
                                }

                                var backWidth = (this.entriesToCopy !== null) ? 225 : 150;
                                var backY = needOffset ? idx * 30: idx * 30 - 5;
                                var tSpanY = needOffset ? idx * 30 + 23: idx * 30 + 18;
                                var sepY = needOffset ? idx * 30 + 3: idx * 30 - 2;

                                var backRect = copyPasteButtons.append('rect')
                                    .attr('x', 1)
                                    .attr('y', backY)
                                    .attr('height', 35)
                                    .attr('width', backWidth)
                                    .attr('rx', 5)
                                    .attr('ry', 5)
                                    .attr('fill', '#2980b9');

                                var copyText = copyPasteButtons.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 14)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#FFFFFF');
                                var copyTspan = copyText.append('tspan')
                                    .attr('text-anchor', 'middle')
                                    .attr('x', 30)
                                    .attr('y', tSpanY)
                                    .text("Copy");
                                // Copy day button
                                var copyButton = copyPasteButtons.append('rect')
                                    .attr('x', 1)
                                    .attr('y', idx * 30 - 5)
                                    .attr('height', 35)
                                    .attr('width', 60)
                                    .attr('fill-opacity', 0);
                                var copyDayCallback = function() {
                                    d3.event.preventDefault();
                                    d3.event.stopPropagation();
                                    if (self.contextSelectedDay !== null) {
                                        self.entriesToCopy = d3.select(self.contextSelectedDay).selectAll('g.entry');
                                    }
                                    self.closeContextMenu();
                                };

                                copyButton.on('touchstart', copyDayCallback);
                                copyButton.on('mousedown', copyDayCallback);

                                // Draw separator
                                var sep = copyPasteButtons.append('line')
                                    .style("stroke", "white")
                                    .style('stroke-opacity', 0.4)
                                    .attr("x1", 65)
                                    .attr('y1', sepY)
                                    .attr('x2', 65)
                                    .attr('y2', sepY + 30);

                                if (this.entriesToCopy !== null) { // Add paste button
                                    var pasteText = copyPasteButtons.append('text')
                                        .attr('font-family', 'Helvetica Neue')
                                        .attr('font-size', 14)
                                        .attr('font-weight', 600)
                                        .attr('fill', '#FFFFFF');
                                    var pasteTspan = pasteText.append('tspan')
                                        .attr('text-anchor', 'left')
                                        .attr('x', 85)
                                        .attr('y', tSpanY)
                                        .text("Paste");

                                    var pasteDayCallback = function() {
                                        d3.event.preventDefault();
                                        d3.event.stopPropagation();
                                        self.copySchedule(self, self.contextSelectedDay);
                                        self.addRawActivity();
                                        self.closeContextMenu();
                                    };
                                    var pasteButton = copyPasteButtons.append('rect')
                                        .attr('x', 70)
                                        .attr('y', idx * 30 - 5)
                                        .attr('height', 35)
                                        .attr('width', 60)
                                        .attr('fill-opacity', 0);
                                    pasteButton.on('mousedown', pasteDayCallback);
                                    pasteButton.on('touchstart', pasteDayCallback);

                                    // Draw separator
                                    var pasteSep = copyPasteButtons.append('line')
                                        .style("stroke", "white")
                                        .style('stroke-opacity', 0.4)
                                        .attr("x1", 135)
                                        .attr('y1', sepY)
                                        .attr('x2', 135)
                                        .attr('y2', sepY + 30);
                                }

                                var clearBtnX = (this.entriesToCopy !== null) ? 140 : 70;
                                var clearText = copyPasteButtons.append('text')
                                    .attr('font-family', 'Helvetica Neue')
                                    .attr('font-size', 14)
                                    .attr('font-weight', 600)
                                    .attr('fill', '#FFFFFF');
                                var clearTspan = clearText.append('tspan')
                                    .attr('text-anchor', 'left')
                                    .attr('x', clearBtnX + 10)
                                    .attr('y', tSpanY)
                                    .text("Clear day");
                                // Clear day button
                                var clearButton = copyPasteButtons.append('rect')
                                    .attr('x', clearBtnX)
                                    .attr('y', idx * 30 - 5)
                                    .attr('width', 85)
                                    .attr('height', 35)
                                    .attr('fill-opacity', 0);
                                // Attach listener for clear
                                var clearDayCallback = function() {
                                    d3.event.preventDefault();
                                    d3.event.stopPropagation();
                                    self.clearDay(dayGroup);
                                    self.closeContextMenu();
                                };
                                clearButton.on('touchstart', clearDayCallback);
                                clearButton.on('mousedown', clearDayCallback);
                            };

                            this.attachListeners = function() {
                                var self = this;
                                var allDays = d3.selectAll('g.parent');

                                var timeoutId;

                                var allDaysOnTouchStartCallback = function() {
                                    d3.event.preventDefault();
                                    d3.event.stopPropagation();
                                    if (!self.inContextMenu && !self.inDetailedView) {
                                        self.contextMenuSwitch = true;
                                        var target = this;
                                        var mouse = d3.mouse(target);

                                        timeoutId = setTimeout(function() {
                                            self.isClickValid = false;
                                            self.inContextMenu = true;
                                            self.contextSelectedDay = target;
                                            // Show copy and clear
                                            self.renderCopyPasteButtons(target);
                                        }, 300);
                                    } else {
                                        self.closeContextMenu();
                                    }
                                };

                                var allDaysOnTouchEndCallback = function() {
                                    d3.event.preventDefault();
                                    d3.event.stopPropagation();
                                    if (!self.inContextMenu && self.contextMenuSwitch && !self.inDetailedView) {
                                        clearTimeout(timeoutId);
                                        if (self.isClickValid) {
                                            self.selectDay(this);
                                            self.inDetailedView = true;
                                        }
                                    }
                                    self.contextMenuSwitch = true;
                                };

                                allDays.on('touchstart', allDaysOnTouchStartCallback);
                                allDays.on('mousedown', allDaysOnTouchStartCallback);
                                allDays.on('touchend', allDaysOnTouchEndCallback);
                                allDays.on('mouseup', allDaysOnTouchEndCallback);

                                var addButton = d3.select('#add');
                                addButton.on('click', function() {
                                    self.addEntryCallback(self);
                                });

                                var weekButton = d3.select('#week');
                                weekButton.on('click', function() {
                                    self.backToWeek();
                                });

                                var deleteButton = d3.select('#delete');
                                deleteButton.on('click', function() {
                                    self.switchToDeleteView(self);
                                });

                                var saveButton = d3.select('#save');
                                saveButton.on('click', function() {
                                    self.save();
                                });

                                var cancelButton = d3.select('#cancel');
                                console.log("cancelBTN: ", cancelButton);
                                cancelButton.on('click', function() {
                                    console.log("called Cancel");
                                    self.cancel();
                                });
                            };
                        };

                        var scheduler = new Schedule();

                        var renderState = function() {
                            if (scope.schedule && !scheduler.rendered) {
                                scheduler.renderTimeline();
                                scheduler.renderScheduleEntries();
                                scheduler.attachListeners();
                                scheduler.rendered = true;

                                scope.hideloader();
                            }
                        };

                        scope.$watch('schedule', renderState);

                    },
                    replace: false,
                    template: '<svg id="room-schedule" overflow="visible" width="100%" height="100%" viewBox="0 0 742 230" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">\
                            <g id="weekdays"> \
                                <g id="monday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="0" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="25">{{"MONDAY" | translate}}</tspan> \
                                    </text> \
                                    <rect class="schedule-col" id="r1" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="0" /> \
                                </g> \
                                <g id="tuesday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="30" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="30" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="55">{{"TUESDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <g id="wednesday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="60" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="60" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="85">{{"WEDNESDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <g id="thursday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="90" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="90" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF "> \
                                        <tspan text-anchor="middle" x="47.5" y="115">{{"THURSDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <g id="friday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="120" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="120" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="145">{{"FRIDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <g id="saturday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="150" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="150" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="175">{{"SATURDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <g id="sunday" class="parent"> \
                                    <rect class="label-col" fill="#483e37" width="95" height="30" x="0" y="180" /> \
                                    <rect class="schedule-col" fill="#FFFFFF" stroke="#BFBFBF" stroke-width="1" width="650" height="30" x="95" y="180" /> \
                                    <text font-family="Helvetica Neue" font-size="16" font-weight="300" fill="#FFFFFF"> \
                                        <tspan text-anchor="middle" x="47.5" y="205">{{"SUNDAY" | translate}}</tspan> \
                                    </text> \
                                </g> \
                                <rect fill="#483e37" width="95" height="20" x="0" y="210" /> \
                            </g> \
                        </svg>'
                };
            }
        ]);