/**
 * @module Builtins
 */

var RouteRecognizer = require('route-recognizer');
var parseUri = require('parseuri');

/**
 * # Routing for Mimeo
 *
 * This builtin handles routing by managing the browsers history and matching
 * routes with injectables (usually components.)
 *
 * The general workflow would be to inject `$routing` into a
 * {{#crossLink "Module/run:method"}}`.run()`{{/crossLink}} injectable on your
 * root module along with the injectables you want to match to the routes, and
 * {{#crossLink "$routing/set:method"}}define routes there{{/crossLink}}:
 *
 *      mimeo.module('example', [])
 *          .run([
 *              '$routing',
 *              'usersComponent',
 *              'loginComponent',
 *              ($routing) => {
 *                  $routing.set('/users', usersComponent);
 *                  $routing.set('/login', loginComponent);
 *              }
 *          );
 *
 * ## Generating output
 *
 * How output is generated is up to the matched injectable. Once an injectable
 * is matched to a route, it is invoked with three parameters:
 *
 * - context
 * - renderer
 * - targetDOMNode
 *
 * Context is an object that contains information about the matched route. See
 * {{#crossLink "$routing/set:method"}}the `set` method for more details
 * {{/crossLink}}. Renderer is a helper to produce output and can be
 * configured.
 * targetDOMNode is the DOM node that was associated with the route.
 *
 * Since the injectable has access to the DOM node, it can simply update the
 * nodes content to produce output. The `renderer` is not strictly necessary.
 * However, when using a rendering library like React, manually calling
 * ReactDOM.render(exampleComponent, targetDOMNode) is annoying and also makes
 * it impossible to switch to e.g.
 * ReactDOMServer.renderToStaticMarkup(exampleComponent) to produce output
 * in NodeJS.
 *
 * Using a renderer has the advantage of being able to change the rendering
 * method depending on the environment the app is in. Using
 * {{#crossLink
 * "$routing/setMakeRenderer:method"}}`setMakeRenderer`{{/crossLink}}
 * to define a default renderer allows the matched injectable to simply call
 * `renderer(exampleComponent)` and not deal with the specifics of generating
 * output. An example for React:
 *
 *      mimeo.module('example', [])
 *          // target is not used since the custom renderer will take care of
 *          // mounting the react node
 *          .component(['usersComponent', () => ($context, $render) => {
 *              let Users = React.createClass({}); // example component
 *
 *              return $render(<Users />);
 *          })
 *          .run(['$routing', 'usersComponent', ($routing, usersComponent) => {
 *              $routing.setMakeRenderer(function(targetDOMNode) {
 *                  return function(reactNode) {
 *                      return ReactDOM.render(reactNode, targetDOMNode);
 *                  };
 *              });
 *
 *              $routing.set('/users', usersComponent);
 *          });
 *
 * ## Initiate routing
 *
 * There are three ways to change the current route:
 *
 * - {{#crossLink "$routing/goto:method"}}goto{{/crossLink}}
 * - a-tag with a href and a 'data-internal' attribute
 * - a-tag with a href, a 'data-internal' and 'data-no-history' attribute
 *
 * `.goto()` is mainly used for server-side rendering. If you set a
 * {{#crossLink "$routing/setMakeRenderer:method"}}a renderer{{/crossLink}} that
 * supports server-side output, you won't have to change your components to
 * generate the output. `.goto()` will return a promise that is full-filled
 * with the return value from the component. You can have your server-side
 * entry-point attach to that promise and then do with the output what you
 * need (e.g. send an email, save to a static .html file, etc.)
 *
 * The other two are simply a-tags in your html. `$routing` attaches an event
 * handler to the document that listens to clicks on a-tags with a
 * 'data-internal' attribute. The value from the 'href' attribute is used as the
 * route to handle. The 'data-no-history' attribute controls whether a new
 * browser-history entry is created. If the attribute is present, no history
 * is created.
 *
 * @class $routing
 * @static
 */
