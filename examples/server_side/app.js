function User($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/users/' + userId).then(function(user) {
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

module.exports = {
    User: User,
    Messages: Messages,
    WelcomePage: WelcomePage
};