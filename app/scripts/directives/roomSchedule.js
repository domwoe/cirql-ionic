'use strict';

angular.module('cirqlApp')
    .directive('roomSchedule', ['$timeout', '$ionicSideMenuDelegate', 
	function($timeout, $ionicSideMenuDelegate) {

	return {
		restrict: 'EA',
		scope: {
            schedule: "=",
            radius:   "=",
            sync: 	  "=",
            roomid:   "=",
            hour: 	  "@",
            minute:   "@",
            goBack:   "&"
        },
		link: function(scope, element, attrs) {

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

				var rec = d3.select('#r1');
				var recWidth = parseInt(rec.attr('width'));
				var recHeight = parseInt(rec.attr('height'));

				this.radius = scope.radius;
				this.leftBound = parseInt(rec.attr('x')) + this.radius + 1;
                this.rightBound = this.leftBound + recWidth - 2*(this.radius + 1);
                this.width = this.rightBound - this.leftBound;
                this.height = recHeight;
                this.self = this;

                this.pad = function(num, size) {
				    var s = num + "";
				    while (s.length < size) s = "0" + s;
				    return s;
				}

				this.timeToPixelOffset = function(hours, minutes) {
					var time = hours*60 + minutes;
					return this.leftBound + time*this.width/this.totalTime;
				}

				this.pixelOffsetToTime = function(xpos) {
					var time = (xpos - this.leftBound)*this.totalTime/(this.width);
					return [
						Math.floor(time/60),  
						15*Math.floor(time%60/15)
					];
				}

				this.mouseDragCallback = function(ev, self, d) {

					console.log("CALLBACK: ", ev, self, d);
					d.px = d.x; // previous x
		            var m = d3.mouse(ev);
		            d.x += m[0] - d.dragstart[0];
		            d.y += m[1] - d.dragstart[1];

					var m = d3.mouse(ev);
					var circle = d3.select(ev);
					var group = d3.select(circle.node().parentNode);

					var currentX = parseInt(circle.attr('cx'));
	                var newpos = d.x + currentX;

	                if (newpos < this.leftBound) {
	                	newpos = this.leftBound;
	                	d.x = newpos - currentX;
	                } else if (newpos > this.rightBound) {
	                	newpos = this.rightBound;
	                	d.x = newpos - currentX;
	                }
	                
	                group.attr('transform', 'translate(' + d.x + ', 0)');

	                var time = self.pixelOffsetToTime(newpos);
	                scope.hour = this.pad(time[0], 2);
	                scope.minute = this.pad(time[1], 2);

	                // Update the times in the local schedule
	                var circleIndex = group.attr('id');
                	var entry = this.localSchedule[circleIndex];
                	entry.hour = time[0];
                	entry.minute = time[1];
	            }

	            d3.selection.prototype.moveToFront = function() {
					return this.each(function() {
						this.parentNode.appendChild(this);
					});
				}

	            this.selectDay = function(day) {
	            	var dayGroup = d3.select(day);
	            	var rectangles = dayGroup.selectAll('rect')[0];
	            	var rec1 = d3.select(rectangles[0]);
	            	var rec2 = d3.select(rectangles[1]);
	            	rec1.attr('fill-opacity', 1);
	            	rec2.attr('fill-opacity', 1);
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
	            	this.selectDay(day);
	            	this.selectedDay = day;
	            }

	            this.deselectEntry = function() {
	            	if (this.selectedEntry != null) {
	            		this.selectedEntry.select('circle')
	            			.attr('fill', 'red')
	            			.attr('r', this.radius);
						this.selectedEntry.selectAll('path')
							.style('visibility', 'hidden');
            			this.selectedEntry = null;
	            	}
	            }

	            this.entrySelector = function(entry) {
	            	var group = d3.select(entry);
	            	this.deselectEntry();
	            	var selection = group.select('circle')
	            		.attr('fill', 'black')
	            		.attr('r', this.radius + 5);
	            	group.selectAll('path')
	            		.style('visibility', 'visible');
	            	this.selectedEntry = group;
	            }

	            // true for increase, false for decrease
	            this.updateTemp = function(obj, increaseOrDecrease) { 
	            	var recObj = d3.select(obj);
        			var parentNode = d3.select(recObj.node().parentNode);
        			var tspan = parentNode.select('tspan');
        			var currentTemp = parseInt(tspan.text());
        			var newTemp = 0;
        			if (increaseOrDecrease) {
        				newTemp = currentTemp + 1;
        			} else {	
        				newTemp = currentTemp - 1;
        			}

        			if (newTemp >= this.minTemp && newTemp <= this.maxTemp) {
        				tspan.text(newTemp);
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
	            	var self = this;
					var entryGroup = dayGroup.append('g')
						.attr('id', id)
						.data([{x: 0, y: 0, px: 0}]);
						
	            	var circle = entryGroup.append('circle')
						.attr('cx', xpos)
						.attr('cy', ypos)
						.attr('r', this.radius)
						.attr('fill', 'red');
						
	            	var text = entryGroup.append('text')
	            		.attr('font-family', 'Helvetica Neue')
	            		.attr('font-size', 20)
	            		.attr('font-weight', 300)
	            		.attr('fill', '#FFFFFF');

	            	var tspan = text.append('tspan')
	            		.attr('text-anchor', 'middle')
	            		.attr('x', xpos)
	            		.attr('y', ypos + this.radius/2)
	            		.text(target);

	            	var pathDecr = entryGroup.append('path')
            			.attr('transform', 'translate(' + (xpos - this.radius + 1) + ',' + (ypos + this.radius) + ') scale(0.25)')
            			.attr('d', 'M50,71.276c-1.338,0-2.676-0.511-3.696-1.53l-32.099-32.1c-2.042-2.042-2.042-5.352,0-7.393 \
						c2.041-2.041,5.351-2.041,7.393,0L50,58.656l28.402-28.402c2.042-2.041,5.352-2.041,7.393,0c2.042,2.041,2.042,5.351,0,7.393 \
						l-32.099,32.1C52.676,70.766,51.338,71.276,50,71.276z')
						.style('visibility', 'hidden');
						
            		var pathIncr = entryGroup.append('path')
            			.attr('transform', 'translate(' + (xpos - this.radius + 1) + ',' + (ypos - 2*this.radius - 10) + ') scale(0.25)')
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
							.origin(function(d) { return d; })
			            	.on('dragstart', function(d) {
			            		d3.event.sourceEvent.preventDefault();
			            		d3.event.sourceEvent.stopPropagation();

			            		console.log("DRAG START ", this);
								d.dragstart = d3.mouse(this); // store this
				                //$ionicSideMenuDelegate.canDragContent(false);
				                var parentNode = d3.select(this).node().parentNode;
				                var secondAncestor = d3.select(parentNode).node().parentNode;
								self.daySelector(secondAncestor);
								self.entrySelector(parentNode);

			            	})
				            .on('drag', function(d) {
				            	console.log("DRAGGING ", this);
				            	self.mouseDragCallback(this, self, d);
				            })
				            .on('dragend', function() {
				            	console.log("DRAG END ", this);
				                //$ionicSideMenuDelegate.canDragContent(true);
			            	})
		            	);

	            	var recIncr = entryGroup.append('rect')
	            		.attr('x', xpos - this.radius)
	            		.attr('y', ypos - 3*this.radius)
	            		.attr('width', 2*this.radius)
	            		.attr('height', 2*this.radius)
	            		.attr('fill-opacity', 0)
	            		.on('click', function() {
			            	self.incrementTemp(this);
			            });

	            	var recDecr = entryGroup.append('rect')
	            		.attr('x', xpos - this.radius)
	            		.attr('y', ypos + this.radius)
	            		.attr('width', 2*this.radius)
	            		.attr('height', 2*this.radius)
	            		.attr('fill-opacity', 0)
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
					    var ypos = this.height*(entry.weekday - 1) + this.height/2;
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
	            	console.log("CREATED ", this.localSchedule[id]);
	            }

	            this.addEntryCallback = function(self) {
	            	if (self.selectedDay != null) { 
	            		var dayGroup = d3.select(self.selectedDay);
	            		var index = self.weekDays.indexOf(dayGroup.attr('id'));
	            		var groupId = this.weekDays[index];	
	            		var ypos = self.height*index + self.height/2;
	            		var id = 'c' + self.nextId;
	            		self.addEntry(dayGroup, id, self.leftBound, ypos, self.defaultTemperature);
	            		self.entrySelector('#' + id);
	            		
	            		// Update local schedule
	            		self.updateSchedule(id, 0, 0, self.defaultTemperature, index + 1);

	            		self.nextId++;
	            	}
	            }

	            this.copySchedule = function(self, dest) {
	            	var destDay = d3.select(dest);
	            	
	            	self.entriesToCopy.each(function() {

	            		var entry = d3.select(this);
	            		var index = entry.attr('id');
	            		var schEntry = self.localSchedule[index];

	            		var factor = self.weekDays.indexOf(destDay.attr('id'));
	            		var id = 'c' + self.nextId;

	            		var target = parseInt(entry.select('tspan').text());

	            		var xpos = self.timeToPixelOffset(schEntry.hour, schEntry.minute);
					    var ypos = self.height*factor + self.height/2;
					    self.addEntry(destDay, id, xpos, ypos, target);

					    // Update local schedule
					    self.updateSchedule(id, schEntry.hour, schEntry.minute, schEntry.target, factor);
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
	            	self.syncFirebase();
	            	scope.goBack({room: scope.roomid});
	            }

	            this.cancel = function() {
	            	scope.goBack({room: scope.roomid});
	            }
 
	            this.attachListeners = function() {
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
		            addButton.on('click', function() {
		            	self.addEntryCallback(self);
		            });

		           	var copyButton = d3.select('#copy');
		           	copyButton.on('click', function() {
		           		self.copyScheduleCallback(self);
		           	});

		           	var deleteButton = d3.select('#delete');
		           	deleteButton.on('click', function() {
		           		self.deleteEntryCallback(self);
	           		});

	           		var saveButton = d3.select('#save');
	           		saveButton.on('click', function() {
	           			self.save(self);
	           		});

	           		var cancelButton = d3.select('#cancel');
	           		cancelButton.on('click', function() {
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
 		replace: 'true',
		template: '\
		<svg id="room-schedule" overflow="visible" width="100%" height="100%" viewBox="-3 0 752 320" preserveAspectRatio="xMidYMin" xmlns="http://www.w3.org/2000/svg">\
		    <g id="weekdays"> \
		    	<g id="monday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="0" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="25">Monday</tspan> \
                    </text> \
				    <rect id="r1" fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="0" /> \
				</g> \
				<g id="tuesday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="30" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="30" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="55">Tuesday</tspan> \
                    </text> \
				</g> \
				<g id="wednesday" class="parent"> \
			    	<rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="60" /> \
			    	<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="60" /> \
			    	<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="85">Wednesday</tspan> \
                    </text> \
			    </g> \
			    <g id="thursday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="90" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="90" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="115">Thursday</tspan> \
                    </text> \
				</g> \
				<g id="friday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="120" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="120" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF"> \
                        <tspan text-anchor="middle" x="47.5" y="145">Friday</tspan> \
                    </text> \
				</g> \
				<g id="saturday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="150" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="150" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF"> \
                        <tspan text-anchor="middle" x="47.5" y="175">Saturday</tspan> \
                    </text> \
			    </g> \
			    <g id="sunday" class="parent"> \
	    			<rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="180" /> \
	    			<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" height="30" x="95" y="180" /> \
	    			<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF"> \
                        <tspan text-anchor="middle" x="47.5" y="205">Sunday</tspan> \
                    </text> \
                </g> \
    		</g> \
    		<g id="label"> \
    			<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="47.5" y="230">{{hour}}:{{minute}}</tspan> \
                </text> \
    		</g> \
    		<g id="add"> \
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="510" y="230" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="545" y="250"> Add </tspan> \
                </text> \
    		</g> \
    		<g id="copy"> \
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="590" y="230" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="625" y="250"> Copy </tspan> \
                </text> \
    		</g> \
    		<g id="delete"> \
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="670" y="230" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="705" y="250"> Delete </tspan> \
                </text> \
    		</g> \
    		<g id="save"> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="250" y="320"> Save </tspan> \
                </text> \
    		</g> \
    		<g id="cancel"> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="500" y="320"> Cancel </tspan> \
                </text> \
    		</g> \
		</svg>'
	};

 }]);