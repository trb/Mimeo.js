var RouteRecognizer = require('route-recognizer');
var parseUri = require('parseuri');

var context = {};
function Context() {
    return function() {
        return context;
    }
}

function Routing($window) {
    var routing = new RouteRecognizer();
    var defaultRoute;

    function preventDefault(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            /*
             * Internet explorer support
             */
            event.returnValue = false;
        }
    }

    function getAttribute(element, attribute) {
        if (element[attribute]) {
            return element[attribute];
        }

        if (element.getAttribute) {
            return element.getAttribute(attribute);
        }

        var value = null;
        for (var i = 0; i < element.attributes.length; ++i) {
            if (element.attributes[i].nodeName === attribute) {
                value = element.attributes[i].nodeValue;
            }
        }

        return value;
    }

    function doDefaultRoute(route) {
        if (route) {
            $window.history.pushState(null, '', route);
            doRouting(route, false);
        }
    }

    function queryToDict(query) {
        var dict = {};
        query.split('&').map(function(part) {
            return part.split('=').map(decodeURIComponent);
        }).forEach(function(part) {
            dict[part[0]] = part[1];
        });

        return dict;
    }

    function doRouting(url, doDefault) {
        var urlParts = parseUri(url);
        var handlers = routing.recognize(urlParts.path);
        if (handlers) {
            for (var i=0; i<handlers.length; ++i) {
                context = {
                    url: urlParts,
                    params: handlers.params,
                    query: queryToDict(urlParts.query)
                };

                handlers[i].handler();
            }
        } else if (doDefault !== false) {
            doDefaultRoute(defaultRoute);
        }
    }

    function gotoRoute(route) {
        $window.history.pushState(null,
            '',
            route);
        doRouting(route);
    }

    function replaceRoute(route) {
        $window.history.replaceState(null,
            '',
            route);

        doRouting(route);
    }

    $window.onpopstate = function() {
        doRouting($window.location.href);
    };

    $window.onclick = function(event) {
        var target = event.target || event.srcElement;

        /*
         * Related to Safari firing events on text nodes
         */
        if (target.nodeType === 3) {
            target = target.parentNode;
        }

        if (getAttribute(target, 'data-internal') !== null) {
            preventDefault(event);

            if (getAttribute(target, 'data-no-history') !== null) {
                replaceRoute(getAttribute(target, 'href'));
            } else {
                gotoRoute(getAttribute(target, 'href'));
            }
        }
    };

    $window.onload = function() {
        doRouting($window.location.href);
    };

    return {
        'default': function(newDefaultRoute) {
            defaultRoute = newDefaultRoute;
        },
        'set': function(route, target, injectable, name) {
            routing.add([
                {
                    path: route,
                    handler: function() {
                        var html;

                        if (injectable.render) {
                            html = injectable.render();
                        } else {
                            html = injectable();
                        }

                        $window.document.getElementById(target).innerHTML = html;
                    }
                }
            ], {'as': name});
        },
        'goto': function(route) {
            gotoRoute(route);
        }
    }
}

module.exports = {
    'Context': Context,
    'Routing': Routing
};