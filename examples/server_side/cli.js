var mimeo = require('../../src/Mimeo.js');
require('./app.mimeo.js');

function Setup($http) {
    $http.$host = 'localhost:3000';
    $http.$protocol = 'http';
}

Setup.$inject = ['$http'];

mimeo.module('example-server')
    .run(Setup)

var app = mimeo.bootstrap('WelcomePage', 1);

app.then(function(data) {
    console.log(data);
});