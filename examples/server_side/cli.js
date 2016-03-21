var mimeo = require('../../src/Mimeo.js');

require('./app/app.bindings.js');

var React = require('react');
var ReactDOMServer = require('react-dom/server');

function Setup($http, $routing) {
    $http.$host = 'localhost:3000';
    $http.$protocol = 'http';

    $routing.setMakeRenderer(function() {
        return function(reactNode) {
            return ReactDOMServer.renderToStaticMarkup(reactNode);
        }
    });
}

Setup.$inject = ['$http', '$routing'];

function EntryPoint($routing) {
    return function() {
        return function(route) {
            $routing
                .goto(route)
                .then(function(html) {
                    /*
                     * Since there can be more than one handler for any given
                     * route, the return promises are handled using $q.all.
                     *
                     * $q.all passes the return values from all promises through
                     * to this .then handler as an array. Since we only have
                     * one handler for any given route, we can just use the
                     * first entry in this array.
                     */
                    process.stdout.write(html[0]);
                    process.stdout.write('\n');
                });
        }
    };
}

EntryPoint.$inject = ['$routing'];

mimeo.module('example-server')
    .run(Setup)
    .factory('EntryPoint', EntryPoint);

mimeo.bootstrap('EntryPoint')(process.argv[2] || '/');