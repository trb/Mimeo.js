(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function User($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/users/' + userId).then(function(user) {
                data.data = user.data;
            }),
            data: {}
        };

        return data;
    };
}

User.$inject = ['$http'];

function Messages($http) {
    return function(userId) {
        var data = {
            promise: $http.get('/messages/' + userId).then(function(messages) {
                data.data = messages.data;
            }),
            data: []
        };

        return data;
    };
}

Messages.$inject = ['$http'];

function WelcomePage($q, User, Messages) {
    return function(userId) {
        var user = User(userId);
        var messages = Messages(userId);

        return $q(function(resolve, reject) {
            $q.all([user.promise, messages.promise]).then(function() {
                resolve({
                    user: user.data,
                    messages: messages.data
                });
            }, function() {
                reject();
            });
        })
    }
}

WelcomePage.$inject = ['$q', 'User', 'Messages'];

module.exports = {
    User: User,
    Messages: Messages,
    WelcomePage: WelcomePage
};
},{}],2:[function(require,module,exports){
var mimeo = require('../../src/Mimeo.js');
var app = require('./app.js');

mimeo.module('example-server', [])
    .factory('User', app.User)
    .factory('Messages', app.Messages)
    .component('WelcomePage', app.WelcomePage);
},{"../../src/Mimeo.js":6,"./app.js":1}],3:[function(require,module,exports){
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
},{"../../src/Mimeo.js":6,"./app.mimeo.js":2}],4:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],5:[function(require,module,exports){
(function() {
    "use strict";
    function $$route$recognizer$dsl$$Target(path, matcher, delegate) {
      this.path = path;
      this.matcher = matcher;
      this.delegate = delegate;
    }

    $$route$recognizer$dsl$$Target.prototype = {
      to: function(target, callback) {
        var delegate = this.delegate;

        if (delegate && delegate.willAddRoute) {
          target = delegate.willAddRoute(this.matcher.target, target);
        }

        this.matcher.add(this.path, target);

        if (callback) {
          if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
          this.matcher.addChild(this.path, target, callback, this.delegate);
        }
        return this;
      }
    };

    function $$route$recognizer$dsl$$Matcher(target) {
      this.routes = {};
      this.children = {};
      this.target = target;
    }

    $$route$recognizer$dsl$$Matcher.prototype = {
      add: function(path, handler) {
        this.routes[path] = handler;
      },

      addChild: function(path, target, callback, delegate) {
        var matcher = new $$route$recognizer$dsl$$Matcher(target);
        this.children[path] = matcher;

        var match = $$route$recognizer$dsl$$generateMatch(path, matcher, delegate);

        if (delegate && delegate.contextEntered) {
          delegate.contextEntered(target, match);
        }

        callback(match);
      }
    };

    function $$route$recognizer$dsl$$generateMatch(startingPath, matcher, delegate) {
      return function(path, nestedCallback) {
        var fullPath = startingPath + path;

        if (nestedCallback) {
          nestedCallback($$route$recognizer$dsl$$generateMatch(fullPath, matcher, delegate));
        } else {
          return new $$route$recognizer$dsl$$Target(startingPath + path, matcher, delegate);
        }
      };
    }

    function $$route$recognizer$dsl$$addRoute(routeArray, path, handler) {
      var len = 0;
      for (var i=0, l=routeArray.length; i<l; i++) {
        len += routeArray[i].path.length;
      }

      path = path.substr(len);
      var route = { path: path, handler: handler };
      routeArray.push(route);
    }

    function $$route$recognizer$dsl$$eachRoute(baseRoute, matcher, callback, binding) {
      var routes = matcher.routes;

      for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
          var routeArray = baseRoute.slice();
          $$route$recognizer$dsl$$addRoute(routeArray, path, routes[path]);

          if (matcher.children[path]) {
            $$route$recognizer$dsl$$eachRoute(routeArray, matcher.children[path], callback, binding);
          } else {
            callback.call(binding, routeArray);
          }
        }
      }
    }

    var $$route$recognizer$dsl$$default = function(callback, addRouteCallback) {
      var matcher = new $$route$recognizer$dsl$$Matcher();

      callback($$route$recognizer$dsl$$generateMatch("", matcher, this.delegate));

      $$route$recognizer$dsl$$eachRoute([], matcher, function(route) {
        if (addRouteCallback) { addRouteCallback(this, route); }
        else { this.add(route); }
      }, this);
    };

    var $$route$recognizer$$specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];

    var $$route$recognizer$$escapeRegex = new RegExp('(\\' + $$route$recognizer$$specials.join('|\\') + ')', 'g');

    function $$route$recognizer$$isArray(test) {
      return Object.prototype.toString.call(test) === "[object Array]";
    }

    // A Segment represents a segment in the original route description.
    // Each Segment type provides an `eachChar` and `regex` method.
    //
    // The `eachChar` method invokes the callback with one or more character
    // specifications. A character specification consumes one or more input
    // characters.
    //
    // The `regex` method returns a regex fragment for the segment. If the
    // segment is a dynamic of star segment, the regex fragment also includes
    // a capture.
    //
    // A character specification contains:
    //
    // * `validChars`: a String with a list of all valid characters, or
    // * `invalidChars`: a String with a list of all invalid characters
    // * `repeat`: true if the character specification can repeat

    function $$route$recognizer$$StaticSegment(string) { this.string = string; }
    $$route$recognizer$$StaticSegment.prototype = {
      eachChar: function(callback) {
        var string = this.string, ch;

        for (var i=0, l=string.length; i<l; i++) {
          ch = string.charAt(i);
          callback({ validChars: ch });
        }
      },

      regex: function() {
        return this.string.replace($$route$recognizer$$escapeRegex, '\\$1');
      },

      generate: function() {
        return this.string;
      }
    };

    function $$route$recognizer$$DynamicSegment(name) { this.name = name; }
    $$route$recognizer$$DynamicSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "/", repeat: true });
      },

      regex: function() {
        return "([^/]+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function $$route$recognizer$$StarSegment(name) { this.name = name; }
    $$route$recognizer$$StarSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "", repeat: true });
      },

      regex: function() {
        return "(.+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function $$route$recognizer$$EpsilonSegment() {}
    $$route$recognizer$$EpsilonSegment.prototype = {
      eachChar: function() {},
      regex: function() { return ""; },
      generate: function() { return ""; }
    };

    function $$route$recognizer$$parse(route, names, specificity) {
      // normalize route as not starting with a "/". Recognition will
      // also normalize.
      if (route.charAt(0) === "/") { route = route.substr(1); }

      var segments = route.split("/"), results = [];

      // A routes has specificity determined by the order that its different segments
      // appear in. This system mirrors how the magnitude of numbers written as strings
      // works.
      // Consider a number written as: "abc". An example would be "200". Any other number written
      // "xyz" will be smaller than "abc" so long as `a > z`. For instance, "199" is smaller
      // then "200", even though "y" and "z" (which are both 9) are larger than "0" (the value
      // of (`b` and `c`). This is because the leading symbol, "2", is larger than the other
      // leading symbol, "1".
      // The rule is that symbols to the left carry more weight than symbols to the right
      // when a number is written out as a string. In the above strings, the leading digit
      // represents how many 100's are in the number, and it carries more weight than the middle
      // number which represents how many 10's are in the number.
      // This system of number magnitude works well for route specificity, too. A route written as
      // `a/b/c` will be more specific than `x/y/z` as long as `a` is more specific than
      // `x`, irrespective of the other parts.
      // Because of this similarity, we assign each type of segment a number value written as a
      // string. We can find the specificity of compound routes by concatenating these strings
      // together, from left to right. After we have looped through all of the segments,
      // we convert the string to a number.
      specificity.val = '';

      for (var i=0, l=segments.length; i<l; i++) {
        var segment = segments[i], match;

        if (match = segment.match(/^:([^\/]+)$/)) {
          results.push(new $$route$recognizer$$DynamicSegment(match[1]));
          names.push(match[1]);
          specificity.val += '3';
        } else if (match = segment.match(/^\*([^\/]+)$/)) {
          results.push(new $$route$recognizer$$StarSegment(match[1]));
          specificity.val += '2';
          names.push(match[1]);
        } else if(segment === "") {
          results.push(new $$route$recognizer$$EpsilonSegment());
          specificity.val += '1';
        } else {
          results.push(new $$route$recognizer$$StaticSegment(segment));
          specificity.val += '4';
        }
      }

      specificity.val = +specificity.val;

      return results;
    }

    // A State has a character specification and (`charSpec`) and a list of possible
    // subsequent states (`nextStates`).
    //
    // If a State is an accepting state, it will also have several additional
    // properties:
    //
    // * `regex`: A regular expression that is used to extract parameters from paths
    //   that reached this accepting state.
    // * `handlers`: Information on how to convert the list of captures into calls
    //   to registered handlers with the specified parameters
    // * `types`: How many static, dynamic or star segments in this route. Used to
    //   decide which route to use if multiple registered routes match a path.
    //
    // Currently, State is implemented naively by looping over `nextStates` and
    // comparing a character specification against a character. A more efficient
    // implementation would use a hash of keys pointing at one or more next states.

    function $$route$recognizer$$State(charSpec) {
      this.charSpec = charSpec;
      this.nextStates = [];
    }

    $$route$recognizer$$State.prototype = {
      get: function(charSpec) {
        var nextStates = this.nextStates;

        for (var i=0, l=nextStates.length; i<l; i++) {
          var child = nextStates[i];

          var isEqual = child.charSpec.validChars === charSpec.validChars;
          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

          if (isEqual) { return child; }
        }
      },

      put: function(charSpec) {
        var state;

        // If the character specification already exists in a child of the current
        // state, just return that state.
        if (state = this.get(charSpec)) { return state; }

        // Make a new state for the character spec
        state = new $$route$recognizer$$State(charSpec);

        // Insert the new state as a child of the current state
        this.nextStates.push(state);

        // If this character specification repeats, insert the new state as a child
        // of itself. Note that this will not trigger an infinite loop because each
        // transition during recognition consumes a character.
        if (charSpec.repeat) {
          state.nextStates.push(state);
        }

        // Return the new state
        return state;
      },

      // Find a list of child states matching the next character
      match: function(ch) {
        // DEBUG "Processing `" + ch + "`:"
        var nextStates = this.nextStates,
            child, charSpec, chars;

        // DEBUG "  " + debugState(this)
        var returned = [];

        for (var i=0, l=nextStates.length; i<l; i++) {
          child = nextStates[i];

          charSpec = child.charSpec;

          if (typeof (chars = charSpec.validChars) !== 'undefined') {
            if (chars.indexOf(ch) !== -1) { returned.push(child); }
          } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
            if (chars.indexOf(ch) === -1) { returned.push(child); }
          }
        }

        return returned;
      }

      /** IF DEBUG
      , debug: function() {
        var charSpec = this.charSpec,
            debug = "[",
            chars = charSpec.validChars || charSpec.invalidChars;

        if (charSpec.invalidChars) { debug += "^"; }
        debug += chars;
        debug += "]";

        if (charSpec.repeat) { debug += "+"; }

        return debug;
      }
      END IF **/
    };

    /** IF DEBUG
    function debug(log) {
      console.log(log);
    }

    function debugState(state) {
      return state.nextStates.map(function(n) {
        if (n.nextStates.length === 0) { return "( " + n.debug() + " [accepting] )"; }
        return "( " + n.debug() + " <then> " + n.nextStates.map(function(s) { return s.debug() }).join(" or ") + " )";
      }).join(", ")
    }
    END IF **/

    // Sort the routes by specificity
    function $$route$recognizer$$sortSolutions(states) {
      return states.sort(function(a, b) {
        return b.specificity.val - a.specificity.val;
      });
    }

    function $$route$recognizer$$recognizeChar(states, ch) {
      var nextStates = [];

      for (var i=0, l=states.length; i<l; i++) {
        var state = states[i];

        nextStates = nextStates.concat(state.match(ch));
      }

      return nextStates;
    }

    var $$route$recognizer$$oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };

    function $$route$recognizer$$RecognizeResults(queryParams) {
      this.queryParams = queryParams || {};
    }
    $$route$recognizer$$RecognizeResults.prototype = $$route$recognizer$$oCreate({
      splice: Array.prototype.splice,
      slice:  Array.prototype.slice,
      push:   Array.prototype.push,
      length: 0,
      queryParams: null
    });

    function $$route$recognizer$$findHandler(state, path, queryParams) {
      var handlers = state.handlers, regex = state.regex;
      var captures = path.match(regex), currentCapture = 1;
      var result = new $$route$recognizer$$RecognizeResults(queryParams);

      for (var i=0, l=handlers.length; i<l; i++) {
        var handler = handlers[i], names = handler.names, params = {};

        for (var j=0, m=names.length; j<m; j++) {
          params[names[j]] = captures[currentCapture++];
        }

        result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
      }

      return result;
    }

    function $$route$recognizer$$addSegment(currentState, segment) {
      segment.eachChar(function(ch) {
        var state;

        currentState = currentState.put(ch);
      });

      return currentState;
    }

    function $$route$recognizer$$decodeQueryParamPart(part) {
      // http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
      part = part.replace(/\+/gm, '%20');
      return decodeURIComponent(part);
    }

    // The main interface

    var $$route$recognizer$$RouteRecognizer = function() {
      this.rootState = new $$route$recognizer$$State();
      this.names = {};
    };


    $$route$recognizer$$RouteRecognizer.prototype = {
      add: function(routes, options) {
        var currentState = this.rootState, regex = "^",
            specificity = {},
            handlers = [], allSegments = [], name;

        var isEmpty = true;

        for (var i=0, l=routes.length; i<l; i++) {
          var route = routes[i], names = [];

          var segments = $$route$recognizer$$parse(route.path, names, specificity);

          allSegments = allSegments.concat(segments);

          for (var j=0, m=segments.length; j<m; j++) {
            var segment = segments[j];

            if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

            isEmpty = false;

            // Add a "/" for the new segment
            currentState = currentState.put({ validChars: "/" });
            regex += "/";

            // Add a representation of the segment to the NFA and regex
            currentState = $$route$recognizer$$addSegment(currentState, segment);
            regex += segment.regex();
          }

          var handler = { handler: route.handler, names: names };
          handlers.push(handler);
        }

        if (isEmpty) {
          currentState = currentState.put({ validChars: "/" });
          regex += "/";
        }

        currentState.handlers = handlers;
        currentState.regex = new RegExp(regex + "$");
        currentState.specificity = specificity;

        if (name = options && options.as) {
          this.names[name] = {
            segments: allSegments,
            handlers: handlers
          };
        }
      },

      handlersFor: function(name) {
        var route = this.names[name], result = [];
        if (!route) { throw new Error("There is no route named " + name); }

        for (var i=0, l=route.handlers.length; i<l; i++) {
          result.push(route.handlers[i]);
        }

        return result;
      },

      hasRoute: function(name) {
        return !!this.names[name];
      },

      generate: function(name, params) {
        var route = this.names[name], output = "";
        if (!route) { throw new Error("There is no route named " + name); }

        var segments = route.segments;

        for (var i=0, l=segments.length; i<l; i++) {
          var segment = segments[i];

          if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

          output += "/";
          output += segment.generate(params);
        }

        if (output.charAt(0) !== '/') { output = '/' + output; }

        if (params && params.queryParams) {
          output += this.generateQueryString(params.queryParams, route.handlers);
        }

        return output;
      },

      generateQueryString: function(params, handlers) {
        var pairs = [];
        var keys = [];
        for(var key in params) {
          if (params.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort();
        for (var i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          var value = params[key];
          if (value == null) {
            continue;
          }
          var pair = encodeURIComponent(key);
          if ($$route$recognizer$$isArray(value)) {
            for (var j = 0, l = value.length; j < l; j++) {
              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
              pairs.push(arrayPair);
            }
          } else {
            pair += "=" + encodeURIComponent(value);
            pairs.push(pair);
          }
        }

        if (pairs.length === 0) { return ''; }

        return "?" + pairs.join("&");
      },

      parseQueryString: function(queryString) {
        var pairs = queryString.split("&"), queryParams = {};
        for(var i=0; i < pairs.length; i++) {
          var pair      = pairs[i].split('='),
              key       = $$route$recognizer$$decodeQueryParamPart(pair[0]),
              keyLength = key.length,
              isArray = false,
              value;
          if (pair.length === 1) {
            value = 'true';
          } else {
            //Handle arrays
            if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
              isArray = true;
              key = key.slice(0, keyLength - 2);
              if(!queryParams[key]) {
                queryParams[key] = [];
              }
            }
            value = pair[1] ? $$route$recognizer$$decodeQueryParamPart(pair[1]) : '';
          }
          if (isArray) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = value;
          }
        }
        return queryParams;
      },

      recognize: function(path) {
        var states = [ this.rootState ],
            pathLen, i, l, queryStart, queryParams = {},
            isSlashDropped = false;

        queryStart = path.indexOf('?');
        if (queryStart !== -1) {
          var queryString = path.substr(queryStart + 1, path.length);
          path = path.substr(0, queryStart);
          queryParams = this.parseQueryString(queryString);
        }

        path = decodeURI(path);

        // DEBUG GROUP path

        if (path.charAt(0) !== "/") { path = "/" + path; }

        pathLen = path.length;
        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
          path = path.substr(0, pathLen - 1);
          isSlashDropped = true;
        }

        for (i=0, l=path.length; i<l; i++) {
          states = $$route$recognizer$$recognizeChar(states, path.charAt(i));
          if (!states.length) { break; }
        }

        // END DEBUG GROUP

        var solutions = [];
        for (i=0, l=states.length; i<l; i++) {
          if (states[i].handlers) { solutions.push(states[i]); }
        }

        states = $$route$recognizer$$sortSolutions(solutions);

        var state = solutions[0];

        if (state && state.handlers) {
          // if a trailing slash was dropped and a star segment is the last segment
          // specified, put the trailing slash back
          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
            path = path + "/";
          }
          return $$route$recognizer$$findHandler(state, path, queryParams);
        }
      }
    };

    $$route$recognizer$$RouteRecognizer.prototype.map = $$route$recognizer$dsl$$default;

    $$route$recognizer$$RouteRecognizer.VERSION = '0.1.9';

    var $$route$recognizer$$default = $$route$recognizer$$RouteRecognizer;

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define('route-recognizer', function() { return $$route$recognizer$$default; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = $$route$recognizer$$default;
    } else if (typeof this !== 'undefined') {
      this['RouteRecognizer'] = $$route$recognizer$$default;
    }
}).call(this);


},{}],6:[function(require,module,exports){
var Module = require('./Module.js');

var Modules = require('./dependencies/Modules.js');
var Injectables = require('./dependencies/Injectables.js');

var registerBuiltIns = require('./builtins/Register.js');

var Mimeo = function() {
    var modules = Modules();
    var injectables = Injectables();

    registerBuiltIns(injectables);

    function bootstrap(injectableName) {
        if (!injectableName) {
            throw new Error('Define an injectable to bootstrap!');
        }

        if (!modules.hasAllDependencies()) {
            throw new Error('Modules don\'t exist: ' + modules.getMissingDependencies());
        }

        if (!injectables.hasAllDependencies()) {
            throw new Error('Injectables don\'t exist: ' + injectables.getMissingDependencies());
        }

        injectables.instantiate();

        modules.instantiate();

        var entryInjectable = injectables.get(injectableName);

        if (!Boolean(entryInjectable)) {
            throw new Error('Injectable "' + injectableName + '" to bootstrap not found');
        }

        return entryInjectable.apply(entryInjectable, Array.prototype.slice.call(arguments, 1));
    }

    return {
        module: function(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(injectables, name, dependencies));
            }

            return modules.get(name);
        },
        bootstrap: bootstrap
    }
};

