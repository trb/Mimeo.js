var mimeo = require('../../src/Mimeo.js');
require('./app.mimeo.js');

var React = require('react');
var ReactDOM = require('react-dom');

function InBrowser(WelcomePage) {
    return function($context, $element) {
        var Welcome = WelcomePage($context.params.userId);
        Welcome.promise.then(function(data) {
            ReactDOM.render(<Welcome user={data.user}/>, $element);
        });
    }
}

InBrowser.$inject = ['WelcomePage'];

function EntryPoint($routing, InBrowser) {
    return function() {
        $routing.default('/users/1');
        $routing.set('/users/:userId', 'app', InBrowser);
    }
}

EntryPoint.$inject = ['$routing', 'InBrowser'];

mimeo.module('example-server')
    .factory('EntryPoint', EntryPoint)
    .component('InBrowser', InBrowser);

mimeo.bootstrap('EntryPoint');