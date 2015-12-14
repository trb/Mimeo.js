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
            history: {
                pushState: noOp,
                replaceState: noOp
            }
        };
    }

    return window;
}

module.exports = function(injectables) {
    Window.$name = '$window';
    Window.$inject = [];

    injectables.add(Window);

    Routing.Context.$name = '$context';
    Routing.Context.$inject = [];

    Routing.Routing.$name = '$routing';
    Routing.Routing.$inject = ['$window'];

    injectables.add(Routing.Context);
    injectables.add(Routing.Routing);

    Promise.$name = '$q';
    Promise.$inject = [];

    injectables.add(Promise);

    Http.$name = '$http';
    Http.$inject = ['$window'];
    injectables.add(Http);
};