module.exports = Mimeo();

},{"./Module.js":7,"./builtins/Register.js":10,"./dependencies/Injectables.js":14,"./dependencies/Modules.js":15}],7:[function(require,module,exports){
function Module(injectables, name, dependencies) {
    var module = this;

    var toRun = [];

    this.$name = name;
    this.$inject = dependencies;

    function prepareInjectable(name, parameters) {
        if (injectables.has(name)) {
            throw new Error('Injectable "' + name + '" already exists');
        }

        var injectable;

        if (parameters instanceof Function) {
            injectable = parameters;
            if (!injectable.$inject) {
                injectable.$inject = [];
            }
        } else {
            var dependencies = parameters.slice(0, -1);
            injectable = parameters.slice(-1)[0];
            injectable.$inject = dependencies;
        }

        injectable.$name = name;

        return injectable;
    }

    function addInjectable(name, parameters) {
        injectables.add(prepareInjectable(name, parameters));

        return module;
    }

    this.executeRun = function executeRun() {
        toRun.forEach(function(injectableName) {
            injectables.get(injectableName)();
        });
    };

    /*
     * I don't like the wrapper and auto-generated name, but for now I can't
     * come up with a better solution. The problem is that the run-function
     * needs to work with the injection system (since it can have other
     * injectables injected), and the whole system isn't designed to deal with
     * unnamed things.
     *
     * In fact, I feel that an injection system that can handle unnamed items
     * would be wrong. How would you identify what to inject? Having names for
     * injectables (or at least IDs) is a core aspect of an injection system.
     *
     * So this would have to live outside of it. But that means having it's own
     * "make sure all this injectables" exist system. Then we could just get the
     * named injectables the run-function needs and call the run-function with
      * those.
      *
      * I can't think of a good way to de-duplicated that dependency resolution
      * system though, so there'd be one for all named injectables and one for
      * the run-functions.
      *
      * I don't plan on having other unnamed injectables, so I feel that effort
      * would be wasted. Hence the "hack" here with an auto-generated name and
      * a wrapper that executes the run-function with pass-through arguments.
     */
    this.run = function(parameters) {
        var name = module.$name + '-run.' + toRun.length;
        toRun.push(name);

        var provider = function providerRun() {
            var args = arguments;
            return function() {
                if (parameters instanceof Function) {
                    return parameters.apply(parameters, args);
                } else {
                    var lastEntry = parameters.slice(-1)[0];
                    return lastEntry.apply(lastEntry, args);
                }
            }
        };

        if (parameters instanceof Function) {
            provider.$inject = parameters.$inject;
        } else {
            provider.$inject = parameters.slice(0, -1);
        }

        addInjectable(name, provider);

        return module;
    };

    this.factory = addInjectable;
    this.component = addInjectable;
    this.value = function(name, value) {
        return addInjectable(name, function() {
            return value;
        });
    }
}

module.exports = Module;
},{}],8:[function(require,module,exports){
var Promise = require('./Promise.js');

var NodeHttp = null;
var NodeHttps = null;

function jQueryLikeRequest(jQueryLike, config, resolve, reject) {
    function responseToAngularResponse(data, _, jqXHR) {
        return {
            data: data,
            status: jqXHR.status, // response code,
            headers: jqXHR.getAllResponseHeaders(),// headers,
            config: config,
            statusText: jqXHR.statusText
        };
    }

    function success(data, textStatus, jqXHR) {
        resolve(responseToAngularResponse(data, textStatus, jqXHR));
    }

    function error(jqXHR, textStatus) {
        reject(responseToAngularResponse({}, textStatus, jqXHR));
    }

    jQueryLike.ajax({
        method: config.method || 'GET',
        data: config.params || {},
        headers: config.headers || {},
        url: config.url || {}
    }).then(success, error);
}

function jQueryRequest($window) {
    return function(config, resolve, reject) {
        jQueryLikeRequest($window.jQuery, config, resolve, reject);
    }
}

function zeptoRequest($window) {
    return function(config, resolve, reject) {
        jQueryLikeRequest($window.Zepto, config, resolve, reject);
    }
}

function nodeRequest(config, resolve, reject) {
    if (!NodeHttp) {
        NodeHttp = require('http');
    }
    if (!NodeHttps) {
        NodeHttps = require('https');
    }

    function configToNode(config) {
        if (config.host && config.host.indexOf(':') !== -1) {
            var hostParts = config.host.split(':');
            var host = hostParts[0];
            var port = hostParts[1];
        } else {
            var host = config.host;
            var port = 80;
        }

        return {
            method: config.method || 'GET',
            path: config.protocol + '://' + config.host + config.url,
            headers: config.headers || {},
            host: host,
            port: port,
            protocol: config.protocol + ':'
        }
    }

    function switchByProtocol() {
        if (config.protocol === 'http') {
            return NodeHttp;
        } else {
            return NodeHttps;
        }
    }

    var request = switchByProtocol().request(configToNode(config), function(response) {
        response.setEncoding('utf8');

        var body = '';
        response.on('data', function(chunk) {
            body += chunk.toString();
        });

        response.on('error', function(error) {
            reject(error);
        });

        response.on('end', function() {
            /*
             * jQuery will parse JSON replies automatically, so replicate that
             * behaviour for nodejs
             */
            if (response.headers['content-type'] && response.headers['content-type'].match(/^application\/json/i)) {
                body = JSON.parse(body);
            }

            resolve({
                data: body,
                headers: response.headers,
                config: config,
                statusText: response.statusText,
                status: response.statusCode
            });
        });
    });

    if (config.method === 'POST') {
        request.write(Object.keys(config.params).map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(config.params[key]);
        }).join('&'));
    }

    request.end();
}

function vendorSpecificRequest($window) {
    if ($window.$fake === true) {
        return nodeRequest;
    } else {
        if ($window.jQuery) {
            return jQueryRequest($window);
        } else if ($window.Zepto) {
            return zeptoRequest($window);
        } else {
            throw new Error('No supported ajax library found (jQuery or Zepto)');
        }
    }
}

/**
 * Config accepts:
 *
 * method: HTTP method for request
 * params: hash of GET parameters
 * headers: HTTP headers
 * url: URL to request
 *
 * @param $window
 * @param config
 * @returns {promise|*|r.promise|Function|a}
 * @constructor
 */
function Http($window, config) {
    var defer = Promise().defer();

    vendorSpecificRequest($window)(config, function(data) {
        defer.resolve(data);
    }, function(error) {
        defer.reject(error);
    });

    return defer.promise;
}

module.exports = function($window) {
    function doHttp(config) {
        config.host = doHttp.$host;
        config.protocol = doHttp.$protocol;
        return new Http($window, config);
    }

    doHttp.$host = '';
    doHttp.$protocol = 'https';

    doHttp.get = function(url, config) {
        config = config || {};
        config.url = url;
        config.method = 'GET';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return Http($window, config);
    };
    doHttp.post = function(url, config) {
        config.url = url;
        config.method = 'POST';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return Http($window, config);
    };
    doHttp.put = function(url, config) {
        config.url = url;
        config.method = 'PUT';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return Http($window, config);
    };
    doHttp.delete = function(url, config) {
        config.url = url;
        config.method = 'DELETE';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return Http($window, config);
    };

    return doHttp;
};
},{"./Promise.js":9,"http":undefined,"https":undefined}],9:[function(require,module,exports){
function Deferred(callback) {
    var resolved = false;
    var resolvedValue;

    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];

    var promise = {
        then: function(onResolve, onReject, onNotify) {
            if (resolved && onResolve) {
                onResolve(resolvedValue);
            } else {
                resolveCallbacks.push(onResolve);
            }

            if (onReject) {
                rejectCallbacks.push(onReject);
            }

            if (onNotify) {
                notifyCallbacks.push(onNotify);
            }

            return promise;
        }
    };

    var resolve = function(resolution) {
        resolveCallbacks.forEach(function(callback) {
            callback(resolution);
        });
    };
    var reject = function(rejectionReason) {
        rejectCallbacks.forEach(function(callback) {
            callback(rejectionReason);
        });
    };
    var notify = function(notification) {
        notifyCallbacks.forEach(function(callback) {
            callback(notification);
        });
    };

    if (callback) {
        callback(resolve, reject, notify);
    }

    return {
        resolve: resolve,
        reject: reject,
        notify: notify,
        promise: promise
    };
}

function $q(callback) {
    return (new Deferred(callback)).promise;
}

$q.defer = function() {
    return new Deferred();
};

$q.all = function(promises) {
    if (!promises instanceof Array) {
        throw new Error('Promises need to be passed to $q.all in an array');
    }

    var counter = 0;
    var resolutions = [];
    var hasRejections = false;

    var deferred = new Deferred();

    function checkComplete() {
        if (counter === promises.length) {
            if (hasRejections) {
                deferred.reject();
            } else {
                deferred.resolve(resolutions);
            }
        }
    }

    promises.forEach(function(promise, index) {
        promise.then(function(resolution) {
            resolutions[index] = resolution;
            ++counter;
            checkComplete();
        }, function() {
            hasRejections = true;
            ++counter;
            checkComplete();
        });
    });

    return deferred.promise;
};

module.exports = function() {
    return $q;
};
},{}],10:[function(require,module,exports){
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

},{"./Http.js":8,"./Promise.js":9,"./Routing.js":11}],11:[function(require,module,exports){
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
},{"parseuri":4,"route-recognizer":5}],12:[function(require,module,exports){
//var DependencyResolver = require('./DependencyResolver.js');
var Graph = require('./Graph.js');

/**
 *
 * @param name
 * @returns {{$name: string, register: register, hasAllDependencies:
 *     hasAllDependencies, instantiate: instantiate, getInstance: getInstance}}
 * @constructor
 */
function DependencyManager(name) {
    var _providers = {};
    var _instances = {};
    var _graph = new Graph();

    var _getMissingDependenciesCache = undefined;

    function register(entity) {
        if (!entity) {
            throw new Error('No entity to register was given');
        }

        if (!entity.$name) {
            throw new Error('Entity "' + entity.$name + '" is missing property $name');
        }

        if (!entity.$inject) {
            throw new Error('Entity "' + entity.$name + '" is missing property $inject');
        }

        if (_providers[entity.$name]) {
            throw new Error('Entity "' + entity.$name + '" already exists');
        }

        _getMissingDependenciesCache = undefined;

        _providers[entity.$name] = entity;

        /*
         * Name might've been registered as a dependency of another entity
         */
        if (!_graph.hasNodeValue(entity.$name)) {
            _graph.add(entity.$name);
        }

        entity.$inject.forEach(function(dependency) {
            if (!_graph.hasNodeValue(dependency)) {
                _graph.add(dependency);
            }

            _graph.addEdge(dependency, entity.$name);
        });
    }

    function getMissingDependencies() {
        if (_getMissingDependenciesCache) {
            return _getMissingDependenciesCache;
        }

        var providersInjects = Object.keys(_providers).map(function(providerName) {
            return _providers[providerName].$inject;
        });

        _getMissingDependenciesCache = [].concat.apply([], providersInjects).filter(function(providerName) {
            return !Boolean(_providers[providerName]);
        });

        return _getMissingDependenciesCache;
    }

    function hasAllDependencies() {
        return getMissingDependencies().length == 0;
    }

    function instantiate() {
        _graph.getNodesTopological().forEach(function(providerName) {
            var provider = _providers[providerName];

            _instances[providerName] = provider.apply(provider, provider.$inject.map(function(dependencyName) {
                return _instances[dependencyName];
            }));
        });
    }

    function getProvider(providerName) {
        return _providers[providerName];
    }

    function getInstance(providerName) {
        return _instances[providerName];
    }

    return {
        $name: name,
        register: register,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies,
        instantiate: instantiate,
        getProvider: getProvider,
        getInstance: getInstance,
        all: {
            providers: function(callback) {
                Object.keys(_providers).forEach(function(name) {
                    callback(name, _providers[name]);
                });
            },
            instances: function(callback) {
                Object.keys(_instances).forEach(function(name) {
                    callback(name, _instances[name]);
                });
            }
        }
    }
}

/**
 *
 * @param name
 * @returns {DependencyManager}
 */
module.exports = function(name) {
    return new DependencyManager(name);
};
},{"./Graph.js":13}],13:[function(require,module,exports){
var Node = function(value) {
    if (!(value instanceof String || typeof value === 'string')) {
        throw new Error('Only strings are accepted as node values');
    }

    this._id = Math.random().toString(36);
    this.value = value;
};


var Edge = function(nodeFrom, nodeTo) {
    this._id = Math.random().toString(36);
    this._from = nodeFrom;
    this._to = nodeTo;
};

var makeNodeIdentifier = function(node1, node2) {
    return node1._id + ':' + node2._id;
};

Edge.prototype.getNodeIdentifier = function() {
    return makeNodeIdentifier(this._from, this._to);
};

/**
 * Directed graph to order nodes by dependencies. Only handles values whose
 * .toString() function returns unique values. Favors pre-computed lookup
 * tables over lookups at sort time. Most machines have lots of ram and
 * especially on mobile the CPU is more restricted. Using more ram and less
 * CPU cycles is preferable in those conditions, although it should hardly
 * matter since most dependency graphs (which this implementation is focused
 * on) shouldn't exceed a few hundred nodes.
 *
 * @returns {{add: Function, addEdge: Function, hasNodeValue: Function,
 *     getNodesTopological: Function}}
 * @constructor
 */
var Graph = function() {
    var _nodes = [];
    var _nodesById = {};
    var _nodesByValue = {};
    var _zeroIngreeNodes = [];
    var _edges = [];
    var _edgesByNodes = {};
    var _edgesByTo = {};
    var _edgesByFrom = {};

    /*
     * The current topological sort implementation mutates the graph, after
     * which it's unusable. This function allows to clean the entire graph
     * up, removing any dangling data that might be left after the sort.
     */
    var reset = function() {
        _nodes = [];
        _nodesById = {};
        _nodesByValue = {};
        _zeroIngreeNodes = [];
        _edges = [];
        _edgesByNodes = {};
        _edgesByTo = {};
        _edgesByFrom = {};
    };

    var addNode = function(node) {
        if (_nodesByValue[node.value]) {
            throw new Error('Duplicate values not allowed. Node with value "' + node.value + '" already exists');
        }

        _nodes.push(node);
        _nodesById[node._id] = node;
        _nodesByValue[node.value] = node;

        _zeroIngreeNodes.push(node);
    };

    var addEdge = function(edge) {
        if (_edgesByNodes[edge.getNodeIdentifier()]) {
            return;
        }

        _edges.push(edge);
        _edgesByNodes[edge.getNodeIdentifier()] = edge;

        if (!_edgesByFrom[edge._from._id]) {
            _edgesByFrom[edge._from._id] = [];
        }
        _edgesByFrom[edge._from._id].push(edge);

        if (!_edgesByTo[edge._to._id]) {
            _edgesByTo[edge._to._id] = [];
        }
        _edgesByTo[edge._to._id].push(edge);

        _zeroIngreeNodes = _zeroIngreeNodes.filter(function(existingNode) {
            return existingNode._id != edge._to._id;
        });
    };
    var removeEdge = function(edgeToRemove) {
        _edges = _edges.filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });

        delete _edgesByNodes[edgeToRemove.getNodeIdentifier()];

        _edgesByFrom[edgeToRemove._from._id] = _edgesByFrom[edgeToRemove._from._id].filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });

        _edgesByTo[edgeToRemove._to._id] = _edgesByTo[edgeToRemove._to._id].filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });
    };

    var getNodeByValue = function(value) {
        return _nodesByValue[value];
    };

    return {
        add: function(value) {
            addNode(new Node(value));
        },
        addEdge: function(fromValue, toValue) {
            var fromNode = getNodeByValue(fromValue);
            var toNode = getNodeByValue(toValue);

            if (!fromNode && !toNode) {
                throw 'Neither from- nor to-node exist: ' + fromValue + ', ' + toValue;
            }

            if (!fromNode) {
                throw 'From-node doesn\'t exist: ' + fromValue;
            }

            if (!toNode) {
                throw 'To-node doesn\'t exist: ' + toValue;
            }

            addEdge(new Edge(fromNode, toNode));
        },
        hasNodeValue: function(value) {
            return Boolean(getNodeByValue(value));
        },
        getNodesTopological: function() {
            var sortedNodes = [];

            while (_zeroIngreeNodes.length > 0) {
                var currentNode = _zeroIngreeNodes.pop();
                sortedNodes.push(currentNode);
                (_edgesByFrom[currentNode._id] || []).slice(0).forEach(function(edge) {
                    removeEdge(edge);
                    if (!_edgesByTo[edge._to._id] || _edgesByTo[edge._to._id].length < 1) {
                        _zeroIngreeNodes.push(edge._to);
                    }
                });
            }

            if (_edges.length > 0) {
                var remainingEdges = _edges.map(function(edge) {
                    return '(' + edge._from.value + ',' + edge._to.value + ')';
                });

                reset();

                throw new Error('Cycle detected, remaining edges: ' + remainingEdges);
            }

            reset();

            return sortedNodes.map(function(node) {
                return node.value;
            });
        }
    };
};

