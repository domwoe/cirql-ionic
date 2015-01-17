'use strict';

angular.module('cirqlApp')
	.directive('showAlert', function () {
        return {
            restrict: 'A',
            link: function (scope, elem) {

  
               elem.bind('click', function() {

                     if (scope.mode.$value === 'manu' || scope.hasBoundResidents()) {
                        scope.showWhyAutoAwayIsDisabled();
                    }

                });

               
                
            }
        };
     });