var React = require('react');

function User($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/users/' + String(userId)).then(function(user) {
                data.data = user.data;
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
                data.data = messages.data;
            }),
            data: []
        };

        return data;
    };
}

Messages.$inject = ['$http'];

function WelcomePage($q, User, Messages) {
    var Welcome = React.createClass({
        render: function() {
            return <h1>Hi {this.props.user.name }</h1>;
        }
    });

    return function(userId) {
        var user = User(userId);
        var messages = Messages(userId);

        Welcome.promise = $q(function(resolve, reject) {
            $q.all([user.promise, messages.promise]).then(function() {
                resolve({
                    user: user.data,
                    messages: messages.data
                });
            }, function() {
                reject();
            });
        });

        return Welcome;
    }
}

WelcomePage.$inject = ['$q', 'User', 'Messages'];

module.exports = {
    User: User,
    Messages: Messages,
    WelcomePage: WelcomePage
};