var path = require('path');
var express = require('express');
var app = express();

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

app.get('/users', function(request, response) {
    response.json(users);
});

app.get('/users/:userId', function(request, response) {
    response.json(users[parseInt(request.params.userId)-1]);
});

app.get('/messages/:userId', function(request, response) {
    var messages = {
        1: [
            {
                from: {
                    id: 2,
                    name: 'Michelle'
                },
                content: 'Remember to call Jason about BBQ sunday'
            },
            {
                from: 'Unregistered User',
                content: 'Hi John, this is your mom, I\'m so proud of you'
            }
        ],
        2: [
            {
                from: 'Preston Technologies',
                content: 'Welcome Aboard! See you Monday at 7.30am'
            }
        ]
    };

    response.json(messages[request.params.userId]);
});

app.use(express.static('html'));

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