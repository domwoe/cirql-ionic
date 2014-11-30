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

    
  });
});
