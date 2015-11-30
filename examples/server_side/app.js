var mimeo = require('../../src/Mimeo.js');

mimeo.module('server-side-test', [])
    .factory('wikipedia', [
        '$http', function($http) {
            return function wikipedia(search) {
                return $http.get('/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(search) + '&format=json');
            }
        }
    ])
    .component('app', ['$http', 'wikipedia', function($http, wikipedia) {
        return function(environment) {
            if (environment === 'node') {
                $http.$protocol = 'https';
                $http.$host = 'en.wikipedia.org';
            }

            var returnData = {
                promise: null,
                searchResults: {}
            };

            returnData.promise = wikipedia('Russia').then(function(response) {
                returnData.searchResults = response.data;
            });

            return returnData;
        }
    }]);

var app = mimeo.bootstrap('app', 'node');

app.promise.then(function() {
    console.log(app.searchResults);
});