var RouteRecognizer = require('route-recognizer');
var parseUri = require('parseuri');

function Routing($q, $window) {
    var routing = new RouteRecognizer();
    var defaultRoute;
    var makeRenderer = function(targetAsDOMNode) {
        return function(toRender) {
            targetAsDOMNode.innerHTML = toRender;
        };
    };

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
        $window.history.pushState(null, '', route);
        return doRouting(route, false);
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
        var promises = [];
        if (handlers) {
            for (var i = 0; i < handlers.length; ++i) {
                var $context = {
                    url: urlParts,
                    params: handlers[i].params,
                    query: queryToDict(urlParts.query)
                };

                promises.push(handlers[i].handler($context));
            }
        } else if ((doDefault !== false) && defaultRoute) {
            promises.push(doDefaultRoute(defaultRoute));
        }

        return $q.all(promises);
    }

    function gotoRoute(route) {
        $window.history.pushState(null,
            '',
            route);
        return doRouting(route);
    }

    function replaceRoute(route) {
        $window.history.replaceState(null,
            '',
            route);

        return doRouting(route);
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
        'setDefaultRoute': function(newDefaultRoute) {
            if (!((typeof newDefaultRoute === 'string') || newDefaultRoute instanceof String)) {
                throw new Error('The default route must be given as a string, e.g. "/app"');
            }

            defaultRoute = newDefaultRoute;
        },
        'setMakeRenderer': function(newMakeRenderer) {
            if (!(newMakeRenderer instanceof Function)) {
                throw new Error('The makeRenderer must be a function');
            }

            makeRenderer = newMakeRenderer;
        },
        /*
         * Sets a handler for a route. There can be multiple handlers for any
         * route.
         *
         * A handler is an injectable that will receive three parameters:
         *
         * $context - information about the current route and access to url parameters
         * $renderer - the renderer $routing is configured to use. Default just
         *      set the html content of the target DOM node
         * $target - DOM node that the content should end up in. Useful if you
         *      don't want to use $renderer for a specific route
         */
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
                        var renderReturn;
                        var targetAsDOMNode = $window.document.getElementById(target);
                        var renderer = makeRenderer(targetAsDOMNode);

                        if (injectable.render) {
                            renderReturn = injectable.render($context,
                                renderer,
                                targetAsDOMNode);
                        } else {
                            renderReturn = injectable($context, renderer, targetAsDOMNode);
                        }

                        return $q.when(renderReturn);
                    }
                }
            ], {'as': name});
        },
        'goto': function(route) {
            return gotoRoute(route);
        }
    }
}

module.exports = {
    'Routing': Routing
};