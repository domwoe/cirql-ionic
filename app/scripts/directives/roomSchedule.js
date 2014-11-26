'use strict';

angular.module('cirqlApp')
    .directive('roomSchedule', ['$timeout', '$ionicSideMenuDelegate', 
	function($timeout, $ionicSideMenuDelegate) {

	return {
		restrict: 'EA',
		scope: {
            schedule: "=",
            radius:   "=",
            hour: 	  "@",
            minute:   "@"
        },
		link: function(scope, element, attrs) {

			var Schedule = function() {

				this.nextId = Object.keys(scope.schedule).length;
				this.defaultTemperature = 20;
				this.totalTime = 1425;
				this.selectedDay = null;
				this.selectedEntry = null;
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

                console.log("recH: ", this.height);

                this.pad = function(num, size) {
				    var s = num + "";
				    while (s.length < size) s = "0" + s;
				    return s;
				}

				this.timeToPixelOffset = function(hours, minutes) {
					var time = hours*60 + minutes;
					console.log("t: ", time);
					return this.leftBound + time*this.width/this.totalTime;
				}

				this.pixelOffsetToTime = function(xpos) {
					var time = (xpos - this.leftBound)*this.totalTime/(this.width);
					return [
						Math.floor(time/60),  
						15*Math.floor(time%60/15)
					];
				}

				this.mouseDragCallback = function(ev, self) {
					var circle = d3.select(ev);
	                var coords = [0,0];
	                coords = d3.mouse(ev);
	                var newpos = coords[0];

	                if (newpos < this.leftBound) {
	                	newpos = this.leftBound;
	                } else if (newpos > this.rightBound) {
	                	newpos = this.rightBound;
	                }

	                circle.attr('cx', newpos);
	                var time = self.pixelOffsetToTime(newpos);
	                scope.hour = this.pad(time[0], 2);
	                scope.minute = this.pad(time[1], 2);

	                // Update the times in the local schedule
	                var circleIndex = parseInt(circle.attr('id').substring(1));
                	var entry = this.localSchedule[circleIndex];
                	entry.hour = time[0];
                	entry.minute = time[1];
	            }

	            this.selectDay = function(day) {
	            	var dayGroup = d3.select(day);
	            	if (dayGroup.attr('id'))
	            	var rectangles = dayGroup.selectAll('rect')[0];
	            	var rec1 = d3.select(rectangles[0]);
	            	var rec2 = d3.select(rectangles[1]);
	            	rec1.attr('fill-opacity', 1);
	            	rec2.attr('fill-opacity', 1);
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
	            		this.deselectDay();
	            	}
	            	this.selectDay(day);
	            	this.selectedDay = day;
	            }

	            this.entrySelector = function(entry) {
	            	if (this.selectedEntry != null) {
	            		d3.select(this.selectedEntry).attr('fill', 'red');
	            	}
	            	var selection = d3.select(entry).attr('fill', '#FF9933');
	            	this.selectedEntry = entry;
	            }

	            this.addEntry = function(dayGroup, id, xpos, ypos) {
	            	var self = this;
	            	var entry = dayGroup.append('circle')
						.attr('id', id)
						.attr('cx', xpos)
						.attr('cy', ypos)
						.attr('r', this.radius)
						.attr('fill', 'red')
						.call(d3.behavior.drag()
			            	.on('dragstart', function() {
				                $ionicSideMenuDelegate.canDragContent(false);
				                var parentNode = d3.select(this).node().parentNode;
				                self.entrySelector(this);
								self.daySelector(parentNode);
								console.log("START");
			            	})
				            .on('drag', function() {
				            	self.mouseDragCallback(this, self);
				            	console.log("DRAGGING");
				            })
				            .on('dragend', function() {
				                $ionicSideMenuDelegate.canDragContent(true);
				                console.log("END");
			            	})
		            	);
	            }

  	            this.renderScheduleEntries = function() {
  	            	var i = 0;
  	            	for (var key in scope.schedule) {
  	            		var entry = scope.schedule[key];
					    var xpos = this.timeToPixelOffset(entry.hour, entry.minute);
					    var ypos = this.height*(entry.weekday - 1) + this.height/2;
						var groupId = this.weekDays[entry.weekday - 1];					    
						var dayGroup = d3.select('#' + groupId);
						this.addEntry(dayGroup, 'c' + i, xpos, ypos);
						this.localSchedule[i] = entry;
						i++;
					}
	            }

	            this.addEntryCallback = function(self) {
	            	if (self.selectedDay != null) { 
	            		var dayGroup = d3.select(self.selectedDay);
	            		var index = self.weekDays.indexOf(dayGroup.attr('id'));
	            		var groupId = this.weekDays[index];	
	            		var ypos = self.height*index + self.height/2;
	            		var id = 'c' + self.nextId;
	            		self.addEntry(dayGroup, id, self.leftBound, ypos);
	            		self.entrySelector('#' + id);
	            		
	            		console.log("NEXTID: ", self.nextId);
	            		// Update local schedule
						self.localSchedule[self.nextId] = {
							'hour': 0,
							'minute': 0,
							'target': 20,
							'weekday': index + 1
						};	            		

	            		self.nextId++;
	            		console.log("SCHEDULE: ", self.localSchedule);
	            	}
	            }

	            this.copyScheduleCallback = function() {
	            	console.log("Copy");
	            }

	            this.deleteEntryCallback = function(self) {
	            	if (self.selectedEntry != null) {
	            		var toDelete = d3.select(self.selectedEntry);
		                var index = parseInt(toDelete.attr('id').substring(1));
	            		delete self.localSchedule[index];
	            		toDelete.remove();
		            	self.selectedEntry = null;
		            	console.log("SCHEDULE: ", self.localSchedule);
	            	}
	            }
 
	            this.attachListeners = function() {
	            	var self = this;
	            	var allDays = d3.selectAll('g.parent');
		            allDays.on('click', function() {
		            	self.daySelector(this);	
		            });

		            var addButton = d3.select('#add');
		            addButton.on('click', function() {
		            	self.addEntryCallback(self);
		            });

		           	var copyButton = d3.select('#copy');
		           	copyButton.on('click', this.copyScheduleCallback);

		           	var deleteButton = d3.select('#delete');
		           	deleteButton.on('click', function() {
		           		self.deleteEntryCallback(self);
	           		});
	            }
			}

			var schedule = new Schedule();
			schedule.renderScheduleEntries();
			schedule.attachListeners();

		},
 		replace: 'true',
		template: '\
		<svg id="room-schedule" overflow="visible" width="100%" height="100%" viewBox="-2 0 750 300" preserveAspectRatio="xMidYMin" xmlns="http://www.w3.org/2000/svg">\
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
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="30" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="55">Tuesday</tspan> \
                    </text> \
				</g> \
				<g id="wednesday" class="parent"> \
			    	<rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="60" /> \
			    	<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="60" /> \
			    	<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="85">Wednesday</tspan> \
                    </text> \
			    </g> \
			    <g id="thursday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="90" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="90" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                        <tspan text-anchor="middle" x="47.5" y="115">Thursday</tspan> \
                    </text> \
				</g> \
				<g id="friday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="120" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="120" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF"> \
                        <tspan text-anchor="middle" x="47.5" y="145">Friday</tspan> \
                    </text> \
				</g> \
				<g id="saturday" class="parent"> \
				    <rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="150" /> \
				    <rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="150" /> \
				    <text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF"> \
                        <tspan text-anchor="middle" x="47.5" y="175">Saturday</tspan> \
                    </text> \
			    </g> \
			    <g id="sunday" class="parent"> \
	    			<rect fill="#483e37" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="95" height="30" x="0" y="180" /> \
	    			<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="650" width="650" height="30" x="95" y="180" /> \
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
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="510" y="220" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="545" y="240"> Add </tspan> \
                </text> \
    		</g> \
    		<g id="copy"> \
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="590" y="220" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="625" y="240"> Copy </tspan> \
                </text> \
    		</g> \
    		<g id="delete"> \
				<rect fill="#b3b3b3" fill-opacity="0.6" stroke="#FFFFFF" stroke-width="1" width="75" height="25" x="670" y="220" /> \
				<text font-family="Helvetica Neue" font-size="20" font-weight="300" fill="#FFFFFF "> \
                    <tspan text-anchor="middle" x="705" y="240"> Delete </tspan> \
                </text> \
    		</g> \
		</svg>'
	};

 }]);