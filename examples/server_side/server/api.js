var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static('html'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var users = [{
    id: 1,
    name: 'John Doe',
    age: 32,
    address: '5325 Example St, Example City, Example State'
}, {
    id: 2,
    name: 'Michelle Dahlen',
    age: 31,
    address: '5326 Parise Dr, Derrentown, Norten'
}];

var messages = {
    1: [
        {
            id: 1,
            from: {
                id: 2,
                name: 'Michelle'
            },
            content: 'Remember to call Jason about BBQ sunday'
        },
        {
            id: 2,
            from: 'Unregistered User',
            content: 'Hi John, this is your mom, I\'m so proud of you'
        }
    ],
    2: [
        {
            id: 3,
            from: 'Preston Technologies',
            content: 'Welcome Aboard! See you Monday at 7.30am'
        }
    ]
};

app.get('/users', function(request, response) {
    response.json(users);
});

app.get('/users/:userId', function(request, response) {
    response.json(users[parseInt(request.params.userId)-1]);
});

app.get('/messages/:userId', function(request, response) {
    response.json({
        to: request.params.userId,
        messages: messages[request.params.userId]
    });
});

app.post('/messages', function(request, response) {
    var to = request.body.to;
    var from = request.body.from;
    var message = request.body.message;

    var hasUser = false;
    var id;
    var maxId = 0;
    users.forEach(function(user) {
        if (user.name == to) {
            hasUser = true;
            id = user.id;
        }

        if (maxId < user.id) {
            maxId = user.id;
        }
    });

    if (!hasUser) {
        id = maxId + 1;
        users.push({
            id: id,
            name: to,
            age: Math.round(Math.random() * 10) + 18,
            address: 'No address'
        });
        messages[id] = [];
    }


    messages[id].push({
        id: Math.round(Math.random() * 100000) + 1,
        from: from,
        content: message
    });

    response.json({});
});

/*
 * Let the app handle routing by directing any non-found requests to the app
 * entry point
 */
app.use(function(request, response) {
    response.status(404).sendFile(path.resolve(__dirname + '/../html/index.html'));
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});