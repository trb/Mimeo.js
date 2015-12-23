var mimeo = require('../../src/Mimeo.js');
var app = require('./app.js');

mimeo.module('example-server', [])
    .factory('User', app.User)
    .factory('Messages', app.Messages)
    .component('WelcomePage', app.WelcomePage);