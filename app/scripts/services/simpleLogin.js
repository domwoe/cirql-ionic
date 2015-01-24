'use strict';
/* jshint undef: false, unused: false, latedef: false */

/**
 * @ngdoc service
 * @name simpleLogin
 * @description
 * # simpleLogin
 */

angular.module('simpleLogin', ['firebase', 'firebase.utils', 'ngStorage'])

// a simple wrapper on simpleLogin.getUser() that rejects the promise
// if the user does not exists (i.e. makes user required), useful for
// setting up secure routes that require authentication
.factory('requireUser', function(simpleLogin, $q) {
    return function() {
        return simpleLogin.getUser().then(function(user) {
            return user ? user : $q.reject({
                authRequired: true
            });
        });
    };
})

.factory('simpleLogin', function($firebaseAuth, fbutil, $q, $rootScope, $localStorage, createProfile, changeEmail) {
    var auth = $firebaseAuth(fbutil.ref());
    var listeners = [];

    function statusChange() {
        //fns.initialized = true;
        fns.user = auth.user || null;
        angular.forEach(listeners, function(fn) {
            fn(fns.user);
        });
    }

    var fns = {
        user: null,

        //initialized: false,

        getUser: function() {
            // check for user object it local storage
            if ($localStorage.user) {
                return $localStorage.user;
            } else {
                // if invalide or none exists authenticate with firebase
                return auth.$waitForAuth().then(function(login) {
                    $localStorage.user = login;
                    return login;
                });
            }
        },

        login: function(email, pass) {
            return auth.$authWithPassword({
                email: email,
                password: pass
            }, {
                rememberMe: true
            });
        },

        logout: function() {
            //delet user from local storage
            delete $localStorage.user;
            auth.$unauth();
        },

        createAccount: function(email, pass, name) {
            return auth.$createUser({
                    email: email,
                    password: pass
                })
                .then(function() {
                    // authenticate so we have permission to write to Firebase
                    return fns.login(email, pass);
                })
                .then(function(user) {
                    // store user data in Firebase after creating account
                    return createProfile(user.uid, email, name).then(function() {
                        return user;
                    });
                });
        },

        changePassword: function(email, oldpass, newpass) {
            return auth.$changePassword({
                email: email,
                oldPassword: oldpass,
                newPassword: newpass
            });
        },

        changeEmail: function(password, oldEmail, newEmail) {
            return changeEmail(password, oldEmail, newEmail, this);
        },

        removeUser: function(email, pass) {
            return auth.$removeUser({
                email: email,
                password: pass
            });
        },

        watch: function(cb, $scope) {
            fns.getUser().then(function(user) {
                cb(user);
            });
            listeners.push(cb);
            var unbind = function() {
                var i = listeners.indexOf(cb);
                if (i > -1) {
                    listeners.splice(i, 1);
                }
            };
            if ($scope) {
                $scope.$on('$destroy', unbind);
            }
            return unbind;
        }
    };

    auth.$onAuth(statusChange);
    statusChange();

    return fns;
})


.factory('createProfile', ['fbutil', '$q', '$timeout',
    function(fbutil, $q, $timeout) {
        return function(id, email, name) {
            var ref = fbutil.ref('users', id),
                def = $q.defer();
            ref.set({
                email: email,
                name: name || firstPartOfEmail(email)
            }, function(err) {
                $timeout(function() {
                    if (err) {
                        def.reject(err);
                    } else {
                        def.resolve(ref);
                    }
                });
            });

            function firstPartOfEmail(email) {
                return ucfirst(email.substr(0, email.indexOf('@')) || '');
            }

            function ucfirst(str) {
                // credits: http://kevin.vanzonneveld.net
                str += '';
                var f = str.charAt(0).toUpperCase();
                return f + str.substr(1);
            }

            return def.promise;
        };
    }
]);