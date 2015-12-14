var mimeo = require('../../src/Mimeo.js');

function User($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/users/' + userId, function(user) {
                data.data = user;
            }),
            data: {}
        };

        return data;
    };
}

User.$inject = ['$http'];

function Messages($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/messages/' + userId, function(messages) {
                data.messages = messages;
            }),
            messages: []
        };

        return data;
    };
}

Messages.$inject = ['$http'];

function WelcomePage(User, Messages) {
    return function(userId) {
        var user = User(userId);
        var messages = Messages(userId);

        return JSON.stringify({
            user: user,
            messages: messages
        });
    }
}

WelcomePage.$inject = ['User', 'Messages'];

function Setup($http) {
    $http.$host = 'localhost:3000';
}

Setup.$inject = ['$http'];

mimeo.module('example-server', [])
    .run(Setup)
    .factory('User', User)
    .factory('Messages', Messages)
    .component('WelcomePage', WelcomePage);

var app = mimeo.bootstrap('app', 'node');

app.promise.then(function() {
    console.log(app.searchResults);
});