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
                        this.inDetailedView = false;
                        this.isClickValid = true;
                        this.inContextMenu = false;
                        this.contextSelectedDay = null;
                        this.contextMenuSwitch = false;

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
                            var redH = height - 2*(this.radius + 1);
                            return redH + this.radius + 1 - (temp - this.minTemp) * redH / (this.maxTemp - this.minTemp);
                        };

                        this.pixelOffsetToTemp = function(ypos, height) {
                            var redH = height - 2*(this.radius + 1);
                            return this.minTemp + (redH + this.radius + 1 - ypos)*(this.maxTemp - this.minTemp) / redH;
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
                                    console.log("TIME: ", time);

                                    // Update the times in the local schedule
                                    var entry = this.localSchedule[circleIndex];
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
                                    this.changed = this.weekDays[entry.weekday + 1];

                                } else if (this.lockOnVerticalDrag) {
                                    // Update temperature
                                    var newTemp = roundHalf(this.pixelOffsetToTemp(newposY, 210));
                                    if (newTemp >= this.minTemp && newTemp <= this.maxTemp) {
                                        // Show the temp in the label
                                        group.select('text.label').select('tspan').text(newTemp);
                                        // Update the hidden temp labels
                                        var target = Math.floor(newTemp);
                                        var dotTarget = (newTemp - target < 0.5) ? 0: 5;
                                        group.select('tspan.target').text(target);
                                        group.select('tspan.dot_target').text(dotTarget);
                                        this.localSchedule[circleIndex].target = newTemp;
                                        // Flag for schedule change
                                        this.changed = this.weekDays[this.localSchedule[circleIndex].weekday + 1];
                                    }
                                }
                            }
                        };

                        d3.selection.prototype.moveToFront = function() {
                            return this.each(function() {
                                this.parentNode.appendChild(this);
                            });
                        };

                        this.addDetailedEntry = function(dayGroup, id, xpos, ypos, target) {
                            this.addEntry(dayGroup, id, xpos, ypos, target);
                            var entryGroup = dayGroup.select('#' + id);
                            var textGroup = entryGroup.append('g')
                                .attr('class', 'time');

                            console.log("entryg: ", entryGroup);
                            var text = textGroup.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 12)
                                .attr('font-weight', 600)
                                .attr('fill', '#483e37');

                            var tspan = text.append('tspan')
                                .attr('text-anchor', 'middle')
                                .attr('x', xpos)
                                .attr('y', ypos + 1.75*this.radius)
                                .text(
                                    this.pad(this.localSchedule[id].hour, 2) + ':' +
                                    this.pad(this.localSchedule[id].minute, 2)
                                );
                        };

                        this.selectDay = function(day) {
                            scope.dayview = true;
                            scope.$apply();
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
                                        this.localSchedule[index].target
                                    );
                                }
                            }
                            // Move to front
                            dayGroup.moveToFront();
                        };

                        this.deselectDay = function() {
                            var previousRec = d3.select(this.selectedDay).selectAll('rect')[0];
                            var previousRec1 = d3.select(previousRec[0]);
                            var previousRec2 = d3.select(previousRec[1]);
                            previousRec1.attr('fill-opacity', 0.6);
                            previousRec2.attr('fill-opacity', 0.6);
                        };

                        this.daySelector = function(day) {
                            if (this.selectedDay !== null) {
                                if (this.selectedDay !== day) {
                                    this.deselectEntry();
                                }
                                this.deselectDay();
                            }
                            if (this.selectedDay !== day) {
                                this.selectDay(day);
                                this.selectedDay = day;
                            }
                        };

                        this.deselectEntry = function() {
                            if (this.selectedEntry !== null) {
                                this.selectedEntry.select('circle')
                                    .attr('fill', 'red')
                                    .attr('r', this.radius);
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
                                .attr('fill', 'red')
                                .attr('stroke', '#FFFFFF')
                                .attr('stroke-width', 2)
                                .attr('r', this.radius*1.7)
                                .attr('cx', selection.attr('cx'))
                                .attr('cy', selection.attr('cy') - 4.0*this.radius);

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
                                .attr('y', parseInt(ypos) + this.radius/2 - 2);

                            // Hide the time and temperature
                            group.select('g.time').attr('visibility', 'hidden');
                            group.select('g.temp').attr('visibility', 'hidden');

                            this.selectedEntry = group;
                        };

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
                        };

                        this.decrementTemp = function(obj) {
                            this.updateTemp(obj, false);
                        };

                        this.incrementTemp = function(obj) {
                            this.updateTemp(obj, true);
                        };

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

                            var back = entryGroup.append('circle')
                                .attr('cx', xpos)
                                .attr('cy', ypos)
                                .attr('r', 2.0*this.radius)
                                .attr('fill-opacity', 0)
                                .call(d3.behavior.drag()
                                    .on('dragstart', function(d) {
                                        console.log("DRAG START");
                                        d3.event.sourceEvent.preventDefault();
                                        d3.event.sourceEvent.stopPropagation();

                                        var selectedNode = d3.select(this);
                                        var parentNode = selectedNode.node().parentNode;
                                        var secondAncestor = d3.select(parentNode).node().parentNode;
                                        console.log("Selected: ", selectedNode);
                                        console.log("ENTRY: ", self.selectedEntry);
                                        if (self.inDetailedView && selectedNode !== self.selectedEntry) {
                                            
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
                                        } else {
                                         /*   if (self.entriesToCopy !== null && secondAncestor !== self.selectedDay) {
                                                self.copySchedule(self, secondAncestor);
                                                self.entriesToCopy = null;
                                            } else {*/
                                                self.daySelector(secondAncestor);
                                                self.inDetailedView = true;
//                                            }
                                        }
                                    })
                                    .on('drag', function(d) {
                                        if (self.dragging) {
                                            self.mouseDragCallback(this, d);
                                        }
                                    })
                                    .on('dragend', function(d) {
                                        console.log("DRAGEND");
                                        self.dragging = false;
                                        self.lockOnVerticalDrag = false;
                                        self.lockOnHorizontalDrag = false;
                                        // Remove path rectangles
                                        d3.select('#vpath').remove();
                                        d3.select('#hpath').remove();
                                        // Deselect entry
                                        self.deselectEntry();
                                        delete d.dragstart;
                                    })
                                );
                        };

                        this.renderTimeline = function() {
                            var weekGroup = d3.select('#weekdays');

                            var timelineGroup = weekGroup.append('g')
                                .attr('id', 'timelineGroup');

                            var timelineRect = timelineGroup.append('rect')
                                .attr('id', 'timeline_back')
                                .attr('fill', '#b3b3b3')
                                .attr('fill-opacity', 0.6)
                                .attr('stroke', '#FFFFFF')
                                .attr('stroke-width', 1)
                                .attr('x', 95)
                                .attr('y', 210)
                                .attr('height', 20)
                                .attr('width', 650);

                            var text = timelineGroup.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 12)
                                .attr('font-weight', 600)
                                .attr('fill', '#FFFFFF');

                            var ypos = 225;
                            var step = 650/24;
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

                        this.updateSchedule = function(id, hour, minute, target, weekday) {
                            this.localSchedule[id] = {
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
                                self.updateSchedule(id, 0, 0, self.defaultTemperature, index + 1);
                                self.nextId++;

                                self.addDetailedEntry(dayGroup, id, self.leftBound, ypos, self.defaultTemperature);
                               // self.entrySelector(self, '#' + id);
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
                        };

                        this.copyScheduleCallback = function() {
                            console.log("THIS: ", this.selectedDay);
                            if (this.selectedDay !== null) {
                                console.log("COPY CALLED");
                                this.entriesToCopy = d3.select(this.selectedDay).selectAll('g.entry');
                            }
                        };

                        this.deleteEntryCallback = function(self) {
                            if (self.selectedEntry !== null) {
                                var index = this.selectedEntry.attr('id');
                                delete self.localSchedule[index];
                                this.selectedEntry.remove();
                                self.selectedEntry = null;
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

                        this.save = function(self) {

                            console.log(self.changed);

                            self.syncFirebase();
                            scope.goback({
                                room: scope.roomid,
                                changedDay: self.changed
                            });
                        };

                        this.cancel = function() {
                            scope.goback({
                                room: scope.roomid
                            });
                        };

                        this.backToWeek = function(self) {
                            console.log('BACK TO WEEK');
                            self.syncFirebase();
                            console.log(self.changed);
                            this.inDetailedView = false;
                            scope.reload({
                                changedDay: self.changed
                            });
                        };

                        this.getIndexForDay = function(day) {
                            return this.weekDays.indexOf(d3.select(day).attr('id'));
                        };

                        this.closeContextMenu = function() {
                            // Delete copy and clear buttons
                            var group = d3.select('g.copy-paste');
                            console.log(" TO REMVE: ", group);
                            group.remove();
                            // Remove day highlight
                            d3.select(this.contextSelectedDay).selectAll('rect')
                                .attr('fill-opacity', 0.6);
                            this.contextSelectedDay = null;
                            this.isClickValid = true;
                            this.inContextMenu = false;
                            this.contextMenuSwitch = false;
                            this.selectedDay = null;
                        };

                        this.renderCopyPasteButtons = function(day) {
                            var dayGroup = d3.select(day);
                            dayGroup.moveToFront();

                            var parentNode = d3.select(dayGroup.node().parentNode);
                            var copyPasteButtons = parentNode.append('g')
                                .attr('class', 'copy-paste');

                            // Highlight the day
                            dayGroup.selectAll('rect')
                                .attr('fill-opacity', 1.0);

                            var idx = this.getIndexForDay(day);
                            if (idx === 0) {
                                idx = 1;
                            } else if (idx === 6) {
                                idx = 5;
                            } else {
                                idx--;
                            }

                            var backRect = copyPasteButtons.append('rect') 
                                .attr('x', 1)
                                .attr('y', 1 + idx * 30)
                                .attr('height', 28)
                                .attr('width', 100)
                                .attr('rx', 5)
                                .attr('ry', 5)
                                .attr('fill', '#483e37');

                            var copyText = copyPasteButtons.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 10)
                                .attr('font-weight', 400)
                                .attr('fill', '#FFFFFF');
                            var copyTspan = copyText.append('tspan')
                                .attr('text-anchor', 'middle')
                                .attr('x', 20)
                                .attr('y', idx * 30 + 18)
                                .text("Copy");
                            // Copy day button
                            var copyButton = copyPasteButtons.append('rect')
                                .attr('x', 1)
                                .attr('y', 1 + idx * 30)
                                .attr('height', 28)
                                .attr('width', 40)
                                .attr('fill-opacity', 0);
                            copyButton.on('mousedown', function() {
                                d3.event.preventDefault();
                                d3.event.stopPropagation();
                                self.copyScheduleCallback();
                                console.log("To COPY: ", self.entriesToCopy);
                                self.closeContextMenu();
                            });

                            // Draw separator
                            var sep = copyPasteButtons.append('line')
                                .style("stroke", "white")
                                .style('stroke-opacity', 0.4)
                                .attr("x1", 40)
                                .attr('y1', 4 + idx * 30)
                                .attr('x2', 40)
                                .attr('y2', (idx + 1) * 30 - 4);

                            var clearText = copyPasteButtons.append('text')
                                .attr('font-family', 'Helvetica Neue')
                                .attr('font-size', 10)
                                .attr('font-weight', 400)
                                .attr('fill', '#FFFFFF');
                            var clearTspan = clearText.append('tspan')
                                .attr('text-anchor', 'middle')
                                .attr('x', 70)
                                .attr('y', idx * 30 + 18)
                                .text("Clear day");
                            // Clear day button
                            var clearButton = copyPasteButtons.append('rect')
                                .attr('x', 40)
                                .attr('y', 1 + idx * 30)
                                .attr('width', 60)
                                .attr('height', 28)
                                .attr('fill-opacity', 0);
                            // Attach listener for click
                            var self = this;
                            clearButton.on('mousedown', function() {
                                d3.event.preventDefault();
                                d3.event.stopPropagation();
                                self.clearDay(dayGroup);
                                self.closeContextMenu();
                                console.log("CLICK ON CLEAR");
                            });
                        }

                        this.attachListeners = function() {
                            console.log("Attaching listeners");
                            var self = this;
                            var allDays = d3.selectAll('g.parent');

                            var timeoutId;

                            allDays.on("mousedown", function() {
                                d3.event.preventDefault();
                                //d3.event.stopPropagation();
                                if (!self.inContextMenu && !self.inDetailedView) {
                                    self.contextMenuSwitch = true;
                                    console.log("MOUSE DOWN");
                                    var target = this;
                                    var mouse = d3.mouse(target);

                                    timeoutId = setTimeout(function() {
                                        self.isClickValid = false;
                                        self.inContextMenu = true;
                                        self.selectedDay = target;
                                        self.contextSelectedDay = target;
                                        console.log("TIMEOUT");
                                        // Show copy and clear
                                        self.renderCopyPasteButtons(target);
                                    }, 300);
                                } else {
                                    console.log("CLOSE CONTEXT MENU");
                                    self.closeContextMenu();
                                }
                            });
                            allDays.on('mouseup', function() {
                                d3.event.preventDefault();
                                //d3.event.stopPropagation();
                                if (!self.inContextMenu && self.contextMenuSwitch && !self.inDetailedView) {
                                    clearTimeout(timeoutId);
                                    console.log("MOUSEUP VALID: ", self.isClickValid);
                                    if (self.isClickValid) {
                                        console.log("CLICK CLICK");
                                        if (self.entriesToCopy !== null && this !== self.selectedDay) {
                                        self.copySchedule(self, this);
                                        self.entriesToCopy = null;
                                        } else {
                                            self.daySelector(this);
                                            self.inDetailedView = true;
                                        }
                                    }
                                }
                                self.contextMenuSwitch = true;
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
                        };
                    };

                    var scheduler = new Schedule();

                    var renderState = function() {
                        if (scope.schedule && !scheduler.rendered) {
                            scheduler.renderTimeline();
                            scheduler.renderScheduleEntries();
                            scheduler.attachListeners();
                            scheduler.rendered = true;
                        }
                    };

                    scope.$watch('schedule', renderState);

                },
                replace: false,
                template: '\
                <ion-content class="has-footer has-header" scroll="false" data-tap-disabled="true"> \
                    <div class="schedule-block"> \
                        <svg id="room-schedule" width="100%" height="100%" viewBox="0 0 742 239" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">\
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
                        </svg> \
                    </div> \
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