module.exports = Graph;
},{}],14:[function(require,module,exports){
var DependencyManager = require('./DependencyManager.js');

module.exports = function() {
    var injectables = DependencyManager('injectables');

    function add(injectable) {
        injectables.register(injectable);
        return injectable;
    }

    function instantiateInjectables() {
        if (!injectables.hasAllDependencies()) {
            throw new Error('Injectables don\'t exist: ' + injectables.getMissingDependencies());
        }

        injectables.instantiate();
    }

    function has(name) {
        return Boolean(injectables.getProvider(name));
    }

    function get(name) {
        return injectables.getInstance(name);
    }

    function hasAllDependencies() {
        return injectables.hasAllDependencies();
    }

    function getMissingDependencies() {
        return injectables.getMissingDependencies();
    }

    return {
        add: add,
        get: get,
        has: has,
        instantiate: instantiateInjectables,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies
    };
};
},{"./DependencyManager.js":12}],15:[function(require,module,exports){
var DependencyManager = require('./DependencyManager.js');

module.exports = function() {
    var modules = DependencyManager('modules');

    function add(module) {
        modules.register(module);
        return module;
    }

    function hasAllDependencies() {
        return modules.hasAllDependencies();
    }

    function instantiateModules() {
        modules.all.providers(function(_, module) {
            if (module) {
                module.executeRun();
            }
        });
    }

    function get(name) {
        return modules.getProvider(name);
    }

    function getMissingDependencies() {
        return modules.getMissingDependencies();
    }

    return {
        add: add,
        get: get,
        instantiate: instantiateModules,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies
    };
};
},{"./DependencyManager.js":12}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAuanMiLCJhcHAubWltZW8uanMiLCJicm93c2VyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3BhcnNldXJpL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JvdXRlLXJlY29nbml6ZXIvZGlzdC9yb3V0ZS1yZWNvZ25pemVyLmpzIiwiLi4vLi4vc3JjL01pbWVvLmpzIiwiLi4vLi4vc3JjL01vZHVsZS5qcyIsIi4uLy4uL3NyYy9idWlsdGlucy9IdHRwLmpzIiwiLi4vLi4vc3JjL2J1aWx0aW5zL1Byb21pc2UuanMiLCIuLi8uLi9zcmMvYnVpbHRpbnMvUmVnaXN0ZXIuanMiLCIuLi8uLi9zcmMvYnVpbHRpbnMvUm91dGluZy5qcyIsIi4uLy4uL3NyYy9kZXBlbmRlbmNpZXMvRGVwZW5kZW5jeU1hbmFnZXIuanMiLCIuLi8uLi9zcmMvZGVwZW5kZW5jaWVzL0dyYXBoLmpzIiwiLi4vLi4vc3JjL2RlcGVuZGVuY2llcy9JbmplY3RhYmxlcy5qcyIsIi4uLy4uL3NyYy9kZXBlbmRlbmNpZXMvTW9kdWxlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1b0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIFVzZXIoJGh0dHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgcHJvbWlzZTogJGh0dHAuZ2V0KCcvdXNlcnMvJyArIHVzZXJJZCkudGhlbihmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gdXNlci5kYXRhO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBkYXRhOiB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG59XG5cblVzZXIuJGluamVjdCA9IFsnJGh0dHAnXTtcblxuZnVuY3Rpb24gTWVzc2FnZXMoJGh0dHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgcHJvbWlzZTogJGh0dHAuZ2V0KCcvbWVzc2FnZXMvJyArIHVzZXJJZCkudGhlbihmdW5jdGlvbihtZXNzYWdlcykge1xuICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IG1lc3NhZ2VzLmRhdGE7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGRhdGE6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbn1cblxuTWVzc2FnZXMuJGluamVjdCA9IFsnJGh0dHAnXTtcblxuZnVuY3Rpb24gV2VsY29tZVBhZ2UoJHEsIFVzZXIsIE1lc3NhZ2VzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgICB2YXIgdXNlciA9IFVzZXIodXNlcklkKTtcbiAgICAgICAgdmFyIG1lc3NhZ2VzID0gTWVzc2FnZXModXNlcklkKTtcblxuICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAkcS5hbGwoW3VzZXIucHJvbWlzZSwgbWVzc2FnZXMucHJvbWlzZV0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHVzZXI6IHVzZXIuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXM6IG1lc3NhZ2VzLmRhdGFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5XZWxjb21lUGFnZS4kaW5qZWN0ID0gWyckcScsICdVc2VyJywgJ01lc3NhZ2VzJ107XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFVzZXI6IFVzZXIsXG4gICAgTWVzc2FnZXM6IE1lc3NhZ2VzLFxuICAgIFdlbGNvbWVQYWdlOiBXZWxjb21lUGFnZVxufTsiLCJ2YXIgbWltZW8gPSByZXF1aXJlKCcuLi8uLi9zcmMvTWltZW8uanMnKTtcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcC5qcycpO1xuXG5taW1lby5tb2R1bGUoJ2V4YW1wbGUtc2VydmVyJywgW10pXG4gICAgLmZhY3RvcnkoJ1VzZXInLCBhcHAuVXNlcilcbiAgICAuZmFjdG9yeSgnTWVzc2FnZXMnLCBhcHAuTWVzc2FnZXMpXG4gICAgLmNvbXBvbmVudCgnV2VsY29tZVBhZ2UnLCBhcHAuV2VsY29tZVBhZ2UpOyIsInZhciBtaW1lbyA9IHJlcXVpcmUoJy4uLy4uL3NyYy9NaW1lby5qcycpO1xucmVxdWlyZSgnLi9hcHAubWltZW8uanMnKTtcblxuZnVuY3Rpb24gSW5Ccm93c2VyKFdlbGNvbWVQYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgV2VsY29tZVBhZ2UoMSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbkluQnJvd3Nlci4kaW5qZWN0ID0gWydXZWxjb21lUGFnZSddO1xuXG5taW1lby5tb2R1bGUoJ2V4YW1wbGUtc2VydmVyJylcbiAgICAuY29tcG9uZW50KCdJbkJyb3dzZXInLCBJbkJyb3dzZXIpO1xuXG5taW1lby5ib290c3RyYXAoJ0luQnJvd3NlcicsICQoJyNhcHAnKSk7IiwiLyoqXG4gKiBQYXJzZXMgYW4gVVJJXG4gKlxuICogQGF1dGhvciBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT4gKE1JVCBsaWNlbnNlKVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHJlID0gL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoaHR0cHxodHRwc3x3c3x3c3MpOlxcL1xcLyk/KCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oKD86W2EtZjAtOV17MCw0fTopezIsN31bYS1mMC05XXswLDR9fFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS87XG5cbnZhciBwYXJ0cyA9IFtcbiAgICAnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2FuY2hvcidcbl07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2V1cmkoc3RyKSB7XG4gICAgdmFyIHNyYyA9IHN0cixcbiAgICAgICAgYiA9IHN0ci5pbmRleE9mKCdbJyksXG4gICAgICAgIGUgPSBzdHIuaW5kZXhPZignXScpO1xuXG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIGIpICsgc3RyLnN1YnN0cmluZyhiLCBlKS5yZXBsYWNlKC86L2csICc7JykgKyBzdHIuc3Vic3RyaW5nKGUsIHN0ci5sZW5ndGgpO1xuICAgIH1cblxuICAgIHZhciBtID0gcmUuZXhlYyhzdHIgfHwgJycpLFxuICAgICAgICB1cmkgPSB7fSxcbiAgICAgICAgaSA9IDE0O1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcbiAgICB9XG5cbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHVyaS5zb3VyY2UgPSBzcmM7XG4gICAgICAgIHVyaS5ob3N0ID0gdXJpLmhvc3Quc3Vic3RyaW5nKDEsIHVyaS5ob3N0Lmxlbmd0aCAtIDEpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmF1dGhvcml0eSA9IHVyaS5hdXRob3JpdHkucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmlwdjZ1cmkgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB1cmk7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJFRhcmdldChwYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSkge1xuICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7XG4gICAgICB0aGlzLmRlbGVnYXRlID0gZGVsZWdhdGU7XG4gICAgfVxuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkVGFyZ2V0LnByb3RvdHlwZSA9IHtcbiAgICAgIHRvOiBmdW5jdGlvbih0YXJnZXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9IHRoaXMuZGVsZWdhdGU7XG5cbiAgICAgICAgaWYgKGRlbGVnYXRlICYmIGRlbGVnYXRlLndpbGxBZGRSb3V0ZSkge1xuICAgICAgICAgIHRhcmdldCA9IGRlbGVnYXRlLndpbGxBZGRSb3V0ZSh0aGlzLm1hdGNoZXIudGFyZ2V0LCB0YXJnZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXRjaGVyLmFkZCh0aGlzLnBhdGgsIHRhcmdldCk7XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrLmxlbmd0aCA9PT0gMCkgeyB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBoYXZlIGFuIGFyZ3VtZW50IGluIHRoZSBmdW5jdGlvbiBwYXNzZWQgdG8gYHRvYFwiKTsgfVxuICAgICAgICAgIHRoaXMubWF0Y2hlci5hZGRDaGlsZCh0aGlzLnBhdGgsIHRhcmdldCwgY2FsbGJhY2ssIHRoaXMuZGVsZWdhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyKHRhcmdldCkge1xuICAgICAgdGhpcy5yb3V0ZXMgPSB7fTtcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fTtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIH1cblxuICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIucHJvdG90eXBlID0ge1xuICAgICAgYWRkOiBmdW5jdGlvbihwYXRoLCBoYW5kbGVyKSB7XG4gICAgICAgIHRoaXMucm91dGVzW3BhdGhdID0gaGFuZGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIGFkZENoaWxkOiBmdW5jdGlvbihwYXRoLCB0YXJnZXQsIGNhbGxiYWNrLCBkZWxlZ2F0ZSkge1xuICAgICAgICB2YXIgbWF0Y2hlciA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyKHRhcmdldCk7XG4gICAgICAgIHRoaXMuY2hpbGRyZW5bcGF0aF0gPSBtYXRjaGVyO1xuXG4gICAgICAgIHZhciBtYXRjaCA9ICQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2gocGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpO1xuXG4gICAgICAgIGlmIChkZWxlZ2F0ZSAmJiBkZWxlZ2F0ZS5jb250ZXh0RW50ZXJlZCkge1xuICAgICAgICAgIGRlbGVnYXRlLmNvbnRleHRFbnRlcmVkKHRhcmdldCwgbWF0Y2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2sobWF0Y2gpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRnZW5lcmF0ZU1hdGNoKHN0YXJ0aW5nUGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihwYXRoLCBuZXN0ZWRDYWxsYmFjaykge1xuICAgICAgICB2YXIgZnVsbFBhdGggPSBzdGFydGluZ1BhdGggKyBwYXRoO1xuXG4gICAgICAgIGlmIChuZXN0ZWRDYWxsYmFjaykge1xuICAgICAgICAgIG5lc3RlZENhbGxiYWNrKCQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2goZnVsbFBhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRUYXJnZXQoc3RhcnRpbmdQYXRoICsgcGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJGFkZFJvdXRlKHJvdXRlQXJyYXksIHBhdGgsIGhhbmRsZXIpIHtcbiAgICAgIHZhciBsZW4gPSAwO1xuICAgICAgZm9yICh2YXIgaT0wLCBsPXJvdXRlQXJyYXkubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICBsZW4gKz0gcm91dGVBcnJheVtpXS5wYXRoLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKGxlbik7XG4gICAgICB2YXIgcm91dGUgPSB7IHBhdGg6IHBhdGgsIGhhbmRsZXI6IGhhbmRsZXIgfTtcbiAgICAgIHJvdXRlQXJyYXkucHVzaChyb3V0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZWFjaFJvdXRlKGJhc2VSb3V0ZSwgbWF0Y2hlciwgY2FsbGJhY2ssIGJpbmRpbmcpIHtcbiAgICAgIHZhciByb3V0ZXMgPSBtYXRjaGVyLnJvdXRlcztcblxuICAgICAgZm9yICh2YXIgcGF0aCBpbiByb3V0ZXMpIHtcbiAgICAgICAgaWYgKHJvdXRlcy5oYXNPd25Qcm9wZXJ0eShwYXRoKSkge1xuICAgICAgICAgIHZhciByb3V0ZUFycmF5ID0gYmFzZVJvdXRlLnNsaWNlKCk7XG4gICAgICAgICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkYWRkUm91dGUocm91dGVBcnJheSwgcGF0aCwgcm91dGVzW3BhdGhdKTtcblxuICAgICAgICAgIGlmIChtYXRjaGVyLmNoaWxkcmVuW3BhdGhdKSB7XG4gICAgICAgICAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRlYWNoUm91dGUocm91dGVBcnJheSwgbWF0Y2hlci5jaGlsZHJlbltwYXRoXSwgY2FsbGJhY2ssIGJpbmRpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGJpbmRpbmcsIHJvdXRlQXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRkZWZhdWx0ID0gZnVuY3Rpb24oY2FsbGJhY2ssIGFkZFJvdXRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBtYXRjaGVyID0gbmV3ICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIoKTtcblxuICAgICAgY2FsbGJhY2soJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZ2VuZXJhdGVNYXRjaChcIlwiLCBtYXRjaGVyLCB0aGlzLmRlbGVnYXRlKSk7XG5cbiAgICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJGVhY2hSb3V0ZShbXSwgbWF0Y2hlciwgZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgaWYgKGFkZFJvdXRlQ2FsbGJhY2spIHsgYWRkUm91dGVDYWxsYmFjayh0aGlzLCByb3V0ZSk7IH1cbiAgICAgICAgZWxzZSB7IHRoaXMuYWRkKHJvdXRlKTsgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfTtcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJHNwZWNpYWxzID0gW1xuICAgICAgJy8nLCAnLicsICcqJywgJysnLCAnPycsICd8JyxcbiAgICAgICcoJywgJyknLCAnWycsICddJywgJ3snLCAnfScsICdcXFxcJ1xuICAgIF07XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRlc2NhcGVSZWdleCA9IG5ldyBSZWdFeHAoJyhcXFxcJyArICQkcm91dGUkcmVjb2duaXplciQkc3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnKTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkaXNBcnJheSh0ZXN0KSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRlc3QpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgfVxuXG4gICAgLy8gQSBTZWdtZW50IHJlcHJlc2VudHMgYSBzZWdtZW50IGluIHRoZSBvcmlnaW5hbCByb3V0ZSBkZXNjcmlwdGlvbi5cbiAgICAvLyBFYWNoIFNlZ21lbnQgdHlwZSBwcm92aWRlcyBhbiBgZWFjaENoYXJgIGFuZCBgcmVnZXhgIG1ldGhvZC5cbiAgICAvL1xuICAgIC8vIFRoZSBgZWFjaENoYXJgIG1ldGhvZCBpbnZva2VzIHRoZSBjYWxsYmFjayB3aXRoIG9uZSBvciBtb3JlIGNoYXJhY3RlclxuICAgIC8vIHNwZWNpZmljYXRpb25zLiBBIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGNvbnN1bWVzIG9uZSBvciBtb3JlIGlucHV0XG4gICAgLy8gY2hhcmFjdGVycy5cbiAgICAvL1xuICAgIC8vIFRoZSBgcmVnZXhgIG1ldGhvZCByZXR1cm5zIGEgcmVnZXggZnJhZ21lbnQgZm9yIHRoZSBzZWdtZW50LiBJZiB0aGVcbiAgICAvLyBzZWdtZW50IGlzIGEgZHluYW1pYyBvZiBzdGFyIHNlZ21lbnQsIHRoZSByZWdleCBmcmFnbWVudCBhbHNvIGluY2x1ZGVzXG4gICAgLy8gYSBjYXB0dXJlLlxuICAgIC8vXG4gICAgLy8gQSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBjb250YWluczpcbiAgICAvL1xuICAgIC8vICogYHZhbGlkQ2hhcnNgOiBhIFN0cmluZyB3aXRoIGEgbGlzdCBvZiBhbGwgdmFsaWQgY2hhcmFjdGVycywgb3JcbiAgICAvLyAqIGBpbnZhbGlkQ2hhcnNgOiBhIFN0cmluZyB3aXRoIGEgbGlzdCBvZiBhbGwgaW52YWxpZCBjaGFyYWN0ZXJzXG4gICAgLy8gKiBgcmVwZWF0YDogdHJ1ZSBpZiB0aGUgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gY2FuIHJlcGVhdFxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0aWNTZWdtZW50KHN0cmluZykgeyB0aGlzLnN0cmluZyA9IHN0cmluZzsgfVxuICAgICQkcm91dGUkcmVjb2duaXplciQkU3RhdGljU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IHRoaXMuc3RyaW5nLCBjaDtcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9c3RyaW5nLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBjaCA9IHN0cmluZy5jaGFyQXQoaSk7XG4gICAgICAgICAgY2FsbGJhY2soeyB2YWxpZENoYXJzOiBjaCB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVnZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmcucmVwbGFjZSgkJHJvdXRlJHJlY29nbml6ZXIkJGVzY2FwZVJlZ2V4LCAnXFxcXCQxJyk7XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmluZztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCREeW5hbWljU2VnbWVudChuYW1lKSB7IHRoaXMubmFtZSA9IG5hbWU7IH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJER5bmFtaWNTZWdtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGVhY2hDaGFyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayh7IGludmFsaWRDaGFyczogXCIvXCIsIHJlcGVhdDogdHJ1ZSB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiKFteL10rKVwiO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gcGFyYW1zW3RoaXMubmFtZV07XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkU3RhclNlZ21lbnQobmFtZSkgeyB0aGlzLm5hbWUgPSBuYW1lOyB9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGFyU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soeyBpbnZhbGlkQ2hhcnM6IFwiXCIsIHJlcGVhdDogdHJ1ZSB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiKC4rKVwiO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gcGFyYW1zW3RoaXMubmFtZV07XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQoKSB7fVxuICAgICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQucHJvdG90eXBlID0ge1xuICAgICAgZWFjaENoYXI6IGZ1bmN0aW9uKCkge30sXG4gICAgICByZWdleDogZnVuY3Rpb24oKSB7IHJldHVybiBcIlwiOyB9LFxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcIjsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJHBhcnNlKHJvdXRlLCBuYW1lcywgc3BlY2lmaWNpdHkpIHtcbiAgICAgIC8vIG5vcm1hbGl6ZSByb3V0ZSBhcyBub3Qgc3RhcnRpbmcgd2l0aCBhIFwiL1wiLiBSZWNvZ25pdGlvbiB3aWxsXG4gICAgICAvLyBhbHNvIG5vcm1hbGl6ZS5cbiAgICAgIGlmIChyb3V0ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7IHJvdXRlID0gcm91dGUuc3Vic3RyKDEpOyB9XG5cbiAgICAgIHZhciBzZWdtZW50cyA9IHJvdXRlLnNwbGl0KFwiL1wiKSwgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAvLyBBIHJvdXRlcyBoYXMgc3BlY2lmaWNpdHkgZGV0ZXJtaW5lZCBieSB0aGUgb3JkZXIgdGhhdCBpdHMgZGlmZmVyZW50IHNlZ21lbnRzXG4gICAgICAvLyBhcHBlYXIgaW4uIFRoaXMgc3lzdGVtIG1pcnJvcnMgaG93IHRoZSBtYWduaXR1ZGUgb2YgbnVtYmVycyB3cml0dGVuIGFzIHN0cmluZ3NcbiAgICAgIC8vIHdvcmtzLlxuICAgICAgLy8gQ29uc2lkZXIgYSBudW1iZXIgd3JpdHRlbiBhczogXCJhYmNcIi4gQW4gZXhhbXBsZSB3b3VsZCBiZSBcIjIwMFwiLiBBbnkgb3RoZXIgbnVtYmVyIHdyaXR0ZW5cbiAgICAgIC8vIFwieHl6XCIgd2lsbCBiZSBzbWFsbGVyIHRoYW4gXCJhYmNcIiBzbyBsb25nIGFzIGBhID4gemAuIEZvciBpbnN0YW5jZSwgXCIxOTlcIiBpcyBzbWFsbGVyXG4gICAgICAvLyB0aGVuIFwiMjAwXCIsIGV2ZW4gdGhvdWdoIFwieVwiIGFuZCBcInpcIiAod2hpY2ggYXJlIGJvdGggOSkgYXJlIGxhcmdlciB0aGFuIFwiMFwiICh0aGUgdmFsdWVcbiAgICAgIC8vIG9mIChgYmAgYW5kIGBjYCkuIFRoaXMgaXMgYmVjYXVzZSB0aGUgbGVhZGluZyBzeW1ib2wsIFwiMlwiLCBpcyBsYXJnZXIgdGhhbiB0aGUgb3RoZXJcbiAgICAgIC8vIGxlYWRpbmcgc3ltYm9sLCBcIjFcIi5cbiAgICAgIC8vIFRoZSBydWxlIGlzIHRoYXQgc3ltYm9scyB0byB0aGUgbGVmdCBjYXJyeSBtb3JlIHdlaWdodCB0aGFuIHN5bWJvbHMgdG8gdGhlIHJpZ2h0XG4gICAgICAvLyB3aGVuIGEgbnVtYmVyIGlzIHdyaXR0ZW4gb3V0IGFzIGEgc3RyaW5nLiBJbiB0aGUgYWJvdmUgc3RyaW5ncywgdGhlIGxlYWRpbmcgZGlnaXRcbiAgICAgIC8vIHJlcHJlc2VudHMgaG93IG1hbnkgMTAwJ3MgYXJlIGluIHRoZSBudW1iZXIsIGFuZCBpdCBjYXJyaWVzIG1vcmUgd2VpZ2h0IHRoYW4gdGhlIG1pZGRsZVxuICAgICAgLy8gbnVtYmVyIHdoaWNoIHJlcHJlc2VudHMgaG93IG1hbnkgMTAncyBhcmUgaW4gdGhlIG51bWJlci5cbiAgICAgIC8vIFRoaXMgc3lzdGVtIG9mIG51bWJlciBtYWduaXR1ZGUgd29ya3Mgd2VsbCBmb3Igcm91dGUgc3BlY2lmaWNpdHksIHRvby4gQSByb3V0ZSB3cml0dGVuIGFzXG4gICAgICAvLyBgYS9iL2NgIHdpbGwgYmUgbW9yZSBzcGVjaWZpYyB0aGFuIGB4L3kvemAgYXMgbG9uZyBhcyBgYWAgaXMgbW9yZSBzcGVjaWZpYyB0aGFuXG4gICAgICAvLyBgeGAsIGlycmVzcGVjdGl2ZSBvZiB0aGUgb3RoZXIgcGFydHMuXG4gICAgICAvLyBCZWNhdXNlIG9mIHRoaXMgc2ltaWxhcml0eSwgd2UgYXNzaWduIGVhY2ggdHlwZSBvZiBzZWdtZW50IGEgbnVtYmVyIHZhbHVlIHdyaXR0ZW4gYXMgYVxuICAgICAgLy8gc3RyaW5nLiBXZSBjYW4gZmluZCB0aGUgc3BlY2lmaWNpdHkgb2YgY29tcG91bmQgcm91dGVzIGJ5IGNvbmNhdGVuYXRpbmcgdGhlc2Ugc3RyaW5nc1xuICAgICAgLy8gdG9nZXRoZXIsIGZyb20gbGVmdCB0byByaWdodC4gQWZ0ZXIgd2UgaGF2ZSBsb29wZWQgdGhyb3VnaCBhbGwgb2YgdGhlIHNlZ21lbnRzLFxuICAgICAgLy8gd2UgY29udmVydCB0aGUgc3RyaW5nIHRvIGEgbnVtYmVyLlxuICAgICAgc3BlY2lmaWNpdHkudmFsID0gJyc7XG5cbiAgICAgIGZvciAodmFyIGk9MCwgbD1zZWdtZW50cy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbaV0sIG1hdGNoO1xuXG4gICAgICAgIGlmIChtYXRjaCA9IHNlZ21lbnQubWF0Y2goL146KFteXFwvXSspJC8pKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJER5bmFtaWNTZWdtZW50KG1hdGNoWzFdKSk7XG4gICAgICAgICAgbmFtZXMucHVzaChtYXRjaFsxXSk7XG4gICAgICAgICAgc3BlY2lmaWNpdHkudmFsICs9ICczJztcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaCA9IHNlZ21lbnQubWF0Y2goL15cXCooW15cXC9dKykkLykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobmV3ICQkcm91dGUkcmVjb2duaXplciQkU3RhclNlZ21lbnQobWF0Y2hbMV0pKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzInO1xuICAgICAgICAgIG5hbWVzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICB9IGVsc2UgaWYoc2VnbWVudCA9PT0gXCJcIikge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudCgpKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0aWNTZWdtZW50KHNlZ21lbnQpKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzQnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNwZWNpZmljaXR5LnZhbCA9ICtzcGVjaWZpY2l0eS52YWw7XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIEEgU3RhdGUgaGFzIGEgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gYW5kIChgY2hhclNwZWNgKSBhbmQgYSBsaXN0IG9mIHBvc3NpYmxlXG4gICAgLy8gc3Vic2VxdWVudCBzdGF0ZXMgKGBuZXh0U3RhdGVzYCkuXG4gICAgLy9cbiAgICAvLyBJZiBhIFN0YXRlIGlzIGFuIGFjY2VwdGluZyBzdGF0ZSwgaXQgd2lsbCBhbHNvIGhhdmUgc2V2ZXJhbCBhZGRpdGlvbmFsXG4gICAgLy8gcHJvcGVydGllczpcbiAgICAvL1xuICAgIC8vICogYHJlZ2V4YDogQSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBpcyB1c2VkIHRvIGV4dHJhY3QgcGFyYW1ldGVycyBmcm9tIHBhdGhzXG4gICAgLy8gICB0aGF0IHJlYWNoZWQgdGhpcyBhY2NlcHRpbmcgc3RhdGUuXG4gICAgLy8gKiBgaGFuZGxlcnNgOiBJbmZvcm1hdGlvbiBvbiBob3cgdG8gY29udmVydCB0aGUgbGlzdCBvZiBjYXB0dXJlcyBpbnRvIGNhbGxzXG4gICAgLy8gICB0byByZWdpc3RlcmVkIGhhbmRsZXJzIHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzXG4gICAgLy8gKiBgdHlwZXNgOiBIb3cgbWFueSBzdGF0aWMsIGR5bmFtaWMgb3Igc3RhciBzZWdtZW50cyBpbiB0aGlzIHJvdXRlLiBVc2VkIHRvXG4gICAgLy8gICBkZWNpZGUgd2hpY2ggcm91dGUgdG8gdXNlIGlmIG11bHRpcGxlIHJlZ2lzdGVyZWQgcm91dGVzIG1hdGNoIGEgcGF0aC5cbiAgICAvL1xuICAgIC8vIEN1cnJlbnRseSwgU3RhdGUgaXMgaW1wbGVtZW50ZWQgbmFpdmVseSBieSBsb29waW5nIG92ZXIgYG5leHRTdGF0ZXNgIGFuZFxuICAgIC8vIGNvbXBhcmluZyBhIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGFnYWluc3QgYSBjaGFyYWN0ZXIuIEEgbW9yZSBlZmZpY2llbnRcbiAgICAvLyBpbXBsZW1lbnRhdGlvbiB3b3VsZCB1c2UgYSBoYXNoIG9mIGtleXMgcG9pbnRpbmcgYXQgb25lIG9yIG1vcmUgbmV4dCBzdGF0ZXMuXG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlKGNoYXJTcGVjKSB7XG4gICAgICB0aGlzLmNoYXJTcGVjID0gY2hhclNwZWM7XG4gICAgICB0aGlzLm5leHRTdGF0ZXMgPSBbXTtcbiAgICB9XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24oY2hhclNwZWMpIHtcbiAgICAgICAgdmFyIG5leHRTdGF0ZXMgPSB0aGlzLm5leHRTdGF0ZXM7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPW5leHRTdGF0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHZhciBjaGlsZCA9IG5leHRTdGF0ZXNbaV07XG5cbiAgICAgICAgICB2YXIgaXNFcXVhbCA9IGNoaWxkLmNoYXJTcGVjLnZhbGlkQ2hhcnMgPT09IGNoYXJTcGVjLnZhbGlkQ2hhcnM7XG4gICAgICAgICAgaXNFcXVhbCA9IGlzRXF1YWwgJiYgY2hpbGQuY2hhclNwZWMuaW52YWxpZENoYXJzID09PSBjaGFyU3BlYy5pbnZhbGlkQ2hhcnM7XG5cbiAgICAgICAgICBpZiAoaXNFcXVhbCkgeyByZXR1cm4gY2hpbGQ7IH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcHV0OiBmdW5jdGlvbihjaGFyU3BlYykge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGFscmVhZHkgZXhpc3RzIGluIGEgY2hpbGQgb2YgdGhlIGN1cnJlbnRcbiAgICAgICAgLy8gc3RhdGUsIGp1c3QgcmV0dXJuIHRoYXQgc3RhdGUuXG4gICAgICAgIGlmIChzdGF0ZSA9IHRoaXMuZ2V0KGNoYXJTcGVjKSkgeyByZXR1cm4gc3RhdGU7IH1cblxuICAgICAgICAvLyBNYWtlIGEgbmV3IHN0YXRlIGZvciB0aGUgY2hhcmFjdGVyIHNwZWNcbiAgICAgICAgc3RhdGUgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZShjaGFyU3BlYyk7XG5cbiAgICAgICAgLy8gSW5zZXJ0IHRoZSBuZXcgc3RhdGUgYXMgYSBjaGlsZCBvZiB0aGUgY3VycmVudCBzdGF0ZVxuICAgICAgICB0aGlzLm5leHRTdGF0ZXMucHVzaChzdGF0ZSk7XG5cbiAgICAgICAgLy8gSWYgdGhpcyBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiByZXBlYXRzLCBpbnNlcnQgdGhlIG5ldyBzdGF0ZSBhcyBhIGNoaWxkXG4gICAgICAgIC8vIG9mIGl0c2VsZi4gTm90ZSB0aGF0IHRoaXMgd2lsbCBub3QgdHJpZ2dlciBhbiBpbmZpbml0ZSBsb29wIGJlY2F1c2UgZWFjaFxuICAgICAgICAvLyB0cmFuc2l0aW9uIGR1cmluZyByZWNvZ25pdGlvbiBjb25zdW1lcyBhIGNoYXJhY3Rlci5cbiAgICAgICAgaWYgKGNoYXJTcGVjLnJlcGVhdCkge1xuICAgICAgICAgIHN0YXRlLm5leHRTdGF0ZXMucHVzaChzdGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG5ldyBzdGF0ZVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9LFxuXG4gICAgICAvLyBGaW5kIGEgbGlzdCBvZiBjaGlsZCBzdGF0ZXMgbWF0Y2hpbmcgdGhlIG5leHQgY2hhcmFjdGVyXG4gICAgICBtYXRjaDogZnVuY3Rpb24oY2gpIHtcbiAgICAgICAgLy8gREVCVUcgXCJQcm9jZXNzaW5nIGBcIiArIGNoICsgXCJgOlwiXG4gICAgICAgIHZhciBuZXh0U3RhdGVzID0gdGhpcy5uZXh0U3RhdGVzLFxuICAgICAgICAgICAgY2hpbGQsIGNoYXJTcGVjLCBjaGFycztcblxuICAgICAgICAvLyBERUJVRyBcIiAgXCIgKyBkZWJ1Z1N0YXRlKHRoaXMpXG4gICAgICAgIHZhciByZXR1cm5lZCA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1uZXh0U3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBjaGlsZCA9IG5leHRTdGF0ZXNbaV07XG5cbiAgICAgICAgICBjaGFyU3BlYyA9IGNoaWxkLmNoYXJTcGVjO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiAoY2hhcnMgPSBjaGFyU3BlYy52YWxpZENoYXJzKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChjaGFycy5pbmRleE9mKGNoKSAhPT0gLTEpIHsgcmV0dXJuZWQucHVzaChjaGlsZCk7IH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoY2hhcnMgPSBjaGFyU3BlYy5pbnZhbGlkQ2hhcnMpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGNoYXJzLmluZGV4T2YoY2gpID09PSAtMSkgeyByZXR1cm5lZC5wdXNoKGNoaWxkKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5lZDtcbiAgICAgIH1cblxuICAgICAgLyoqIElGIERFQlVHXG4gICAgICAsIGRlYnVnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNoYXJTcGVjID0gdGhpcy5jaGFyU3BlYyxcbiAgICAgICAgICAgIGRlYnVnID0gXCJbXCIsXG4gICAgICAgICAgICBjaGFycyA9IGNoYXJTcGVjLnZhbGlkQ2hhcnMgfHwgY2hhclNwZWMuaW52YWxpZENoYXJzO1xuXG4gICAgICAgIGlmIChjaGFyU3BlYy5pbnZhbGlkQ2hhcnMpIHsgZGVidWcgKz0gXCJeXCI7IH1cbiAgICAgICAgZGVidWcgKz0gY2hhcnM7XG4gICAgICAgIGRlYnVnICs9IFwiXVwiO1xuXG4gICAgICAgIGlmIChjaGFyU3BlYy5yZXBlYXQpIHsgZGVidWcgKz0gXCIrXCI7IH1cblxuICAgICAgICByZXR1cm4gZGVidWc7XG4gICAgICB9XG4gICAgICBFTkQgSUYgKiovXG4gICAgfTtcblxuICAgIC8qKiBJRiBERUJVR1xuICAgIGZ1bmN0aW9uIGRlYnVnKGxvZykge1xuICAgICAgY29uc29sZS5sb2cobG9nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWJ1Z1N0YXRlKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubmV4dFN0YXRlcy5tYXAoZnVuY3Rpb24obikge1xuICAgICAgICBpZiAobi5uZXh0U3RhdGVzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gXCIoIFwiICsgbi5kZWJ1ZygpICsgXCIgW2FjY2VwdGluZ10gKVwiOyB9XG4gICAgICAgIHJldHVybiBcIiggXCIgKyBuLmRlYnVnKCkgKyBcIiA8dGhlbj4gXCIgKyBuLm5leHRTdGF0ZXMubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMuZGVidWcoKSB9KS5qb2luKFwiIG9yIFwiKSArIFwiIClcIjtcbiAgICAgIH0pLmpvaW4oXCIsIFwiKVxuICAgIH1cbiAgICBFTkQgSUYgKiovXG5cbiAgICAvLyBTb3J0IHRoZSByb3V0ZXMgYnkgc3BlY2lmaWNpdHlcbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJHNvcnRTb2x1dGlvbnMoc3RhdGVzKSB7XG4gICAgICByZXR1cm4gc3RhdGVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gYi5zcGVjaWZpY2l0eS52YWwgLSBhLnNwZWNpZmljaXR5LnZhbDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkcmVjb2duaXplQ2hhcihzdGF0ZXMsIGNoKSB7XG4gICAgICB2YXIgbmV4dFN0YXRlcyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9c3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVzW2ldO1xuXG4gICAgICAgIG5leHRTdGF0ZXMgPSBuZXh0U3RhdGVzLmNvbmNhdChzdGF0ZS5tYXRjaChjaCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV4dFN0YXRlcztcbiAgICB9XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRvQ3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbihwcm90bykge1xuICAgICAgZnVuY3Rpb24gRigpIHt9XG4gICAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgICAgcmV0dXJuIG5ldyBGKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkUmVjb2duaXplUmVzdWx0cyhxdWVyeVBhcmFtcykge1xuICAgICAgdGhpcy5xdWVyeVBhcmFtcyA9IHF1ZXJ5UGFyYW1zIHx8IHt9O1xuICAgIH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFJlY29nbml6ZVJlc3VsdHMucHJvdG90eXBlID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRvQ3JlYXRlKHtcbiAgICAgIHNwbGljZTogQXJyYXkucHJvdG90eXBlLnNwbGljZSxcbiAgICAgIHNsaWNlOiAgQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgcHVzaDogICBBcnJheS5wcm90b3R5cGUucHVzaCxcbiAgICAgIGxlbmd0aDogMCxcbiAgICAgIHF1ZXJ5UGFyYW1zOiBudWxsXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJGZpbmRIYW5kbGVyKHN0YXRlLCBwYXRoLCBxdWVyeVBhcmFtcykge1xuICAgICAgdmFyIGhhbmRsZXJzID0gc3RhdGUuaGFuZGxlcnMsIHJlZ2V4ID0gc3RhdGUucmVnZXg7XG4gICAgICB2YXIgY2FwdHVyZXMgPSBwYXRoLm1hdGNoKHJlZ2V4KSwgY3VycmVudENhcHR1cmUgPSAxO1xuICAgICAgdmFyIHJlc3VsdCA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFJlY29nbml6ZVJlc3VsdHMocXVlcnlQYXJhbXMpO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9aGFuZGxlcnMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IGhhbmRsZXJzW2ldLCBuYW1lcyA9IGhhbmRsZXIubmFtZXMsIHBhcmFtcyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGo9MCwgbT1uYW1lcy5sZW5ndGg7IGo8bTsgaisrKSB7XG4gICAgICAgICAgcGFyYW1zW25hbWVzW2pdXSA9IGNhcHR1cmVzW2N1cnJlbnRDYXB0dXJlKytdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0LnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLmhhbmRsZXIsIHBhcmFtczogcGFyYW1zLCBpc0R5bmFtaWM6ICEhbmFtZXMubGVuZ3RoIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkYWRkU2VnbWVudChjdXJyZW50U3RhdGUsIHNlZ21lbnQpIHtcbiAgICAgIHNlZ21lbnQuZWFjaENoYXIoZnVuY3Rpb24oY2gpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIGN1cnJlbnRTdGF0ZSA9IGN1cnJlbnRTdGF0ZS5wdXQoY2gpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjdXJyZW50U3RhdGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWNvZGVRdWVyeVBhcmFtUGFydChwYXJ0KSB7XG4gICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNDAxL2ludGVyYWN0L2Zvcm1zLmh0bWwjaC0xNy4xMy40LjFcbiAgICAgIHBhcnQgPSBwYXJ0LnJlcGxhY2UoL1xcKy9nbSwgJyUyMCcpO1xuICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXJ0KTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbWFpbiBpbnRlcmZhY2VcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yb290U3RhdGUgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZSgpO1xuICAgICAgdGhpcy5uYW1lcyA9IHt9O1xuICAgIH07XG5cblxuICAgICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyLnByb3RvdHlwZSA9IHtcbiAgICAgIGFkZDogZnVuY3Rpb24ocm91dGVzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBjdXJyZW50U3RhdGUgPSB0aGlzLnJvb3RTdGF0ZSwgcmVnZXggPSBcIl5cIixcbiAgICAgICAgICAgIHNwZWNpZmljaXR5ID0ge30sXG4gICAgICAgICAgICBoYW5kbGVycyA9IFtdLCBhbGxTZWdtZW50cyA9IFtdLCBuYW1lO1xuXG4gICAgICAgIHZhciBpc0VtcHR5ID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9cm91dGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbaV0sIG5hbWVzID0gW107XG5cbiAgICAgICAgICB2YXIgc2VnbWVudHMgPSAkJHJvdXRlJHJlY29nbml6ZXIkJHBhcnNlKHJvdXRlLnBhdGgsIG5hbWVzLCBzcGVjaWZpY2l0eSk7XG5cbiAgICAgICAgICBhbGxTZWdtZW50cyA9IGFsbFNlZ21lbnRzLmNvbmNhdChzZWdtZW50cyk7XG5cbiAgICAgICAgICBmb3IgKHZhciBqPTAsIG09c2VnbWVudHMubGVuZ3RoOyBqPG07IGorKykge1xuICAgICAgICAgICAgdmFyIHNlZ21lbnQgPSBzZWdtZW50c1tqXTtcblxuICAgICAgICAgICAgaWYgKHNlZ21lbnQgaW5zdGFuY2VvZiAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50KSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgIGlzRW1wdHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gQWRkIGEgXCIvXCIgZm9yIHRoZSBuZXcgc2VnbWVudFxuICAgICAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFN0YXRlLnB1dCh7IHZhbGlkQ2hhcnM6IFwiL1wiIH0pO1xuICAgICAgICAgICAgcmVnZXggKz0gXCIvXCI7XG5cbiAgICAgICAgICAgIC8vIEFkZCBhIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzZWdtZW50IHRvIHRoZSBORkEgYW5kIHJlZ2V4XG4gICAgICAgICAgICBjdXJyZW50U3RhdGUgPSAkJHJvdXRlJHJlY29nbml6ZXIkJGFkZFNlZ21lbnQoY3VycmVudFN0YXRlLCBzZWdtZW50KTtcbiAgICAgICAgICAgIHJlZ2V4ICs9IHNlZ21lbnQucmVnZXgoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgaGFuZGxlciA9IHsgaGFuZGxlcjogcm91dGUuaGFuZGxlciwgbmFtZXM6IG5hbWVzIH07XG4gICAgICAgICAgaGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0VtcHR5KSB7XG4gICAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFN0YXRlLnB1dCh7IHZhbGlkQ2hhcnM6IFwiL1wiIH0pO1xuICAgICAgICAgIHJlZ2V4ICs9IFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFN0YXRlLmhhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgICAgIGN1cnJlbnRTdGF0ZS5yZWdleCA9IG5ldyBSZWdFeHAocmVnZXggKyBcIiRcIik7XG4gICAgICAgIGN1cnJlbnRTdGF0ZS5zcGVjaWZpY2l0eSA9IHNwZWNpZmljaXR5O1xuXG4gICAgICAgIGlmIChuYW1lID0gb3B0aW9ucyAmJiBvcHRpb25zLmFzKSB7XG4gICAgICAgICAgdGhpcy5uYW1lc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIHNlZ21lbnRzOiBhbGxTZWdtZW50cyxcbiAgICAgICAgICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGhhbmRsZXJzRm9yOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciByb3V0ZSA9IHRoaXMubmFtZXNbbmFtZV0sIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAoIXJvdXRlKSB7IHRocm93IG5ldyBFcnJvcihcIlRoZXJlIGlzIG5vIHJvdXRlIG5hbWVkIFwiICsgbmFtZSk7IH1cblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9cm91dGUuaGFuZGxlcnMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJvdXRlLmhhbmRsZXJzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuXG4gICAgICBoYXNSb3V0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gISF0aGlzLm5hbWVzW25hbWVdO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKG5hbWUsIHBhcmFtcykge1xuICAgICAgICB2YXIgcm91dGUgPSB0aGlzLm5hbWVzW25hbWVdLCBvdXRwdXQgPSBcIlwiO1xuICAgICAgICBpZiAoIXJvdXRlKSB7IHRocm93IG5ldyBFcnJvcihcIlRoZXJlIGlzIG5vIHJvdXRlIG5hbWVkIFwiICsgbmFtZSk7IH1cblxuICAgICAgICB2YXIgc2VnbWVudHMgPSByb3V0ZS5zZWdtZW50cztcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9c2VnbWVudHMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbaV07XG5cbiAgICAgICAgICBpZiAoc2VnbWVudCBpbnN0YW5jZW9mICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgIG91dHB1dCArPSBcIi9cIjtcbiAgICAgICAgICBvdXRwdXQgKz0gc2VnbWVudC5nZW5lcmF0ZShwYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG91dHB1dC5jaGFyQXQoMCkgIT09ICcvJykgeyBvdXRwdXQgPSAnLycgKyBvdXRwdXQ7IH1cblxuICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5xdWVyeVBhcmFtcykge1xuICAgICAgICAgIG91dHB1dCArPSB0aGlzLmdlbmVyYXRlUXVlcnlTdHJpbmcocGFyYW1zLnF1ZXJ5UGFyYW1zLCByb3V0ZS5oYW5kbGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGVRdWVyeVN0cmluZzogZnVuY3Rpb24ocGFyYW1zLCBoYW5kbGVycykge1xuICAgICAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5zb3J0KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJhbXNba2V5XTtcbiAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBwYWlyID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSk7XG4gICAgICAgICAgaWYgKCQkcm91dGUkcmVjb2duaXplciQkaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBqIDwgbDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBhcnJheVBhaXIgPSBrZXkgKyAnW10nICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKTtcbiAgICAgICAgICAgICAgcGFpcnMucHVzaChhcnJheVBhaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYWlyICs9IFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgIHBhaXJzLnB1c2gocGFpcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhaXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJyc7IH1cblxuICAgICAgICByZXR1cm4gXCI/XCIgKyBwYWlycy5qb2luKFwiJlwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHBhcnNlUXVlcnlTdHJpbmc6IGZ1bmN0aW9uKHF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgIHZhciBwYWlycyA9IHF1ZXJ5U3RyaW5nLnNwbGl0KFwiJlwiKSwgcXVlcnlQYXJhbXMgPSB7fTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBwYWlycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBwYWlyICAgICAgPSBwYWlyc1tpXS5zcGxpdCgnPScpLFxuICAgICAgICAgICAgICBrZXkgICAgICAgPSAkJHJvdXRlJHJlY29nbml6ZXIkJGRlY29kZVF1ZXJ5UGFyYW1QYXJ0KHBhaXJbMF0pLFxuICAgICAgICAgICAgICBrZXlMZW5ndGggPSBrZXkubGVuZ3RoLFxuICAgICAgICAgICAgICBpc0FycmF5ID0gZmFsc2UsXG4gICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgIGlmIChwYWlyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdmFsdWUgPSAndHJ1ZSc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vSGFuZGxlIGFycmF5c1xuICAgICAgICAgICAgaWYgKGtleUxlbmd0aCA+IDIgJiYga2V5LnNsaWNlKGtleUxlbmd0aCAtMikgPT09ICdbXScpIHtcbiAgICAgICAgICAgICAgaXNBcnJheSA9IHRydWU7XG4gICAgICAgICAgICAgIGtleSA9IGtleS5zbGljZSgwLCBrZXlMZW5ndGggLSAyKTtcbiAgICAgICAgICAgICAgaWYoIXF1ZXJ5UGFyYW1zW2tleV0pIHtcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtc1trZXldID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gcGFpclsxXSA/ICQkcm91dGUkcmVjb2duaXplciQkZGVjb2RlUXVlcnlQYXJhbVBhcnQocGFpclsxXSkgOiAnJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zW2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHF1ZXJ5UGFyYW1zO1xuICAgICAgfSxcblxuICAgICAgcmVjb2duaXplOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHZhciBzdGF0ZXMgPSBbIHRoaXMucm9vdFN0YXRlIF0sXG4gICAgICAgICAgICBwYXRoTGVuLCBpLCBsLCBxdWVyeVN0YXJ0LCBxdWVyeVBhcmFtcyA9IHt9LFxuICAgICAgICAgICAgaXNTbGFzaERyb3BwZWQgPSBmYWxzZTtcblxuICAgICAgICBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xuICAgICAgICAgIHZhciBxdWVyeVN0cmluZyA9IHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCk7XG4gICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKDAsIHF1ZXJ5U3RhcnQpO1xuICAgICAgICAgIHF1ZXJ5UGFyYW1zID0gdGhpcy5wYXJzZVF1ZXJ5U3RyaW5nKHF1ZXJ5U3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhdGggPSBkZWNvZGVVUkkocGF0aCk7XG5cbiAgICAgICAgLy8gREVCVUcgR1JPVVAgcGF0aFxuXG4gICAgICAgIGlmIChwYXRoLmNoYXJBdCgwKSAhPT0gXCIvXCIpIHsgcGF0aCA9IFwiL1wiICsgcGF0aDsgfVxuXG4gICAgICAgIHBhdGhMZW4gPSBwYXRoLmxlbmd0aDtcbiAgICAgICAgaWYgKHBhdGhMZW4gPiAxICYmIHBhdGguY2hhckF0KHBhdGhMZW4gLSAxKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoMCwgcGF0aExlbiAtIDEpO1xuICAgICAgICAgIGlzU2xhc2hEcm9wcGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaT0wLCBsPXBhdGgubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHN0YXRlcyA9ICQkcm91dGUkcmVjb2duaXplciQkcmVjb2duaXplQ2hhcihzdGF0ZXMsIHBhdGguY2hhckF0KGkpKTtcbiAgICAgICAgICBpZiAoIXN0YXRlcy5sZW5ndGgpIHsgYnJlYWs7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVORCBERUJVRyBHUk9VUFxuXG4gICAgICAgIHZhciBzb2x1dGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChpPTAsIGw9c3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBpZiAoc3RhdGVzW2ldLmhhbmRsZXJzKSB7IHNvbHV0aW9ucy5wdXNoKHN0YXRlc1tpXSk7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlcyA9ICQkcm91dGUkcmVjb2duaXplciQkc29ydFNvbHV0aW9ucyhzb2x1dGlvbnMpO1xuXG4gICAgICAgIHZhciBzdGF0ZSA9IHNvbHV0aW9uc1swXTtcblxuICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuaGFuZGxlcnMpIHtcbiAgICAgICAgICAvLyBpZiBhIHRyYWlsaW5nIHNsYXNoIHdhcyBkcm9wcGVkIGFuZCBhIHN0YXIgc2VnbWVudCBpcyB0aGUgbGFzdCBzZWdtZW50XG4gICAgICAgICAgLy8gc3BlY2lmaWVkLCBwdXQgdGhlIHRyYWlsaW5nIHNsYXNoIGJhY2tcbiAgICAgICAgICBpZiAoaXNTbGFzaERyb3BwZWQgJiYgc3RhdGUucmVnZXguc291cmNlLnNsaWNlKC01KSA9PT0gXCIoLispJFwiKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aCArIFwiL1wiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJCRyb3V0ZSRyZWNvZ25pemVyJCRmaW5kSGFuZGxlcihzdGF0ZSwgcGF0aCwgcXVlcnlQYXJhbXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyLnByb3RvdHlwZS5tYXAgPSAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRkZWZhdWx0O1xuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXIuVkVSU0lPTiA9ICcwLjEuOSc7XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0ID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXI7XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKCdyb3V0ZS1yZWNvZ25pemVyJywgZnVuY3Rpb24oKSB7IHJldHVybiAkJHJvdXRlJHJlY29nbml6ZXIkJGRlZmF1bHQ7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlWydleHBvcnRzJ10pIHtcbiAgICAgIG1vZHVsZVsnZXhwb3J0cyddID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydSb3V0ZVJlY29nbml6ZXInXSA9ICQkcm91dGUkcmVjb2duaXplciQkZGVmYXVsdDtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yb3V0ZS1yZWNvZ25pemVyLmpzLm1hcCIsInZhciBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZS5qcycpO1xuXG52YXIgTW9kdWxlcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzL01vZHVsZXMuanMnKTtcbnZhciBJbmplY3RhYmxlcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzL0luamVjdGFibGVzLmpzJyk7XG5cbnZhciByZWdpc3RlckJ1aWx0SW5zID0gcmVxdWlyZSgnLi9idWlsdGlucy9SZWdpc3Rlci5qcycpO1xuXG52YXIgTWltZW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlcyA9IE1vZHVsZXMoKTtcbiAgICB2YXIgaW5qZWN0YWJsZXMgPSBJbmplY3RhYmxlcygpO1xuXG4gICAgcmVnaXN0ZXJCdWlsdElucyhpbmplY3RhYmxlcyk7XG5cbiAgICBmdW5jdGlvbiBib290c3RyYXAoaW5qZWN0YWJsZU5hbWUpIHtcbiAgICAgICAgaWYgKCFpbmplY3RhYmxlTmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZpbmUgYW4gaW5qZWN0YWJsZSB0byBib290c3RyYXAhJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW1vZHVsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlcyBkb25cXCd0IGV4aXN0OiAnICsgbW9kdWxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpbmplY3RhYmxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlcyBkb25cXCd0IGV4aXN0OiAnICsgaW5qZWN0YWJsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluamVjdGFibGVzLmluc3RhbnRpYXRlKCk7XG5cbiAgICAgICAgbW9kdWxlcy5pbnN0YW50aWF0ZSgpO1xuXG4gICAgICAgIHZhciBlbnRyeUluamVjdGFibGUgPSBpbmplY3RhYmxlcy5nZXQoaW5qZWN0YWJsZU5hbWUpO1xuXG4gICAgICAgIGlmICghQm9vbGVhbihlbnRyeUluamVjdGFibGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGUgXCInICsgaW5qZWN0YWJsZU5hbWUgKyAnXCIgdG8gYm9vdHN0cmFwIG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVudHJ5SW5qZWN0YWJsZS5hcHBseShlbnRyeUluamVjdGFibGUsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIG1vZHVsZTogZnVuY3Rpb24obmFtZSwgZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICBpZiAoZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZHVsZXMuYWRkKG5ldyBNb2R1bGUoaW5qZWN0YWJsZXMsIG5hbWUsIGRlcGVuZGVuY2llcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbW9kdWxlcy5nZXQobmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJvb3RzdHJhcDogYm9vdHN0cmFwXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNaW1lbygpO1xuIiwiZnVuY3Rpb24gTW9kdWxlKGluamVjdGFibGVzLCBuYW1lLCBkZXBlbmRlbmNpZXMpIHtcbiAgICB2YXIgbW9kdWxlID0gdGhpcztcblxuICAgIHZhciB0b1J1biA9IFtdO1xuXG4gICAgdGhpcy4kbmFtZSA9IG5hbWU7XG4gICAgdGhpcy4kaW5qZWN0ID0gZGVwZW5kZW5jaWVzO1xuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUluamVjdGFibGUobmFtZSwgcGFyYW1ldGVycykge1xuICAgICAgICBpZiAoaW5qZWN0YWJsZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluamVjdGFibGU7XG5cbiAgICAgICAgaWYgKHBhcmFtZXRlcnMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgaW5qZWN0YWJsZSA9IHBhcmFtZXRlcnM7XG4gICAgICAgICAgICBpZiAoIWluamVjdGFibGUuJGluamVjdCkge1xuICAgICAgICAgICAgICAgIGluamVjdGFibGUuJGluamVjdCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGRlcGVuZGVuY2llcyA9IHBhcmFtZXRlcnMuc2xpY2UoMCwgLTEpO1xuICAgICAgICAgICAgaW5qZWN0YWJsZSA9IHBhcmFtZXRlcnMuc2xpY2UoLTEpWzBdO1xuICAgICAgICAgICAgaW5qZWN0YWJsZS4kaW5qZWN0ID0gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0YWJsZS4kbmFtZSA9IG5hbWU7XG5cbiAgICAgICAgcmV0dXJuIGluamVjdGFibGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkSW5qZWN0YWJsZShuYW1lLCBwYXJhbWV0ZXJzKSB7XG4gICAgICAgIGluamVjdGFibGVzLmFkZChwcmVwYXJlSW5qZWN0YWJsZShuYW1lLCBwYXJhbWV0ZXJzKSk7XG5cbiAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9XG5cbiAgICB0aGlzLmV4ZWN1dGVSdW4gPSBmdW5jdGlvbiBleGVjdXRlUnVuKCkge1xuICAgICAgICB0b1J1bi5mb3JFYWNoKGZ1bmN0aW9uKGluamVjdGFibGVOYW1lKSB7XG4gICAgICAgICAgICBpbmplY3RhYmxlcy5nZXQoaW5qZWN0YWJsZU5hbWUpKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKlxuICAgICAqIEkgZG9uJ3QgbGlrZSB0aGUgd3JhcHBlciBhbmQgYXV0by1nZW5lcmF0ZWQgbmFtZSwgYnV0IGZvciBub3cgSSBjYW4ndFxuICAgICAqIGNvbWUgdXAgd2l0aCBhIGJldHRlciBzb2x1dGlvbi4gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGUgcnVuLWZ1bmN0aW9uXG4gICAgICogbmVlZHMgdG8gd29yayB3aXRoIHRoZSBpbmplY3Rpb24gc3lzdGVtIChzaW5jZSBpdCBjYW4gaGF2ZSBvdGhlclxuICAgICAqIGluamVjdGFibGVzIGluamVjdGVkKSwgYW5kIHRoZSB3aG9sZSBzeXN0ZW0gaXNuJ3QgZGVzaWduZWQgdG8gZGVhbCB3aXRoXG4gICAgICogdW5uYW1lZCB0aGluZ3MuXG4gICAgICpcbiAgICAgKiBJbiBmYWN0LCBJIGZlZWwgdGhhdCBhbiBpbmplY3Rpb24gc3lzdGVtIHRoYXQgY2FuIGhhbmRsZSB1bm5hbWVkIGl0ZW1zXG4gICAgICogd291bGQgYmUgd3JvbmcuIEhvdyB3b3VsZCB5b3UgaWRlbnRpZnkgd2hhdCB0byBpbmplY3Q/IEhhdmluZyBuYW1lcyBmb3JcbiAgICAgKiBpbmplY3RhYmxlcyAob3IgYXQgbGVhc3QgSURzKSBpcyBhIGNvcmUgYXNwZWN0IG9mIGFuIGluamVjdGlvbiBzeXN0ZW0uXG4gICAgICpcbiAgICAgKiBTbyB0aGlzIHdvdWxkIGhhdmUgdG8gbGl2ZSBvdXRzaWRlIG9mIGl0LiBCdXQgdGhhdCBtZWFucyBoYXZpbmcgaXQncyBvd25cbiAgICAgKiBcIm1ha2Ugc3VyZSBhbGwgdGhpcyBpbmplY3RhYmxlc1wiIGV4aXN0IHN5c3RlbS4gVGhlbiB3ZSBjb3VsZCBqdXN0IGdldCB0aGVcbiAgICAgKiBuYW1lZCBpbmplY3RhYmxlcyB0aGUgcnVuLWZ1bmN0aW9uIG5lZWRzIGFuZCBjYWxsIHRoZSBydW4tZnVuY3Rpb24gd2l0aFxuICAgICAgKiB0aG9zZS5cbiAgICAgICpcbiAgICAgICogSSBjYW4ndCB0aGluayBvZiBhIGdvb2Qgd2F5IHRvIGRlLWR1cGxpY2F0ZWQgdGhhdCBkZXBlbmRlbmN5IHJlc29sdXRpb25cbiAgICAgICogc3lzdGVtIHRob3VnaCwgc28gdGhlcmUnZCBiZSBvbmUgZm9yIGFsbCBuYW1lZCBpbmplY3RhYmxlcyBhbmQgb25lIGZvclxuICAgICAgKiB0aGUgcnVuLWZ1bmN0aW9ucy5cbiAgICAgICpcbiAgICAgICogSSBkb24ndCBwbGFuIG9uIGhhdmluZyBvdGhlciB1bm5hbWVkIGluamVjdGFibGVzLCBzbyBJIGZlZWwgdGhhdCBlZmZvcnRcbiAgICAgICogd291bGQgYmUgd2FzdGVkLiBIZW5jZSB0aGUgXCJoYWNrXCIgaGVyZSB3aXRoIGFuIGF1dG8tZ2VuZXJhdGVkIG5hbWUgYW5kXG4gICAgICAqIGEgd3JhcHBlciB0aGF0IGV4ZWN1dGVzIHRoZSBydW4tZnVuY3Rpb24gd2l0aCBwYXNzLXRocm91Z2ggYXJndW1lbnRzLlxuICAgICAqL1xuICAgIHRoaXMucnVuID0gZnVuY3Rpb24ocGFyYW1ldGVycykge1xuICAgICAgICB2YXIgbmFtZSA9IG1vZHVsZS4kbmFtZSArICctcnVuLicgKyB0b1J1bi5sZW5ndGg7XG4gICAgICAgIHRvUnVuLnB1c2gobmFtZSk7XG5cbiAgICAgICAgdmFyIHByb3ZpZGVyID0gZnVuY3Rpb24gcHJvdmlkZXJSdW4oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1ldGVycyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbWV0ZXJzLmFwcGx5KHBhcmFtZXRlcnMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0RW50cnkgPSBwYXJhbWV0ZXJzLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RFbnRyeS5hcHBseShsYXN0RW50cnksIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAocGFyYW1ldGVycyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBwcm92aWRlci4kaW5qZWN0ID0gcGFyYW1ldGVycy4kaW5qZWN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvdmlkZXIuJGluamVjdCA9IHBhcmFtZXRlcnMuc2xpY2UoMCwgLTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkSW5qZWN0YWJsZShuYW1lLCBwcm92aWRlcik7XG5cbiAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9O1xuXG4gICAgdGhpcy5mYWN0b3J5ID0gYWRkSW5qZWN0YWJsZTtcbiAgICB0aGlzLmNvbXBvbmVudCA9IGFkZEluamVjdGFibGU7XG4gICAgdGhpcy52YWx1ZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBhZGRJbmplY3RhYmxlKG5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlOyIsInZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9Qcm9taXNlLmpzJyk7XG5cbnZhciBOb2RlSHR0cCA9IG51bGw7XG52YXIgTm9kZUh0dHBzID0gbnVsbDtcblxuZnVuY3Rpb24galF1ZXJ5TGlrZVJlcXVlc3QoalF1ZXJ5TGlrZSwgY29uZmlnLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiByZXNwb25zZVRvQW5ndWxhclJlc3BvbnNlKGRhdGEsIF8sIGpxWEhSKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgc3RhdHVzOiBqcVhIUi5zdGF0dXMsIC8vIHJlc3BvbnNlIGNvZGUsXG4gICAgICAgICAgICBoZWFkZXJzOiBqcVhIUi5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSwvLyBoZWFkZXJzLFxuICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiBqcVhIUi5zdGF0dXNUZXh0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xuICAgICAgICByZXNvbHZlKHJlc3BvbnNlVG9Bbmd1bGFyUmVzcG9uc2UoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihqcVhIUiwgdGV4dFN0YXR1cykge1xuICAgICAgICByZWplY3QocmVzcG9uc2VUb0FuZ3VsYXJSZXNwb25zZSh7fSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICBqUXVlcnlMaWtlLmFqYXgoe1xuICAgICAgICBtZXRob2Q6IGNvbmZpZy5tZXRob2QgfHwgJ0dFVCcsXG4gICAgICAgIGRhdGE6IGNvbmZpZy5wYXJhbXMgfHwge30sXG4gICAgICAgIGhlYWRlcnM6IGNvbmZpZy5oZWFkZXJzIHx8IHt9LFxuICAgICAgICB1cmw6IGNvbmZpZy51cmwgfHwge31cbiAgICB9KS50aGVuKHN1Y2Nlc3MsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24galF1ZXJ5UmVxdWVzdCgkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGpRdWVyeUxpa2VSZXF1ZXN0KCR3aW5kb3cualF1ZXJ5LCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB6ZXB0b1JlcXVlc3QoJHdpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBqUXVlcnlMaWtlUmVxdWVzdCgkd2luZG93LlplcHRvLCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub2RlUmVxdWVzdChjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICghTm9kZUh0dHApIHtcbiAgICAgICAgTm9kZUh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG4gICAgfVxuICAgIGlmICghTm9kZUh0dHBzKSB7XG4gICAgICAgIE5vZGVIdHRwcyA9IHJlcXVpcmUoJ2h0dHBzJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlnVG9Ob2RlKGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLmhvc3QgJiYgY29uZmlnLmhvc3QuaW5kZXhPZignOicpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGhvc3RQYXJ0cyA9IGNvbmZpZy5ob3N0LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IGhvc3RQYXJ0c1swXTtcbiAgICAgICAgICAgIHZhciBwb3J0ID0gaG9zdFBhcnRzWzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhvc3QgPSBjb25maWcuaG9zdDtcbiAgICAgICAgICAgIHZhciBwb3J0ID0gODA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kOiBjb25maWcubWV0aG9kIHx8ICdHRVQnLFxuICAgICAgICAgICAgcGF0aDogY29uZmlnLnByb3RvY29sICsgJzovLycgKyBjb25maWcuaG9zdCArIGNvbmZpZy51cmwsXG4gICAgICAgICAgICBoZWFkZXJzOiBjb25maWcuaGVhZGVycyB8fCB7fSxcbiAgICAgICAgICAgIGhvc3Q6IGhvc3QsXG4gICAgICAgICAgICBwb3J0OiBwb3J0LFxuICAgICAgICAgICAgcHJvdG9jb2w6IGNvbmZpZy5wcm90b2NvbCArICc6J1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3dpdGNoQnlQcm90b2NvbCgpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5wcm90b2NvbCA9PT0gJ2h0dHAnKSB7XG4gICAgICAgICAgICByZXR1cm4gTm9kZUh0dHA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gTm9kZUh0dHBzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlcXVlc3QgPSBzd2l0Y2hCeVByb3RvY29sKCkucmVxdWVzdChjb25maWdUb05vZGUoY29uZmlnKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcmVzcG9uc2Uuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblxuICAgICAgICB2YXIgYm9keSA9ICcnO1xuICAgICAgICByZXNwb25zZS5vbignZGF0YScsIGZ1bmN0aW9uKGNodW5rKSB7XG4gICAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3BvbnNlLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXNwb25zZS5vbignZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogalF1ZXJ5IHdpbGwgcGFyc2UgSlNPTiByZXBsaWVzIGF1dG9tYXRpY2FsbHksIHNvIHJlcGxpY2F0ZSB0aGF0XG4gICAgICAgICAgICAgKiBiZWhhdmlvdXIgZm9yIG5vZGVqc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuaGVhZGVyc1snY29udGVudC10eXBlJ10gJiYgcmVzcG9uc2UuaGVhZGVyc1snY29udGVudC10eXBlJ10ubWF0Y2goL15hcHBsaWNhdGlvblxcL2pzb24vaSkpIHtcbiAgICAgICAgICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgZGF0YTogYm9keSxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzLFxuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXNDb2RlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgIHJlcXVlc3Qud3JpdGUoT2JqZWN0LmtleXMoY29uZmlnLnBhcmFtcykubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGNvbmZpZy5wYXJhbXNba2V5XSk7XG4gICAgICAgIH0pLmpvaW4oJyYnKSk7XG4gICAgfVxuXG4gICAgcmVxdWVzdC5lbmQoKTtcbn1cblxuZnVuY3Rpb24gdmVuZG9yU3BlY2lmaWNSZXF1ZXN0KCR3aW5kb3cpIHtcbiAgICBpZiAoJHdpbmRvdy4kZmFrZSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gbm9kZVJlcXVlc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCR3aW5kb3cualF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4galF1ZXJ5UmVxdWVzdCgkd2luZG93KTtcbiAgICAgICAgfSBlbHNlIGlmICgkd2luZG93LlplcHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gemVwdG9SZXF1ZXN0KCR3aW5kb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdXBwb3J0ZWQgYWpheCBsaWJyYXJ5IGZvdW5kIChqUXVlcnkgb3IgWmVwdG8pJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQ29uZmlnIGFjY2VwdHM6XG4gKlxuICogbWV0aG9kOiBIVFRQIG1ldGhvZCBmb3IgcmVxdWVzdFxuICogcGFyYW1zOiBoYXNoIG9mIEdFVCBwYXJhbWV0ZXJzXG4gKiBoZWFkZXJzOiBIVFRQIGhlYWRlcnNcbiAqIHVybDogVVJMIHRvIHJlcXVlc3RcbiAqXG4gKiBAcGFyYW0gJHdpbmRvd1xuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnMge3Byb21pc2V8KnxyLnByb21pc2V8RnVuY3Rpb258YX1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIdHRwKCR3aW5kb3csIGNvbmZpZykge1xuICAgIHZhciBkZWZlciA9IFByb21pc2UoKS5kZWZlcigpO1xuXG4gICAgdmVuZG9yU3BlY2lmaWNSZXF1ZXN0KCR3aW5kb3cpKGNvbmZpZywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkZWZlci5yZXNvbHZlKGRhdGEpO1xuICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkd2luZG93KSB7XG4gICAgZnVuY3Rpb24gZG9IdHRwKGNvbmZpZykge1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IdHRwLiRob3N0ID0gJyc7XG4gICAgZG9IdHRwLiRwcm90b2NvbCA9ICdodHRwcyc7XG5cbiAgICBkb0h0dHAuZ2V0ID0gZnVuY3Rpb24odXJsLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gSHR0cCgkd2luZG93LCBjb25maWcpO1xuICAgIH07XG4gICAgZG9IdHRwLnBvc3QgPSBmdW5jdGlvbih1cmwsIGNvbmZpZykge1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgcmV0dXJuIEh0dHAoJHdpbmRvdywgY29uZmlnKTtcbiAgICB9O1xuICAgIGRvSHR0cC5wdXQgPSBmdW5jdGlvbih1cmwsIGNvbmZpZykge1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BVVCc7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gSHR0cCgkd2luZG93LCBjb25maWcpO1xuICAgIH07XG4gICAgZG9IdHRwLmRlbGV0ZSA9IGZ1bmN0aW9uKHVybCwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnREVMRVRFJztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIHJldHVybiBIdHRwKCR3aW5kb3csIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIHJldHVybiBkb0h0dHA7XG59OyIsImZ1bmN0aW9uIERlZmVycmVkKGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlc29sdmVkID0gZmFsc2U7XG4gICAgdmFyIHJlc29sdmVkVmFsdWU7XG5cbiAgICB2YXIgcmVzb2x2ZUNhbGxiYWNrcyA9IFtdO1xuICAgIHZhciByZWplY3RDYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgbm90aWZ5Q2FsbGJhY2tzID0gW107XG5cbiAgICB2YXIgcHJvbWlzZSA9IHtcbiAgICAgICAgdGhlbjogZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZCAmJiBvblJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICBvblJlc29sdmUocmVzb2x2ZWRWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmVDYWxsYmFja3MucHVzaChvblJlc29sdmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob25SZWplY3QpIHtcbiAgICAgICAgICAgICAgICByZWplY3RDYWxsYmFja3MucHVzaChvblJlamVjdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvbk5vdGlmeSkge1xuICAgICAgICAgICAgICAgIG5vdGlmeUNhbGxiYWNrcy5wdXNoKG9uTm90aWZ5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHJlc29sdmUgPSBmdW5jdGlvbihyZXNvbHV0aW9uKSB7XG4gICAgICAgIHJlc29sdmVDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzb2x1dGlvbik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgdmFyIHJlamVjdCA9IGZ1bmN0aW9uKHJlamVjdGlvblJlYXNvbikge1xuICAgICAgICByZWplY3RDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVqZWN0aW9uUmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgbm90aWZ5ID0gZnVuY3Rpb24obm90aWZpY2F0aW9uKSB7XG4gICAgICAgIG5vdGlmeUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhub3RpZmljYXRpb24pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc29sdmUsIHJlamVjdCwgbm90aWZ5KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgICByZWplY3Q6IHJlamVjdCxcbiAgICAgICAgbm90aWZ5OiBub3RpZnksXG4gICAgICAgIHByb21pc2U6IHByb21pc2VcbiAgICB9O1xufVxuXG5mdW5jdGlvbiAkcShjYWxsYmFjaykge1xuICAgIHJldHVybiAobmV3IERlZmVycmVkKGNhbGxiYWNrKSkucHJvbWlzZTtcbn1cblxuJHEuZGVmZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERlZmVycmVkKCk7XG59O1xuXG4kcS5hbGwgPSBmdW5jdGlvbihwcm9taXNlcykge1xuICAgIGlmICghcHJvbWlzZXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb21pc2VzIG5lZWQgdG8gYmUgcGFzc2VkIHRvICRxLmFsbCBpbiBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgcmVzb2x1dGlvbnMgPSBbXTtcbiAgICB2YXIgaGFzUmVqZWN0aW9ucyA9IGZhbHNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XG5cbiAgICBmdW5jdGlvbiBjaGVja0NvbXBsZXRlKCkge1xuICAgICAgICBpZiAoY291bnRlciA9PT0gcHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzUmVqZWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc29sdXRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb21pc2VzLmZvckVhY2goZnVuY3Rpb24ocHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHJlc29sdXRpb24pIHtcbiAgICAgICAgICAgIHJlc29sdXRpb25zW2luZGV4XSA9IHJlc29sdXRpb247XG4gICAgICAgICAgICArK2NvdW50ZXI7XG4gICAgICAgICAgICBjaGVja0NvbXBsZXRlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaGFzUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgICAgICAgICArK2NvdW50ZXI7XG4gICAgICAgICAgICBjaGVja0NvbXBsZXRlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkcTtcbn07IiwidmFyIFByb21pc2UgPSByZXF1aXJlKCcuL1Byb21pc2UuanMnKTtcbnZhciBSb3V0aW5nID0gcmVxdWlyZSgnLi9Sb3V0aW5nLmpzJyk7XG52YXIgSHR0cCA9IHJlcXVpcmUoJy4vSHR0cC5qcycpO1xuXG5mdW5jdGlvbiBXaW5kb3coKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBub09wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAkZmFrZTogdHJ1ZSxcbiAgICAgICAgICAgIG9ucG9wc3RhdGU6IG5vT3AsXG4gICAgICAgICAgICBvbmNsaWNrOiBub09wLFxuICAgICAgICAgICAgb25sb2FkOiBub09wLFxuICAgICAgICAgICAgaGlzdG9yeToge1xuICAgICAgICAgICAgICAgIHB1c2hTdGF0ZTogbm9PcCxcbiAgICAgICAgICAgICAgICByZXBsYWNlU3RhdGU6IG5vT3BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2luZG93O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluamVjdGFibGVzKSB7XG4gICAgV2luZG93LiRuYW1lID0gJyR3aW5kb3cnO1xuICAgIFdpbmRvdy4kaW5qZWN0ID0gW107XG5cbiAgICBpbmplY3RhYmxlcy5hZGQoV2luZG93KTtcblxuICAgIFJvdXRpbmcuQ29udGV4dC4kbmFtZSA9ICckY29udGV4dCc7XG4gICAgUm91dGluZy5Db250ZXh0LiRpbmplY3QgPSBbXTtcblxuICAgIFJvdXRpbmcuUm91dGluZy4kbmFtZSA9ICckcm91dGluZyc7XG4gICAgUm91dGluZy5Sb3V0aW5nLiRpbmplY3QgPSBbJyR3aW5kb3cnXTtcblxuICAgIGluamVjdGFibGVzLmFkZChSb3V0aW5nLkNvbnRleHQpO1xuICAgIGluamVjdGFibGVzLmFkZChSb3V0aW5nLlJvdXRpbmcpO1xuXG4gICAgUHJvbWlzZS4kbmFtZSA9ICckcSc7XG4gICAgUHJvbWlzZS4kaW5qZWN0ID0gW107XG5cbiAgICBpbmplY3RhYmxlcy5hZGQoUHJvbWlzZSk7XG5cbiAgICBIdHRwLiRuYW1lID0gJyRodHRwJztcbiAgICBIdHRwLiRpbmplY3QgPSBbJyR3aW5kb3cnXTtcbiAgICBpbmplY3RhYmxlcy5hZGQoSHR0cCk7XG59O1xuIiwidmFyIFJvdXRlUmVjb2duaXplciA9IHJlcXVpcmUoJ3JvdXRlLXJlY29nbml6ZXInKTtcbnZhciBwYXJzZVVyaSA9IHJlcXVpcmUoJ3BhcnNldXJpJyk7XG5cbnZhciBjb250ZXh0ID0ge307XG5mdW5jdGlvbiBDb250ZXh0KCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBSb3V0aW5nKCR3aW5kb3cpIHtcbiAgICB2YXIgcm91dGluZyA9IG5ldyBSb3V0ZVJlY29nbml6ZXIoKTtcbiAgICB2YXIgZGVmYXVsdFJvdXRlO1xuXG4gICAgZnVuY3Rpb24gcHJldmVudERlZmF1bHQoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEludGVybmV0IGV4cGxvcmVyIHN1cHBvcnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZShlbGVtZW50LCBhdHRyaWJ1dGUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnRbYXR0cmlidXRlXSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRbYXR0cmlidXRlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQuYXR0cmlidXRlc1tpXS5ub2RlTmFtZSA9PT0gYXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBlbGVtZW50LmF0dHJpYnV0ZXNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvRGVmYXVsdFJvdXRlKHJvdXRlKSB7XG4gICAgICAgIGlmIChyb3V0ZSkge1xuICAgICAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCAnJywgcm91dGUpO1xuICAgICAgICAgICAgZG9Sb3V0aW5nKHJvdXRlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBxdWVyeVRvRGljdChxdWVyeSkge1xuICAgICAgICB2YXIgZGljdCA9IHt9O1xuICAgICAgICBxdWVyeS5zcGxpdCgnJicpLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gcGFydC5zcGxpdCgnPScpLm1hcChkZWNvZGVVUklDb21wb25lbnQpO1xuICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgICAgIGRpY3RbcGFydFswXV0gPSBwYXJ0WzFdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGljdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb1JvdXRpbmcodXJsLCBkb0RlZmF1bHQpIHtcbiAgICAgICAgdmFyIHVybFBhcnRzID0gcGFyc2VVcmkodXJsKTtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gcm91dGluZy5yZWNvZ25pemUodXJsUGFydHMucGF0aCk7XG4gICAgICAgIGlmIChoYW5kbGVycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxQYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBoYW5kbGVycy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVRvRGljdCh1cmxQYXJ0cy5xdWVyeSlcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbaV0uaGFuZGxlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRvRGVmYXVsdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGRvRGVmYXVsdFJvdXRlKGRlZmF1bHRSb3V0ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnb3RvUm91dGUocm91dGUpIHtcbiAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLFxuICAgICAgICAgICAgJycsXG4gICAgICAgICAgICByb3V0ZSk7XG4gICAgICAgIGRvUm91dGluZyhyb3V0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwbGFjZVJvdXRlKHJvdXRlKSB7XG4gICAgICAgICR3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCxcbiAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgcm91dGUpO1xuXG4gICAgICAgIGRvUm91dGluZyhyb3V0ZSk7XG4gICAgfVxuXG4gICAgJHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvUm91dGluZygkd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgIH07XG5cbiAgICAkd2luZG93Lm9uY2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogUmVsYXRlZCB0byBTYWZhcmkgZmlyaW5nIGV2ZW50cyBvbiB0ZXh0IG5vZGVzXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnZGF0YS1pbnRlcm5hbCcpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwcmV2ZW50RGVmYXVsdChldmVudCk7XG5cbiAgICAgICAgICAgIGlmIChnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnZGF0YS1uby1oaXN0b3J5JykgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlUm91dGUoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2hyZWYnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvdG9Sb3V0ZShnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnaHJlZicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBkb1JvdXRpbmcoJHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgJ2RlZmF1bHQnOiBmdW5jdGlvbihuZXdEZWZhdWx0Um91dGUpIHtcbiAgICAgICAgICAgIGRlZmF1bHRSb3V0ZSA9IG5ld0RlZmF1bHRSb3V0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3NldCc6IGZ1bmN0aW9uKHJvdXRlLCB0YXJnZXQsIGluamVjdGFibGUsIG5hbWUpIHtcbiAgICAgICAgICAgIHJvdXRpbmcuYWRkKFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHJvdXRlLFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBodG1sO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5qZWN0YWJsZS5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gaW5qZWN0YWJsZS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCA9IGluamVjdGFibGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXQpLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLCB7J2FzJzogbmFtZX0pO1xuICAgICAgICB9LFxuICAgICAgICAnZ290byc6IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgICAgICBnb3RvUm91dGUocm91dGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnQ29udGV4dCc6IENvbnRleHQsXG4gICAgJ1JvdXRpbmcnOiBSb3V0aW5nXG59OyIsIi8vdmFyIERlcGVuZGVuY3lSZXNvbHZlciA9IHJlcXVpcmUoJy4vRGVwZW5kZW5jeVJlc29sdmVyLmpzJyk7XG52YXIgR3JhcGggPSByZXF1aXJlKCcuL0dyYXBoLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcmV0dXJucyB7eyRuYW1lOiBzdHJpbmcsIHJlZ2lzdGVyOiByZWdpc3RlciwgaGFzQWxsRGVwZW5kZW5jaWVzOlxuICogICAgIGhhc0FsbERlcGVuZGVuY2llcywgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlLCBnZXRJbnN0YW5jZTogZ2V0SW5zdGFuY2V9fVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERlcGVuZGVuY3lNYW5hZ2VyKG5hbWUpIHtcbiAgICB2YXIgX3Byb3ZpZGVycyA9IHt9O1xuICAgIHZhciBfaW5zdGFuY2VzID0ge307XG4gICAgdmFyIF9ncmFwaCA9IG5ldyBHcmFwaCgpO1xuXG4gICAgdmFyIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSB1bmRlZmluZWQ7XG5cbiAgICBmdW5jdGlvbiByZWdpc3RlcihlbnRpdHkpIHtcbiAgICAgICAgaWYgKCFlbnRpdHkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZW50aXR5IHRvIHJlZ2lzdGVyIHdhcyBnaXZlbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbnRpdHkuJG5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW50aXR5IFwiJyArIGVudGl0eS4kbmFtZSArICdcIiBpcyBtaXNzaW5nIHByb3BlcnR5ICRuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWVudGl0eS4kaW5qZWN0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eSBcIicgKyBlbnRpdHkuJG5hbWUgKyAnXCIgaXMgbWlzc2luZyBwcm9wZXJ0eSAkaW5qZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoX3Byb3ZpZGVyc1tlbnRpdHkuJG5hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eSBcIicgKyBlbnRpdHkuJG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgX3Byb3ZpZGVyc1tlbnRpdHkuJG5hbWVdID0gZW50aXR5O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAqIE5hbWUgbWlnaHQndmUgYmVlbiByZWdpc3RlcmVkIGFzIGEgZGVwZW5kZW5jeSBvZiBhbm90aGVyIGVudGl0eVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFfZ3JhcGguaGFzTm9kZVZhbHVlKGVudGl0eS4kbmFtZSkpIHtcbiAgICAgICAgICAgIF9ncmFwaC5hZGQoZW50aXR5LiRuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVudGl0eS4kaW5qZWN0LmZvckVhY2goZnVuY3Rpb24oZGVwZW5kZW5jeSkge1xuICAgICAgICAgICAgaWYgKCFfZ3JhcGguaGFzTm9kZVZhbHVlKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgICAgX2dyYXBoLmFkZChkZXBlbmRlbmN5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX2dyYXBoLmFkZEVkZ2UoZGVwZW5kZW5jeSwgZW50aXR5LiRuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgaWYgKF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb3ZpZGVyc0luamVjdHMgPSBPYmplY3Qua2V5cyhfcHJvdmlkZXJzKS5tYXAoZnVuY3Rpb24ocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Byb3ZpZGVyc1twcm92aWRlck5hbWVdLiRpbmplY3Q7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSBbXS5jb25jYXQuYXBwbHkoW10sIHByb3ZpZGVyc0luamVjdHMpLmZpbHRlcihmdW5jdGlvbihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiAhQm9vbGVhbihfcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkubGVuZ3RoID09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFudGlhdGUoKSB7XG4gICAgICAgIF9ncmFwaC5nZXROb2Rlc1RvcG9sb2dpY2FsKCkuZm9yRWFjaChmdW5jdGlvbihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm92aWRlciA9IF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXTtcblxuICAgICAgICAgICAgX2luc3RhbmNlc1twcm92aWRlck5hbWVdID0gcHJvdmlkZXIuYXBwbHkocHJvdmlkZXIsIHByb3ZpZGVyLiRpbmplY3QubWFwKGZ1bmN0aW9uKGRlcGVuZGVuY3lOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pbnN0YW5jZXNbZGVwZW5kZW5jeU5hbWVdO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQcm92aWRlcihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRJbnN0YW5jZShwcm92aWRlck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9pbnN0YW5jZXNbcHJvdmlkZXJOYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAkbmFtZTogbmFtZSxcbiAgICAgICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxuICAgICAgICBoYXNBbGxEZXBlbmRlbmNpZXM6IGhhc0FsbERlcGVuZGVuY2llcyxcbiAgICAgICAgZ2V0TWlzc2luZ0RlcGVuZGVuY2llczogZ2V0TWlzc2luZ0RlcGVuZGVuY2llcyxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlLFxuICAgICAgICBnZXRQcm92aWRlcjogZ2V0UHJvdmlkZXIsXG4gICAgICAgIGdldEluc3RhbmNlOiBnZXRJbnN0YW5jZSxcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBwcm92aWRlcnM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoX3Byb3ZpZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5hbWUsIF9wcm92aWRlcnNbbmFtZV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc3RhbmNlczogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhfaW5zdGFuY2VzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmFtZSwgX2luc3RhbmNlc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcmV0dXJucyB7RGVwZW5kZW5jeU1hbmFnZXJ9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBuZXcgRGVwZW5kZW5jeU1hbmFnZXIobmFtZSk7XG59OyIsInZhciBOb2RlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgc3RyaW5ncyBhcmUgYWNjZXB0ZWQgYXMgbm9kZSB2YWx1ZXMnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cblxudmFyIEVkZ2UgPSBmdW5jdGlvbihub2RlRnJvbSwgbm9kZVRvKSB7XG4gICAgdGhpcy5faWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KTtcbiAgICB0aGlzLl9mcm9tID0gbm9kZUZyb207XG4gICAgdGhpcy5fdG8gPSBub2RlVG87XG59O1xuXG52YXIgbWFrZU5vZGVJZGVudGlmaWVyID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG4gICAgcmV0dXJuIG5vZGUxLl9pZCArICc6JyArIG5vZGUyLl9pZDtcbn07XG5cbkVkZ2UucHJvdG90eXBlLmdldE5vZGVJZGVudGlmaWVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG1ha2VOb2RlSWRlbnRpZmllcih0aGlzLl9mcm9tLCB0aGlzLl90byk7XG59O1xuXG4vKipcbiAqIERpcmVjdGVkIGdyYXBoIHRvIG9yZGVyIG5vZGVzIGJ5IGRlcGVuZGVuY2llcy4gT25seSBoYW5kbGVzIHZhbHVlcyB3aG9zZVxuICogLnRvU3RyaW5nKCkgZnVuY3Rpb24gcmV0dXJucyB1bmlxdWUgdmFsdWVzLiBGYXZvcnMgcHJlLWNvbXB1dGVkIGxvb2t1cFxuICogdGFibGVzIG92ZXIgbG9va3VwcyBhdCBzb3J0IHRpbWUuIE1vc3QgbWFjaGluZXMgaGF2ZSBsb3RzIG9mIHJhbSBhbmRcbiAqIGVzcGVjaWFsbHkgb24gbW9iaWxlIHRoZSBDUFUgaXMgbW9yZSByZXN0cmljdGVkLiBVc2luZyBtb3JlIHJhbSBhbmQgbGVzc1xuICogQ1BVIGN5Y2xlcyBpcyBwcmVmZXJhYmxlIGluIHRob3NlIGNvbmRpdGlvbnMsIGFsdGhvdWdoIGl0IHNob3VsZCBoYXJkbHlcbiAqIG1hdHRlciBzaW5jZSBtb3N0IGRlcGVuZGVuY3kgZ3JhcGhzICh3aGljaCB0aGlzIGltcGxlbWVudGF0aW9uIGlzIGZvY3VzZWRcbiAqIG9uKSBzaG91bGRuJ3QgZXhjZWVkIGEgZmV3IGh1bmRyZWQgbm9kZXMuXG4gKlxuICogQHJldHVybnMge3thZGQ6IEZ1bmN0aW9uLCBhZGRFZGdlOiBGdW5jdGlvbiwgaGFzTm9kZVZhbHVlOiBGdW5jdGlvbixcbiAqICAgICBnZXROb2Rlc1RvcG9sb2dpY2FsOiBGdW5jdGlvbn19XG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIEdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9ub2RlcyA9IFtdO1xuICAgIHZhciBfbm9kZXNCeUlkID0ge307XG4gICAgdmFyIF9ub2Rlc0J5VmFsdWUgPSB7fTtcbiAgICB2YXIgX3plcm9JbmdyZWVOb2RlcyA9IFtdO1xuICAgIHZhciBfZWRnZXMgPSBbXTtcbiAgICB2YXIgX2VkZ2VzQnlOb2RlcyA9IHt9O1xuICAgIHZhciBfZWRnZXNCeVRvID0ge307XG4gICAgdmFyIF9lZGdlc0J5RnJvbSA9IHt9O1xuXG4gICAgLypcbiAgICAgKiBUaGUgY3VycmVudCB0b3BvbG9naWNhbCBzb3J0IGltcGxlbWVudGF0aW9uIG11dGF0ZXMgdGhlIGdyYXBoLCBhZnRlclxuICAgICAqIHdoaWNoIGl0J3MgdW51c2FibGUuIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHRvIGNsZWFuIHRoZSBlbnRpcmUgZ3JhcGhcbiAgICAgKiB1cCwgcmVtb3ZpbmcgYW55IGRhbmdsaW5nIGRhdGEgdGhhdCBtaWdodCBiZSBsZWZ0IGFmdGVyIHRoZSBzb3J0LlxuICAgICAqL1xuICAgIHZhciByZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBfbm9kZXMgPSBbXTtcbiAgICAgICAgX25vZGVzQnlJZCA9IHt9O1xuICAgICAgICBfbm9kZXNCeVZhbHVlID0ge307XG4gICAgICAgIF96ZXJvSW5ncmVlTm9kZXMgPSBbXTtcbiAgICAgICAgX2VkZ2VzID0gW107XG4gICAgICAgIF9lZGdlc0J5Tm9kZXMgPSB7fTtcbiAgICAgICAgX2VkZ2VzQnlUbyA9IHt9O1xuICAgICAgICBfZWRnZXNCeUZyb20gPSB7fTtcbiAgICB9O1xuXG4gICAgdmFyIGFkZE5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChfbm9kZXNCeVZhbHVlW25vZGUudmFsdWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0R1cGxpY2F0ZSB2YWx1ZXMgbm90IGFsbG93ZWQuIE5vZGUgd2l0aCB2YWx1ZSBcIicgKyBub2RlLnZhbHVlICsgJ1wiIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBfbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgX25vZGVzQnlJZFtub2RlLl9pZF0gPSBub2RlO1xuICAgICAgICBfbm9kZXNCeVZhbHVlW25vZGUudmFsdWVdID0gbm9kZTtcblxuICAgICAgICBfemVyb0luZ3JlZU5vZGVzLnB1c2gobm9kZSk7XG4gICAgfTtcblxuICAgIHZhciBhZGRFZGdlID0gZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICBpZiAoX2VkZ2VzQnlOb2Rlc1tlZGdlLmdldE5vZGVJZGVudGlmaWVyKCldKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfZWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgX2VkZ2VzQnlOb2Rlc1tlZGdlLmdldE5vZGVJZGVudGlmaWVyKCldID0gZWRnZTtcblxuICAgICAgICBpZiAoIV9lZGdlc0J5RnJvbVtlZGdlLl9mcm9tLl9pZF0pIHtcbiAgICAgICAgICAgIF9lZGdlc0J5RnJvbVtlZGdlLl9mcm9tLl9pZF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBfZWRnZXNCeUZyb21bZWRnZS5fZnJvbS5faWRdLnB1c2goZWRnZSk7XG5cbiAgICAgICAgaWYgKCFfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0pIHtcbiAgICAgICAgICAgIF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXS5wdXNoKGVkZ2UpO1xuXG4gICAgICAgIF96ZXJvSW5ncmVlTm9kZXMgPSBfemVyb0luZ3JlZU5vZGVzLmZpbHRlcihmdW5jdGlvbihleGlzdGluZ05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ05vZGUuX2lkICE9IGVkZ2UuX3RvLl9pZDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgcmVtb3ZlRWRnZSA9IGZ1bmN0aW9uKGVkZ2VUb1JlbW92ZSkge1xuICAgICAgICBfZWRnZXMgPSBfZWRnZXMuZmlsdGVyKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGdlLl9pZCAhPSBlZGdlVG9SZW1vdmUuX2lkO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZWxldGUgX2VkZ2VzQnlOb2Rlc1tlZGdlVG9SZW1vdmUuZ2V0Tm9kZUlkZW50aWZpZXIoKV07XG5cbiAgICAgICAgX2VkZ2VzQnlGcm9tW2VkZ2VUb1JlbW92ZS5fZnJvbS5faWRdID0gX2VkZ2VzQnlGcm9tW2VkZ2VUb1JlbW92ZS5fZnJvbS5faWRdLmZpbHRlcihmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRnZS5faWQgIT0gZWRnZVRvUmVtb3ZlLl9pZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2VkZ2VzQnlUb1tlZGdlVG9SZW1vdmUuX3RvLl9pZF0gPSBfZWRnZXNCeVRvW2VkZ2VUb1JlbW92ZS5fdG8uX2lkXS5maWx0ZXIoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2UuX2lkICE9IGVkZ2VUb1JlbW92ZS5faWQ7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0Tm9kZUJ5VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gX25vZGVzQnlWYWx1ZVt2YWx1ZV07XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGFkZE5vZGUobmV3IE5vZGUodmFsdWUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkRWRnZTogZnVuY3Rpb24oZnJvbVZhbHVlLCB0b1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgZnJvbU5vZGUgPSBnZXROb2RlQnlWYWx1ZShmcm9tVmFsdWUpO1xuICAgICAgICAgICAgdmFyIHRvTm9kZSA9IGdldE5vZGVCeVZhbHVlKHRvVmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlICYmICF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnTmVpdGhlciBmcm9tLSBub3IgdG8tbm9kZSBleGlzdDogJyArIGZyb21WYWx1ZSArICcsICcgKyB0b1ZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0Zyb20tbm9kZSBkb2VzblxcJ3QgZXhpc3Q6ICcgKyBmcm9tVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RvLW5vZGUgZG9lc25cXCd0IGV4aXN0OiAnICsgdG9WYWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWRkRWRnZShuZXcgRWRnZShmcm9tTm9kZSwgdG9Ob2RlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc05vZGVWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBCb29sZWFuKGdldE5vZGVCeVZhbHVlKHZhbHVlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldE5vZGVzVG9wb2xvZ2ljYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNvcnRlZE5vZGVzID0gW107XG5cbiAgICAgICAgICAgIHdoaWxlIChfemVyb0luZ3JlZU5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSBfemVyb0luZ3JlZU5vZGVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHNvcnRlZE5vZGVzLnB1c2goY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIChfZWRnZXNCeUZyb21bY3VycmVudE5vZGUuX2lkXSB8fCBbXSkuc2xpY2UoMCkuZm9yRWFjaChmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUVkZ2UoZWRnZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdIHx8IF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXS5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfemVyb0luZ3JlZU5vZGVzLnB1c2goZWRnZS5fdG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfZWRnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmdFZGdlcyA9IF9lZGdlcy5tYXAoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJygnICsgZWRnZS5fZnJvbS52YWx1ZSArICcsJyArIGVkZ2UuX3RvLnZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzZXQoKTtcblxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ3ljbGUgZGV0ZWN0ZWQsIHJlbWFpbmluZyBlZGdlczogJyArIHJlbWFpbmluZ0VkZ2VzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzZXQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHNvcnRlZE5vZGVzLm1hcChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyYXBoOyIsInZhciBEZXBlbmRlbmN5TWFuYWdlciA9IHJlcXVpcmUoJy4vRGVwZW5kZW5jeU1hbmFnZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5qZWN0YWJsZXMgPSBEZXBlbmRlbmN5TWFuYWdlcignaW5qZWN0YWJsZXMnKTtcblxuICAgIGZ1bmN0aW9uIGFkZChpbmplY3RhYmxlKSB7XG4gICAgICAgIGluamVjdGFibGVzLnJlZ2lzdGVyKGluamVjdGFibGUpO1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YW50aWF0ZUluamVjdGFibGVzKCkge1xuICAgICAgICBpZiAoIWluamVjdGFibGVzLmhhc0FsbERlcGVuZGVuY2llcygpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGVzIGRvblxcJ3QgZXhpc3Q6ICcgKyBpbmplY3RhYmxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0YWJsZXMuaW5zdGFudGlhdGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgICAgICByZXR1cm4gQm9vbGVhbihpbmplY3RhYmxlcy5nZXRQcm92aWRlcihuYW1lKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVzLmdldEluc3RhbmNlKG5hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVzLmhhc0FsbERlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBhZGQsXG4gICAgICAgIGdldDogZ2V0LFxuICAgICAgICBoYXM6IGhhcyxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlSW5qZWN0YWJsZXMsXG4gICAgICAgIGhhc0FsbERlcGVuZGVuY2llczogaGFzQWxsRGVwZW5kZW5jaWVzLFxuICAgICAgICBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzOiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzXG4gICAgfTtcbn07IiwidmFyIERlcGVuZGVuY3lNYW5hZ2VyID0gcmVxdWlyZSgnLi9EZXBlbmRlbmN5TWFuYWdlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2R1bGVzID0gRGVwZW5kZW5jeU1hbmFnZXIoJ21vZHVsZXMnKTtcblxuICAgIGZ1bmN0aW9uIGFkZChtb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlcy5yZWdpc3Rlcihtb2R1bGUpO1xuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFudGlhdGVNb2R1bGVzKCkge1xuICAgICAgICBtb2R1bGVzLmFsbC5wcm92aWRlcnMoZnVuY3Rpb24oXywgbW9kdWxlKSB7XG4gICAgICAgICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlLmV4ZWN1dGVSdW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuZ2V0UHJvdmlkZXIobmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlTW9kdWxlcyxcbiAgICAgICAgaGFzQWxsRGVwZW5kZW5jaWVzOiBoYXNBbGxEZXBlbmRlbmNpZXMsXG4gICAgICAgIGdldE1pc3NpbmdEZXBlbmRlbmNpZXM6IGdldE1pc3NpbmdEZXBlbmRlbmNpZXNcbiAgICB9O1xufTsiXX0=
