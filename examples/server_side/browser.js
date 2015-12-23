var mimeo = require('../../src/Mimeo.js');
require('./app.mimeo.js');

function InBrowser(WelcomePage) {
    return function(element) {
        WelcomePage(1).then(function(data) {
            console.log('data', data);
        });
    }
}

InBrowser.$inject = ['WelcomePage'];

mimeo.module('example-server')
    .component('InBrowser', InBrowser);

mimeo.bootstrap('InBrowser', $('#app'));