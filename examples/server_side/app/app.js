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

function MessagesForUser($http) {
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

MessagesForUser.$inject = ['$http'];

function UsersWithMessagesFactory($q, $http) {
    return function() {
        var users = {};
        return $http.get('/users')
            .then(function(response) {
                response.data.forEach(function(user) {
                    users[user.id] = user;
                });

                return response.data.map(function(user) {
                    return user.id;
                });
            })
            .then(function(userIds) {
                return userIds.map(function(userId) {
                    return '/messages/' + userId;
                });
            })
            .then(function(messageUrls) {
                return $q.all(
                    messageUrls.map(function(url) {
                        return $http.get(url);
                    })
                );
            })
            .then(function(usersMessages) {
                usersMessages.forEach(function(messagesResponse) {
                    var messages = messagesResponse.data;
                    users[messages.to]['messages'] = messages.messages;
                });

                return users;
            });
    }
}

UsersWithMessagesFactory.$inject = ['$q', '$http'];

function UsersWithMessagesComponent() {
    return function() {
        var Message = React.createClass({
            render: function() {
                var from;
                if ((typeof this.props.message.from === 'string')
                    || (this.props.message.from instanceof String)) {
                    from = this.props.message.from;
                } else {
                    from = this.props.message.from.name;
                }
                return (
                    <dl id={this.props.message.id}>
                        <dt>{ from }</dt>
                        <dd>
                            { this.props.message.content }
                        </dd>
                    </dl>
                );
            }
        });

        var UserMessages = React.createClass({
            render: function() {
                return (
                    <li>
                        { this.props.user.name }'s messages:
                        <br />
                        {this.props.user.messages.map(function(messageData) {
                            return <Message key={messageData.id} message={messageData}/>;
                        })}
                    </li>
                );
            }
        });

        var usersMessages = React.createClass({
            render: function() {
                var userIds = Object.keys(this.props.usersWithMessages);
                var usersWithMessages = this.props.usersWithMessages;

                return (
                    <ul>
                        {userIds.map(function(userId) {
                            return <UserMessages key={userId} user={usersWithMessages[userId]}/>
                        })}
                    </ul>
                );
            }
        });

        return usersMessages;
    };
}

function WelcomePageComponent(UsersWithMessagesFactory, UsersWithMessagesComponent) {
    return function($context, $render) {
        var usersWithMessages = UsersWithMessagesFactory();
        var UserWithMessages = UsersWithMessagesComponent();

        return usersWithMessages.then(function(data) {
            $render(
                <UserWithMessages usersWithMessages={data}/>
            );
        });
    }
}

function WriteMessageComponent($q, $http) {
    var FromField = React.createClass({
        render: function() {
            return <input type="text" />;
        }
    });

    var ToField = React.createClass({
        render: function() {
            return <input type="text" />;
        }
    });

    var MessageField = React.createClass({
        render: function() {
            return <textarea></textarea>;
        }
    });

    var WriteMessageForm = React.createClass({
        render: function() {
            return (
                <form>
                    <label>From:</label>
                    <FromField/>
                    <label>To:</label>
                    <ToField/>
                    <label>Message:</label>
                    <MessageField/>
                    <button>Send message!</button>
                </form>
            );
        }
    });

    return function($context, $render) {
        $render(
            <WriteMessageForm/>
        );

        return $q.when(true);
    }
}

WriteMessageComponent.$inject = ['$q', '$http'];

WelcomePageComponent.$inject = [
    'UsersWithMessagesFactory',
    'UsersWithMessagesComponent'
];

function Routes($routing, WelcomePage, WriteMessageComponent) {
    $routing.set('/', 'app', WelcomePage);
    $routing.set('/write-message', 'app', WriteMessageComponent);
}

Routes.$inject = ['$routing', 'WelcomePageComponent', 'WriteMessageComponent'];

module.exports = {
    User: User,
    MessagesForUser: MessagesForUser,
    UsersWithMessagesFactory: UsersWithMessagesFactory,
    UsersWithMessagesComponent: UsersWithMessagesComponent,
    WelcomePageComponent: WelcomePageComponent,
    WriteMessageComponent: WriteMessageComponent,
    Routes: Routes
};