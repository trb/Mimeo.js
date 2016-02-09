var mimeo = require('../../../src/Mimeo.js');
var app = require('./app.js');

mimeo.module('example-server', [])
    .run(app.Routes)
    .factory('User', app.User)
    .factory('MessagesForUser', app.MessagesForUser)
    .factory('UsersWithMessagesFactory', app.UsersWithMessagesFactory)
    .component('UsersWithMessagesComponent', app.UsersWithMessagesComponent)
    .component('WelcomePageComponent', app.WelcomePageComponent)
;