'use strict';

angular.module('cirqlApp').service('User',
  function($q, $firebase, ENV, Auth) {
    var fburl  = ENV.fburl;
    var usersRef = new Firebase(fburl + '/homes');
    var currentUser = null;

    this.loadCurrentUser = function() {
      var defer = $q.defer();
      //var currentUserRef = usersRef.child(Auth.currentUser.uid);
      var currentUserRef = new Firebase(fburl + '/homes/simplelogin:46');

      currentUser = $firebase(currentUserRef).$asObject();
      currentUser.$loaded().then(defer.resolve);

      return defer.promise;
    };

    this.create = function(id, email) {
      var users = $firebase(usersRef);

      return users.$child(id).$set({ email: email });
    };

    this.recordPasswordChange = function() {
      var now = Math.floor(Date.now() / 1000);

      return currentUser.$update({ passwordLastChangedAt: now });
    };

    this.hasChangedPassword = function() {
      return angular.isDefined(currentUser.passwordLastChangedAt);
    };
  });
