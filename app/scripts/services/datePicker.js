angular.module('cirqlApp').factory('datePicker', ['$window', '$q', function ($window, $q) {

    return {
      show: function (options) {
        options = options || {date: new Date(), mode: 'date'};

        var d = $q.defer();

        $window.datePicker.show(options, function (date) {
          d.resolve(date);
        });

        return d.promise;
      }
    };
  }]);