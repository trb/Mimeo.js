var Promise = require('./Promise.js');
var Routing = require('./Routing.js');
var Http = require('./Http.js');
var GlobalsWrapper = require('./GlobalsWrapper.js');

module.exports = function(injectables) {
    GlobalsWrapper.Window.$name = '$window';
    GlobalsWrapper.Window.$inject = [];

    injectables.add(GlobalsWrapper.Window);

    GlobalsWrapper.NodeHttp.$name = '$nodeHttp';
    GlobalsWrapper.NodeHttp.$inject = [];

    injectables.add(GlobalsWrapper.NodeHttp);

    GlobalsWrapper.NodeHttps.$name = '$nodeHttps';
    GlobalsWrapper.NodeHttps.$inject = [];

    injectables.add(GlobalsWrapper.NodeHttps);

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
