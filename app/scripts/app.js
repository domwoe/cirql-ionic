'use strict';

angular.module('cirqlApp', [
  'ionic',
  'config',
  'simpleLogin',
  'firebase.utils',
  'ngStorage'
])

.run(function($ionicPlatform, discovery) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    
    // Find Gateway
    
    if (window.cordova && window.Discovery)  {
    
      var params = { 
        clientName: 'cirqlApp',
        port: 5353
      };

      discovery.identify(params).then(function(result) {
        console.log(result);
      }, function(reason) {
        console.log(reason);
      });

    }  
        if (window.plugins && window.plugins.DGGeofencing) {
            
            geo.init()

            geo.monitorRegion();

            geo.startMonitoringSignificantLocationChanges();
        }









        // cordova.plugins.Discovery.identify(function(serviceData) {

        //   console.log(serviceData);

        // }, function(error) {

        //   console.log(error);

        // }, {
        //   clientName: 'cirqlMobile', // the name the server expects to see for clients connecting
        //   port: 7072 // the port the service's broadcast service is running on
        // });

        // navigator.Discovery.identify(function(serviceData) {

        //   console.log(serviceData);

        // }, function(error) {

        //   console.log(error);

        // }, {
        //   clientName: 'cirqlMobile', // the name the server expects to see for clients connecting
        //   port: 7072 // the port the service's broadcast service is running on
        // });
    });
});