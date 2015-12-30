var mimeo = require('../../src/Mimeo.js');
require('./app.mimeo.js');

var React = require('react');
var ReactDOM = require('react-dom');

function InBrowser(WelcomePage) {
    return function(element) {
        var Welcome = WelcomePage(1);
        Welcome.promise.then(function(data) {
            ReactDOM.render(<Welcome user={data.user}/>, element);
        });
    }
}

InBrowser.$inject = ['WelcomePage'];

mimeo.module('example-server')
    .component('InBrowser', InBrowser);

mimeo.bootstrap('InBrowser', $('#app').first());