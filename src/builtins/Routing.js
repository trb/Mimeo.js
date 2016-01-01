var RouteRecognizer = require('route-recognizer');
var parseUri = require('parseuri');

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
               var $context = {
                    url: urlParts,
                    params: handlers[i].params,
                    query: queryToDict(urlParts.query)
                };

                handlers[i].handler($context);
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
            if (!(injectable instanceof Function)) {
                var message = 'To set a route, you have to provide an injectable that is executable (i.e. instanceof Function). Route: ' + route + ', stringified injectable: "' + String(injectable + '"');
                if ((target instanceof Function) && ((injectable instanceof String) || (typeof injectable === 'string'))) {
                    message += '. Target is a function and injectable is a string. You might have switched the parameters, please double-check that';
                }
                throw new Error(message);
            }

            routing.add([
                {
                    path: route,
                    handler: function($context) {
                        var html;
                        var targetAsDOMNode = $window.document.getElementById(target);

                        if (injectable.render) {
                            html = injectable.render($context, targetAsDOMNode);
                        } else {
                            html = injectable($context, targetAsDOMNode);
                        }

                        if (typeof html === 'string' || (html instanceof String)) {
                            targetAsDOMNode.innerHTML = html;
                        }
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
    'Routing': Routing
};