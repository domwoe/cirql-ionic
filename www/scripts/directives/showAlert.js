'use strict';

angular.module('cirqlApp')
	.directive('showAlert', function () {
        return {
            restrict: 'A',
            link: function (scope, elem) {

  
               elem.bind('click', function() {

                     if (scope.hasBoundResidents()) {
                        scope.showWhyAutoAwayIsDisabled();
                    }

                });

               
                
            }
        };
     });