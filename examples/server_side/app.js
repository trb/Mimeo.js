var mimeo = require('../../src/Mimeo.js');

function User($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/users/' + userId).then(function(user) {
                data.data = JSON.parse(user.data);
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
            promise: $http.get('/messages/' + userId).then(function(messages) {
                data.data = JSON.parse(messages.data);
            }),
            data: []
        };

        return data;
    };
}

Messages.$inject = ['$http'];

function WelcomePage($q, User, Messages) {
    return function(userId) {
        var user = User(userId);
        var messages = Messages(userId);

        return $q(function(resolve, reject) {
            $q.all([user.promise, messages.promise]).then(function() {
                resolve({
                    user: user.data,
                    messages: messages.data
                });
            }, function() {
                reject();
            });
        })
    }
}

WelcomePage.$inject = ['$q', 'User', 'Messages'];

function Setup($http) {
    $http.$host = 'localhost:3000';
    $http.$protocol = 'http';
}

Setup.$inject = ['$http'];

mimeo.module('example-server', [])
    .run(Setup)
    .factory('User', User)
    .factory('Messages', Messages)
    .component('WelcomePage', WelcomePage);

var app = mimeo.bootstrap('WelcomePage', 1);

app.then(function(data) {
    console.log(data);
});