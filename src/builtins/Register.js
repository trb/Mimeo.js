var Promise = require('./Promise.js');
var Routing = require('./Routing.js');
var Http = require('./Http.js');

function Window() {
    if (typeof window === 'undefined') {
        var noOp = function() {
        };
        return {
            $fake: true,
            onpopstate: noOp,
            onclick: noOp,
            onload: noOp,
            document: {
                getElementById: noOp
            },
            history: {
                pushState: noOp,
                replaceState: noOp
            }
        };
    }

    return window;
}

function NodeHttp() {
    if (typeof window === 'undefined') {
        return require('http');
    } else {
        return {};
    }
}

function NodeHttps() {
    if (typeof window === 'undefined') {
        return require('https');
    } else {
        return {};
    }
}

module.exports = function(injectables) {
    Window.$name = '$window';
    Window.$inject = [];

    injectables.add(Window);

    NodeHttp.$name = '$nodeHttp';
    NodeHttp.$inject = [];

    injectables.add(NodeHttp);

    NodeHttps.$name = '$nodeHttps';
    NodeHttps.$inject = [];

    injectables.add(NodeHttps);

    Routing.Routing.$name = '$routing';
    Routing.Routing.$inject = ['$q', '$window'];

    injectables.add(Routing.Routing);

    Promise.$name = '$q';
    Promise.$inject = [];

    injectables.add(Promise);

    Http.$name = '$http';
    Http.$inject = ['$window', '$q', '$nodeHttp', '$nodeHttps'];
    injectables.add(Http);
};
