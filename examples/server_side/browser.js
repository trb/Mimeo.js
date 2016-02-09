var mimeo = require('../../src/Mimeo.js');

require('./app/app.bindings.js');

var React = require('react');
var ReactDOM = require('react-dom');

function EntryPoint($routing) {
    return function() {
        $routing.default('/');
        $routing.setMakeRenderer(function(targetDOMNode) {
            return function(reactNode) {
                ReactDOM.render(reactNode, targetDOMNode);
            }
        });
    }
}

EntryPoint.$inject = ['$routing'];

mimeo.module('example-server')
    .factory('EntryPoint', EntryPoint);

mimeo.bootstrap('EntryPoint');