function Routing($q, $window) {
    var routing = new RouteRecognizer();
    var defaultRoute;
    var anyRouteHandled = false;
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

        if (!element.attributes) {
            return null;
        }

        var value = null;
        for (var i = 0; i < element.attributes.length; ++i) {
            if (element.attributes[i].nodeName === attribute) {
                value = element.attributes[i].nodeValue;
            }
        }

        return value;
    }

    function getAncestorWithAttribute(node, attribute) {
        if (!node) {
            return null;
        }

        if (getAttribute(node, attribute) !== null) {
            return node;
        }

        return getAncestorWithAttribute(node.parentNode, attribute);
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
            if (dict[part[0]]) {
                if (!(Object.prototype.toString.call(dict[part[0]]) == '[object Array]')) {
                    dict[part[0]] = [dict[part[0]]];
                }

                dict[part[0]].push(part[1])
            } else {
                dict[part[0]] = part[1];
            }
        });

        return dict;
    }

    function doRouting(url, doDefault) {
        anyRouteHandled = true;
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

        /*
         * Other elements might be inside an a-tag which end up as event.target,
         * so we need to walk the parent nodes to find the a-tag with the 'src'
         * attribute
         */
        target = getAncestorWithAttribute(target, 'data-internal');

        if (target && getAttribute(target, 'data-internal') !== null) {
            preventDefault(event);
            if (getAttribute(target, 'data-no-history') !== null) {
                replaceRoute(getAttribute(target, 'href'));
            } else {
                gotoRoute(getAttribute(target, 'href'));
            }
        }
    };

    $window.onload = function() {
        /*
         * If a route is handled before .onload is fired (e.g. by calling
         * .goto()), then don't do routing. This prevents a double-load as the
         * route has already been handled.
         */
        if (!anyRouteHandled) {
            doRouting($window.location.href);
        }
    };

    return {
        /**
         * Set a default route to redirect to when the current route isn't
         * matched to anything
         *
         * @method setDefaultRoute
         * @for $routing
         * @param {string} newDefaultRoute The default path to route to if the
         *  current path wasn't matched by any defined route
         */
        'setDefaultRoute': function(newDefaultRoute) {
            if (!((typeof newDefaultRoute === 'string') || newDefaultRoute instanceof String)) {
                throw new Error('The default route must be given as a string, e.g. "/app"');
            }

            defaultRoute = newDefaultRoute;
        },

        /**
         * Set a custom factory for render functions
         *
         * Render factories receive the DOM target node for the route and
         * produce an executable that can be used to render content (that
         * executable is called `renderer`).
         *
         * A new renderer is created every time a route is matched by passing
         * the routes target DOM node to the makeRenderer function.
         *
         * Renderer functions are passed to the injectable that is matched with
         * the route. `setMakeRenderer` sets the factory that creates the
         * render functions.
         *
         * The default makeRenderer factory produces renderer functions that
         * simply set innerHTML on the target DOM node:
         *
         *      function(targetAsDOMNode) {
         *          return function(toRender) {
         *              targetAsDOMNode.innerHTML = toRender;
         *          };
         *      }
         *
         * The injectable for any given route can use the render method like
         * this:
         *
         *      mimeo.module('example', [])
         *          .component(['component', () => ($context, $renderer) => {
         *              $renderer('<h1>Headline content</h1>');
         *          }]);
         *
         * When using a rendering library, it's often beneficial to set a
         * custom
         * renderer factory to simplify rendering in the component. E.g. with
         * React, custom components are mounted on DOM nodes via
         *
         *      ReactDOM.render(<Component/>, DOMNode);
         *
         * A custom `setMakeRenderer` for React would create a function that
         * accepts a React component and mounts it to the routes target DOM
         * node:
         *
         *      $routing.setMakeRenderer(function(targetDOMNode) {
         *          return function(component) {
         *              ReactDOM.render(component, targetDOMNode);
         *          }
         *      });
         *
         * @method setMakeRenderer
         * @for $routing
         * @param {Function} newMakeRenderer - Set the renderer factory. Gets
         * the routes target DOM node passed in
         */
        'setMakeRenderer': function(newMakeRenderer) {
            if (!(newMakeRenderer instanceof Function)) {
                throw new Error('The makeRenderer must be a function');
            }

            makeRenderer = newMakeRenderer;
        },

        /**
         * Sets a handler for a route. There can be multiple handlers for any
         * route.
         *
         * The route matching is handled by (the route-recognizer package,
         * read the docs regarding the route syntax
         * here)[https://github.com/tildeio/route-recognizer#usage]. You can
         * capture parts of the url with `:name` and `*name`:
         *
         *      $routing.set('/users/:id')
         *      //=> matches /users/1 to { id: 1 }
         *
         *      $routing.set('/about/*path')
         *      //=> matches /about/location/city to { path: 'location/city' }
         *
         * Captured segments of the url will be available in `$context.params`.
         *
         * Setting a route matches an injectable with a url:
         *
         *      $routing.set('/example-url', exampleInjectable);
         *
         * The injectable that will receive three parameters:
         *
         * - $context - information about the current route and access to url
         * parameters
         * - $renderer - the renderer $routing is configured to use. Default
         * just set the html content of the target DOM node
         * - $target - DOM node that the content should end up in. Useful if
         * you don't want to use $renderer for a specific route
         *
         * Set routes in a `.run()` block on your root module:
         *
         *      mimeo.bootstrap('example', [])
         *          .component(['users', () => ($context, $renderer) => {
         *              $renderer('<ul><li>John</li><li>Alice</li</ul>');
         *          }])
         *          .component(['loginForm', () => ($context, $renderer) => {
         *              $renderer('<form></form>');
         *          }])
         *          .run([
         *              '$routing',
         *              'users',
         *              'loginForm',
         *              ($routing, users, loginForm) => {
         *                  $routing.set('/users', users);
         *                  $routing.set('/login', loginForm);
         *              }
         *          ]);
         *
         * The `.run()` block needs to have all component-injectables you want
         * to set as route handlers injected. `.set()` requires the actual
         * injectables to be passed in, not the injectables name.
         *
         * $context contains information about the current route, it has three
         * attributes:
         *
         * - `$context.params` will contain any matched segments from the url.
         * - `$context.query` will contain decoded query parameters as a
         * key-value hash. Repeating keys will create an array:
         * `/example?a=1&b=2&c=3 //=> { a: [1, 2, 3] }`
         * - `$context.url` represents the parsed url as a key-value store.
         *
         * `$context.url` example for
         * `http://localhost:3000/?example-key=value`:
         *
         *      $context.url = {
         *          anchor: '',
         *          authority: 'localhost:3000',
         *          directory: '/',
         *          file: '',
         *          host: 'localhost',
         *          password: '',
         *          path: '/',
         *          port: '3000',
         *          protocol: 'http',
         *          query: 'example-key=value',
         *          relative: '/?example-key=value',
         *          source: 'http://localhost:3000/?example-key=value',
         *          user: '',
         *          userInfo: ''
         *      }
         *
         * @method set
         * @for $routing
         * @param {string} route
         * @param {string} target
         * @param {Function} injectable
         * @param {string} [name]
         */
        'set': function(route, target, injectable, name) {
            if (!(injectable instanceof Function)) {
                var message = 'To set a route, you have to provide an injectable that is executable (i.e. instanceof Function). Route: ' + route + ', stringified injectable: "' + String(
                        injectable + '"');
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
                        var targetAsDOMNode = $window.document.getElementById(
                            target);
                        var renderer = makeRenderer(targetAsDOMNode);

                        if (injectable.render) {
                            renderReturn = injectable.render($context,
                                renderer,
                                targetAsDOMNode);
                        } else {
                            renderReturn = injectable($context,
                                renderer,
                                targetAsDOMNode);
                        }

                        return $q.when(renderReturn);
                    }
                }
            ], {'as': name});
        },

        /**
         * Matches `route` and executes all associated injectables
         *
         * The return values from the matched injectables are turned into a
         * promise using {{#crossLink
         * "$q/when:method"}}$q.when(){{/crossLink}},
         * and then aggregated with {{#crossLink
         * "$q/all:method"}}$q.all(){{/crossLink}} and then returned by
         * `goto()`. This allows handling asynchronous requests on the server.
         *
         * @example
         *      mimeo.module('example', []).
         *          .component('Blog', ['$http', ($http) => () => {
         *              return $http.get('/example-api/blogs')
         *                  .then((response) => {
         *                      return response.data;
         *                  })
         *                  .then((blogPosts) => {
         *                      return //turn blog posts into html
         *                  });
         *          })
         *          .run(['$routing', 'Blog', ($routing, Blog) => {
         *              $routing.set('/blogs', Blog);
         *          }])
         *          .run(['$routing', ($routing) => {
         *              $routing.goto('/blogs').then((blogHtml) => {
         *                  // save to cdn
         *              });
         *          });
         *
         * @method goto
         * @for $routing
         * @param {string} route Route to go to
         * @returns {Promise} Promise that is resolved with the return values
         *  from all matched routes
         */
        'goto': function(route) {
            return gotoRoute(route);
        }
    }
}

module.exports = {
    'Routing': Routing
};