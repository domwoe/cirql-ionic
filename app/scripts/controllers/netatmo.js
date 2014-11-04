'use strict';

/**
 * @ngdoc function
 * @name cirqlApp.controller:NetatmoCtrl
 * @description
 * # NetatmoCtrl
 * Controller of the cirqlApp
 */
angular.module('cirqlApp')
  .controller('NetatmoCtrl', ['$scope', '$rootScope', 'user', 'simpleLogin', 'fbutil', '$window', '$routeParams','$location',
  function ($scope, $rootScope, user, simpleLogin, fbutil, $window, $routeParams, $location) {

    $rootScope.menu = true;
    $scope.user = user;
    $scope.logout = simpleLogin.logout;

    function loadNetatmoOauth() {
      var netatmo = fbutil.syncObject('netatmo/oauth');
      return netatmo;
    }

    $scope.authorizeNetatmo = function() {
      var netatmo = loadNetatmoOauth();
      var state = user.uid;
      netatmo.$loaded(function(data) {
        var url = data.authorize_url + 
                '?client_id=' +data.client_id +
                '&redirect_uri='+data.redirect_uri+
                '&state='+state;
        $window.open(url);   
      });      
    };

    function loadNetatmos(user) {
      if( $scope.netatmos ) {
        $scope.netatmos.$destroy();
      }
      var netatmos = fbutil.syncArray('homes/'+user.uid+'/sensors/netatmo/stations');
      $scope.netatmos = netatmos;
      console.log(netatmos);
      netatmos.$loaded().then(function() {
      	console.log(netatmos[0]);
      	if (netatmos[0]) {
      		$scope.isConnected = true;
      	}
      	else {
      		$scope.isConnected = false;
      	}
      });
      //netatmos.$watch(function(netatmos) {
      //	$scope.netatmos = netatmos;
      //});
      
    }
    loadNetatmos(user);

    $scope.toggleNetatmo = function(stationId,moduleId,hasRoom) {

    	var room = $scope.roomId;
    	var roomUrl = 'homes/' + user.uid +'/rooms/' + room + '/sensors';
    	var roomObj = fbutil.syncObject(roomUrl);

    	var netatmoUrl = 'homes/' + user.uid + '/sensors/netatmo/stations/' +
    					  stationId + '/modules/' + moduleId;
    	var netatmoObj = fbutil.syncObject(netatmoUrl);

    	if(hasRoom) {
    		delNetatmo();
    	}
    	else {
    		addNetatmo();
    	}

    	function addNetatmo() {

    		// Add Netatmo reference to room
			roomObj.netatmo = {
				station: stationId,
				module: moduleId
			};
    		//roomObj.station = stationId;
    		//roomObj.module = moduleId;
    		roomObj.$save();

    		// Add room reference to Netatmo
    		netatmoObj.$loaded().then(function() {
	    		console.log(netatmoObj);
	    		netatmoObj.room = room;
	    		netatmoObj.$save();
    		});
    		// Go back to room sceen
			$location.path('/room/'+room);
    	}

    	function delNetatmo() {	
    		roomObj.$loaded().then(function() {
    			delete roomObj.netatmo;
    			roomObj.$save();
    		});
    		netatmoObj.$loaded().then(function() {
	    		delete netatmoObj.room;
	    		netatmoObj.$save();
    		});
    	}



    };
   
  }]);
