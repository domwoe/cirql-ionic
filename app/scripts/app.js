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
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        // simpleLogin.getUser().then(function(user) {
        //   $log.info('Promise: ' + user);  
        // });
        // 


        if (window.plugins && window.plugins.DGGeofencing) {
            geo.init().then(function(result) {
                console.log('GeoInitCallback: ' + result);
                var date = new Date();
                fbLocation.date = date + '';
                fbLocation.msg = result;
                fbLocation.$save();
            });

            var params = ['1', '40.781552', '-73.967171', '10'];
            geo.monitorRegion(params);

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