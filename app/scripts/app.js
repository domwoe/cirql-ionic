'use strict';

angular.module('cirqlApp', [
  'ionic',
  'config',
  'simpleLogin',
  'firebase.utils',
  'ngStorage'
])

.run(function($ionicPlatform, geo) {
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

    if (window.plugins && window.plugins.DGGeofencing) {
      geo.init().then(function(result) {
        console.log(result);
      });

      var params = ["1", "40.781552", "-73.967171", "150"];
      geo.monitorRegion(params).then(function(result) {
        console.log(result)
      });
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
