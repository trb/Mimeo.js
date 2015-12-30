var mimeo = require('../../src/Mimeo.js');
require('./app.mimeo.js');

var React = require('react');
var ReactDOMServer = require('react-dom/server');

function Setup($http) {
    $http.$host = 'localhost:3000';
    $http.$protocol = 'http';
}

Setup.$inject = ['$http'];

function CLI(WelcomePage) {
    return function(userId) {
        var Welcome = WelcomePage(userId);
        Welcome.promise.then(function(data) {
            process.stdout.write(
                ReactDOMServer.renderToStaticMarkup(
                    <Welcome user={data.user}/>)
            );
            process.stdout.write('\n');
        });

        return Welcome.promise;
    }
}

CLI.$inject = ['WelcomePage'];

mimeo.module('example-server')
    .run(Setup)
    .component('CLI', CLI);

mimeo.bootstrap('CLI', 1)
    .then(function() {
    });