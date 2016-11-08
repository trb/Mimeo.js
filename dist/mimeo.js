(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mimeo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
'use strict';

/**
 * The mimeo modules describes the use of the mimeo framework.
 *
 * @module Mimeo
 */
var Module = require('./Module.js');

var Modules = require('./dependencies/Modules.js');
var Injectables = require('./dependencies/Injectables.js');

var registerBuiltIns = require('./builtins/Register.js');
/**
 * This is the entry point for the Mimeo framework. Create modules or bootstrap
 * an injectable.
 *
 * @class Mimeo
 * @static
 */
var Mimeo = function Mimeo() {
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
            throw new Error('Injectable "' + injectableName + '" to bootstrap not found. Stringyfied injectable: ' + entryInjectable);
        }

        if (!(entryInjectable instanceof Function)) {
            throw new Error('Injectable "' + injectableName + '" is not executable. Stringyfied injectable: ' + String(entryInjectable));
        }

        return entryInjectable.apply(entryInjectable, Array.prototype.slice.call(arguments, 1));
    }

    return {
        /**
         * In Mimeo, modules are top-level constructs that own and manage
         * injectables. Modules can depend on other module and will be instantiated
         * in dependency-order.
         *
         * @method module
         * @for Mimeo
         * @example
         *      mimeo.module('example', [])
         *          .component('greeting', () => (name) => console.log('Hi, ' + name);
         * @param {string} name Name of the module
         * @param {Array} [dependencies] Array of module names that this
         *  module depends on
         * @return {Module}
         */
        module: function module(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(injectables, name, dependencies));
            }

            return modules.get(name);
        },

        /**
         * @method bootstrap
         * @for Mimeo
         * @example
         *      mimeo.module('example', [])
         *          .component('greeting', () => (name) => console.log('Hi, ' + name);
         *      mimeo.bootstrap('greeting', 'John')
         *      //=> "Hi, John"
         * @param {string} injectableName
         * @param {object} [...parameters] Passed through to injectable
         */
        bootstrap: bootstrap
    };
};

module.exports = Mimeo();

},{"./Module.js":4,"./builtins/Register.js":8,"./dependencies/Injectables.js":12,"./dependencies/Modules.js":13}],4:[function(require,module,exports){
'use strict';

/**
 * @module Mimeo
 */

/**
 * Modules are the primary interface to mimeo. On a module, you can define
 * injectables. Each injectable definition will return the current module,
 * allowing you to chain injectable definitions.
 *
 * Injectables consist of three parts: A name, a list of dependencies and an
 * executable. The dependencies are names of other injectables that will be
 * passed to the executable.
 *
 * There are two ways of defining an injectable. The first is an array notation
 * where the last entry in the array is the executable. The other is an
 * executable that has the special properties $name and $inject.
 *
 * Here is an example of the array-style. Two factories A and B are defined,
 * with B having a dependency on A:
 *
 *      mimeo.module('example', [])
 *          .factory('A', [() => {}])
 *          .factory('B', ['B', (b) => {}])
 *
 * And here's how the same example would look like with the executable style:
 *
 *      function A() {}
 *      A.$name = 'A';
 *      A.$inject = [];
 *
 *      function B() {}
 *      B.$name = 'B';
 *      B.$inject = ['A'];
 *
 *      mimeo.module('example', [])
 *          .factory(A)
 *          .factory(B);
 *
 * The executable-style makes it very easy to separate out your code from the
 * mimeo bindings. In the example, function A and B can be used independent of
 * mimeo. This is great of unit-testing your code, as you can import the
 * executables into your test suite without having to worry about mimeo.
 *
 * @class Module
 * @constructor
 */
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
        toRun.forEach(function (injectableName) {
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
     * "make sure all these injectables exist" system. Then we could just get
     * the named injectables the run-function needs and call the run-function
     * with those.
     *
     * I can't think of a good way to de-duplicated that dependency resolution
     * system though, so there'd be one for all named injectables and one for
     * the run-functions.
     *
     * I don't plan on having other unnamed injectables, so I feel that effort
     * would be wasted. Hence the "hack" here with an auto-generated name and
     * a wrapper that executes the run-function with pass-through arguments.
     */
    /**
     * Defines an injectable that will be run after modules are instantiated.
     *
     * @method run
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.run = function (parameters) {
        var name = module.$name + '-run.' + toRun.length;
        toRun.push(name);

        var provider = function providerRun() {
            var args = arguments;
            return function () {
                if (parameters instanceof Function) {
                    return parameters.apply(parameters, args);
                } else {
                    var lastEntry = parameters.slice(-1)[0];
                    return lastEntry.apply(lastEntry, args);
                }
            };
        };

        if (parameters instanceof Function) {
            provider.$inject = parameters.$inject;
        } else {
            provider.$inject = parameters.slice(0, -1);
        }

        return addInjectable(name, provider);
    };

    /**
     * Use factories for anything that doesn't create output
     *
     * @method factory
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.factory = addInjectable;

    /**
     * Components are meant to produce some output, regardless of what rendering
     * technique you use
     *
     * @method component
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.component = addInjectable;

    /**
     * Values are different from factories and components in that there's no
     * executable. It's just a name and a value.
     *
     * @example
     *      mimeo.module('example', [])
     *          .value('name', 'value')
     *
     * @method value
     * @for Module
     * @chainable
     * @param {string} name Name of value
     * @param {*} value Value you want available for injection
     * @return {Module}
     */
    this.value = function (name, value) {
        return addInjectable(name, function () {
            return value;
        });
    };
}

module.exports = Module;

},{}],5:[function(require,module,exports){
'use strict';

function Window() {
    if (typeof window === 'undefined') {
        var noOp = function noOp() {};
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

module.exports = {
    Window: Window,
    NodeHttp: NodeHttp,
    NodeHttps: NodeHttps
};

},{"http":undefined,"https":undefined}],6:[function(require,module,exports){
'use strict';
/**
 * @module Builtins
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var NodeHttp;
var NodeHttps;

function toQuery(object) {
    return Object.keys(object).map(function (key) {
        if (Object.prototype.toString.call(object[key]) == '[object Array]') {
            return object[key].map(function (arrayValue) {
                return encodeURI(key) + '=' + encodeURI(arrayValue);
            }).join('&');
        } else if (Object.prototype.toString.call(object[key]) == '[object Object]') {
            return encodeURI(key) + '=' + encodeURI(JSON.stringify(object[key]));
        } else {
            return encodeURI(key) + '=' + encodeURI(object[key].toString());
        }
    }).join('&');
}

function isJsonContentType(contentType) {
    if (!contentType) {
        return false;
    }

    if (contentType == 'application/x-www-form-urlencoded') {
        return false;
    }

    function startsWith(string, start) {
        return string.substr(0, start.length) == start;
    }

    var textJson = 'text/json';
    var applicationJson = 'application/json';

    var type = contentType.toLowerCase().trim();

    if (startsWith(type, textJson)) {
        return true;
    }
    if (startsWith(type, applicationJson)) {
        return true;
    }
    if (type.match(/^application\/vnd\..*\+json$/)) {
        return true;
    }

    return false;
}

function jQueryLikeRequest(jQueryLike, config, resolve, reject) {
    function parseJqXHRHeaders(headerString) {
        if (!headerString) {
            return;
        }

        return headerString.split('\n').filter(function (line) {
            return line.length;
        }).map(function (line) {
            return line.split(':').map(function (part) {
                return part.trim();
            });
        }).reduce(function (headers, _ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var header = _ref2[0];
            var value = _ref2[1];

            headers[header] = value;
            return headers;
        }, {});
    }

    function responseToAngularResponse(data, _, jqXHR) {
        return {
            data: data,
            status: jqXHR.status, // response code,
            headers: parseJqXHRHeaders(jqXHR.getAllResponseHeaders()),
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

    var url = config.host && config.protocol ? config.protocol + '://' + config.host + config.url : config.url;

    jQueryLike.ajax({
        type: config.method,
        headers: config.headers,
        contentType: config.headers['Content-Type'],
        url: url,
        data: isJsonContentType(config.headers['Content-Type']) ? JSON.stringify(config.data) : config.data
    }).then(success, error);
}

function jQueryRequest($window) {
    return function (config, resolve, reject) {
        jQueryLikeRequest($window.jQuery, config, resolve, reject);
    };
}

function zeptoRequest($window) {
    return function (config, resolve, reject) {
        jQueryLikeRequest($window.Zepto, config, resolve, reject);
    };
}

function nodeRequest(config, resolve, reject) {
    function configToNode(config) {
        if (config.host && config.host.indexOf(':') !== -1) {
            var hostParts = config.host.split(':');
            var host = hostParts[0];
            var port = hostParts[1];
        } else {
            var host = config.host;
            var port = '80';
        }

        if (!host) {
            throw new Error('When using nodes http libraries, you have to set $http.$host, otherwise node does not know where to send the request to');
        }

        return {
            method: config.method,
            path: config.protocol + '://' + config.host + config.url,
            headers: config.headers,
            host: host,
            port: port,
            protocol: config.protocol + ':'
        };
    }

    function switchByProtocol() {
        if (config.protocol === 'http') {
            return NodeHttp;
        } else {
            return NodeHttps;
        }
    }

    function jsonEncode(object) {
        return JSON.stringify(object);
    }

    var request = switchByProtocol().request(configToNode(config), function (response) {
        response.setEncoding('utf8');

        var body = '';
        response.on('data', function (chunk) {
            body += chunk.toString();
        });

        response.on('error', function (error) {
            reject(error);
        });

        response.on('end', function () {
            /*
             * jQuery will parse JSON replies automatically, so replicate that
             * behaviour for nodejs
             */
            if (body && response.headers['content-type']) {
                var type = response.headers['content-type'].toLowerCase().trim();

                if (isJsonContentType(type)) {
                    body = JSON.parse(body);
                }
            }

            resolve({
                data: body,
                headers: response.headers,
                config: config,
                statusText: response.statusMessage,
                status: response.statusCode
            });
        });
    });

    if (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') {
        if (config.data) {
            if (isJsonContentType(config.headers['Content-Type'])) {
                request.write(jsonEncode(config.data));
            } else {
                request.write(config.data);
            }
        }
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
            throw new Error('No supported xhr library found (jQuery or Zepto are supported)');
        }
    }
}

function Http($window, $q, config) {
    var defer = $q.defer();

    if (config.params) {
        if (config.url.indexOf('?') === -1) {
            config.url += '?';
        } else {
            if (config.url[config.url.length - 1] != '&') {
                config.url += '&';
            }
        }

        config.url += toQuery(config.params);
        delete config.params;
    }

    config = config.pre.reduce(function (config, callback) {
        return callback(config);
    }, config);
    vendorSpecificRequest($window)(config, function (data) {
        data = config.post.reduce(function (data, callback) {
            return callback(data);
        }, data);
        defer.resolve(data);
    }, function (error) {
        error = config.post.reduce(function (error, callback) {
            return callback(error);
        }, error);
        defer.reject(error);
    });

    return defer.promise;
}

module.exports = function ($window, $q, $nodeHttp, $nodeHttps) {
    NodeHttp = $nodeHttp;
    NodeHttps = $nodeHttps;

    function clone(object) {
        var newObject = {};
        Object.keys(object).forEach(function (key) {
            if (object[key].toString() == '[object Object]') {
                newObject[key] = clone(object[key]);
            } else {
                newObject[key] = object[key];
            }
        });

        return newObject;
    }

    function mergeConfig(defaultConfig, userConfig) {
        var targetConfig = clone(defaultConfig);
        Object.keys(userConfig).forEach(function (key) {
            if (userConfig[key].toString() == '[object Object]') {
                targetConfig[key] = mergeConfig(targetConfig[key], userConfig[key]);
            } else {
                targetConfig[key] = userConfig[key];
            }
        });

        return targetConfig;
    }

    /**
     * # Send http(s) requests to a server
     *
     * You can use $http in two ways, either as a function that accepts a
     * configuration object, or use shorthand methods for common HTTP methods.
     *
     * To use $http as a function, the config object needs to include the url
     * and http method:
     *
     *      $http({
     *          url: '/example',
     *          method: 'GET'
     *      });
     *
     * For common http methods there are shorthand functions:
     *
     *      $http.get('/url');
     *      $http.post('/example', { key: 'value' });
     *
     * Both variations will return a Promise that resolves with the response
     * from the server:
     *
     *      $http.get('/example').then((response) => {
     *          console.log(response.data);
     *      });
     *
     * The response object has the following properties:
     *
     *      {
     *          data: {},
     *          //Data is the response body. If response content type is
     *          //'application/json' the response body will be JSON decoded and
     *          //the decoded object will be accessible in `data`
     *          status: 200, // http response code,
     *          headers: {
     *              'Content-Type': 'application/json'
     *          },// response http-headers,
     *          config: config, // config object send with request
     *          statusText: '200 Success' // http status text
     *      }
     *
     * All shorthand-methods are documented separately and optionally accept
     * the same config-object `$http` as a function accepts. Should the config
     * object contain different data than the arguments for the shorthand
     * method, then the arguments to the method take precedent:
     *
     *      $http.get('/example', {}, { url: '/not-used' });
     *      //=> Sends request to '/example'
     *
     * ## Configuration
     *
     * The config object can have these keys:
     *
     *      {
     *          pre: [],
     *          post: [],
     *          method: 'GET',
     *          url: '/example',
     *          data: {
     *              key: 'value'
     *          },
     *          params: {
     *              search: 'a search criteria'
     *          },
     *          headers: {
     *              'Content-Type': 'application/json'
     *          }
     *      }
     *
     * Default settings can be set directly on `$http` and will be used for all
     * future requests:
     *
     *      mimeo.module('example', [])
     *          .run(['$http', ($http) => {
     *              $http.$config.headers['Authorization'] = 'Basic W@3jolb2'
     *          });
     *
     * `pre` and `post` are callback-chains that can
     *      1. Modify the config before a request (in case of `pre`)
     *      2. Modify the response (in case of `post`)
     *
     * To add callbacks simply push them to the array. It's up to you to manage
     * the chain and add/remove functions from the array.
     *
     * The function itself will receive the config for the request (for `pre`)
     * or the response (for `post`). The functions in the chain will receive
     * the return value from the previous function as input. The first function
     * will receive the original config/response as input.
     *
     * If you change values in the headers-object make sure not to override the
     * headers object or if you do, to provide a 'Content-Type' header,
     * otherwise requests might fail depending on the environment (unspecified
     * content types should be avoided). Instead, simply add or modify headers
     * on the existing headers object.
     *
     * The `data` field is send as the request body and the `params` key is
     * send as a query string in the url. The `headers` field allows you to set
     * http headers for only this request, usually used to set a content type.
     *
     * The default content type is 'application/json', so by default, `data`
     * will be send as a JSON string to the server. If you want to send a
     * browser-like form string (content type
     * 'application/x-www-form-urlencoded') you have to set the content type
     * in the `headers` field and `data` must be a string. It's up to you to
     * build the form-urlencoded string.
     *
     * ## Defaults
     *
     * The default values `$http` uses can be changed and will be applied to
     * every request. There are three configurable properties:
     *
     * - `$http.$host`
     * - `$http.$protocol`
     * - `$http.$config`
     *
     * `$http.$host` is the host that will be used for every request. By
     * default, no host is used. For use in the browser this is fine, as the
     * browser simply uses the current host. For use with NodeJS `$http.$host`
     * has to be set as there is not default host. Setting the host for the
     * browser will send all requests to the specified host, and not the
     * current host. In that case the host has to support
     * [cross-origin HTTP
     * requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS).
     *
     * `$http.$protocol` should be one of 'http' or 'https', depending on what
     * your app uses.
     *
     * `$http.$config` is merged into the config object passed to `$http` or
     * one
     * of the shorthand methods. The settings in the config object passed to
     * `$http` or the shorthand method takes precedent:
     *
     *      $http.$config.headers['Authorization'] = 'Basic F@L#B';
     *      $http.post('/example', { key: 'value' }, {
     *          headers: {
     *              'Authorization': 'None'
     *          }
     *      );
     *      //=> Will send 'None' as the 'Authorization' header.
     *
     * An example changing all the available properties:
     *
     *      mimeo.module('example', [])
     *          .run(['$http', ($http) => {
     *              $http.$host = 'http://www.example.com';
     *              $http.$protocol = 'https';
     *              $http.$config.headers['Authorization'] = 'Basic F@L#B'
     *          });
     *
     * @class $http
     * @param config
     * @return {Promise}
     * @constructor
     */
    function doHttp(config) {
        config = mergeConfig(doHttp.$config, config);
        config.host = doHttp.$host;
        config.protocol = doHttp.$protocol;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    }

    /**
     * When using Mimeo on NodeJS, setting $host to the host you want to send
     * requests to is a requirement.
     *
     * @property $host
     * @for $http
     * @type {string}
     */
    doHttp.$host = '';
    doHttp.$protocol = 'https';
    doHttp.$config = {
        pre: [],
        post: [],
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    /**
     * Send a GET request
     *
     * @method get
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [params] Query parameters as a hash
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.get = function (url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'GET';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    };

    /**
     * Send a HEAD request. The server response will not include a body
     *
     * @method head
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [params] Query parameters as a hash
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.head = function (url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'HEAD';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    };

    /**
     * Send a POST request. By default, `data` will be JSON encoded and send as
     * the request body.
     *
     * @method post
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [data] Object to send as request body. If content-type
     * is set to 'application/json' (which is the default), `data` will be
     * JSON-encoded before sending
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.post = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'POST';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    };

    /**
     * Send a PUT request. By default, `data` will be JSON encoded and send as
     * the request body.
     *
     * @method put
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [data] Object to send as request body. If content-type
     * is set to 'application/json' (which is the default), `data` will be
     * JSON-encoded before sending
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.put = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PUT';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    };

    /**
     * Send a PATCH request. By default, `data` will be JSON encoded and send as
     * the request body.
     *
     * @method patch
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [data] Object to send as request body. If content-type
     * is set to 'application/json' (which is the default), `data` will be
     * JSON-encoded before sending
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.patch = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PATCH';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    /**
     * Send a DELETE request. Does not accept any parameters or data to send
     * with the request, as the URL should identify the entity to delete
     *
     * @method delete
     * @for $http
     * @static
     * @param {string} url Url you want to send request to
     * @param {object} [config] Config for this request
     * @returns {Promise}
     */
    doHttp.delete = function (url, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'DELETE';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        //noinspection JSValidateTypes
        return new Http($window, $q, config);
    };

    return doHttp;
};

},{}],7:[function(require,module,exports){
'use strict';

function isFunction(object) {
    return object && typeof object === 'function' && object instanceof Function;
}

/**
 * An instance of a promise. Created and accessed through $q.
 *
 * @class Promise
 * @private
 * @constructor
 */
function Promise() {
    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];
    var state = 'pending';
    var resolution;
    var rejection;

    var api = {
        /**
         * Attach resolution, rejection and notification handlers to the promise.
         *
         * @method then
         * @for Promise
         * @chainable
         * @param {Function} onResolve Executed when the promise is resolved.
         *  If another promise is returned, the next promise in the chain is
         *  attached to the returned promise. If a value is returned, the next
         *  promise in the chain is resolved with the returned value immediately.
         * @param {Function} onReject Executed when the promise is rejected
         * @param {Function} onNotify Executed when the promise notified
         * @return {Promise}
         */
        then: function then(onResolve, onReject, onNotify) {
            var promise = new Promise();

            if ((state === 'pending' || state === 'resolved') && isFunction(onResolve)) {
                var resolveWrapper = function resolveWrapper(resolution) {
                    var returnValue = onResolve(resolution);

                    if (returnValue && isFunction(returnValue.then)) {
                        returnValue.then(function (nextResolution) {
                            promise.resolve(nextResolution);
                        }, function (nextRejection) {
                            promise.reject(nextRejection);
                        });
                    } else {
                        promise.resolve(returnValue);
                    }
                };

                if (state === 'resolved') {
                    resolveWrapper(resolution);
                } else {
                    resolveCallbacks.push(resolveWrapper);
                }
            }

            if (state === 'pending' || state === 'rejected') {
                var rejectionWrapper = function rejectionWrapper(rejectWith) {
                    if (isFunction(onReject)) {
                        onReject(rejectWith);
                    } else {
                        /*
                         * Stop rejecting the promise chain once the rejection
                         * has been handled.
                         */
                        promise.reject(rejectWith);
                    }
                };

                if (state === 'rejected') {
                    rejectionWrapper(rejection);
                } else {
                    rejectCallbacks.push(rejectionWrapper);
                }
            }

            notifyCallbacks.push(function (notifyWith) {
                if (isFunction(onNotify)) {
                    onNotify(notifyWith);
                }

                promise.notify(notifyWith);
            });

            return promise;
        },

        /**
         * Registers a rejection handler. Shorthand for `.then(_, onReject)`.
         *
         * @method catch
         * @for Promise
         * @chainable
         * @param onReject Executed when
         *  the promise is rejected. Receives the rejection reason as argument.
         * @return {Promise}
         */
        'catch': function _catch(onReject) {
            return api.then(null, onReject);
        },

        /**
         * Send a notification to the promise.
         *
         * @method notify
         * @for Promise
         * @param {*} notifyWith Notification value
         */
        notify: function notify(notifyWith) {
            notifyCallbacks.forEach(function (callback) {
                callback(notifyWith);
            });
        },

        /**
         * Rejects the promise.
         *
         * @method reject
         * @for Promise
         * @param {*} rejectWith Rejection reason. Will be passed on to the
         *  rejection handlers
         */
        reject: function reject(rejectWith) {
            rejectCallbacks.forEach(function (callback) {
                callback(rejectWith);
            });

            state = 'rejected';
            rejection = rejectWith;
        },

        /**
         * Resolves the promise.
         *
         * @method resolve
         * @for Promise
         * @param {*} resolveWith This value is passed on to the resolution
         *  handlers attached to the promise.
         */
        resolve: function resolve(resolveWith) {
            resolveCallbacks.forEach(function (callback) {
                callback(resolveWith);
            });

            state = 'resolved';
            resolution = resolveWith;
        }
    };

    return api;
}

/**
 * The deferred object that's wrapped by $q
 *
 * @class Deferred
 * @param {Function} init This callback is passed three arguments, `resolve`,
 *  `reject` and `notify` that respectively resolve, reject or notify the
 *  deferreds promise.
 * @constructor
 */
function Deferred(init) {
    var promise = new Promise();

    if (isFunction(init)) {
        init(promise.resolve, promise.reject, promise.notify);
    }

    return {
        /**
         * See {{#crossLink "Promise/resolve:method"}}the underlying
         * promises resolve{{/crossLink}} documentation.
         *
         * @method resolve
         * @for Deferred
         */
        resolve: promise.resolve,

        /**
         * See {{#crossLink "Promise/reject:method"}}the underlying
         * promises reject{{/crossLink}} documentation.
         *
         * @method reject
         * @for Deferred
         */
        reject: promise.reject,

        /**
         * See {{#crossLink "Promise/notify:method"}}the underlying
         * promises notify{{/crossLink}} documentation.
         *
         * @method notify
         * @for Deferred
         */
        notify: promise.notify,

        /**
         * @property {Promise} promise
         * @for Deferred
         */
        promise: promise
    };
}

/**
 * Creates and manages promises. Used by $http and $routing.
 *
 * $q is used to create a deferred object, which contains a promise. The
 * deferred is used to create and manage promises.
 *
 * A promise accepts resolution, rejection and notification handlers that are
 * executed when the promise itself is resolved, rejected or notified. The
 * handlers are attached to the promise via the {{#crossLink "Promise/then:method"}}
 * .then(){{/crossLink}} method.
 *
 * You can attach multiple handlers by calling .then() multiple times with
 * different handlers. In addition, you can chain .then() calls. In this case,
 * the return value from .then() is a new promise that's attached to the resolve
 * handler passed to .then(). This way you can return promises from your resolve
 * handler and the next .then() will wait until that promise is resolved to
 * continue. Usually used to do multiple asyncronous calls in sequence.
 *
 * @class $q
 * @param {Function} callback The callback to initialized the deferred object
 * with
 * @constructor
 * @return {Promise}
 */
function $q(callback) {
    return new Deferred(callback).promise;
}

/**
 * Create a new defer. This method requires no arguments, the returned defer has
 * the methods required to resolve/reject/notify the promise.
 *
 * @example
 *      let defer = $q.defer();
 *      defer.promise.then((name) => console.log('Hi ' + name));
 *      defer.resolve('John');
 *      //=> "Hi John"
 * @method defer
 * @for $q
 * @return {Deferred}
 */
$q.defer = function () {
    return new Deferred();
};

/**
 * Creates a new promise and resolves it with `value`. If `value` is a promise,
 * the returned promise is attached to `value`. If onResolve, onReject or
 * onNotify are given, they are attached to the new promise.
 *
 * @method when
 * @for $q
 * @example
 *      $q.when('John').then((name) => console.log('Hi ' + name));
 *      //=> "Hi John"
 * @param {*|Promise} value Value that the returned promise is resolve with. If
 *  value is a promise, the returned promise is attached to value.
 * @param {Function} [onResolve] Resolve handler
 * @param {Function} [onReject] Rejection handler
 * @param {Function} [onNotify] Notification handler
 * @return {Promise}
 */
$q.when = function (value, onResolve, onReject, onNotify) {
    var defer = new Deferred(function (resolve, reject, notify) {
        if (value && value.then) {
            value.then(function (resolveValue) {
                resolve(resolveValue);
            }, function (error) {
                reject(error);
            }, function (notifyValue) {
                notify(notifyValue);
            });
        } else {
            resolve(value);
        }
    });

    defer.promise.then(onResolve, onReject, onNotify);

    return defer.promise;
};

/**
 * Alias for {{#crossLink "$q/when:method"}}$q.when{{/crossLink}}
 * @method resolve
 * @for $q
 */
$q.resolve = $q.when;

/**
 * Takes an array of promises (called inner promises) and creates a new promise
 * (called outer promise) that resolves when all the inner promises resolve.
 * If any of the inner promises are rejected, the outer promise is
 * immediately rejected as well and any other inner promises left over are
 * discarded.
 *
 * E.g. if you have three inner promises, A, B, and C, then the outer promise O
 * is resolved once all three A, B and C are resolved.
 *
 * If A is resolved, and B is rejected, and C is pending, then O will be
 * rejected regardless of C's outcome.
 *
 * @method all
 * @example
 *      let greeting = $q.defer();
 *      let name = $q.defer();
 *
 *      $q.all([greeting.promise, name.promise])
 *          .then((greeting, name) => console.log(greeting + ' ' + name));
 *
 *      greeting.resolve('Welcome');
 *      name.resolve('John')
 *      //=> "Welcome John"
 * @param {Array} promises Array of promises
 * @return {Promise}
 */
$q.all = function (promises) {
    if (!(promises instanceof Array)) {
        throw new Error('Promises need to be passed to $q.all in an array');
    }

    var counter = 0;
    var resolutions = [];

    var deferred = new Deferred();

    function checkComplete() {
        if (counter === promises.length) {
            deferred.resolve(resolutions);
        }
    }

    promises.forEach(function (promise, index) {
        promise.then(function (resolution) {
            resolutions[index] = resolution;
            ++counter;
            checkComplete();
        }, function (rejection) {
            deferred.reject(rejection);
        });
    });

    return deferred.promise;
};

module.exports = function () {
    return $q;
};

},{}],8:[function(require,module,exports){
'use strict';

/**
 * Mimeo ships with a few built-in injectables, namely {{#crossLink "$q"}}a
 * promise library called $q{{/crossLink}}, a networking wrapper called $http
 * and a routing facility called $routing.
 *
 * @module Builtins
 */

var Promise = require('./Promise.js');
var Routing = require('./Routing.js');
var Http = require('./Http.js');
var GlobalsWrapper = require('./GlobalsWrapper.js');

module.exports = function (injectables) {
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

},{"./GlobalsWrapper.js":5,"./Http.js":6,"./Promise.js":7,"./Routing.js":9}],9:[function(require,module,exports){
'use strict';

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
    var makeRenderer = function makeRenderer(targetAsDOMNode) {
        return function (toRender) {
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
        query.split('&').map(function (part) {
            return part.split('=').map(decodeURIComponent);
        }).forEach(function (part) {
            if (dict[part[0]]) {
                if (!(Object.prototype.toString.call(dict[part[0]]) == '[object Array]')) {
                    dict[part[0]] = [dict[part[0]]];
                }

                dict[part[0]].push(part[1]);
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
        } else if (doDefault !== false && defaultRoute) {
            promises.push(doDefaultRoute(defaultRoute));
        }

        return $q.all(promises);
    }

    function gotoRoute(route) {
        $window.history.pushState(null, '', route);
        return doRouting(route);
    }

    function replaceRoute(route) {
        $window.history.replaceState(null, '', route);

        return doRouting(route);
    }

    $window.onpopstate = function () {
        doRouting($window.location.href);
    };

    $window.onclick = function (event) {
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

    $window.onload = function () {
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
        'setDefaultRoute': function setDefaultRoute(newDefaultRoute) {
            if (!(typeof newDefaultRoute === 'string' || newDefaultRoute instanceof String)) {
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
        'setMakeRenderer': function setMakeRenderer(newMakeRenderer) {
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
        'set': function set(route, target, injectable, name) {
            if (!(injectable instanceof Function)) {
                var message = 'To set a route, you have to provide an injectable that is executable (i.e. instanceof Function). Route: ' + route + ', stringified injectable: "' + String(injectable + '"');
                if (target instanceof Function && (injectable instanceof String || typeof injectable === 'string')) {
                    message += '. Target is a function and injectable is a string. You might have switched the parameters, please double-check that';
                }
                throw new Error(message);
            }

            routing.add([{
                path: route,
                handler: function handler($context) {
                    var renderReturn;
                    var targetAsDOMNode = $window.document.getElementById(target);
                    var renderer = makeRenderer(targetAsDOMNode);

                    if (injectable.render) {
                        renderReturn = injectable.render($context, renderer, targetAsDOMNode);
                    } else {
                        renderReturn = injectable($context, renderer, targetAsDOMNode);
                    }

                    return $q.when(renderReturn);
                }
            }], { 'as': name });
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
        'goto': function goto(route) {
            return gotoRoute(route);
        }
    };
}

module.exports = {
    'Routing': Routing
};

},{"parseuri":1,"route-recognizer":2}],10:[function(require,module,exports){
'use strict';

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

        entity.$inject.forEach(function (dependency) {
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

        var providersInjects = Object.keys(_providers).map(function (providerName) {
            return _providers[providerName].$inject;
        });

        _getMissingDependenciesCache = [].concat.apply([], providersInjects).filter(function (providerName) {
            return !Boolean(_providers[providerName]);
        });

        return _getMissingDependenciesCache;
    }

    function hasAllDependencies() {
        return getMissingDependencies().length == 0;
    }

    function instantiate() {
        _graph.getNodesTopological().forEach(function (providerName) {
            var provider = _providers[providerName];

            _instances[providerName] = provider.apply(provider, provider.$inject.map(function (dependencyName) {
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
            providers: function providers(callback) {
                Object.keys(_providers).forEach(function (name) {
                    callback(name, _providers[name]);
                });
            },
            instances: function instances(callback) {
                Object.keys(_instances).forEach(function (name) {
                    callback(name, _instances[name]);
                });
            }
        }
    };
}

/**
 *
 * @param name
 * @returns {DependencyManager}
 */
module.exports = function (name) {
    return new DependencyManager(name);
};

},{"./Graph.js":11}],11:[function(require,module,exports){
'use strict';

var Node = function Node(value) {
    if (!(value instanceof String || typeof value === 'string')) {
        throw new Error('Only strings are accepted as node values');
    }

    this._id = Math.random().toString(36);
    this.value = value;
};

var Edge = function Edge(nodeFrom, nodeTo) {
    this._id = Math.random().toString(36);
    this._from = nodeFrom;
    this._to = nodeTo;
};

var makeNodeIdentifier = function makeNodeIdentifier(node1, node2) {
    return node1._id + ':' + node2._id;
};

Edge.prototype.getNodeIdentifier = function () {
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
var Graph = function Graph() {
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
    var reset = function reset() {
        _nodes = [];
        _nodesById = {};
        _nodesByValue = {};
        _zeroIngreeNodes = [];
        _edges = [];
        _edgesByNodes = {};
        _edgesByTo = {};
        _edgesByFrom = {};
    };

    var addNode = function addNode(node) {
        if (_nodesByValue[node.value]) {
            throw new Error('Duplicate values not allowed. Node with value "' + node.value + '" already exists');
        }

        _nodes.push(node);
        _nodesById[node._id] = node;
        _nodesByValue[node.value] = node;

        _zeroIngreeNodes.push(node);
    };

    var _addEdge = function _addEdge(edge) {
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

        _zeroIngreeNodes = _zeroIngreeNodes.filter(function (existingNode) {
            return existingNode._id != edge._to._id;
        });
    };
    var removeEdge = function removeEdge(edgeToRemove) {
        _edges = _edges.filter(function (edge) {
            return edge._id != edgeToRemove._id;
        });

        delete _edgesByNodes[edgeToRemove.getNodeIdentifier()];

        _edgesByFrom[edgeToRemove._from._id] = _edgesByFrom[edgeToRemove._from._id].filter(function (edge) {
            return edge._id != edgeToRemove._id;
        });

        _edgesByTo[edgeToRemove._to._id] = _edgesByTo[edgeToRemove._to._id].filter(function (edge) {
            return edge._id != edgeToRemove._id;
        });
    };

    var getNodeByValue = function getNodeByValue(value) {
        return _nodesByValue[value];
    };

    return {
        add: function add(value) {
            addNode(new Node(value));
        },
        addEdge: function addEdge(fromValue, toValue) {
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

            _addEdge(new Edge(fromNode, toNode));
        },
        hasNodeValue: function hasNodeValue(value) {
            return Boolean(getNodeByValue(value));
        },
        getNodesTopological: function getNodesTopological() {
            var sortedNodes = [];

            while (_zeroIngreeNodes.length > 0) {
                var currentNode = _zeroIngreeNodes.pop();
                sortedNodes.push(currentNode);
                (_edgesByFrom[currentNode._id] || []).slice(0).forEach(function (edge) {
                    removeEdge(edge);
                    if (!_edgesByTo[edge._to._id] || _edgesByTo[edge._to._id].length < 1) {
                        _zeroIngreeNodes.push(edge._to);
                    }
                });
            }

            if (_edges.length > 0) {
                var remainingEdges = _edges.map(function (edge) {
                    return '(' + edge._from.value + ',' + edge._to.value + ')';
                });

                reset();

                throw new Error('Cycle detected, remaining edges: ' + remainingEdges);
            }

            reset();

            return sortedNodes.map(function (node) {
                return node.value;
            });
        }
    };
};

module.exports = Graph;

},{}],12:[function(require,module,exports){
'use strict';

var DependencyManager = require('./DependencyManager.js');

module.exports = function () {
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

},{"./DependencyManager.js":10}],13:[function(require,module,exports){
'use strict';

var DependencyManager = require('./DependencyManager.js');

module.exports = function () {
    var modules = DependencyManager('modules');

    function add(module) {
        modules.register(module);
        return module;
    }

    function hasAllDependencies() {
        return modules.hasAllDependencies();
    }

    function instantiateModules() {
        modules.all.providers(function (_, module) {
            module.executeRun();
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

},{"./DependencyManager.js":10}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGFyc2V1cmkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcm91dGUtcmVjb2duaXplci9kaXN0L3JvdXRlLXJlY29nbml6ZXIuanMiLCJzcmMvTWltZW8uanMiLCJzcmMvTW9kdWxlLmpzIiwic3JjL2J1aWx0aW5zL0dsb2JhbHNXcmFwcGVyLmpzIiwic3JjL2J1aWx0aW5zL0h0dHAuanMiLCJzcmMvYnVpbHRpbnMvUHJvbWlzZS5qcyIsInNyYy9idWlsdGlucy9SZWdpc3Rlci5qcyIsInNyYy9idWlsdGlucy9Sb3V0aW5nLmpzIiwic3JjL2RlcGVuZGVuY2llcy9EZXBlbmRlbmN5TWFuYWdlci5qcyIsInNyYy9kZXBlbmRlbmNpZXMvR3JhcGguanMiLCJzcmMvZGVwZW5kZW5jaWVzL0luamVjdGFibGVzLmpzIiwic3JjL2RlcGVuZGVuY2llcy9Nb2R1bGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QkFBb0Isa0JBSmpCO0FBS0gsZ0NBQXdCO0FBTHJCLEtBQVA7QUFPSCxDQWpDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFBhcnNlcyBhbiBVUklcbiAqXG4gKiBAYXV0aG9yIFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPiAoTUlUIGxpY2Vuc2UpXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG52YXIgcmUgPSAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShodHRwfGh0dHBzfHdzfHdzcyk6XFwvXFwvKT8oKD86KChbXjpAXSopKD86OihbXjpAXSopKT8pP0ApPygoPzpbYS1mMC05XXswLDR9Oil7Miw3fVthLWYwLTldezAsNH18W146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLztcblxudmFyIHBhcnRzID0gW1xuICAgICdzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnYW5jaG9yJ1xuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZXVyaShzdHIpIHtcbiAgICB2YXIgc3JjID0gc3RyLFxuICAgICAgICBiID0gc3RyLmluZGV4T2YoJ1snKSxcbiAgICAgICAgZSA9IHN0ci5pbmRleE9mKCddJyk7XG5cbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgYikgKyBzdHIuc3Vic3RyaW5nKGIsIGUpLnJlcGxhY2UoLzovZywgJzsnKSArIHN0ci5zdWJzdHJpbmcoZSwgc3RyLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgdmFyIG0gPSByZS5leGVjKHN0ciB8fCAnJyksXG4gICAgICAgIHVyaSA9IHt9LFxuICAgICAgICBpID0gMTQ7XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHVyaVtwYXJ0c1tpXV0gPSBtW2ldIHx8ICcnO1xuICAgIH1cblxuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgdXJpLnNvdXJjZSA9IHNyYztcbiAgICAgICAgdXJpLmhvc3QgPSB1cmkuaG9zdC5zdWJzdHJpbmcoMSwgdXJpLmhvc3QubGVuZ3RoIC0gMSkucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuYXV0aG9yaXR5ID0gdXJpLmF1dGhvcml0eS5yZXBsYWNlKCdbJywgJycpLnJlcGxhY2UoJ10nLCAnJykucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuaXB2NnVyaSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVyaTtcbn07XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkVGFyZ2V0KHBhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKSB7XG4gICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgdGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSBkZWxlZ2F0ZTtcbiAgICB9XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRUYXJnZXQucHJvdG90eXBlID0ge1xuICAgICAgdG86IGZ1bmN0aW9uKHRhcmdldCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRlbGVnYXRlID0gdGhpcy5kZWxlZ2F0ZTtcblxuICAgICAgICBpZiAoZGVsZWdhdGUgJiYgZGVsZWdhdGUud2lsbEFkZFJvdXRlKSB7XG4gICAgICAgICAgdGFyZ2V0ID0gZGVsZWdhdGUud2lsbEFkZFJvdXRlKHRoaXMubWF0Y2hlci50YXJnZXQsIHRhcmdldCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hdGNoZXIuYWRkKHRoaXMucGF0aCwgdGFyZ2V0KTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2subGVuZ3RoID09PSAwKSB7IHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGhhdmUgYW4gYXJndW1lbnQgaW4gdGhlIGZ1bmN0aW9uIHBhc3NlZCB0byBgdG9gXCIpOyB9XG4gICAgICAgICAgdGhpcy5tYXRjaGVyLmFkZENoaWxkKHRoaXMucGF0aCwgdGFyZ2V0LCBjYWxsYmFjaywgdGhpcy5kZWxlZ2F0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIodGFyZ2V0KSB7XG4gICAgICB0aGlzLnJvdXRlcyA9IHt9O1xuICAgICAgdGhpcy5jaGlsZHJlbiA9IHt9O1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkTWF0Y2hlci5wcm90b3R5cGUgPSB7XG4gICAgICBhZGQ6IGZ1bmN0aW9uKHBhdGgsIGhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5yb3V0ZXNbcGF0aF0gPSBoYW5kbGVyO1xuICAgICAgfSxcblxuICAgICAgYWRkQ2hpbGQ6IGZ1bmN0aW9uKHBhdGgsIHRhcmdldCwgY2FsbGJhY2ssIGRlbGVnYXRlKSB7XG4gICAgICAgIHZhciBtYXRjaGVyID0gbmV3ICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbltwYXRoXSA9IG1hdGNoZXI7XG5cbiAgICAgICAgdmFyIG1hdGNoID0gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZ2VuZXJhdGVNYXRjaChwYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSk7XG5cbiAgICAgICAgaWYgKGRlbGVnYXRlICYmIGRlbGVnYXRlLmNvbnRleHRFbnRlcmVkKSB7XG4gICAgICAgICAgZGVsZWdhdGUuY29udGV4dEVudGVyZWQodGFyZ2V0LCBtYXRjaCk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhtYXRjaCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2goc3RhcnRpbmdQYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhdGgsIG5lc3RlZENhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmdWxsUGF0aCA9IHN0YXJ0aW5nUGF0aCArIHBhdGg7XG5cbiAgICAgICAgaWYgKG5lc3RlZENhbGxiYWNrKSB7XG4gICAgICAgICAgbmVzdGVkQ2FsbGJhY2soJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZ2VuZXJhdGVNYXRjaChmdWxsUGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3ICQkcm91dGUkcmVjb2duaXplciRkc2wkJFRhcmdldChzdGFydGluZ1BhdGggKyBwYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkYWRkUm91dGUocm91dGVBcnJheSwgcGF0aCwgaGFuZGxlcikge1xuICAgICAgdmFyIGxlbiA9IDA7XG4gICAgICBmb3IgKHZhciBpPTAsIGw9cm91dGVBcnJheS5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIGxlbiArPSByb3V0ZUFycmF5W2ldLnBhdGgubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHIobGVuKTtcbiAgICAgIHZhciByb3V0ZSA9IHsgcGF0aDogcGF0aCwgaGFuZGxlcjogaGFuZGxlciB9O1xuICAgICAgcm91dGVBcnJheS5wdXNoKHJvdXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRlYWNoUm91dGUoYmFzZVJvdXRlLCBtYXRjaGVyLCBjYWxsYmFjaywgYmluZGluZykge1xuICAgICAgdmFyIHJvdXRlcyA9IG1hdGNoZXIucm91dGVzO1xuXG4gICAgICBmb3IgKHZhciBwYXRoIGluIHJvdXRlcykge1xuICAgICAgICBpZiAocm91dGVzLmhhc093blByb3BlcnR5KHBhdGgpKSB7XG4gICAgICAgICAgdmFyIHJvdXRlQXJyYXkgPSBiYXNlUm91dGUuc2xpY2UoKTtcbiAgICAgICAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRhZGRSb3V0ZShyb3V0ZUFycmF5LCBwYXRoLCByb3V0ZXNbcGF0aF0pO1xuXG4gICAgICAgICAgaWYgKG1hdGNoZXIuY2hpbGRyZW5bcGF0aF0pIHtcbiAgICAgICAgICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJGVhY2hSb3V0ZShyb3V0ZUFycmF5LCBtYXRjaGVyLmNoaWxkcmVuW3BhdGhdLCBjYWxsYmFjaywgYmluZGluZyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoYmluZGluZywgcm91dGVBcnJheSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciRkc2wkJGRlZmF1bHQgPSBmdW5jdGlvbihjYWxsYmFjaywgYWRkUm91dGVDYWxsYmFjaykge1xuICAgICAgdmFyIG1hdGNoZXIgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkTWF0Y2hlcigpO1xuXG4gICAgICBjYWxsYmFjaygkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRnZW5lcmF0ZU1hdGNoKFwiXCIsIG1hdGNoZXIsIHRoaXMuZGVsZWdhdGUpKTtcblxuICAgICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZWFjaFJvdXRlKFtdLCBtYXRjaGVyLCBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgICBpZiAoYWRkUm91dGVDYWxsYmFjaykgeyBhZGRSb3V0ZUNhbGxiYWNrKHRoaXMsIHJvdXRlKTsgfVxuICAgICAgICBlbHNlIHsgdGhpcy5hZGQocm91dGUpOyB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9O1xuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciQkc3BlY2lhbHMgPSBbXG4gICAgICAnLycsICcuJywgJyonLCAnKycsICc/JywgJ3wnLFxuICAgICAgJygnLCAnKScsICdbJywgJ10nLCAneycsICd9JywgJ1xcXFwnXG4gICAgXTtcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJGVzY2FwZVJlZ2V4ID0gbmV3IFJlZ0V4cCgnKFxcXFwnICsgJCRyb3V0ZSRyZWNvZ25pemVyJCRzcGVjaWFscy5qb2luKCd8XFxcXCcpICsgJyknLCAnZycpO1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRpc0FycmF5KHRlc3QpIHtcbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGVzdCkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICB9XG5cbiAgICAvLyBBIFNlZ21lbnQgcmVwcmVzZW50cyBhIHNlZ21lbnQgaW4gdGhlIG9yaWdpbmFsIHJvdXRlIGRlc2NyaXB0aW9uLlxuICAgIC8vIEVhY2ggU2VnbWVudCB0eXBlIHByb3ZpZGVzIGFuIGBlYWNoQ2hhcmAgYW5kIGByZWdleGAgbWV0aG9kLlxuICAgIC8vXG4gICAgLy8gVGhlIGBlYWNoQ2hhcmAgbWV0aG9kIGludm9rZXMgdGhlIGNhbGxiYWNrIHdpdGggb25lIG9yIG1vcmUgY2hhcmFjdGVyXG4gICAgLy8gc3BlY2lmaWNhdGlvbnMuIEEgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gY29uc3VtZXMgb25lIG9yIG1vcmUgaW5wdXRcbiAgICAvLyBjaGFyYWN0ZXJzLlxuICAgIC8vXG4gICAgLy8gVGhlIGByZWdleGAgbWV0aG9kIHJldHVybnMgYSByZWdleCBmcmFnbWVudCBmb3IgdGhlIHNlZ21lbnQuIElmIHRoZVxuICAgIC8vIHNlZ21lbnQgaXMgYSBkeW5hbWljIG9mIHN0YXIgc2VnbWVudCwgdGhlIHJlZ2V4IGZyYWdtZW50IGFsc28gaW5jbHVkZXNcbiAgICAvLyBhIGNhcHR1cmUuXG4gICAgLy9cbiAgICAvLyBBIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGNvbnRhaW5zOlxuICAgIC8vXG4gICAgLy8gKiBgdmFsaWRDaGFyc2A6IGEgU3RyaW5nIHdpdGggYSBsaXN0IG9mIGFsbCB2YWxpZCBjaGFyYWN0ZXJzLCBvclxuICAgIC8vICogYGludmFsaWRDaGFyc2A6IGEgU3RyaW5nIHdpdGggYSBsaXN0IG9mIGFsbCBpbnZhbGlkIGNoYXJhY3RlcnNcbiAgICAvLyAqIGByZXBlYXRgOiB0cnVlIGlmIHRoZSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBjYW4gcmVwZWF0XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRpY1NlZ21lbnQoc3RyaW5nKSB7IHRoaXMuc3RyaW5nID0gc3RyaW5nOyB9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0aWNTZWdtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGVhY2hDaGFyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgc3RyaW5nID0gdGhpcy5zdHJpbmcsIGNoO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1zdHJpbmcubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIGNoID0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgICBjYWxsYmFjayh7IHZhbGlkQ2hhcnM6IGNoIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZWdleDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmluZy5yZXBsYWNlKCQkcm91dGUkcmVjb2duaXplciQkZXNjYXBlUmVnZXgsICdcXFxcJDEnKTtcbiAgICAgIH0sXG5cbiAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyaW5nO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJER5bmFtaWNTZWdtZW50KG5hbWUpIHsgdGhpcy5uYW1lID0gbmFtZTsgfVxuICAgICQkcm91dGUkcmVjb2duaXplciQkRHluYW1pY1NlZ21lbnQucHJvdG90eXBlID0ge1xuICAgICAgZWFjaENoYXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHsgaW52YWxpZENoYXJzOiBcIi9cIiwgcmVwZWF0OiB0cnVlIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVnZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gXCIoW14vXSspXCI7XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBwYXJhbXNbdGhpcy5uYW1lXTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGFyU2VnbWVudChuYW1lKSB7IHRoaXMubmFtZSA9IG5hbWU7IH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXJTZWdtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGVhY2hDaGFyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayh7IGludmFsaWRDaGFyczogXCJcIiwgcmVwZWF0OiB0cnVlIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVnZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gXCIoLispXCI7XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBwYXJhbXNbdGhpcy5uYW1lXTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudCgpIHt9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oKSB7fSxcbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXCI7IH0sXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24oKSB7IHJldHVybiBcIlwiOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkcGFyc2Uocm91dGUsIG5hbWVzLCBzcGVjaWZpY2l0eSkge1xuICAgICAgLy8gbm9ybWFsaXplIHJvdXRlIGFzIG5vdCBzdGFydGluZyB3aXRoIGEgXCIvXCIuIFJlY29nbml0aW9uIHdpbGxcbiAgICAgIC8vIGFsc28gbm9ybWFsaXplLlxuICAgICAgaWYgKHJvdXRlLmNoYXJBdCgwKSA9PT0gXCIvXCIpIHsgcm91dGUgPSByb3V0ZS5zdWJzdHIoMSk7IH1cblxuICAgICAgdmFyIHNlZ21lbnRzID0gcm91dGUuc3BsaXQoXCIvXCIpLCByZXN1bHRzID0gW107XG5cbiAgICAgIC8vIEEgcm91dGVzIGhhcyBzcGVjaWZpY2l0eSBkZXRlcm1pbmVkIGJ5IHRoZSBvcmRlciB0aGF0IGl0cyBkaWZmZXJlbnQgc2VnbWVudHNcbiAgICAgIC8vIGFwcGVhciBpbi4gVGhpcyBzeXN0ZW0gbWlycm9ycyBob3cgdGhlIG1hZ25pdHVkZSBvZiBudW1iZXJzIHdyaXR0ZW4gYXMgc3RyaW5nc1xuICAgICAgLy8gd29ya3MuXG4gICAgICAvLyBDb25zaWRlciBhIG51bWJlciB3cml0dGVuIGFzOiBcImFiY1wiLiBBbiBleGFtcGxlIHdvdWxkIGJlIFwiMjAwXCIuIEFueSBvdGhlciBudW1iZXIgd3JpdHRlblxuICAgICAgLy8gXCJ4eXpcIiB3aWxsIGJlIHNtYWxsZXIgdGhhbiBcImFiY1wiIHNvIGxvbmcgYXMgYGEgPiB6YC4gRm9yIGluc3RhbmNlLCBcIjE5OVwiIGlzIHNtYWxsZXJcbiAgICAgIC8vIHRoZW4gXCIyMDBcIiwgZXZlbiB0aG91Z2ggXCJ5XCIgYW5kIFwielwiICh3aGljaCBhcmUgYm90aCA5KSBhcmUgbGFyZ2VyIHRoYW4gXCIwXCIgKHRoZSB2YWx1ZVxuICAgICAgLy8gb2YgKGBiYCBhbmQgYGNgKS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBsZWFkaW5nIHN5bWJvbCwgXCIyXCIsIGlzIGxhcmdlciB0aGFuIHRoZSBvdGhlclxuICAgICAgLy8gbGVhZGluZyBzeW1ib2wsIFwiMVwiLlxuICAgICAgLy8gVGhlIHJ1bGUgaXMgdGhhdCBzeW1ib2xzIHRvIHRoZSBsZWZ0IGNhcnJ5IG1vcmUgd2VpZ2h0IHRoYW4gc3ltYm9scyB0byB0aGUgcmlnaHRcbiAgICAgIC8vIHdoZW4gYSBudW1iZXIgaXMgd3JpdHRlbiBvdXQgYXMgYSBzdHJpbmcuIEluIHRoZSBhYm92ZSBzdHJpbmdzLCB0aGUgbGVhZGluZyBkaWdpdFxuICAgICAgLy8gcmVwcmVzZW50cyBob3cgbWFueSAxMDAncyBhcmUgaW4gdGhlIG51bWJlciwgYW5kIGl0IGNhcnJpZXMgbW9yZSB3ZWlnaHQgdGhhbiB0aGUgbWlkZGxlXG4gICAgICAvLyBudW1iZXIgd2hpY2ggcmVwcmVzZW50cyBob3cgbWFueSAxMCdzIGFyZSBpbiB0aGUgbnVtYmVyLlxuICAgICAgLy8gVGhpcyBzeXN0ZW0gb2YgbnVtYmVyIG1hZ25pdHVkZSB3b3JrcyB3ZWxsIGZvciByb3V0ZSBzcGVjaWZpY2l0eSwgdG9vLiBBIHJvdXRlIHdyaXR0ZW4gYXNcbiAgICAgIC8vIGBhL2IvY2Agd2lsbCBiZSBtb3JlIHNwZWNpZmljIHRoYW4gYHgveS96YCBhcyBsb25nIGFzIGBhYCBpcyBtb3JlIHNwZWNpZmljIHRoYW5cbiAgICAgIC8vIGB4YCwgaXJyZXNwZWN0aXZlIG9mIHRoZSBvdGhlciBwYXJ0cy5cbiAgICAgIC8vIEJlY2F1c2Ugb2YgdGhpcyBzaW1pbGFyaXR5LCB3ZSBhc3NpZ24gZWFjaCB0eXBlIG9mIHNlZ21lbnQgYSBudW1iZXIgdmFsdWUgd3JpdHRlbiBhcyBhXG4gICAgICAvLyBzdHJpbmcuIFdlIGNhbiBmaW5kIHRoZSBzcGVjaWZpY2l0eSBvZiBjb21wb3VuZCByb3V0ZXMgYnkgY29uY2F0ZW5hdGluZyB0aGVzZSBzdHJpbmdzXG4gICAgICAvLyB0b2dldGhlciwgZnJvbSBsZWZ0IHRvIHJpZ2h0LiBBZnRlciB3ZSBoYXZlIGxvb3BlZCB0aHJvdWdoIGFsbCBvZiB0aGUgc2VnbWVudHMsXG4gICAgICAvLyB3ZSBjb252ZXJ0IHRoZSBzdHJpbmcgdG8gYSBudW1iZXIuXG4gICAgICBzcGVjaWZpY2l0eS52YWwgPSAnJztcblxuICAgICAgZm9yICh2YXIgaT0wLCBsPXNlZ21lbnRzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgdmFyIHNlZ21lbnQgPSBzZWdtZW50c1tpXSwgbWF0Y2g7XG5cbiAgICAgICAgaWYgKG1hdGNoID0gc2VnbWVudC5tYXRjaCgvXjooW15cXC9dKykkLykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobmV3ICQkcm91dGUkcmVjb2duaXplciQkRHluYW1pY1NlZ21lbnQobWF0Y2hbMV0pKTtcbiAgICAgICAgICBuYW1lcy5wdXNoKG1hdGNoWzFdKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzMnO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoID0gc2VnbWVudC5tYXRjaCgvXlxcKihbXlxcL10rKSQvKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGFyU2VnbWVudChtYXRjaFsxXSkpO1xuICAgICAgICAgIHNwZWNpZmljaXR5LnZhbCArPSAnMic7XG4gICAgICAgICAgbmFtZXMucHVzaChtYXRjaFsxXSk7XG4gICAgICAgIH0gZWxzZSBpZihzZWdtZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50KCkpO1xuICAgICAgICAgIHNwZWNpZmljaXR5LnZhbCArPSAnMSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRpY1NlZ21lbnQoc2VnbWVudCkpO1xuICAgICAgICAgIHNwZWNpZmljaXR5LnZhbCArPSAnNCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3BlY2lmaWNpdHkudmFsID0gK3NwZWNpZmljaXR5LnZhbDtcblxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLy8gQSBTdGF0ZSBoYXMgYSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBhbmQgKGBjaGFyU3BlY2ApIGFuZCBhIGxpc3Qgb2YgcG9zc2libGVcbiAgICAvLyBzdWJzZXF1ZW50IHN0YXRlcyAoYG5leHRTdGF0ZXNgKS5cbiAgICAvL1xuICAgIC8vIElmIGEgU3RhdGUgaXMgYW4gYWNjZXB0aW5nIHN0YXRlLCBpdCB3aWxsIGFsc28gaGF2ZSBzZXZlcmFsIGFkZGl0aW9uYWxcbiAgICAvLyBwcm9wZXJ0aWVzOlxuICAgIC8vXG4gICAgLy8gKiBgcmVnZXhgOiBBIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGlzIHVzZWQgdG8gZXh0cmFjdCBwYXJhbWV0ZXJzIGZyb20gcGF0aHNcbiAgICAvLyAgIHRoYXQgcmVhY2hlZCB0aGlzIGFjY2VwdGluZyBzdGF0ZS5cbiAgICAvLyAqIGBoYW5kbGVyc2A6IEluZm9ybWF0aW9uIG9uIGhvdyB0byBjb252ZXJ0IHRoZSBsaXN0IG9mIGNhcHR1cmVzIGludG8gY2FsbHNcbiAgICAvLyAgIHRvIHJlZ2lzdGVyZWQgaGFuZGxlcnMgd2l0aCB0aGUgc3BlY2lmaWVkIHBhcmFtZXRlcnNcbiAgICAvLyAqIGB0eXBlc2A6IEhvdyBtYW55IHN0YXRpYywgZHluYW1pYyBvciBzdGFyIHNlZ21lbnRzIGluIHRoaXMgcm91dGUuIFVzZWQgdG9cbiAgICAvLyAgIGRlY2lkZSB3aGljaCByb3V0ZSB0byB1c2UgaWYgbXVsdGlwbGUgcmVnaXN0ZXJlZCByb3V0ZXMgbWF0Y2ggYSBwYXRoLlxuICAgIC8vXG4gICAgLy8gQ3VycmVudGx5LCBTdGF0ZSBpcyBpbXBsZW1lbnRlZCBuYWl2ZWx5IGJ5IGxvb3Bpbmcgb3ZlciBgbmV4dFN0YXRlc2AgYW5kXG4gICAgLy8gY29tcGFyaW5nIGEgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gYWdhaW5zdCBhIGNoYXJhY3Rlci4gQSBtb3JlIGVmZmljaWVudFxuICAgIC8vIGltcGxlbWVudGF0aW9uIHdvdWxkIHVzZSBhIGhhc2ggb2Yga2V5cyBwb2ludGluZyBhdCBvbmUgb3IgbW9yZSBuZXh0IHN0YXRlcy5cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkU3RhdGUoY2hhclNwZWMpIHtcbiAgICAgIHRoaXMuY2hhclNwZWMgPSBjaGFyU3BlYztcbiAgICAgIHRoaXMubmV4dFN0YXRlcyA9IFtdO1xuICAgIH1cblxuICAgICQkcm91dGUkcmVjb2duaXplciQkU3RhdGUucHJvdG90eXBlID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbihjaGFyU3BlYykge1xuICAgICAgICB2YXIgbmV4dFN0YXRlcyA9IHRoaXMubmV4dFN0YXRlcztcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9bmV4dFN0YXRlcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGNoaWxkID0gbmV4dFN0YXRlc1tpXTtcblxuICAgICAgICAgIHZhciBpc0VxdWFsID0gY2hpbGQuY2hhclNwZWMudmFsaWRDaGFycyA9PT0gY2hhclNwZWMudmFsaWRDaGFycztcbiAgICAgICAgICBpc0VxdWFsID0gaXNFcXVhbCAmJiBjaGlsZC5jaGFyU3BlYy5pbnZhbGlkQ2hhcnMgPT09IGNoYXJTcGVjLmludmFsaWRDaGFycztcblxuICAgICAgICAgIGlmIChpc0VxdWFsKSB7IHJldHVybiBjaGlsZDsgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBwdXQ6IGZ1bmN0aW9uKGNoYXJTcGVjKSB7XG4gICAgICAgIHZhciBzdGF0ZTtcblxuICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gYWxyZWFkeSBleGlzdHMgaW4gYSBjaGlsZCBvZiB0aGUgY3VycmVudFxuICAgICAgICAvLyBzdGF0ZSwganVzdCByZXR1cm4gdGhhdCBzdGF0ZS5cbiAgICAgICAgaWYgKHN0YXRlID0gdGhpcy5nZXQoY2hhclNwZWMpKSB7IHJldHVybiBzdGF0ZTsgfVxuXG4gICAgICAgIC8vIE1ha2UgYSBuZXcgc3RhdGUgZm9yIHRoZSBjaGFyYWN0ZXIgc3BlY1xuICAgICAgICBzdGF0ZSA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlKGNoYXJTcGVjKTtcblxuICAgICAgICAvLyBJbnNlcnQgdGhlIG5ldyBzdGF0ZSBhcyBhIGNoaWxkIG9mIHRoZSBjdXJyZW50IHN0YXRlXG4gICAgICAgIHRoaXMubmV4dFN0YXRlcy5wdXNoKHN0YXRlKTtcblxuICAgICAgICAvLyBJZiB0aGlzIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIHJlcGVhdHMsIGluc2VydCB0aGUgbmV3IHN0YXRlIGFzIGEgY2hpbGRcbiAgICAgICAgLy8gb2YgaXRzZWxmLiBOb3RlIHRoYXQgdGhpcyB3aWxsIG5vdCB0cmlnZ2VyIGFuIGluZmluaXRlIGxvb3AgYmVjYXVzZSBlYWNoXG4gICAgICAgIC8vIHRyYW5zaXRpb24gZHVyaW5nIHJlY29nbml0aW9uIGNvbnN1bWVzIGEgY2hhcmFjdGVyLlxuICAgICAgICBpZiAoY2hhclNwZWMucmVwZWF0KSB7XG4gICAgICAgICAgc3RhdGUubmV4dFN0YXRlcy5wdXNoKHN0YXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgbmV3IHN0YXRlXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIEZpbmQgYSBsaXN0IG9mIGNoaWxkIHN0YXRlcyBtYXRjaGluZyB0aGUgbmV4dCBjaGFyYWN0ZXJcbiAgICAgIG1hdGNoOiBmdW5jdGlvbihjaCkge1xuICAgICAgICAvLyBERUJVRyBcIlByb2Nlc3NpbmcgYFwiICsgY2ggKyBcImA6XCJcbiAgICAgICAgdmFyIG5leHRTdGF0ZXMgPSB0aGlzLm5leHRTdGF0ZXMsXG4gICAgICAgICAgICBjaGlsZCwgY2hhclNwZWMsIGNoYXJzO1xuXG4gICAgICAgIC8vIERFQlVHIFwiICBcIiArIGRlYnVnU3RhdGUodGhpcylcbiAgICAgICAgdmFyIHJldHVybmVkID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPW5leHRTdGF0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIGNoaWxkID0gbmV4dFN0YXRlc1tpXTtcblxuICAgICAgICAgIGNoYXJTcGVjID0gY2hpbGQuY2hhclNwZWM7XG5cbiAgICAgICAgICBpZiAodHlwZW9mIChjaGFycyA9IGNoYXJTcGVjLnZhbGlkQ2hhcnMpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGNoYXJzLmluZGV4T2YoY2gpICE9PSAtMSkgeyByZXR1cm5lZC5wdXNoKGNoaWxkKTsgfVxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChjaGFycyA9IGNoYXJTcGVjLmludmFsaWRDaGFycykgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoY2hhcnMuaW5kZXhPZihjaCkgPT09IC0xKSB7IHJldHVybmVkLnB1c2goY2hpbGQpOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xuICAgICAgfVxuXG4gICAgICAvKiogSUYgREVCVUdcbiAgICAgICwgZGVidWc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hhclNwZWMgPSB0aGlzLmNoYXJTcGVjLFxuICAgICAgICAgICAgZGVidWcgPSBcIltcIixcbiAgICAgICAgICAgIGNoYXJzID0gY2hhclNwZWMudmFsaWRDaGFycyB8fCBjaGFyU3BlYy5pbnZhbGlkQ2hhcnM7XG5cbiAgICAgICAgaWYgKGNoYXJTcGVjLmludmFsaWRDaGFycykgeyBkZWJ1ZyArPSBcIl5cIjsgfVxuICAgICAgICBkZWJ1ZyArPSBjaGFycztcbiAgICAgICAgZGVidWcgKz0gXCJdXCI7XG5cbiAgICAgICAgaWYgKGNoYXJTcGVjLnJlcGVhdCkgeyBkZWJ1ZyArPSBcIitcIjsgfVxuXG4gICAgICAgIHJldHVybiBkZWJ1ZztcbiAgICAgIH1cbiAgICAgIEVORCBJRiAqKi9cbiAgICB9O1xuXG4gICAgLyoqIElGIERFQlVHXG4gICAgZnVuY3Rpb24gZGVidWcobG9nKSB7XG4gICAgICBjb25zb2xlLmxvZyhsb2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlYnVnU3RhdGUoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5uZXh0U3RhdGVzLm1hcChmdW5jdGlvbihuKSB7XG4gICAgICAgIGlmIChuLm5leHRTdGF0ZXMubGVuZ3RoID09PSAwKSB7IHJldHVybiBcIiggXCIgKyBuLmRlYnVnKCkgKyBcIiBbYWNjZXB0aW5nXSApXCI7IH1cbiAgICAgICAgcmV0dXJuIFwiKCBcIiArIG4uZGVidWcoKSArIFwiIDx0aGVuPiBcIiArIG4ubmV4dFN0YXRlcy5tYXAoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5kZWJ1ZygpIH0pLmpvaW4oXCIgb3IgXCIpICsgXCIgKVwiO1xuICAgICAgfSkuam9pbihcIiwgXCIpXG4gICAgfVxuICAgIEVORCBJRiAqKi9cblxuICAgIC8vIFNvcnQgdGhlIHJvdXRlcyBieSBzcGVjaWZpY2l0eVxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkc29ydFNvbHV0aW9ucyhzdGF0ZXMpIHtcbiAgICAgIHJldHVybiBzdGF0ZXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBiLnNwZWNpZmljaXR5LnZhbCAtIGEuc3BlY2lmaWNpdHkudmFsO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRyZWNvZ25pemVDaGFyKHN0YXRlcywgY2gpIHtcbiAgICAgIHZhciBuZXh0U3RhdGVzID0gW107XG5cbiAgICAgIGZvciAodmFyIGk9MCwgbD1zdGF0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICB2YXIgc3RhdGUgPSBzdGF0ZXNbaV07XG5cbiAgICAgICAgbmV4dFN0YXRlcyA9IG5leHRTdGF0ZXMuY29uY2F0KHN0YXRlLm1hdGNoKGNoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXh0U3RhdGVzO1xuICAgIH1cblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJG9DcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgICBmdW5jdGlvbiBGKCkge31cbiAgICAgIEYucHJvdG90eXBlID0gcHJvdG87XG4gICAgICByZXR1cm4gbmV3IEYoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRSZWNvZ25pemVSZXN1bHRzKHF1ZXJ5UGFyYW1zKSB7XG4gICAgICB0aGlzLnF1ZXJ5UGFyYW1zID0gcXVlcnlQYXJhbXMgfHwge307XG4gICAgfVxuICAgICQkcm91dGUkcmVjb2duaXplciQkUmVjb2duaXplUmVzdWx0cy5wcm90b3R5cGUgPSAkJHJvdXRlJHJlY29nbml6ZXIkJG9DcmVhdGUoe1xuICAgICAgc3BsaWNlOiBBcnJheS5wcm90b3R5cGUuc3BsaWNlLFxuICAgICAgc2xpY2U6ICBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBwdXNoOiAgIEFycmF5LnByb3RvdHlwZS5wdXNoLFxuICAgICAgbGVuZ3RoOiAwLFxuICAgICAgcXVlcnlQYXJhbXM6IG51bGxcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkZmluZEhhbmRsZXIoc3RhdGUsIHBhdGgsIHF1ZXJ5UGFyYW1zKSB7XG4gICAgICB2YXIgaGFuZGxlcnMgPSBzdGF0ZS5oYW5kbGVycywgcmVnZXggPSBzdGF0ZS5yZWdleDtcbiAgICAgIHZhciBjYXB0dXJlcyA9IHBhdGgubWF0Y2gocmVnZXgpLCBjdXJyZW50Q2FwdHVyZSA9IDE7XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3ICQkcm91dGUkcmVjb2duaXplciQkUmVjb2duaXplUmVzdWx0cyhxdWVyeVBhcmFtcyk7XG5cbiAgICAgIGZvciAodmFyIGk9MCwgbD1oYW5kbGVycy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gaGFuZGxlcnNbaV0sIG5hbWVzID0gaGFuZGxlci5uYW1lcywgcGFyYW1zID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgaj0wLCBtPW5hbWVzLmxlbmd0aDsgajxtOyBqKyspIHtcbiAgICAgICAgICBwYXJhbXNbbmFtZXNbal1dID0gY2FwdHVyZXNbY3VycmVudENhcHR1cmUrK107XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQucHVzaCh7IGhhbmRsZXI6IGhhbmRsZXIuaGFuZGxlciwgcGFyYW1zOiBwYXJhbXMsIGlzRHluYW1pYzogISFuYW1lcy5sZW5ndGggfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRhZGRTZWdtZW50KGN1cnJlbnRTdGF0ZSwgc2VnbWVudCkge1xuICAgICAgc2VnbWVudC5lYWNoQ2hhcihmdW5jdGlvbihjaCkge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFN0YXRlLnB1dChjaCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGN1cnJlbnRTdGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJGRlY29kZVF1ZXJ5UGFyYW1QYXJ0KHBhcnQpIHtcbiAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw0MDEvaW50ZXJhY3QvZm9ybXMuaHRtbCNoLTE3LjEzLjQuMVxuICAgICAgcGFydCA9IHBhcnQucmVwbGFjZSgvXFwrL2dtLCAnJTIwJyk7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnQpO1xuICAgIH1cblxuICAgIC8vIFRoZSBtYWluIGludGVyZmFjZVxuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJvb3RTdGF0ZSA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlKCk7XG4gICAgICB0aGlzLm5hbWVzID0ge307XG4gICAgfTtcblxuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgICAgYWRkOiBmdW5jdGlvbihyb3V0ZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHRoaXMucm9vdFN0YXRlLCByZWdleCA9IFwiXlwiLFxuICAgICAgICAgICAgc3BlY2lmaWNpdHkgPSB7fSxcbiAgICAgICAgICAgIGhhbmRsZXJzID0gW10sIGFsbFNlZ21lbnRzID0gW10sIG5hbWU7XG5cbiAgICAgICAgdmFyIGlzRW1wdHkgPSB0cnVlO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1yb3V0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHZhciByb3V0ZSA9IHJvdXRlc1tpXSwgbmFtZXMgPSBbXTtcblxuICAgICAgICAgIHZhciBzZWdtZW50cyA9ICQkcm91dGUkcmVjb2duaXplciQkcGFyc2Uocm91dGUucGF0aCwgbmFtZXMsIHNwZWNpZmljaXR5KTtcblxuICAgICAgICAgIGFsbFNlZ21lbnRzID0gYWxsU2VnbWVudHMuY29uY2F0KHNlZ21lbnRzKTtcblxuICAgICAgICAgIGZvciAodmFyIGo9MCwgbT1zZWdtZW50cy5sZW5ndGg7IGo8bTsgaisrKSB7XG4gICAgICAgICAgICB2YXIgc2VnbWVudCA9IHNlZ21lbnRzW2pdO1xuXG4gICAgICAgICAgICBpZiAoc2VnbWVudCBpbnN0YW5jZW9mICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgaXNFbXB0eSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBBZGQgYSBcIi9cIiBmb3IgdGhlIG5ldyBzZWdtZW50XG4gICAgICAgICAgICBjdXJyZW50U3RhdGUgPSBjdXJyZW50U3RhdGUucHV0KHsgdmFsaWRDaGFyczogXCIvXCIgfSk7XG4gICAgICAgICAgICByZWdleCArPSBcIi9cIjtcblxuICAgICAgICAgICAgLy8gQWRkIGEgcmVwcmVzZW50YXRpb24gb2YgdGhlIHNlZ21lbnQgdG8gdGhlIE5GQSBhbmQgcmVnZXhcbiAgICAgICAgICAgIGN1cnJlbnRTdGF0ZSA9ICQkcm91dGUkcmVjb2duaXplciQkYWRkU2VnbWVudChjdXJyZW50U3RhdGUsIHNlZ21lbnQpO1xuICAgICAgICAgICAgcmVnZXggKz0gc2VnbWVudC5yZWdleCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBoYW5kbGVyID0geyBoYW5kbGVyOiByb3V0ZS5oYW5kbGVyLCBuYW1lczogbmFtZXMgfTtcbiAgICAgICAgICBoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzRW1wdHkpIHtcbiAgICAgICAgICBjdXJyZW50U3RhdGUgPSBjdXJyZW50U3RhdGUucHV0KHsgdmFsaWRDaGFyczogXCIvXCIgfSk7XG4gICAgICAgICAgcmVnZXggKz0gXCIvXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50U3RhdGUuaGFuZGxlcnMgPSBoYW5kbGVycztcbiAgICAgICAgY3VycmVudFN0YXRlLnJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCArIFwiJFwiKTtcbiAgICAgICAgY3VycmVudFN0YXRlLnNwZWNpZmljaXR5ID0gc3BlY2lmaWNpdHk7XG5cbiAgICAgICAgaWYgKG5hbWUgPSBvcHRpb25zICYmIG9wdGlvbnMuYXMpIHtcbiAgICAgICAgICB0aGlzLm5hbWVzW25hbWVdID0ge1xuICAgICAgICAgICAgc2VnbWVudHM6IGFsbFNlZ21lbnRzLFxuICAgICAgICAgICAgaGFuZGxlcnM6IGhhbmRsZXJzXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaGFuZGxlcnNGb3I6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIHJvdXRlID0gdGhpcy5uYW1lc1tuYW1lXSwgcmVzdWx0ID0gW107XG4gICAgICAgIGlmICghcm91dGUpIHsgdGhyb3cgbmV3IEVycm9yKFwiVGhlcmUgaXMgbm8gcm91dGUgbmFtZWQgXCIgKyBuYW1lKTsgfVxuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1yb3V0ZS5oYW5kbGVycy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2gocm91dGUuaGFuZGxlcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG5cbiAgICAgIGhhc1JvdXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMubmFtZXNbbmFtZV07XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24obmFtZSwgcGFyYW1zKSB7XG4gICAgICAgIHZhciByb3V0ZSA9IHRoaXMubmFtZXNbbmFtZV0sIG91dHB1dCA9IFwiXCI7XG4gICAgICAgIGlmICghcm91dGUpIHsgdGhyb3cgbmV3IEVycm9yKFwiVGhlcmUgaXMgbm8gcm91dGUgbmFtZWQgXCIgKyBuYW1lKTsgfVxuXG4gICAgICAgIHZhciBzZWdtZW50cyA9IHJvdXRlLnNlZ21lbnRzO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1zZWdtZW50cy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNlZ21lbnQgPSBzZWdtZW50c1tpXTtcblxuICAgICAgICAgIGlmIChzZWdtZW50IGluc3RhbmNlb2YgJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgb3V0cHV0ICs9IFwiL1wiO1xuICAgICAgICAgIG91dHB1dCArPSBzZWdtZW50LmdlbmVyYXRlKHBhcmFtcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3V0cHV0LmNoYXJBdCgwKSAhPT0gJy8nKSB7IG91dHB1dCA9ICcvJyArIG91dHB1dDsgfVxuXG4gICAgICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zLnF1ZXJ5UGFyYW1zKSB7XG4gICAgICAgICAgb3V0cHV0ICs9IHRoaXMuZ2VuZXJhdGVRdWVyeVN0cmluZyhwYXJhbXMucXVlcnlQYXJhbXMsIHJvdXRlLmhhbmRsZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZVF1ZXJ5U3RyaW5nOiBmdW5jdGlvbihwYXJhbXMsIGhhbmRsZXJzKSB7XG4gICAgICAgIHZhciBwYWlycyA9IFtdO1xuICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICBmb3IodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICBpZiAocGFyYW1zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBrZXlzLnNvcnQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcmFtc1trZXldO1xuICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHBhaXIgPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KTtcbiAgICAgICAgICBpZiAoJCRyb3V0ZSRyZWNvZ25pemVyJCRpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICAgICAgICAgICAgdmFyIGFycmF5UGFpciA9IGtleSArICdbXScgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWVbal0pO1xuICAgICAgICAgICAgICBwYWlycy5wdXNoKGFycmF5UGFpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhaXIgKz0gXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgcGFpcnMucHVzaChwYWlyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFpcnMubGVuZ3RoID09PSAwKSB7IHJldHVybiAnJzsgfVxuXG4gICAgICAgIHJldHVybiBcIj9cIiArIHBhaXJzLmpvaW4oXCImXCIpO1xuICAgICAgfSxcblxuICAgICAgcGFyc2VRdWVyeVN0cmluZzogZnVuY3Rpb24ocXVlcnlTdHJpbmcpIHtcbiAgICAgICAgdmFyIHBhaXJzID0gcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpLCBxdWVyeVBhcmFtcyA9IHt9O1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHBhaXIgICAgICA9IHBhaXJzW2ldLnNwbGl0KCc9JyksXG4gICAgICAgICAgICAgIGtleSAgICAgICA9ICQkcm91dGUkcmVjb2duaXplciQkZGVjb2RlUXVlcnlQYXJhbVBhcnQocGFpclswXSksXG4gICAgICAgICAgICAgIGtleUxlbmd0aCA9IGtleS5sZW5ndGgsXG4gICAgICAgICAgICAgIGlzQXJyYXkgPSBmYWxzZSxcbiAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgaWYgKHBhaXIubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB2YWx1ZSA9ICd0cnVlJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9IYW5kbGUgYXJyYXlzXG4gICAgICAgICAgICBpZiAoa2V5TGVuZ3RoID4gMiAmJiBrZXkuc2xpY2Uoa2V5TGVuZ3RoIC0yKSA9PT0gJ1tdJykge1xuICAgICAgICAgICAgICBpc0FycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAga2V5ID0ga2V5LnNsaWNlKDAsIGtleUxlbmd0aCAtIDIpO1xuICAgICAgICAgICAgICBpZighcXVlcnlQYXJhbXNba2V5XSkge1xuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zW2tleV0gPSBbXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYWlyWzFdID8gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWNvZGVRdWVyeVBhcmFtUGFydChwYWlyWzFdKSA6ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICAgICAgcXVlcnlQYXJhbXNba2V5XS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcXVlcnlQYXJhbXNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcXVlcnlQYXJhbXM7XG4gICAgICB9LFxuXG4gICAgICByZWNvZ25pemU6IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgdmFyIHN0YXRlcyA9IFsgdGhpcy5yb290U3RhdGUgXSxcbiAgICAgICAgICAgIHBhdGhMZW4sIGksIGwsIHF1ZXJ5U3RhcnQsIHF1ZXJ5UGFyYW1zID0ge30sXG4gICAgICAgICAgICBpc1NsYXNoRHJvcHBlZCA9IGZhbHNlO1xuXG4gICAgICAgIHF1ZXJ5U3RhcnQgPSBwYXRoLmluZGV4T2YoJz8nKTtcbiAgICAgICAgaWYgKHF1ZXJ5U3RhcnQgIT09IC0xKSB7XG4gICAgICAgICAgdmFyIHF1ZXJ5U3RyaW5nID0gcGF0aC5zdWJzdHIocXVlcnlTdGFydCArIDEsIHBhdGgubGVuZ3RoKTtcbiAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoMCwgcXVlcnlTdGFydCk7XG4gICAgICAgICAgcXVlcnlQYXJhbXMgPSB0aGlzLnBhcnNlUXVlcnlTdHJpbmcocXVlcnlTdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGF0aCA9IGRlY29kZVVSSShwYXRoKTtcblxuICAgICAgICAvLyBERUJVRyBHUk9VUCBwYXRoXG5cbiAgICAgICAgaWYgKHBhdGguY2hhckF0KDApICE9PSBcIi9cIikgeyBwYXRoID0gXCIvXCIgKyBwYXRoOyB9XG5cbiAgICAgICAgcGF0aExlbiA9IHBhdGgubGVuZ3RoO1xuICAgICAgICBpZiAocGF0aExlbiA+IDEgJiYgcGF0aC5jaGFyQXQocGF0aExlbiAtIDEpID09PSBcIi9cIikge1xuICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cigwLCBwYXRoTGVuIC0gMSk7XG4gICAgICAgICAgaXNTbGFzaERyb3BwZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpPTAsIGw9cGF0aC5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgc3RhdGVzID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRyZWNvZ25pemVDaGFyKHN0YXRlcywgcGF0aC5jaGFyQXQoaSkpO1xuICAgICAgICAgIGlmICghc3RhdGVzLmxlbmd0aCkgeyBicmVhazsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRU5EIERFQlVHIEdST1VQXG5cbiAgICAgICAgdmFyIHNvbHV0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGk9MCwgbD1zdGF0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIGlmIChzdGF0ZXNbaV0uaGFuZGxlcnMpIHsgc29sdXRpb25zLnB1c2goc3RhdGVzW2ldKTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGVzID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRzb3J0U29sdXRpb25zKHNvbHV0aW9ucyk7XG5cbiAgICAgICAgdmFyIHN0YXRlID0gc29sdXRpb25zWzBdO1xuXG4gICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5oYW5kbGVycykge1xuICAgICAgICAgIC8vIGlmIGEgdHJhaWxpbmcgc2xhc2ggd2FzIGRyb3BwZWQgYW5kIGEgc3RhciBzZWdtZW50IGlzIHRoZSBsYXN0IHNlZ21lbnRcbiAgICAgICAgICAvLyBzcGVjaWZpZWQsIHB1dCB0aGUgdHJhaWxpbmcgc2xhc2ggYmFja1xuICAgICAgICAgIGlmIChpc1NsYXNoRHJvcHBlZCAmJiBzdGF0ZS5yZWdleC5zb3VyY2Uuc2xpY2UoLTUpID09PSBcIiguKykkXCIpIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoICsgXCIvXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAkJHJvdXRlJHJlY29nbml6ZXIkJGZpbmRIYW5kbGVyKHN0YXRlLCBwYXRoLCBxdWVyeVBhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXIucHJvdG90eXBlLm1hcCA9ICQkcm91dGUkcmVjb2duaXplciRkc2wkJGRlZmF1bHQ7XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplci5WRVJTSU9OID0gJzAuMS45JztcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJGRlZmF1bHQgPSAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplcjtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoJ3JvdXRlLXJlY29nbml6ZXInLCBmdW5jdGlvbigpIHsgcmV0dXJuICQkcm91dGUkcmVjb2duaXplciQkZGVmYXVsdDsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSAkJHJvdXRlJHJlY29nbml6ZXIkJGRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ1JvdXRlUmVjb2duaXplciddID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0O1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJvdXRlLXJlY29nbml6ZXIuanMubWFwIiwiLyoqXG4gKiBUaGUgbWltZW8gbW9kdWxlcyBkZXNjcmliZXMgdGhlIHVzZSBvZiB0aGUgbWltZW8gZnJhbWV3b3JrLlxuICpcbiAqIEBtb2R1bGUgTWltZW9cbiAqL1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlLmpzJyk7XG5cbnZhciBNb2R1bGVzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMvTW9kdWxlcy5qcycpO1xudmFyIEluamVjdGFibGVzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMvSW5qZWN0YWJsZXMuanMnKTtcblxudmFyIHJlZ2lzdGVyQnVpbHRJbnMgPSByZXF1aXJlKCcuL2J1aWx0aW5zL1JlZ2lzdGVyLmpzJyk7XG4vKipcbiAqIFRoaXMgaXMgdGhlIGVudHJ5IHBvaW50IGZvciB0aGUgTWltZW8gZnJhbWV3b3JrLiBDcmVhdGUgbW9kdWxlcyBvciBib290c3RyYXBcbiAqIGFuIGluamVjdGFibGUuXG4gKlxuICogQGNsYXNzIE1pbWVvXG4gKiBAc3RhdGljXG4gKi9cbnZhciBNaW1lbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2R1bGVzID0gTW9kdWxlcygpO1xuICAgIHZhciBpbmplY3RhYmxlcyA9IEluamVjdGFibGVzKCk7XG5cbiAgICByZWdpc3RlckJ1aWx0SW5zKGluamVjdGFibGVzKTtcblxuICAgIGZ1bmN0aW9uIGJvb3RzdHJhcChpbmplY3RhYmxlTmFtZSkge1xuICAgICAgICBpZiAoIWluamVjdGFibGVOYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlZmluZSBhbiBpbmplY3RhYmxlIHRvIGJvb3RzdHJhcCEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbW9kdWxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGVzIGRvblxcJ3QgZXhpc3Q6ICcgKyBtb2R1bGVzLmdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWluamVjdGFibGVzLmhhc0FsbERlcGVuZGVuY2llcygpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGVzIGRvblxcJ3QgZXhpc3Q6ICcgKyBpbmplY3RhYmxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0YWJsZXMuaW5zdGFudGlhdGUoKTtcblxuICAgICAgICBtb2R1bGVzLmluc3RhbnRpYXRlKCk7XG5cbiAgICAgICAgdmFyIGVudHJ5SW5qZWN0YWJsZSA9IGluamVjdGFibGVzLmdldChpbmplY3RhYmxlTmFtZSk7XG5cbiAgICAgICAgaWYgKCFCb29sZWFuKGVudHJ5SW5qZWN0YWJsZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0YWJsZSBcIicgKyBpbmplY3RhYmxlTmFtZSArICdcIiB0byBib290c3RyYXAgbm90IGZvdW5kLiBTdHJpbmd5ZmllZCBpbmplY3RhYmxlOiAnICsgZW50cnlJbmplY3RhYmxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKGVudHJ5SW5qZWN0YWJsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlIFwiJyArIGluamVjdGFibGVOYW1lICsgJ1wiIGlzIG5vdCBleGVjdXRhYmxlLiBTdHJpbmd5ZmllZCBpbmplY3RhYmxlOiAnICsgU3RyaW5nKGVudHJ5SW5qZWN0YWJsZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVudHJ5SW5qZWN0YWJsZS5hcHBseShlbnRyeUluamVjdGFibGUsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbiBNaW1lbywgbW9kdWxlcyBhcmUgdG9wLWxldmVsIGNvbnN0cnVjdHMgdGhhdCBvd24gYW5kIG1hbmFnZVxuICAgICAgICAgKiBpbmplY3RhYmxlcy4gTW9kdWxlcyBjYW4gZGVwZW5kIG9uIG90aGVyIG1vZHVsZSBhbmQgd2lsbCBiZSBpbnN0YW50aWF0ZWRcbiAgICAgICAgICogaW4gZGVwZW5kZW5jeS1vcmRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBtb2R1bGVcbiAgICAgICAgICogQGZvciBNaW1lb1xuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICAgICAgICAgKiAgICAgICAgICAuY29tcG9uZW50KCdncmVldGluZycsICgpID0+IChuYW1lKSA9PiBjb25zb2xlLmxvZygnSGksICcgKyBuYW1lKTtcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgbW9kdWxlXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IFtkZXBlbmRlbmNpZXNdIEFycmF5IG9mIG1vZHVsZSBuYW1lcyB0aGF0IHRoaXNcbiAgICAgICAgICogIG1vZHVsZSBkZXBlbmRzIG9uXG4gICAgICAgICAqIEByZXR1cm4ge01vZHVsZX1cbiAgICAgICAgICovXG4gICAgICAgIG1vZHVsZTogZnVuY3Rpb24obmFtZSwgZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICBpZiAoZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZHVsZXMuYWRkKG5ldyBNb2R1bGUoaW5qZWN0YWJsZXMsIG5hbWUsIGRlcGVuZGVuY2llcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbW9kdWxlcy5nZXQobmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBtZXRob2QgYm9vdHN0cmFwXG4gICAgICAgICAqIEBmb3IgTWltZW9cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAgICAgICAgICogICAgICAgICAgLmNvbXBvbmVudCgnZ3JlZXRpbmcnLCAoKSA9PiAobmFtZSkgPT4gY29uc29sZS5sb2coJ0hpLCAnICsgbmFtZSk7XG4gICAgICAgICAqICAgICAgbWltZW8uYm9vdHN0cmFwKCdncmVldGluZycsICdKb2huJylcbiAgICAgICAgICogICAgICAvLz0+IFwiSGksIEpvaG5cIlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5qZWN0YWJsZU5hbWVcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IFsuLi5wYXJhbWV0ZXJzXSBQYXNzZWQgdGhyb3VnaCB0byBpbmplY3RhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBib290c3RyYXA6IGJvb3RzdHJhcFxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWltZW8oKTtcbiIsIi8qKlxuICogQG1vZHVsZSBNaW1lb1xuICovXG5cbi8qKlxuICogTW9kdWxlcyBhcmUgdGhlIHByaW1hcnkgaW50ZXJmYWNlIHRvIG1pbWVvLiBPbiBhIG1vZHVsZSwgeW91IGNhbiBkZWZpbmVcbiAqIGluamVjdGFibGVzLiBFYWNoIGluamVjdGFibGUgZGVmaW5pdGlvbiB3aWxsIHJldHVybiB0aGUgY3VycmVudCBtb2R1bGUsXG4gKiBhbGxvd2luZyB5b3UgdG8gY2hhaW4gaW5qZWN0YWJsZSBkZWZpbml0aW9ucy5cbiAqXG4gKiBJbmplY3RhYmxlcyBjb25zaXN0IG9mIHRocmVlIHBhcnRzOiBBIG5hbWUsIGEgbGlzdCBvZiBkZXBlbmRlbmNpZXMgYW5kIGFuXG4gKiBleGVjdXRhYmxlLiBUaGUgZGVwZW5kZW5jaWVzIGFyZSBuYW1lcyBvZiBvdGhlciBpbmplY3RhYmxlcyB0aGF0IHdpbGwgYmVcbiAqIHBhc3NlZCB0byB0aGUgZXhlY3V0YWJsZS5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHdheXMgb2YgZGVmaW5pbmcgYW4gaW5qZWN0YWJsZS4gVGhlIGZpcnN0IGlzIGFuIGFycmF5IG5vdGF0aW9uXG4gKiB3aGVyZSB0aGUgbGFzdCBlbnRyeSBpbiB0aGUgYXJyYXkgaXMgdGhlIGV4ZWN1dGFibGUuIFRoZSBvdGhlciBpcyBhblxuICogZXhlY3V0YWJsZSB0aGF0IGhhcyB0aGUgc3BlY2lhbCBwcm9wZXJ0aWVzICRuYW1lIGFuZCAkaW5qZWN0LlxuICpcbiAqIEhlcmUgaXMgYW4gZXhhbXBsZSBvZiB0aGUgYXJyYXktc3R5bGUuIFR3byBmYWN0b3JpZXMgQSBhbmQgQiBhcmUgZGVmaW5lZCxcbiAqIHdpdGggQiBoYXZpbmcgYSBkZXBlbmRlbmN5IG9uIEE6XG4gKlxuICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAqICAgICAgICAgIC5mYWN0b3J5KCdBJywgWygpID0+IHt9XSlcbiAqICAgICAgICAgIC5mYWN0b3J5KCdCJywgWydCJywgKGIpID0+IHt9XSlcbiAqXG4gKiBBbmQgaGVyZSdzIGhvdyB0aGUgc2FtZSBleGFtcGxlIHdvdWxkIGxvb2sgbGlrZSB3aXRoIHRoZSBleGVjdXRhYmxlIHN0eWxlOlxuICpcbiAqICAgICAgZnVuY3Rpb24gQSgpIHt9XG4gKiAgICAgIEEuJG5hbWUgPSAnQSc7XG4gKiAgICAgIEEuJGluamVjdCA9IFtdO1xuICpcbiAqICAgICAgZnVuY3Rpb24gQigpIHt9XG4gKiAgICAgIEIuJG5hbWUgPSAnQic7XG4gKiAgICAgIEIuJGluamVjdCA9IFsnQSddO1xuICpcbiAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gKiAgICAgICAgICAuZmFjdG9yeShBKVxuICogICAgICAgICAgLmZhY3RvcnkoQik7XG4gKlxuICogVGhlIGV4ZWN1dGFibGUtc3R5bGUgbWFrZXMgaXQgdmVyeSBlYXN5IHRvIHNlcGFyYXRlIG91dCB5b3VyIGNvZGUgZnJvbSB0aGVcbiAqIG1pbWVvIGJpbmRpbmdzLiBJbiB0aGUgZXhhbXBsZSwgZnVuY3Rpb24gQSBhbmQgQiBjYW4gYmUgdXNlZCBpbmRlcGVuZGVudCBvZlxuICogbWltZW8uIFRoaXMgaXMgZ3JlYXQgb2YgdW5pdC10ZXN0aW5nIHlvdXIgY29kZSwgYXMgeW91IGNhbiBpbXBvcnQgdGhlXG4gKiBleGVjdXRhYmxlcyBpbnRvIHlvdXIgdGVzdCBzdWl0ZSB3aXRob3V0IGhhdmluZyB0byB3b3JyeSBhYm91dCBtaW1lby5cbiAqXG4gKiBAY2xhc3MgTW9kdWxlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTW9kdWxlKGluamVjdGFibGVzLCBuYW1lLCBkZXBlbmRlbmNpZXMpIHtcbiAgICB2YXIgbW9kdWxlID0gdGhpcztcblxuICAgIHZhciB0b1J1biA9IFtdO1xuXG4gICAgdGhpcy4kbmFtZSA9IG5hbWU7XG4gICAgdGhpcy4kaW5qZWN0ID0gZGVwZW5kZW5jaWVzO1xuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUluamVjdGFibGUobmFtZSwgcGFyYW1ldGVycykge1xuICAgICAgICBpZiAoaW5qZWN0YWJsZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGUgXCInICsgbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluamVjdGFibGU7XG5cbiAgICAgICAgaWYgKHBhcmFtZXRlcnMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgaW5qZWN0YWJsZSA9IHBhcmFtZXRlcnM7XG4gICAgICAgICAgICBpZiAoIWluamVjdGFibGUuJGluamVjdCkge1xuICAgICAgICAgICAgICAgIGluamVjdGFibGUuJGluamVjdCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGRlcGVuZGVuY2llcyA9IHBhcmFtZXRlcnMuc2xpY2UoMCwgLTEpO1xuICAgICAgICAgICAgaW5qZWN0YWJsZSA9IHBhcmFtZXRlcnMuc2xpY2UoLTEpWzBdO1xuICAgICAgICAgICAgaW5qZWN0YWJsZS4kaW5qZWN0ID0gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0YWJsZS4kbmFtZSA9IG5hbWU7XG5cbiAgICAgICAgcmV0dXJuIGluamVjdGFibGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkSW5qZWN0YWJsZShuYW1lLCBwYXJhbWV0ZXJzKSB7XG4gICAgICAgIGluamVjdGFibGVzLmFkZChwcmVwYXJlSW5qZWN0YWJsZShuYW1lLCBwYXJhbWV0ZXJzKSk7XG5cbiAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9XG5cbiAgICB0aGlzLmV4ZWN1dGVSdW4gPSBmdW5jdGlvbiBleGVjdXRlUnVuKCkge1xuICAgICAgICB0b1J1bi5mb3JFYWNoKGZ1bmN0aW9uKGluamVjdGFibGVOYW1lKSB7XG4gICAgICAgICAgICBpbmplY3RhYmxlcy5nZXQoaW5qZWN0YWJsZU5hbWUpKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKlxuICAgICAqIEkgZG9uJ3QgbGlrZSB0aGUgd3JhcHBlciBhbmQgYXV0by1nZW5lcmF0ZWQgbmFtZSwgYnV0IGZvciBub3cgSSBjYW4ndFxuICAgICAqIGNvbWUgdXAgd2l0aCBhIGJldHRlciBzb2x1dGlvbi4gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGUgcnVuLWZ1bmN0aW9uXG4gICAgICogbmVlZHMgdG8gd29yayB3aXRoIHRoZSBpbmplY3Rpb24gc3lzdGVtIChzaW5jZSBpdCBjYW4gaGF2ZSBvdGhlclxuICAgICAqIGluamVjdGFibGVzIGluamVjdGVkKSwgYW5kIHRoZSB3aG9sZSBzeXN0ZW0gaXNuJ3QgZGVzaWduZWQgdG8gZGVhbCB3aXRoXG4gICAgICogdW5uYW1lZCB0aGluZ3MuXG4gICAgICpcbiAgICAgKiBJbiBmYWN0LCBJIGZlZWwgdGhhdCBhbiBpbmplY3Rpb24gc3lzdGVtIHRoYXQgY2FuIGhhbmRsZSB1bm5hbWVkIGl0ZW1zXG4gICAgICogd291bGQgYmUgd3JvbmcuIEhvdyB3b3VsZCB5b3UgaWRlbnRpZnkgd2hhdCB0byBpbmplY3Q/IEhhdmluZyBuYW1lcyBmb3JcbiAgICAgKiBpbmplY3RhYmxlcyAob3IgYXQgbGVhc3QgSURzKSBpcyBhIGNvcmUgYXNwZWN0IG9mIGFuIGluamVjdGlvbiBzeXN0ZW0uXG4gICAgICpcbiAgICAgKiBTbyB0aGlzIHdvdWxkIGhhdmUgdG8gbGl2ZSBvdXRzaWRlIG9mIGl0LiBCdXQgdGhhdCBtZWFucyBoYXZpbmcgaXQncyBvd25cbiAgICAgKiBcIm1ha2Ugc3VyZSBhbGwgdGhlc2UgaW5qZWN0YWJsZXMgZXhpc3RcIiBzeXN0ZW0uIFRoZW4gd2UgY291bGQganVzdCBnZXRcbiAgICAgKiB0aGUgbmFtZWQgaW5qZWN0YWJsZXMgdGhlIHJ1bi1mdW5jdGlvbiBuZWVkcyBhbmQgY2FsbCB0aGUgcnVuLWZ1bmN0aW9uXG4gICAgICogd2l0aCB0aG9zZS5cbiAgICAgKlxuICAgICAqIEkgY2FuJ3QgdGhpbmsgb2YgYSBnb29kIHdheSB0byBkZS1kdXBsaWNhdGVkIHRoYXQgZGVwZW5kZW5jeSByZXNvbHV0aW9uXG4gICAgICogc3lzdGVtIHRob3VnaCwgc28gdGhlcmUnZCBiZSBvbmUgZm9yIGFsbCBuYW1lZCBpbmplY3RhYmxlcyBhbmQgb25lIGZvclxuICAgICAqIHRoZSBydW4tZnVuY3Rpb25zLlxuICAgICAqXG4gICAgICogSSBkb24ndCBwbGFuIG9uIGhhdmluZyBvdGhlciB1bm5hbWVkIGluamVjdGFibGVzLCBzbyBJIGZlZWwgdGhhdCBlZmZvcnRcbiAgICAgKiB3b3VsZCBiZSB3YXN0ZWQuIEhlbmNlIHRoZSBcImhhY2tcIiBoZXJlIHdpdGggYW4gYXV0by1nZW5lcmF0ZWQgbmFtZSBhbmRcbiAgICAgKiBhIHdyYXBwZXIgdGhhdCBleGVjdXRlcyB0aGUgcnVuLWZ1bmN0aW9uIHdpdGggcGFzcy10aHJvdWdoIGFyZ3VtZW50cy5cbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIGFuIGluamVjdGFibGUgdGhhdCB3aWxsIGJlIHJ1biBhZnRlciBtb2R1bGVzIGFyZSBpbnN0YW50aWF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJ1blxuICAgICAqIEBmb3IgTW9kdWxlXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8RnVuY3Rpb259IEluamVjdGFibGUgZGVmaW5pdGlvblxuICAgICAqIEByZXR1cm4ge01vZHVsZX1cbiAgICAgKi9cbiAgICB0aGlzLnJ1biA9IGZ1bmN0aW9uKHBhcmFtZXRlcnMpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBtb2R1bGUuJG5hbWUgKyAnLXJ1bi4nICsgdG9SdW4ubGVuZ3RoO1xuICAgICAgICB0b1J1bi5wdXNoKG5hbWUpO1xuXG4gICAgICAgIHZhciBwcm92aWRlciA9IGZ1bmN0aW9uIHByb3ZpZGVyUnVuKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtZXRlcnMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1ldGVycy5hcHBseShwYXJhbWV0ZXJzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdEVudHJ5ID0gcGFyYW1ldGVycy5zbGljZSgtMSlbMF07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsYXN0RW50cnkuYXBwbHkobGFzdEVudHJ5LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHBhcmFtZXRlcnMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgcHJvdmlkZXIuJGluamVjdCA9IHBhcmFtZXRlcnMuJGluamVjdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3ZpZGVyLiRpbmplY3QgPSBwYXJhbWV0ZXJzLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhZGRJbmplY3RhYmxlKG5hbWUsIHByb3ZpZGVyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlIGZhY3RvcmllcyBmb3IgYW55dGhpbmcgdGhhdCBkb2Vzbid0IGNyZWF0ZSBvdXRwdXRcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmFjdG9yeVxuICAgICAqIEBmb3IgTW9kdWxlXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8RnVuY3Rpb259IEluamVjdGFibGUgZGVmaW5pdGlvblxuICAgICAqIEByZXR1cm4ge01vZHVsZX1cbiAgICAgKi9cbiAgICB0aGlzLmZhY3RvcnkgPSBhZGRJbmplY3RhYmxlO1xuXG4gICAgLyoqXG4gICAgICogQ29tcG9uZW50cyBhcmUgbWVhbnQgdG8gcHJvZHVjZSBzb21lIG91dHB1dCwgcmVnYXJkbGVzcyBvZiB3aGF0IHJlbmRlcmluZ1xuICAgICAqIHRlY2huaXF1ZSB5b3UgdXNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGNvbXBvbmVudFxuICAgICAqIEBmb3IgTW9kdWxlXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8RnVuY3Rpb259IEluamVjdGFibGUgZGVmaW5pdGlvblxuICAgICAqIEByZXR1cm4ge01vZHVsZX1cbiAgICAgKi9cbiAgICB0aGlzLmNvbXBvbmVudCA9IGFkZEluamVjdGFibGU7XG5cbiAgICAvKipcbiAgICAgKiBWYWx1ZXMgYXJlIGRpZmZlcmVudCBmcm9tIGZhY3RvcmllcyBhbmQgY29tcG9uZW50cyBpbiB0aGF0IHRoZXJlJ3Mgbm9cbiAgICAgKiBleGVjdXRhYmxlLiBJdCdzIGp1c3QgYSBuYW1lIGFuZCBhIHZhbHVlLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICAgICAqICAgICAgICAgIC52YWx1ZSgnbmFtZScsICd2YWx1ZScpXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHZhbHVlXG4gICAgICogQGZvciBNb2R1bGVcbiAgICAgKiBAY2hhaW5hYmxlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiB2YWx1ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgeW91IHdhbnQgYXZhaWxhYmxlIGZvciBpbmplY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtNb2R1bGV9XG4gICAgICovXG4gICAgdGhpcy52YWx1ZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBhZGRJbmplY3RhYmxlKG5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlOyIsImZ1bmN0aW9uIFdpbmRvdygpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vT3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICRmYWtlOiB0cnVlLFxuICAgICAgICAgICAgb25wb3BzdGF0ZTogbm9PcCxcbiAgICAgICAgICAgIG9uY2xpY2s6IG5vT3AsXG4gICAgICAgICAgICBvbmxvYWQ6IG5vT3AsXG4gICAgICAgICAgICBkb2N1bWVudDoge1xuICAgICAgICAgICAgICAgIGdldEVsZW1lbnRCeUlkOiBub09wXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGlzdG9yeToge1xuICAgICAgICAgICAgICAgIHB1c2hTdGF0ZTogbm9PcCxcbiAgICAgICAgICAgICAgICByZXBsYWNlU3RhdGU6IG5vT3BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2luZG93O1xufVxuXG5mdW5jdGlvbiBOb2RlSHR0cCgpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJ2h0dHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxufVxuXG5mdW5jdGlvbiBOb2RlSHR0cHMoKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCdodHRwcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFdpbmRvdzogV2luZG93LFxuICAgIE5vZGVIdHRwOiBOb2RlSHR0cCxcbiAgICBOb2RlSHR0cHM6IE5vZGVIdHRwc1xufTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiAqIEBtb2R1bGUgQnVpbHRpbnNcbiAqL1xuXG52YXIgTm9kZUh0dHA7XG52YXIgTm9kZUh0dHBzO1xuXG5mdW5jdGlvbiB0b1F1ZXJ5KG9iamVjdCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0W2tleV0pID09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rba2V5XVxuICAgICAgICAgICAgICAgIC5tYXAoKGFycmF5VmFsdWUpID0+IGVuY29kZVVSSShrZXkpICsgJz0nICsgZW5jb2RlVVJJKGFycmF5VmFsdWUpKVxuICAgICAgICAgICAgICAgIC5qb2luKCcmJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdFtrZXldKSA9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSShrZXkpICsgJz0nICsgZW5jb2RlVVJJKEpTT04uc3RyaW5naWZ5KG9iamVjdFtrZXldKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlVVJJKGtleSkgKyAnPScgKyBlbmNvZGVVUkkob2JqZWN0W2tleV0udG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9KVxuICAgICAgICAuam9pbignJicpO1xufVxuXG5mdW5jdGlvbiBpc0pzb25Db250ZW50VHlwZShjb250ZW50VHlwZSkge1xuICAgIGlmICghY29udGVudFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChjb250ZW50VHlwZSA9PSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnRzV2l0aChzdHJpbmcsIHN0YXJ0KSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuc3Vic3RyKDAsIHN0YXJ0Lmxlbmd0aCkgPT0gc3RhcnQ7XG4gICAgfVxuXG4gICAgdmFyIHRleHRKc29uID0gJ3RleHQvanNvbic7XG4gICAgdmFyIGFwcGxpY2F0aW9uSnNvbiA9ICdhcHBsaWNhdGlvbi9qc29uJztcblxuICAgIHZhciB0eXBlID0gY29udGVudFR5cGUudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICBpZiAoc3RhcnRzV2l0aCh0eXBlLCB0ZXh0SnNvbikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChzdGFydHNXaXRoKHR5cGUsIGFwcGxpY2F0aW9uSnNvbikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0eXBlLm1hdGNoKC9eYXBwbGljYXRpb25cXC92bmRcXC4uKlxcK2pzb24kLykpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBqUXVlcnlMaWtlUmVxdWVzdChqUXVlcnlMaWtlLCBjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIGZ1bmN0aW9uIHBhcnNlSnFYSFJIZWFkZXJzKGhlYWRlclN0cmluZykge1xuICAgICAgICBpZiAoIWhlYWRlclN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhlYWRlclN0cmluZ1xuICAgICAgICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgICAgICAgLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoKVxuICAgICAgICAgICAgLm1hcCgobGluZSkgPT4gbGluZS5zcGxpdCgnOicpLm1hcChwYXJ0ID0+IHBhcnQudHJpbSgpKSlcbiAgICAgICAgICAgIC5yZWR1Y2UoKGhlYWRlcnMsIFtoZWFkZXIsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICAgIGhlYWRlcnNbaGVhZGVyXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgICAgICAgfSwge30pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzcG9uc2VUb0FuZ3VsYXJSZXNwb25zZShkYXRhLCBfLCBqcVhIUikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHN0YXR1czoganFYSFIuc3RhdHVzLCAvLyByZXNwb25zZSBjb2RlLFxuICAgICAgICAgICAgaGVhZGVyczogcGFyc2VKcVhIUkhlYWRlcnMoanFYSFIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpLFxuICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiBqcVhIUi5zdGF0dXNUZXh0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xuICAgICAgICByZXNvbHZlKHJlc3BvbnNlVG9Bbmd1bGFyUmVzcG9uc2UoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihqcVhIUiwgdGV4dFN0YXR1cykge1xuICAgICAgICByZWplY3QocmVzcG9uc2VUb0FuZ3VsYXJSZXNwb25zZSh7fSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICB2YXIgdXJsID0gY29uZmlnLmhvc3QgJiYgY29uZmlnLnByb3RvY29sXG4gICAgICAgID8gY29uZmlnLnByb3RvY29sICsgJzovLycgKyBjb25maWcuaG9zdCArIGNvbmZpZy51cmxcbiAgICAgICAgOiBjb25maWcudXJsO1xuXG4gICAgalF1ZXJ5TGlrZS5hamF4KHtcbiAgICAgICAgdHlwZTogY29uZmlnLm1ldGhvZCxcbiAgICAgICAgaGVhZGVyczogY29uZmlnLmhlYWRlcnMsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBjb25maWcuaGVhZGVyc1snQ29udGVudC1UeXBlJ10sXG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBkYXRhOiBpc0pzb25Db250ZW50VHlwZShjb25maWcuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pID8gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBjb25maWcuZGF0YSkgOiBjb25maWcuZGF0YVxuICAgIH0pLnRoZW4oc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBqUXVlcnlSZXF1ZXN0KCR3aW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oY29uZmlnLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgalF1ZXJ5TGlrZVJlcXVlc3QoJHdpbmRvdy5qUXVlcnksIGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHplcHRvUmVxdWVzdCgkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGpRdWVyeUxpa2VSZXF1ZXN0KCR3aW5kb3cuWmVwdG8sIGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vZGVSZXF1ZXN0KGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZnVuY3Rpb24gY29uZmlnVG9Ob2RlKGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLmhvc3QgJiYgY29uZmlnLmhvc3QuaW5kZXhPZignOicpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGhvc3RQYXJ0cyA9IGNvbmZpZy5ob3N0LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IGhvc3RQYXJ0c1swXTtcbiAgICAgICAgICAgIHZhciBwb3J0ID0gaG9zdFBhcnRzWzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhvc3QgPSBjb25maWcuaG9zdDtcbiAgICAgICAgICAgIHZhciBwb3J0ID0gJzgwJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaG9zdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXaGVuIHVzaW5nIG5vZGVzIGh0dHAgbGlicmFyaWVzLCB5b3UgaGF2ZSB0byBzZXQgJGh0dHAuJGhvc3QsIG90aGVyd2lzZSBub2RlIGRvZXMgbm90IGtub3cgd2hlcmUgdG8gc2VuZCB0aGUgcmVxdWVzdCB0bycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1ldGhvZDogY29uZmlnLm1ldGhvZCxcbiAgICAgICAgICAgIHBhdGg6IGNvbmZpZy5wcm90b2NvbCArICc6Ly8nICsgY29uZmlnLmhvc3QgKyBjb25maWcudXJsLFxuICAgICAgICAgICAgaGVhZGVyczogY29uZmlnLmhlYWRlcnMsXG4gICAgICAgICAgICBob3N0OiBob3N0LFxuICAgICAgICAgICAgcG9ydDogcG9ydCxcbiAgICAgICAgICAgIHByb3RvY29sOiBjb25maWcucHJvdG9jb2wgKyAnOidcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN3aXRjaEJ5UHJvdG9jb2woKSB7XG4gICAgICAgIGlmIChjb25maWcucHJvdG9jb2wgPT09ICdodHRwJykge1xuICAgICAgICAgICAgcmV0dXJuIE5vZGVIdHRwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE5vZGVIdHRwcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGpzb25FbmNvZGUob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmplY3QpO1xuICAgIH1cblxuICAgIHZhciByZXF1ZXN0ID0gc3dpdGNoQnlQcm90b2NvbCgpLnJlcXVlc3QoY29uZmlnVG9Ob2RlKGNvbmZpZyksXG4gICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXNwb25zZS5zZXRFbmNvZGluZygndXRmOCcpO1xuXG4gICAgICAgICAgICB2YXIgYm9keSA9ICcnO1xuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2RhdGEnLCBmdW5jdGlvbihjaHVuaykge1xuICAgICAgICAgICAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXNwb25zZS5vbignZXJyb3InLCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogalF1ZXJ5IHdpbGwgcGFyc2UgSlNPTiByZXBsaWVzIGF1dG9tYXRpY2FsbHksIHNvIHJlcGxpY2F0ZSB0aGF0XG4gICAgICAgICAgICAgICAgICogYmVoYXZpb3VyIGZvciBub2RlanNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAoYm9keSAmJiByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHJlc3BvbnNlLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0pzb25Db250ZW50VHlwZSh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogYm9keSxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c01lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzQ29kZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgaWYgKGNvbmZpZy5tZXRob2QgPT09ICdQT1NUJyB8fCBjb25maWcubWV0aG9kID09PSAnUFVUJyB8fCBjb25maWcubWV0aG9kID09PSAnUEFUQ0gnKSB7XG4gICAgICAgIGlmIChjb25maWcuZGF0YSkge1xuICAgICAgICAgICAgaWYgKGlzSnNvbkNvbnRlbnRUeXBlKGNvbmZpZy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSkpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LndyaXRlKGpzb25FbmNvZGUoY29uZmlnLmRhdGEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC53cml0ZShjb25maWcuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXF1ZXN0LmVuZCgpO1xufVxuXG5mdW5jdGlvbiB2ZW5kb3JTcGVjaWZpY1JlcXVlc3QoJHdpbmRvdykge1xuICAgIGlmICgkd2luZG93LiRmYWtlID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiBub2RlUmVxdWVzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoJHdpbmRvdy5qUXVlcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBqUXVlcnlSZXF1ZXN0KCR3aW5kb3cpO1xuICAgICAgICB9IGVsc2UgaWYgKCR3aW5kb3cuWmVwdG8pIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXB0b1JlcXVlc3QoJHdpbmRvdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHN1cHBvcnRlZCB4aHIgbGlicmFyeSBmb3VuZCAoalF1ZXJ5IG9yIFplcHRvIGFyZSBzdXBwb3J0ZWQpJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZykge1xuICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XG5cbiAgICBpZiAoY29uZmlnLnBhcmFtcykge1xuICAgICAgICBpZiAoY29uZmlnLnVybC5pbmRleE9mKCc/JykgPT09IC0xKSB7XG4gICAgICAgICAgICBjb25maWcudXJsICs9ICc/JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjb25maWcudXJsW2NvbmZpZy51cmwubGVuZ3RoIC0gMV0gIT0gJyYnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnVybCArPSAnJic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcudXJsICs9IHRvUXVlcnkoY29uZmlnLnBhcmFtcyk7XG4gICAgICAgIGRlbGV0ZSBjb25maWcucGFyYW1zO1xuICAgIH1cblxuICAgIGNvbmZpZyA9IGNvbmZpZy5wcmUucmVkdWNlKChjb25maWcsIGNhbGxiYWNrKSA9PiBjYWxsYmFjayhjb25maWcpLCBjb25maWcpO1xuICAgIHZlbmRvclNwZWNpZmljUmVxdWVzdCgkd2luZG93KShjb25maWcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGF0YSA9IGNvbmZpZy5wb3N0LnJlZHVjZSgoZGF0YSwgY2FsbGJhY2spID0+IGNhbGxiYWNrKGRhdGEpLCBkYXRhKTtcbiAgICAgICAgZGVmZXIucmVzb2x2ZShkYXRhKTtcbiAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBlcnJvciA9IGNvbmZpZy5wb3N0LnJlZHVjZSgoZXJyb3IsIGNhbGxiYWNrKSA9PiBjYWxsYmFjayhlcnJvciksIGVycm9yKTtcbiAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCR3aW5kb3csICRxLCAkbm9kZUh0dHAsICRub2RlSHR0cHMpIHtcbiAgICBOb2RlSHR0cCA9ICRub2RlSHR0cDtcbiAgICBOb2RlSHR0cHMgPSAkbm9kZUh0dHBzO1xuXG4gICAgZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gICAgICAgIGxldCBuZXdPYmplY3QgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChvYmplY3Rba2V5XS50b1N0cmluZygpID09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICAgICAgbmV3T2JqZWN0W2tleV0gPSBjbG9uZShvYmplY3Rba2V5XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld09iamVjdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXdPYmplY3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VDb25maWcoZGVmYXVsdENvbmZpZywgdXNlckNvbmZpZykge1xuICAgICAgICBsZXQgdGFyZ2V0Q29uZmlnID0gY2xvbmUoZGVmYXVsdENvbmZpZyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHVzZXJDb25maWcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJDb25maWdba2V5XS50b1N0cmluZygpID09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Q29uZmlnW2tleV0gPSBtZXJnZUNvbmZpZyh0YXJnZXRDb25maWdba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Q29uZmlnW2tleV0gPSB1c2VyQ29uZmlnW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRDb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIyBTZW5kIGh0dHAocykgcmVxdWVzdHMgdG8gYSBzZXJ2ZXJcbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlICRodHRwIGluIHR3byB3YXlzLCBlaXRoZXIgYXMgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYVxuICAgICAqIGNvbmZpZ3VyYXRpb24gb2JqZWN0LCBvciB1c2Ugc2hvcnRoYW5kIG1ldGhvZHMgZm9yIGNvbW1vbiBIVFRQIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBUbyB1c2UgJGh0dHAgYXMgYSBmdW5jdGlvbiwgdGhlIGNvbmZpZyBvYmplY3QgbmVlZHMgdG8gaW5jbHVkZSB0aGUgdXJsXG4gICAgICogYW5kIGh0dHAgbWV0aG9kOlxuICAgICAqXG4gICAgICogICAgICAkaHR0cCh7XG4gICAgICogICAgICAgICAgdXJsOiAnL2V4YW1wbGUnLFxuICAgICAqICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogRm9yIGNvbW1vbiBodHRwIG1ldGhvZHMgdGhlcmUgYXJlIHNob3J0aGFuZCBmdW5jdGlvbnM6XG4gICAgICpcbiAgICAgKiAgICAgICRodHRwLmdldCgnL3VybCcpO1xuICAgICAqICAgICAgJGh0dHAucG9zdCgnL2V4YW1wbGUnLCB7IGtleTogJ3ZhbHVlJyB9KTtcbiAgICAgKlxuICAgICAqIEJvdGggdmFyaWF0aW9ucyB3aWxsIHJldHVybiBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSByZXNwb25zZVxuICAgICAqIGZyb20gdGhlIHNlcnZlcjpcbiAgICAgKlxuICAgICAqICAgICAgJGh0dHAuZ2V0KCcvZXhhbXBsZScpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICogICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqIFRoZSByZXNwb25zZSBvYmplY3QgaGFzIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKlxuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAqICAgICAgICAgIC8vRGF0YSBpcyB0aGUgcmVzcG9uc2UgYm9keS4gSWYgcmVzcG9uc2UgY29udGVudCB0eXBlIGlzXG4gICAgICogICAgICAgICAgLy8nYXBwbGljYXRpb24vanNvbicgdGhlIHJlc3BvbnNlIGJvZHkgd2lsbCBiZSBKU09OIGRlY29kZWQgYW5kXG4gICAgICogICAgICAgICAgLy90aGUgZGVjb2RlZCBvYmplY3Qgd2lsbCBiZSBhY2Nlc3NpYmxlIGluIGBkYXRhYFxuICAgICAqICAgICAgICAgIHN0YXR1czogMjAwLCAvLyBodHRwIHJlc3BvbnNlIGNvZGUsXG4gICAgICogICAgICAgICAgaGVhZGVyczoge1xuICAgICAqICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICogICAgICAgICAgfSwvLyByZXNwb25zZSBodHRwLWhlYWRlcnMsXG4gICAgICogICAgICAgICAgY29uZmlnOiBjb25maWcsIC8vIGNvbmZpZyBvYmplY3Qgc2VuZCB3aXRoIHJlcXVlc3RcbiAgICAgKiAgICAgICAgICBzdGF0dXNUZXh0OiAnMjAwIFN1Y2Nlc3MnIC8vIGh0dHAgc3RhdHVzIHRleHRcbiAgICAgKiAgICAgIH1cbiAgICAgKlxuICAgICAqIEFsbCBzaG9ydGhhbmQtbWV0aG9kcyBhcmUgZG9jdW1lbnRlZCBzZXBhcmF0ZWx5IGFuZCBvcHRpb25hbGx5IGFjY2VwdFxuICAgICAqIHRoZSBzYW1lIGNvbmZpZy1vYmplY3QgYCRodHRwYCBhcyBhIGZ1bmN0aW9uIGFjY2VwdHMuIFNob3VsZCB0aGUgY29uZmlnXG4gICAgICogb2JqZWN0IGNvbnRhaW4gZGlmZmVyZW50IGRhdGEgdGhhbiB0aGUgYXJndW1lbnRzIGZvciB0aGUgc2hvcnRoYW5kXG4gICAgICogbWV0aG9kLCB0aGVuIHRoZSBhcmd1bWVudHMgdG8gdGhlIG1ldGhvZCB0YWtlIHByZWNlZGVudDpcbiAgICAgKlxuICAgICAqICAgICAgJGh0dHAuZ2V0KCcvZXhhbXBsZScsIHt9LCB7IHVybDogJy9ub3QtdXNlZCcgfSk7XG4gICAgICogICAgICAvLz0+IFNlbmRzIHJlcXVlc3QgdG8gJy9leGFtcGxlJ1xuICAgICAqXG4gICAgICogIyMgQ29uZmlndXJhdGlvblxuICAgICAqXG4gICAgICogVGhlIGNvbmZpZyBvYmplY3QgY2FuIGhhdmUgdGhlc2Uga2V5czpcbiAgICAgKlxuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIHByZTogW10sXG4gICAgICogICAgICAgICAgcG9zdDogW10sXG4gICAgICogICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgKiAgICAgICAgICB1cmw6ICcvZXhhbXBsZScsXG4gICAgICogICAgICAgICAgZGF0YToge1xuICAgICAqICAgICAgICAgICAgICBrZXk6ICd2YWx1ZSdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIHBhcmFtczoge1xuICAgICAqICAgICAgICAgICAgICBzZWFyY2g6ICdhIHNlYXJjaCBjcml0ZXJpYSdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgKiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH1cbiAgICAgKlxuICAgICAqIERlZmF1bHQgc2V0dGluZ3MgY2FuIGJlIHNldCBkaXJlY3RseSBvbiBgJGh0dHBgIGFuZCB3aWxsIGJlIHVzZWQgZm9yIGFsbFxuICAgICAqIGZ1dHVyZSByZXF1ZXN0czpcbiAgICAgKlxuICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gICAgICogICAgICAgICAgLnJ1bihbJyRodHRwJywgKCRodHRwKSA9PiB7XG4gICAgICogICAgICAgICAgICAgICRodHRwLiRjb25maWcuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gJ0Jhc2ljIFdAM2pvbGIyJ1xuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogYHByZWAgYW5kIGBwb3N0YCBhcmUgY2FsbGJhY2stY2hhaW5zIHRoYXQgY2FuXG4gICAgICogICAgICAxLiBNb2RpZnkgdGhlIGNvbmZpZyBiZWZvcmUgYSByZXF1ZXN0IChpbiBjYXNlIG9mIGBwcmVgKVxuICAgICAqICAgICAgMi4gTW9kaWZ5IHRoZSByZXNwb25zZSAoaW4gY2FzZSBvZiBgcG9zdGApXG4gICAgICpcbiAgICAgKiBUbyBhZGQgY2FsbGJhY2tzIHNpbXBseSBwdXNoIHRoZW0gdG8gdGhlIGFycmF5LiBJdCdzIHVwIHRvIHlvdSB0byBtYW5hZ2VcbiAgICAgKiB0aGUgY2hhaW4gYW5kIGFkZC9yZW1vdmUgZnVuY3Rpb25zIGZyb20gdGhlIGFycmF5LlxuICAgICAqXG4gICAgICogVGhlIGZ1bmN0aW9uIGl0c2VsZiB3aWxsIHJlY2VpdmUgdGhlIGNvbmZpZyBmb3IgdGhlIHJlcXVlc3QgKGZvciBgcHJlYClcbiAgICAgKiBvciB0aGUgcmVzcG9uc2UgKGZvciBgcG9zdGApLiBUaGUgZnVuY3Rpb25zIGluIHRoZSBjaGFpbiB3aWxsIHJlY2VpdmVcbiAgICAgKiB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uIGFzIGlucHV0LiBUaGUgZmlyc3QgZnVuY3Rpb25cbiAgICAgKiB3aWxsIHJlY2VpdmUgdGhlIG9yaWdpbmFsIGNvbmZpZy9yZXNwb25zZSBhcyBpbnB1dC5cbiAgICAgKlxuICAgICAqIElmIHlvdSBjaGFuZ2UgdmFsdWVzIGluIHRoZSBoZWFkZXJzLW9iamVjdCBtYWtlIHN1cmUgbm90IHRvIG92ZXJyaWRlIHRoZVxuICAgICAqIGhlYWRlcnMgb2JqZWN0IG9yIGlmIHlvdSBkbywgdG8gcHJvdmlkZSBhICdDb250ZW50LVR5cGUnIGhlYWRlcixcbiAgICAgKiBvdGhlcndpc2UgcmVxdWVzdHMgbWlnaHQgZmFpbCBkZXBlbmRpbmcgb24gdGhlIGVudmlyb25tZW50ICh1bnNwZWNpZmllZFxuICAgICAqIGNvbnRlbnQgdHlwZXMgc2hvdWxkIGJlIGF2b2lkZWQpLiBJbnN0ZWFkLCBzaW1wbHkgYWRkIG9yIG1vZGlmeSBoZWFkZXJzXG4gICAgICogb24gdGhlIGV4aXN0aW5nIGhlYWRlcnMgb2JqZWN0LlxuICAgICAqXG4gICAgICogVGhlIGBkYXRhYCBmaWVsZCBpcyBzZW5kIGFzIHRoZSByZXF1ZXN0IGJvZHkgYW5kIHRoZSBgcGFyYW1zYCBrZXkgaXNcbiAgICAgKiBzZW5kIGFzIGEgcXVlcnkgc3RyaW5nIGluIHRoZSB1cmwuIFRoZSBgaGVhZGVyc2AgZmllbGQgYWxsb3dzIHlvdSB0byBzZXRcbiAgICAgKiBodHRwIGhlYWRlcnMgZm9yIG9ubHkgdGhpcyByZXF1ZXN0LCB1c3VhbGx5IHVzZWQgdG8gc2V0IGEgY29udGVudCB0eXBlLlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgY29udGVudCB0eXBlIGlzICdhcHBsaWNhdGlvbi9qc29uJywgc28gYnkgZGVmYXVsdCwgYGRhdGFgXG4gICAgICogd2lsbCBiZSBzZW5kIGFzIGEgSlNPTiBzdHJpbmcgdG8gdGhlIHNlcnZlci4gSWYgeW91IHdhbnQgdG8gc2VuZCBhXG4gICAgICogYnJvd3Nlci1saWtlIGZvcm0gc3RyaW5nIChjb250ZW50IHR5cGVcbiAgICAgKiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJykgeW91IGhhdmUgdG8gc2V0IHRoZSBjb250ZW50IHR5cGVcbiAgICAgKiBpbiB0aGUgYGhlYWRlcnNgIGZpZWxkIGFuZCBgZGF0YWAgbXVzdCBiZSBhIHN0cmluZy4gSXQncyB1cCB0byB5b3UgdG9cbiAgICAgKiBidWlsZCB0aGUgZm9ybS11cmxlbmNvZGVkIHN0cmluZy5cbiAgICAgKlxuICAgICAqICMjIERlZmF1bHRzXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCB2YWx1ZXMgYCRodHRwYCB1c2VzIGNhbiBiZSBjaGFuZ2VkIGFuZCB3aWxsIGJlIGFwcGxpZWQgdG9cbiAgICAgKiBldmVyeSByZXF1ZXN0LiBUaGVyZSBhcmUgdGhyZWUgY29uZmlndXJhYmxlIHByb3BlcnRpZXM6XG4gICAgICpcbiAgICAgKiAtIGAkaHR0cC4kaG9zdGBcbiAgICAgKiAtIGAkaHR0cC4kcHJvdG9jb2xgXG4gICAgICogLSBgJGh0dHAuJGNvbmZpZ2BcbiAgICAgKlxuICAgICAqIGAkaHR0cC4kaG9zdGAgaXMgdGhlIGhvc3QgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGV2ZXJ5IHJlcXVlc3QuIEJ5XG4gICAgICogZGVmYXVsdCwgbm8gaG9zdCBpcyB1c2VkLiBGb3IgdXNlIGluIHRoZSBicm93c2VyIHRoaXMgaXMgZmluZSwgYXMgdGhlXG4gICAgICogYnJvd3NlciBzaW1wbHkgdXNlcyB0aGUgY3VycmVudCBob3N0LiBGb3IgdXNlIHdpdGggTm9kZUpTIGAkaHR0cC4kaG9zdGBcbiAgICAgKiBoYXMgdG8gYmUgc2V0IGFzIHRoZXJlIGlzIG5vdCBkZWZhdWx0IGhvc3QuIFNldHRpbmcgdGhlIGhvc3QgZm9yIHRoZVxuICAgICAqIGJyb3dzZXIgd2lsbCBzZW5kIGFsbCByZXF1ZXN0cyB0byB0aGUgc3BlY2lmaWVkIGhvc3QsIGFuZCBub3QgdGhlXG4gICAgICogY3VycmVudCBob3N0LiBJbiB0aGF0IGNhc2UgdGhlIGhvc3QgaGFzIHRvIHN1cHBvcnRcbiAgICAgKiBbY3Jvc3Mtb3JpZ2luIEhUVFBcbiAgICAgKiByZXF1ZXN0c10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9BY2Nlc3NfY29udHJvbF9DT1JTKS5cbiAgICAgKlxuICAgICAqIGAkaHR0cC4kcHJvdG9jb2xgIHNob3VsZCBiZSBvbmUgb2YgJ2h0dHAnIG9yICdodHRwcycsIGRlcGVuZGluZyBvbiB3aGF0XG4gICAgICogeW91ciBhcHAgdXNlcy5cbiAgICAgKlxuICAgICAqIGAkaHR0cC4kY29uZmlnYCBpcyBtZXJnZWQgaW50byB0aGUgY29uZmlnIG9iamVjdCBwYXNzZWQgdG8gYCRodHRwYCBvclxuICAgICAqIG9uZVxuICAgICAqIG9mIHRoZSBzaG9ydGhhbmQgbWV0aG9kcy4gVGhlIHNldHRpbmdzIGluIHRoZSBjb25maWcgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIGAkaHR0cGAgb3IgdGhlIHNob3J0aGFuZCBtZXRob2QgdGFrZXMgcHJlY2VkZW50OlxuICAgICAqXG4gICAgICogICAgICAkaHR0cC4kY29uZmlnLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9ICdCYXNpYyBGQEwjQic7XG4gICAgICogICAgICAkaHR0cC5wb3N0KCcvZXhhbXBsZScsIHsga2V5OiAndmFsdWUnIH0sIHtcbiAgICAgKiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICogICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ05vbmUnXG4gICAgICogICAgICAgICAgfVxuICAgICAqICAgICAgKTtcbiAgICAgKiAgICAgIC8vPT4gV2lsbCBzZW5kICdOb25lJyBhcyB0aGUgJ0F1dGhvcml6YXRpb24nIGhlYWRlci5cbiAgICAgKlxuICAgICAqIEFuIGV4YW1wbGUgY2hhbmdpbmcgYWxsIHRoZSBhdmFpbGFibGUgcHJvcGVydGllczpcbiAgICAgKlxuICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gICAgICogICAgICAgICAgLnJ1bihbJyRodHRwJywgKCRodHRwKSA9PiB7XG4gICAgICogICAgICAgICAgICAgICRodHRwLiRob3N0ID0gJ2h0dHA6Ly93d3cuZXhhbXBsZS5jb20nO1xuICAgICAqICAgICAgICAgICAgICAkaHR0cC4kcHJvdG9jb2wgPSAnaHR0cHMnO1xuICAgICAqICAgICAgICAgICAgICAkaHR0cC4kY29uZmlnLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9ICdCYXNpYyBGQEwjQidcbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqIEBjbGFzcyAkaHR0cFxuICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRvSHR0cChjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyk7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlVHlwZXNcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gdXNpbmcgTWltZW8gb24gTm9kZUpTLCBzZXR0aW5nICRob3N0IHRvIHRoZSBob3N0IHlvdSB3YW50IHRvIHNlbmRcbiAgICAgKiByZXF1ZXN0cyB0byBpcyBhIHJlcXVpcmVtZW50LlxuICAgICAqXG4gICAgICogQHByb3BlcnR5ICRob3N0XG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZG9IdHRwLiRob3N0ID0gJyc7XG4gICAgZG9IdHRwLiRwcm90b2NvbCA9ICdodHRwcyc7XG4gICAgZG9IdHRwLiRjb25maWcgPSB7XG4gICAgICAgIHByZTogW10sXG4gICAgICAgIHBvc3Q6IFtdLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIEdFVCByZXF1ZXN0XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGdldFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIFF1ZXJ5IHBhcmFtZXRlcnMgYXMgYSBoYXNoXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb25maWddIENvbmZpZyBmb3IgdGhpcyByZXF1ZXN0XG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZG9IdHRwLmdldCA9IGZ1bmN0aW9uKHVybCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgY29uZmlnLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVmFsaWRhdGVUeXBlc1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSBIRUFEIHJlcXVlc3QuIFRoZSBzZXJ2ZXIgcmVzcG9uc2Ugd2lsbCBub3QgaW5jbHVkZSBhIGJvZHlcbiAgICAgKlxuICAgICAqIEBtZXRob2QgaGVhZFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIFF1ZXJ5IHBhcmFtZXRlcnMgYXMgYSBoYXNoXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb25maWddIENvbmZpZyBmb3IgdGhpcyByZXF1ZXN0XG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZG9IdHRwLmhlYWQgPSBmdW5jdGlvbih1cmwsIHBhcmFtcywgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ0hFQUQnO1xuICAgICAgICBjb25maWcucGFyYW1zID0gcGFyYW1zO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZVR5cGVzXG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIFBPU1QgcmVxdWVzdC4gQnkgZGVmYXVsdCwgYGRhdGFgIHdpbGwgYmUgSlNPTiBlbmNvZGVkIGFuZCBzZW5kIGFzXG4gICAgICogdGhlIHJlcXVlc3QgYm9keS5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgcG9zdFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBPYmplY3QgdG8gc2VuZCBhcyByZXF1ZXN0IGJvZHkuIElmIGNvbnRlbnQtdHlwZVxuICAgICAqIGlzIHNldCB0byAnYXBwbGljYXRpb24vanNvbicgKHdoaWNoIGlzIHRoZSBkZWZhdWx0KSwgYGRhdGFgIHdpbGwgYmVcbiAgICAgKiBKU09OLWVuY29kZWQgYmVmb3JlIHNlbmRpbmdcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBjb25maWcuZGF0YSA9IGRhdGE7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlVHlwZXNcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgUFVUIHJlcXVlc3QuIEJ5IGRlZmF1bHQsIGBkYXRhYCB3aWxsIGJlIEpTT04gZW5jb2RlZCBhbmQgc2VuZCBhc1xuICAgICAqIHRoZSByZXF1ZXN0IGJvZHkuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHB1dFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBPYmplY3QgdG8gc2VuZCBhcyByZXF1ZXN0IGJvZHkuIElmIGNvbnRlbnQtdHlwZVxuICAgICAqIGlzIHNldCB0byAnYXBwbGljYXRpb24vanNvbicgKHdoaWNoIGlzIHRoZSBkZWZhdWx0KSwgYGRhdGFgIHdpbGwgYmVcbiAgICAgKiBKU09OLWVuY29kZWQgYmVmb3JlIHNlbmRpbmdcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAucHV0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnUFVUJztcbiAgICAgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZVR5cGVzXG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIFBBVENIIHJlcXVlc3QuIEJ5IGRlZmF1bHQsIGBkYXRhYCB3aWxsIGJlIEpTT04gZW5jb2RlZCBhbmQgc2VuZCBhc1xuICAgICAqIHRoZSByZXF1ZXN0IGJvZHkuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHBhdGNoXG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVybCB5b3Ugd2FudCB0byBzZW5kIHJlcXVlc3QgdG9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIE9iamVjdCB0byBzZW5kIGFzIHJlcXVlc3QgYm9keS4gSWYgY29udGVudC10eXBlXG4gICAgICogaXMgc2V0IHRvICdhcHBsaWNhdGlvbi9qc29uJyAod2hpY2ggaXMgdGhlIGRlZmF1bHQpLCBgZGF0YWAgd2lsbCBiZVxuICAgICAqIEpTT04tZW5jb2RlZCBiZWZvcmUgc2VuZGluZ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29uZmlnXSBDb25maWcgZm9yIHRoaXMgcmVxdWVzdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGRvSHR0cC5wYXRjaCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BBVENIJztcbiAgICAgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogU2VuZCBhIERFTEVURSByZXF1ZXN0LiBEb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMgb3IgZGF0YSB0byBzZW5kXG4gICAgICogd2l0aCB0aGUgcmVxdWVzdCwgYXMgdGhlIFVSTCBzaG91bGQgaWRlbnRpZnkgdGhlIGVudGl0eSB0byBkZWxldGVcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZGVsZXRlXG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVybCB5b3Ugd2FudCB0byBzZW5kIHJlcXVlc3QgdG9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAuZGVsZXRlID0gZnVuY3Rpb24odXJsLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnREVMRVRFJztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVmFsaWRhdGVUeXBlc1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIHJldHVybiBkb0h0dHA7XG59OyIsImZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCAmJiAoKHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbicpICYmIChvYmplY3QgaW5zdGFuY2VvZiBGdW5jdGlvbikpO1xufVxuXG4vKipcbiAqIEFuIGluc3RhbmNlIG9mIGEgcHJvbWlzZS4gQ3JlYXRlZCBhbmQgYWNjZXNzZWQgdGhyb3VnaCAkcS5cbiAqXG4gKiBAY2xhc3MgUHJvbWlzZVxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICAgIHZhciByZXNvbHZlQ2FsbGJhY2tzID0gW107XG4gICAgdmFyIHJlamVjdENhbGxiYWNrcyA9IFtdO1xuICAgIHZhciBub3RpZnlDYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgc3RhdGUgPSAncGVuZGluZyc7XG4gICAgdmFyIHJlc29sdXRpb247XG4gICAgdmFyIHJlamVjdGlvbjtcblxuICAgIHZhciBhcGkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBdHRhY2ggcmVzb2x1dGlvbiwgcmVqZWN0aW9uIGFuZCBub3RpZmljYXRpb24gaGFuZGxlcnMgdG8gdGhlIHByb21pc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgdGhlblxuICAgICAgICAgKiBAZm9yIFByb21pc2VcbiAgICAgICAgICogQGNoYWluYWJsZVxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlc29sdmUgRXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZC5cbiAgICAgICAgICogIElmIGFub3RoZXIgcHJvbWlzZSBpcyByZXR1cm5lZCwgdGhlIG5leHQgcHJvbWlzZSBpbiB0aGUgY2hhaW4gaXNcbiAgICAgICAgICogIGF0dGFjaGVkIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlLiBJZiBhIHZhbHVlIGlzIHJldHVybmVkLCB0aGUgbmV4dFxuICAgICAgICAgKiAgcHJvbWlzZSBpbiB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuZWQgdmFsdWUgaW1tZWRpYXRlbHkuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0IEV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25Ob3RpZnkgRXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBub3RpZmllZFxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhlbjogZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKTtcblxuICAgICAgICAgICAgaWYgKCgoc3RhdGUgPT09ICdwZW5kaW5nJykgfHwgKHN0YXRlID09PSAncmVzb2x2ZWQnKSkgJiYgaXNGdW5jdGlvbihcbiAgICAgICAgICAgICAgICAgICAgb25SZXNvbHZlKSkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVXcmFwcGVyKHJlc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlID0gb25SZXNvbHZlKHJlc29sdXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXR1cm5WYWx1ZSAmJiBpc0Z1bmN0aW9uKHJldHVyblZhbHVlLnRoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZS50aGVuKGZ1bmN0aW9uKG5leHRSZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKG5leHRSZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKG5leHRSZWplY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXh0UmVqZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3Jlc29sdmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlV3JhcHBlcihyZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2tzLnB1c2gocmVzb2x2ZVdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChzdGF0ZSA9PT0gJ3BlbmRpbmcnKSB8fCAoc3RhdGUgPT09ICdyZWplY3RlZCcpKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVqZWN0aW9uV3JhcHBlcihyZWplY3RXaXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKG9uUmVqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25SZWplY3QocmVqZWN0V2l0aCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogU3RvcCByZWplY3RpbmcgdGhlIHByb21pc2UgY2hhaW4gb25jZSB0aGUgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBoYXMgYmVlbiBoYW5kbGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChyZWplY3RXaXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3JlamVjdGVkJykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3Rpb25XcmFwcGVyKHJlamVjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2tzLnB1c2gocmVqZWN0aW9uV3JhcHBlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBub3RpZnlDYWxsYmFja3MucHVzaChmdW5jdGlvbihub3RpZnlXaXRoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ob25Ob3RpZnkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uTm90aWZ5KG5vdGlmeVdpdGgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByb21pc2Uubm90aWZ5KG5vdGlmeVdpdGgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlcnMgYSByZWplY3Rpb24gaGFuZGxlci4gU2hvcnRoYW5kIGZvciBgLnRoZW4oXywgb25SZWplY3QpYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBjYXRjaFxuICAgICAgICAgKiBAZm9yIFByb21pc2VcbiAgICAgICAgICogQGNoYWluYWJsZVxuICAgICAgICAgKiBAcGFyYW0gb25SZWplY3QgRXhlY3V0ZWQgd2hlblxuICAgICAgICAgKiAgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQuIFJlY2VpdmVzIHRoZSByZWplY3Rpb24gcmVhc29uIGFzIGFyZ3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBhcGkudGhlbihudWxsLCBvblJlamVjdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmQgYSBub3RpZmljYXRpb24gdG8gdGhlIHByb21pc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2Qgbm90aWZ5XG4gICAgICAgICAqIEBmb3IgUHJvbWlzZVxuICAgICAgICAgKiBAcGFyYW0geyp9IG5vdGlmeVdpdGggTm90aWZpY2F0aW9uIHZhbHVlXG4gICAgICAgICAqL1xuICAgICAgICBub3RpZnk6IGZ1bmN0aW9uKG5vdGlmeVdpdGgpIHtcbiAgICAgICAgICAgIG5vdGlmeUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobm90aWZ5V2l0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVqZWN0cyB0aGUgcHJvbWlzZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCByZWplY3RcbiAgICAgICAgICogQGZvciBQcm9taXNlXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gcmVqZWN0V2l0aCBSZWplY3Rpb24gcmVhc29uLiBXaWxsIGJlIHBhc3NlZCBvbiB0byB0aGVcbiAgICAgICAgICogIHJlamVjdGlvbiBoYW5kbGVyc1xuICAgICAgICAgKi9cbiAgICAgICAgcmVqZWN0OiBmdW5jdGlvbihyZWplY3RXaXRoKSB7XG4gICAgICAgICAgICByZWplY3RDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlamVjdFdpdGgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHN0YXRlID0gJ3JlamVjdGVkJztcbiAgICAgICAgICAgIHJlamVjdGlvbiA9IHJlamVjdFdpdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlc29sdmVzIHRoZSBwcm9taXNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIHJlc29sdmVcbiAgICAgICAgICogQGZvciBQcm9taXNlXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gcmVzb2x2ZVdpdGggVGhpcyB2YWx1ZSBpcyBwYXNzZWQgb24gdG8gdGhlIHJlc29sdXRpb25cbiAgICAgICAgICogIGhhbmRsZXJzIGF0dGFjaGVkIHRvIHRoZSBwcm9taXNlLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVzb2x2ZTogZnVuY3Rpb24ocmVzb2x2ZVdpdGgpIHtcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc29sdmVXaXRoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzdGF0ZSA9ICdyZXNvbHZlZCc7XG4gICAgICAgICAgICByZXNvbHV0aW9uID0gcmVzb2x2ZVdpdGg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbn1cblxuLyoqXG4gKiBUaGUgZGVmZXJyZWQgb2JqZWN0IHRoYXQncyB3cmFwcGVkIGJ5ICRxXG4gKlxuICogQGNsYXNzIERlZmVycmVkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoaXMgY2FsbGJhY2sgaXMgcGFzc2VkIHRocmVlIGFyZ3VtZW50cywgYHJlc29sdmVgLFxuICogIGByZWplY3RgIGFuZCBgbm90aWZ5YCB0aGF0IHJlc3BlY3RpdmVseSByZXNvbHZlLCByZWplY3Qgb3Igbm90aWZ5IHRoZVxuICogIGRlZmVycmVkcyBwcm9taXNlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERlZmVycmVkKGluaXQpIHtcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKCk7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihpbml0KSkge1xuICAgICAgICBpbml0KHByb21pc2UucmVzb2x2ZSwgcHJvbWlzZS5yZWplY3QsIHByb21pc2Uubm90aWZ5KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogU2VlIHt7I2Nyb3NzTGluayBcIlByb21pc2UvcmVzb2x2ZTptZXRob2RcIn19dGhlIHVuZGVybHlpbmdcbiAgICAgICAgICogcHJvbWlzZXMgcmVzb2x2ZXt7L2Nyb3NzTGlua319IGRvY3VtZW50YXRpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgcmVzb2x2ZVxuICAgICAgICAgKiBAZm9yIERlZmVycmVkXG4gICAgICAgICAqL1xuICAgICAgICByZXNvbHZlOiBwcm9taXNlLnJlc29sdmUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlZSB7eyNjcm9zc0xpbmsgXCJQcm9taXNlL3JlamVjdDptZXRob2RcIn19dGhlIHVuZGVybHlpbmdcbiAgICAgICAgICogcHJvbWlzZXMgcmVqZWN0e3svY3Jvc3NMaW5rfX0gZG9jdW1lbnRhdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCByZWplY3RcbiAgICAgICAgICogQGZvciBEZWZlcnJlZFxuICAgICAgICAgKi9cbiAgICAgICAgcmVqZWN0OiBwcm9taXNlLnJlamVjdCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VlIHt7I2Nyb3NzTGluayBcIlByb21pc2Uvbm90aWZ5Om1ldGhvZFwifX10aGUgdW5kZXJseWluZ1xuICAgICAgICAgKiBwcm9taXNlcyBub3RpZnl7ey9jcm9zc0xpbmt9fSBkb2N1bWVudGF0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIG5vdGlmeVxuICAgICAgICAgKiBAZm9yIERlZmVycmVkXG4gICAgICAgICAqL1xuICAgICAgICBub3RpZnk6IHByb21pc2Uubm90aWZ5LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge1Byb21pc2V9IHByb21pc2VcbiAgICAgICAgICogQGZvciBEZWZlcnJlZFxuICAgICAgICAgKi9cbiAgICAgICAgcHJvbWlzZTogcHJvbWlzZVxuICAgIH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgbWFuYWdlcyBwcm9taXNlcy4gVXNlZCBieSAkaHR0cCBhbmQgJHJvdXRpbmcuXG4gKlxuICogJHEgaXMgdXNlZCB0byBjcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QsIHdoaWNoIGNvbnRhaW5zIGEgcHJvbWlzZS4gVGhlXG4gKiBkZWZlcnJlZCBpcyB1c2VkIHRvIGNyZWF0ZSBhbmQgbWFuYWdlIHByb21pc2VzLlxuICpcbiAqIEEgcHJvbWlzZSBhY2NlcHRzIHJlc29sdXRpb24sIHJlamVjdGlvbiBhbmQgbm90aWZpY2F0aW9uIGhhbmRsZXJzIHRoYXQgYXJlXG4gKiBleGVjdXRlZCB3aGVuIHRoZSBwcm9taXNlIGl0c2VsZiBpcyByZXNvbHZlZCwgcmVqZWN0ZWQgb3Igbm90aWZpZWQuIFRoZVxuICogaGFuZGxlcnMgYXJlIGF0dGFjaGVkIHRvIHRoZSBwcm9taXNlIHZpYSB0aGUge3sjY3Jvc3NMaW5rIFwiUHJvbWlzZS90aGVuOm1ldGhvZFwifX1cbiAqIC50aGVuKCl7ey9jcm9zc0xpbmt9fSBtZXRob2QuXG4gKlxuICogWW91IGNhbiBhdHRhY2ggbXVsdGlwbGUgaGFuZGxlcnMgYnkgY2FsbGluZyAudGhlbigpIG11bHRpcGxlIHRpbWVzIHdpdGhcbiAqIGRpZmZlcmVudCBoYW5kbGVycy4gSW4gYWRkaXRpb24sIHlvdSBjYW4gY2hhaW4gLnRoZW4oKSBjYWxscy4gSW4gdGhpcyBjYXNlLFxuICogdGhlIHJldHVybiB2YWx1ZSBmcm9tIC50aGVuKCkgaXMgYSBuZXcgcHJvbWlzZSB0aGF0J3MgYXR0YWNoZWQgdG8gdGhlIHJlc29sdmVcbiAqIGhhbmRsZXIgcGFzc2VkIHRvIC50aGVuKCkuIFRoaXMgd2F5IHlvdSBjYW4gcmV0dXJuIHByb21pc2VzIGZyb20geW91ciByZXNvbHZlXG4gKiBoYW5kbGVyIGFuZCB0aGUgbmV4dCAudGhlbigpIHdpbGwgd2FpdCB1bnRpbCB0aGF0IHByb21pc2UgaXMgcmVzb2x2ZWQgdG9cbiAqIGNvbnRpbnVlLiBVc3VhbGx5IHVzZWQgdG8gZG8gbXVsdGlwbGUgYXN5bmNyb25vdXMgY2FsbHMgaW4gc2VxdWVuY2UuXG4gKlxuICogQGNsYXNzICRxXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gaW5pdGlhbGl6ZWQgdGhlIGRlZmVycmVkIG9iamVjdFxuICogd2l0aFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICovXG5mdW5jdGlvbiAkcShjYWxsYmFjaykge1xuICAgIHJldHVybiAobmV3IERlZmVycmVkKGNhbGxiYWNrKSkucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgZGVmZXIuIFRoaXMgbWV0aG9kIHJlcXVpcmVzIG5vIGFyZ3VtZW50cywgdGhlIHJldHVybmVkIGRlZmVyIGhhc1xuICogdGhlIG1ldGhvZHMgcmVxdWlyZWQgdG8gcmVzb2x2ZS9yZWplY3Qvbm90aWZ5IHRoZSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgIGxldCBkZWZlciA9ICRxLmRlZmVyKCk7XG4gKiAgICAgIGRlZmVyLnByb21pc2UudGhlbigobmFtZSkgPT4gY29uc29sZS5sb2coJ0hpICcgKyBuYW1lKSk7XG4gKiAgICAgIGRlZmVyLnJlc29sdmUoJ0pvaG4nKTtcbiAqICAgICAgLy89PiBcIkhpIEpvaG5cIlxuICogQG1ldGhvZCBkZWZlclxuICogQGZvciAkcVxuICogQHJldHVybiB7RGVmZXJyZWR9XG4gKi9cbiRxLmRlZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEZWZlcnJlZCgpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHByb21pc2UgYW5kIHJlc29sdmVzIGl0IHdpdGggYHZhbHVlYC4gSWYgYHZhbHVlYCBpcyBhIHByb21pc2UsXG4gKiB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBhdHRhY2hlZCB0byBgdmFsdWVgLiBJZiBvblJlc29sdmUsIG9uUmVqZWN0IG9yXG4gKiBvbk5vdGlmeSBhcmUgZ2l2ZW4sIHRoZXkgYXJlIGF0dGFjaGVkIHRvIHRoZSBuZXcgcHJvbWlzZS5cbiAqXG4gKiBAbWV0aG9kIHdoZW5cbiAqIEBmb3IgJHFcbiAqIEBleGFtcGxlXG4gKiAgICAgICRxLndoZW4oJ0pvaG4nKS50aGVuKChuYW1lKSA9PiBjb25zb2xlLmxvZygnSGkgJyArIG5hbWUpKTtcbiAqICAgICAgLy89PiBcIkhpIEpvaG5cIlxuICogQHBhcmFtIHsqfFByb21pc2V9IHZhbHVlIFZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2UgaXMgcmVzb2x2ZSB3aXRoLiBJZlxuICogIHZhbHVlIGlzIGEgcHJvbWlzZSwgdGhlIHJldHVybmVkIHByb21pc2UgaXMgYXR0YWNoZWQgdG8gdmFsdWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb25SZXNvbHZlXSBSZXNvbHZlIGhhbmRsZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtvblJlamVjdF0gUmVqZWN0aW9uIGhhbmRsZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtvbk5vdGlmeV0gTm90aWZpY2F0aW9uIGhhbmRsZXJcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKi9cbiRxLndoZW4gPSBmdW5jdGlvbih2YWx1ZSwgb25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICB2YXIgZGVmZXIgPSBuZXcgRGVmZXJyZWQoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0LCBub3RpZnkpIHtcbiAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnRoZW4pIHtcbiAgICAgICAgICAgIHZhbHVlLnRoZW4oZnVuY3Rpb24ocmVzb2x2ZVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNvbHZlVmFsdWUpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24obm90aWZ5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICBub3RpZnkobm90aWZ5VmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmZXIucHJvbWlzZS50aGVuKG9uUmVzb2x2ZSwgb25SZWplY3QsIG9uTm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige3sjY3Jvc3NMaW5rIFwiJHEvd2hlbjptZXRob2RcIn19JHEud2hlbnt7L2Nyb3NzTGlua319XG4gKiBAbWV0aG9kIHJlc29sdmVcbiAqIEBmb3IgJHFcbiAqL1xuJHEucmVzb2x2ZSA9ICRxLndoZW47XG5cbi8qKlxuICogVGFrZXMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgKGNhbGxlZCBpbm5lciBwcm9taXNlcykgYW5kIGNyZWF0ZXMgYSBuZXcgcHJvbWlzZVxuICogKGNhbGxlZCBvdXRlciBwcm9taXNlKSB0aGF0IHJlc29sdmVzIHdoZW4gYWxsIHRoZSBpbm5lciBwcm9taXNlcyByZXNvbHZlLlxuICogSWYgYW55IG9mIHRoZSBpbm5lciBwcm9taXNlcyBhcmUgcmVqZWN0ZWQsIHRoZSBvdXRlciBwcm9taXNlIGlzXG4gKiBpbW1lZGlhdGVseSByZWplY3RlZCBhcyB3ZWxsIGFuZCBhbnkgb3RoZXIgaW5uZXIgcHJvbWlzZXMgbGVmdCBvdmVyIGFyZVxuICogZGlzY2FyZGVkLlxuICpcbiAqIEUuZy4gaWYgeW91IGhhdmUgdGhyZWUgaW5uZXIgcHJvbWlzZXMsIEEsIEIsIGFuZCBDLCB0aGVuIHRoZSBvdXRlciBwcm9taXNlIE9cbiAqIGlzIHJlc29sdmVkIG9uY2UgYWxsIHRocmVlIEEsIEIgYW5kIEMgYXJlIHJlc29sdmVkLlxuICpcbiAqIElmIEEgaXMgcmVzb2x2ZWQsIGFuZCBCIGlzIHJlamVjdGVkLCBhbmQgQyBpcyBwZW5kaW5nLCB0aGVuIE8gd2lsbCBiZVxuICogcmVqZWN0ZWQgcmVnYXJkbGVzcyBvZiBDJ3Mgb3V0Y29tZS5cbiAqXG4gKiBAbWV0aG9kIGFsbFxuICogQGV4YW1wbGVcbiAqICAgICAgbGV0IGdyZWV0aW5nID0gJHEuZGVmZXIoKTtcbiAqICAgICAgbGV0IG5hbWUgPSAkcS5kZWZlcigpO1xuICpcbiAqICAgICAgJHEuYWxsKFtncmVldGluZy5wcm9taXNlLCBuYW1lLnByb21pc2VdKVxuICogICAgICAgICAgLnRoZW4oKGdyZWV0aW5nLCBuYW1lKSA9PiBjb25zb2xlLmxvZyhncmVldGluZyArICcgJyArIG5hbWUpKTtcbiAqXG4gKiAgICAgIGdyZWV0aW5nLnJlc29sdmUoJ1dlbGNvbWUnKTtcbiAqICAgICAgbmFtZS5yZXNvbHZlKCdKb2huJylcbiAqICAgICAgLy89PiBcIldlbGNvbWUgSm9oblwiXG4gKiBAcGFyYW0ge0FycmF5fSBwcm9taXNlcyBBcnJheSBvZiBwcm9taXNlc1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqL1xuJHEuYWxsID0gZnVuY3Rpb24ocHJvbWlzZXMpIHtcbiAgICBpZiAoIShwcm9taXNlcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb21pc2VzIG5lZWQgdG8gYmUgcGFzc2VkIHRvICRxLmFsbCBpbiBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgcmVzb2x1dGlvbnMgPSBbXTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tDb21wbGV0ZSgpIHtcbiAgICAgICAgaWYgKGNvdW50ZXIgPT09IHByb21pc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNvbHV0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbihyZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICByZXNvbHV0aW9uc1tpbmRleF0gPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgKytjb3VudGVyO1xuICAgICAgICAgICAgY2hlY2tDb21wbGV0ZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHE7XG59OyIsIi8qKlxuICogTWltZW8gc2hpcHMgd2l0aCBhIGZldyBidWlsdC1pbiBpbmplY3RhYmxlcywgbmFtZWx5IHt7I2Nyb3NzTGluayBcIiRxXCJ9fWFcbiAqIHByb21pc2UgbGlicmFyeSBjYWxsZWQgJHF7ey9jcm9zc0xpbmt9fSwgYSBuZXR3b3JraW5nIHdyYXBwZXIgY2FsbGVkICRodHRwXG4gKiBhbmQgYSByb3V0aW5nIGZhY2lsaXR5IGNhbGxlZCAkcm91dGluZy5cbiAqXG4gKiBAbW9kdWxlIEJ1aWx0aW5zXG4gKi9cblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL1Byb21pc2UuanMnKTtcbnZhciBSb3V0aW5nID0gcmVxdWlyZSgnLi9Sb3V0aW5nLmpzJyk7XG52YXIgSHR0cCA9IHJlcXVpcmUoJy4vSHR0cC5qcycpO1xudmFyIEdsb2JhbHNXcmFwcGVyID0gcmVxdWlyZSgnLi9HbG9iYWxzV3JhcHBlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluamVjdGFibGVzKSB7XG4gICAgR2xvYmFsc1dyYXBwZXIuV2luZG93LiRuYW1lID0gJyR3aW5kb3cnO1xuICAgIEdsb2JhbHNXcmFwcGVyLldpbmRvdy4kaW5qZWN0ID0gW107XG5cbiAgICBpbmplY3RhYmxlcy5hZGQoR2xvYmFsc1dyYXBwZXIuV2luZG93KTtcblxuICAgIEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwLiRuYW1lID0gJyRub2RlSHR0cCc7XG4gICAgR2xvYmFsc1dyYXBwZXIuTm9kZUh0dHAuJGluamVjdCA9IFtdO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwKTtcblxuICAgIEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwcy4kbmFtZSA9ICckbm9kZUh0dHBzJztcbiAgICBHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cHMuJGluamVjdCA9IFtdO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwcyk7XG5cbiAgICBSb3V0aW5nLlJvdXRpbmcuJG5hbWUgPSAnJHJvdXRpbmcnO1xuICAgIFJvdXRpbmcuUm91dGluZy4kaW5qZWN0ID0gWyckcScsICckd2luZG93J107XG5cbiAgICBpbmplY3RhYmxlcy5hZGQoUm91dGluZy5Sb3V0aW5nKTtcblxuICAgIFByb21pc2UuJG5hbWUgPSAnJHEnO1xuICAgIFByb21pc2UuJGluamVjdCA9IFtdO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKFByb21pc2UpO1xuXG4gICAgSHR0cC4kbmFtZSA9ICckaHR0cCc7XG4gICAgSHR0cC4kaW5qZWN0ID0gWyckd2luZG93JywgJyRxJywgJyRub2RlSHR0cCcsICckbm9kZUh0dHBzJ107XG4gICAgaW5qZWN0YWJsZXMuYWRkKEh0dHApO1xufTtcbiIsIi8qKlxuICogQG1vZHVsZSBCdWlsdGluc1xuICovXG5cbnZhciBSb3V0ZVJlY29nbml6ZXIgPSByZXF1aXJlKCdyb3V0ZS1yZWNvZ25pemVyJyk7XG52YXIgcGFyc2VVcmkgPSByZXF1aXJlKCdwYXJzZXVyaScpO1xuXG4vKipcbiAqICMgUm91dGluZyBmb3IgTWltZW9cbiAqXG4gKiBUaGlzIGJ1aWx0aW4gaGFuZGxlcyByb3V0aW5nIGJ5IG1hbmFnaW5nIHRoZSBicm93c2VycyBoaXN0b3J5IGFuZCBtYXRjaGluZ1xuICogcm91dGVzIHdpdGggaW5qZWN0YWJsZXMgKHVzdWFsbHkgY29tcG9uZW50cy4pXG4gKlxuICogVGhlIGdlbmVyYWwgd29ya2Zsb3cgd291bGQgYmUgdG8gaW5qZWN0IGAkcm91dGluZ2AgaW50byBhXG4gKiB7eyNjcm9zc0xpbmsgXCJNb2R1bGUvcnVuOm1ldGhvZFwifX1gLnJ1bigpYHt7L2Nyb3NzTGlua319IGluamVjdGFibGUgb24geW91clxuICogcm9vdCBtb2R1bGUgYWxvbmcgd2l0aCB0aGUgaW5qZWN0YWJsZXMgeW91IHdhbnQgdG8gbWF0Y2ggdG8gdGhlIHJvdXRlcywgYW5kXG4gKiB7eyNjcm9zc0xpbmsgXCIkcm91dGluZy9zZXQ6bWV0aG9kXCJ9fWRlZmluZSByb3V0ZXMgdGhlcmV7ey9jcm9zc0xpbmt9fTpcbiAqXG4gKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICogICAgICAgICAgLnJ1bihbXG4gKiAgICAgICAgICAgICAgJyRyb3V0aW5nJyxcbiAqICAgICAgICAgICAgICAndXNlcnNDb21wb25lbnQnLFxuICogICAgICAgICAgICAgICdsb2dpbkNvbXBvbmVudCcsXG4gKiAgICAgICAgICAgICAgKCRyb3V0aW5nKSA9PiB7XG4gKiAgICAgICAgICAgICAgICAgICRyb3V0aW5nLnNldCgnL3VzZXJzJywgdXNlcnNDb21wb25lbnQpO1xuICogICAgICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy9sb2dpbicsIGxvZ2luQ29tcG9uZW50KTtcbiAqICAgICAgICAgICAgICB9XG4gKiAgICAgICAgICApO1xuICpcbiAqICMjIEdlbmVyYXRpbmcgb3V0cHV0XG4gKlxuICogSG93IG91dHB1dCBpcyBnZW5lcmF0ZWQgaXMgdXAgdG8gdGhlIG1hdGNoZWQgaW5qZWN0YWJsZS4gT25jZSBhbiBpbmplY3RhYmxlXG4gKiBpcyBtYXRjaGVkIHRvIGEgcm91dGUsIGl0IGlzIGludm9rZWQgd2l0aCB0aHJlZSBwYXJhbWV0ZXJzOlxuICpcbiAqIC0gY29udGV4dFxuICogLSByZW5kZXJlclxuICogLSB0YXJnZXRET01Ob2RlXG4gKlxuICogQ29udGV4dCBpcyBhbiBvYmplY3QgdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbWF0Y2hlZCByb3V0ZS4gU2VlXG4gKiB7eyNjcm9zc0xpbmsgXCIkcm91dGluZy9zZXQ6bWV0aG9kXCJ9fXRoZSBgc2V0YCBtZXRob2QgZm9yIG1vcmUgZGV0YWlsc1xuICoge3svY3Jvc3NMaW5rfX0uIFJlbmRlcmVyIGlzIGEgaGVscGVyIHRvIHByb2R1Y2Ugb3V0cHV0IGFuZCBjYW4gYmVcbiAqIGNvbmZpZ3VyZWQuXG4gKiB0YXJnZXRET01Ob2RlIGlzIHRoZSBET00gbm9kZSB0aGF0IHdhcyBhc3NvY2lhdGVkIHdpdGggdGhlIHJvdXRlLlxuICpcbiAqIFNpbmNlIHRoZSBpbmplY3RhYmxlIGhhcyBhY2Nlc3MgdG8gdGhlIERPTSBub2RlLCBpdCBjYW4gc2ltcGx5IHVwZGF0ZSB0aGVcbiAqIG5vZGVzIGNvbnRlbnQgdG8gcHJvZHVjZSBvdXRwdXQuIFRoZSBgcmVuZGVyZXJgIGlzIG5vdCBzdHJpY3RseSBuZWNlc3NhcnkuXG4gKiBIb3dldmVyLCB3aGVuIHVzaW5nIGEgcmVuZGVyaW5nIGxpYnJhcnkgbGlrZSBSZWFjdCwgbWFudWFsbHkgY2FsbGluZ1xuICogUmVhY3RET00ucmVuZGVyKGV4YW1wbGVDb21wb25lbnQsIHRhcmdldERPTU5vZGUpIGlzIGFubm95aW5nIGFuZCBhbHNvIG1ha2VzXG4gKiBpdCBpbXBvc3NpYmxlIHRvIHN3aXRjaCB0byBlLmcuXG4gKiBSZWFjdERPTVNlcnZlci5yZW5kZXJUb1N0YXRpY01hcmt1cChleGFtcGxlQ29tcG9uZW50KSB0byBwcm9kdWNlIG91dHB1dFxuICogaW4gTm9kZUpTLlxuICpcbiAqIFVzaW5nIGEgcmVuZGVyZXIgaGFzIHRoZSBhZHZhbnRhZ2Ugb2YgYmVpbmcgYWJsZSB0byBjaGFuZ2UgdGhlIHJlbmRlcmluZ1xuICogbWV0aG9kIGRlcGVuZGluZyBvbiB0aGUgZW52aXJvbm1lbnQgdGhlIGFwcCBpcyBpbi4gVXNpbmdcbiAqIHt7I2Nyb3NzTGlua1xuICogXCIkcm91dGluZy9zZXRNYWtlUmVuZGVyZXI6bWV0aG9kXCJ9fWBzZXRNYWtlUmVuZGVyZXJge3svY3Jvc3NMaW5rfX1cbiAqIHRvIGRlZmluZSBhIGRlZmF1bHQgcmVuZGVyZXIgYWxsb3dzIHRoZSBtYXRjaGVkIGluamVjdGFibGUgdG8gc2ltcGx5IGNhbGxcbiAqIGByZW5kZXJlcihleGFtcGxlQ29tcG9uZW50KWAgYW5kIG5vdCBkZWFsIHdpdGggdGhlIHNwZWNpZmljcyBvZiBnZW5lcmF0aW5nXG4gKiBvdXRwdXQuIEFuIGV4YW1wbGUgZm9yIFJlYWN0OlxuICpcbiAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gKiAgICAgICAgICAvLyB0YXJnZXQgaXMgbm90IHVzZWQgc2luY2UgdGhlIGN1c3RvbSByZW5kZXJlciB3aWxsIHRha2UgY2FyZSBvZlxuICogICAgICAgICAgLy8gbW91bnRpbmcgdGhlIHJlYWN0IG5vZGVcbiAqICAgICAgICAgIC5jb21wb25lbnQoWyd1c2Vyc0NvbXBvbmVudCcsICgpID0+ICgkY29udGV4dCwgJHJlbmRlcikgPT4ge1xuICogICAgICAgICAgICAgIGxldCBVc2VycyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHt9KTsgLy8gZXhhbXBsZSBjb21wb25lbnRcbiAqXG4gKiAgICAgICAgICAgICAgcmV0dXJuICRyZW5kZXIoPFVzZXJzIC8+KTtcbiAqICAgICAgICAgIH0pXG4gKiAgICAgICAgICAucnVuKFsnJHJvdXRpbmcnLCAndXNlcnNDb21wb25lbnQnLCAoJHJvdXRpbmcsIHVzZXJzQ29tcG9uZW50KSA9PiB7XG4gKiAgICAgICAgICAgICAgJHJvdXRpbmcuc2V0TWFrZVJlbmRlcmVyKGZ1bmN0aW9uKHRhcmdldERPTU5vZGUpIHtcbiAqICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0Tm9kZSkge1xuICogICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlYWN0RE9NLnJlbmRlcihyZWFjdE5vZGUsIHRhcmdldERPTU5vZGUpO1xuICogICAgICAgICAgICAgICAgICB9O1xuICogICAgICAgICAgICAgIH0pO1xuICpcbiAqICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy91c2VycycsIHVzZXJzQ29tcG9uZW50KTtcbiAqICAgICAgICAgIH0pO1xuICpcbiAqICMjIEluaXRpYXRlIHJvdXRpbmdcbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgd2F5cyB0byBjaGFuZ2UgdGhlIGN1cnJlbnQgcm91dGU6XG4gKlxuICogLSB7eyNjcm9zc0xpbmsgXCIkcm91dGluZy9nb3RvOm1ldGhvZFwifX1nb3Rve3svY3Jvc3NMaW5rfX1cbiAqIC0gYS10YWcgd2l0aCBhIGhyZWYgYW5kIGEgJ2RhdGEtaW50ZXJuYWwnIGF0dHJpYnV0ZVxuICogLSBhLXRhZyB3aXRoIGEgaHJlZiwgYSAnZGF0YS1pbnRlcm5hbCcgYW5kICdkYXRhLW5vLWhpc3RvcnknIGF0dHJpYnV0ZVxuICpcbiAqIGAuZ290bygpYCBpcyBtYWlubHkgdXNlZCBmb3Igc2VydmVyLXNpZGUgcmVuZGVyaW5nLiBJZiB5b3Ugc2V0IGFcbiAqIHt7I2Nyb3NzTGluayBcIiRyb3V0aW5nL3NldE1ha2VSZW5kZXJlcjptZXRob2RcIn19YSByZW5kZXJlcnt7L2Nyb3NzTGlua319IHRoYXRcbiAqIHN1cHBvcnRzIHNlcnZlci1zaWRlIG91dHB1dCwgeW91IHdvbid0IGhhdmUgdG8gY2hhbmdlIHlvdXIgY29tcG9uZW50cyB0b1xuICogZ2VuZXJhdGUgdGhlIG91dHB1dC4gYC5nb3RvKClgIHdpbGwgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IGlzIGZ1bGwtZmlsbGVkXG4gKiB3aXRoIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgY29tcG9uZW50LiBZb3UgY2FuIGhhdmUgeW91ciBzZXJ2ZXItc2lkZVxuICogZW50cnktcG9pbnQgYXR0YWNoIHRvIHRoYXQgcHJvbWlzZSBhbmQgdGhlbiBkbyB3aXRoIHRoZSBvdXRwdXQgd2hhdCB5b3VcbiAqIG5lZWQgKGUuZy4gc2VuZCBhbiBlbWFpbCwgc2F2ZSB0byBhIHN0YXRpYyAuaHRtbCBmaWxlLCBldGMuKVxuICpcbiAqIFRoZSBvdGhlciB0d28gYXJlIHNpbXBseSBhLXRhZ3MgaW4geW91ciBodG1sLiBgJHJvdXRpbmdgIGF0dGFjaGVzIGFuIGV2ZW50XG4gKiBoYW5kbGVyIHRvIHRoZSBkb2N1bWVudCB0aGF0IGxpc3RlbnMgdG8gY2xpY2tzIG9uIGEtdGFncyB3aXRoIGFcbiAqICdkYXRhLWludGVybmFsJyBhdHRyaWJ1dGUuIFRoZSB2YWx1ZSBmcm9tIHRoZSAnaHJlZicgYXR0cmlidXRlIGlzIHVzZWQgYXMgdGhlXG4gKiByb3V0ZSB0byBoYW5kbGUuIFRoZSAnZGF0YS1uby1oaXN0b3J5JyBhdHRyaWJ1dGUgY29udHJvbHMgd2hldGhlciBhIG5ld1xuICogYnJvd3Nlci1oaXN0b3J5IGVudHJ5IGlzIGNyZWF0ZWQuIElmIHRoZSBhdHRyaWJ1dGUgaXMgcHJlc2VudCwgbm8gaGlzdG9yeVxuICogaXMgY3JlYXRlZC5cbiAqXG4gKiBAY2xhc3MgJHJvdXRpbmdcbiAqIEBzdGF0aWNcbiAqL1xuZnVuY3Rpb24gUm91dGluZygkcSwgJHdpbmRvdykge1xuICAgIHZhciByb3V0aW5nID0gbmV3IFJvdXRlUmVjb2duaXplcigpO1xuICAgIHZhciBkZWZhdWx0Um91dGU7XG4gICAgdmFyIGFueVJvdXRlSGFuZGxlZCA9IGZhbHNlO1xuICAgIHZhciBtYWtlUmVuZGVyZXIgPSBmdW5jdGlvbih0YXJnZXRBc0RPTU5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRvUmVuZGVyKSB7XG4gICAgICAgICAgICB0YXJnZXRBc0RPTU5vZGUuaW5uZXJIVE1MID0gdG9SZW5kZXI7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0KGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBJbnRlcm5ldCBleHBsb3JlciBzdXBwb3J0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUoZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICAgIGlmIChlbGVtZW50W2F0dHJpYnV0ZV0pIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50W2F0dHJpYnV0ZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5nZXRBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbGVtZW50LmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhbHVlID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmF0dHJpYnV0ZXNbaV0ubm9kZU5hbWUgPT09IGF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRBbmNlc3RvcldpdGhBdHRyaWJ1dGUobm9kZSwgYXR0cmlidXRlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2V0QXR0cmlidXRlKG5vZGUsIGF0dHJpYnV0ZSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldEFuY2VzdG9yV2l0aEF0dHJpYnV0ZShub2RlLnBhcmVudE5vZGUsIGF0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9EZWZhdWx0Um91dGUocm91dGUpIHtcbiAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCAnJywgcm91dGUpO1xuICAgICAgICByZXR1cm4gZG9Sb3V0aW5nKHJvdXRlLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcXVlcnlUb0RpY3QocXVlcnkpIHtcbiAgICAgICAgdmFyIGRpY3QgPSB7fTtcbiAgICAgICAgcXVlcnkuc3BsaXQoJyYnKS5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnQuc3BsaXQoJz0nKS5tYXAoZGVjb2RlVVJJQ29tcG9uZW50KTtcbiAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgICAgICBpZiAoZGljdFtwYXJ0WzBdXSkge1xuICAgICAgICAgICAgICAgIGlmICghKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkaWN0W3BhcnRbMF1dKSA9PSAnW29iamVjdCBBcnJheV0nKSkge1xuICAgICAgICAgICAgICAgICAgICBkaWN0W3BhcnRbMF1dID0gW2RpY3RbcGFydFswXV1dO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRpY3RbcGFydFswXV0ucHVzaChwYXJ0WzFdKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0W3BhcnRbMF1dID0gcGFydFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRpY3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9Sb3V0aW5nKHVybCwgZG9EZWZhdWx0KSB7XG4gICAgICAgIGFueVJvdXRlSGFuZGxlZCA9IHRydWU7XG4gICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhcnNlVXJpKHVybCk7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHJvdXRpbmcucmVjb2duaXplKHVybFBhcnRzLnBhdGgpO1xuICAgICAgICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyICRjb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybFBhcnRzLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IGhhbmRsZXJzW2ldLnBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5VG9EaWN0KHVybFBhcnRzLnF1ZXJ5KVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJzW2ldLmhhbmRsZXIoJGNvbnRleHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgoZG9EZWZhdWx0ICE9PSBmYWxzZSkgJiYgZGVmYXVsdFJvdXRlKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRvRGVmYXVsdFJvdXRlKGRlZmF1bHRSb3V0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ290b1JvdXRlKHJvdXRlKSB7XG4gICAgICAgICR3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCxcbiAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgcm91dGUpO1xuICAgICAgICByZXR1cm4gZG9Sb3V0aW5nKHJvdXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlUm91dGUocm91dGUpIHtcbiAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLFxuICAgICAgICAgICAgJycsXG4gICAgICAgICAgICByb3V0ZSk7XG5cbiAgICAgICAgcmV0dXJuIGRvUm91dGluZyhyb3V0ZSk7XG4gICAgfVxuXG4gICAgJHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvUm91dGluZygkd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgIH07XG5cbiAgICAkd2luZG93Lm9uY2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogUmVsYXRlZCB0byBTYWZhcmkgZmlyaW5nIGV2ZW50cyBvbiB0ZXh0IG5vZGVzXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgICAqIE90aGVyIGVsZW1lbnRzIG1pZ2h0IGJlIGluc2lkZSBhbiBhLXRhZyB3aGljaCBlbmQgdXAgYXMgZXZlbnQudGFyZ2V0LFxuICAgICAgICAgKiBzbyB3ZSBuZWVkIHRvIHdhbGsgdGhlIHBhcmVudCBub2RlcyB0byBmaW5kIHRoZSBhLXRhZyB3aXRoIHRoZSAnc3JjJ1xuICAgICAgICAgKiBhdHRyaWJ1dGVcbiAgICAgICAgICovXG4gICAgICAgIHRhcmdldCA9IGdldEFuY2VzdG9yV2l0aEF0dHJpYnV0ZSh0YXJnZXQsICdkYXRhLWludGVybmFsJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiBnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnZGF0YS1pbnRlcm5hbCcpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwcmV2ZW50RGVmYXVsdChldmVudCk7XG4gICAgICAgICAgICBpZiAoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2RhdGEtbm8taGlzdG9yeScpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVwbGFjZVJvdXRlKGdldEF0dHJpYnV0ZSh0YXJnZXQsICdocmVmJykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnb3RvUm91dGUoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2hyZWYnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLypcbiAgICAgICAgICogSWYgYSByb3V0ZSBpcyBoYW5kbGVkIGJlZm9yZSAub25sb2FkIGlzIGZpcmVkIChlLmcuIGJ5IGNhbGxpbmdcbiAgICAgICAgICogLmdvdG8oKSksIHRoZW4gZG9uJ3QgZG8gcm91dGluZy4gVGhpcyBwcmV2ZW50cyBhIGRvdWJsZS1sb2FkIGFzIHRoZVxuICAgICAgICAgKiByb3V0ZSBoYXMgYWxyZWFkeSBiZWVuIGhhbmRsZWQuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIWFueVJvdXRlSGFuZGxlZCkge1xuICAgICAgICAgICAgZG9Sb3V0aW5nKCR3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBhIGRlZmF1bHQgcm91dGUgdG8gcmVkaXJlY3QgdG8gd2hlbiB0aGUgY3VycmVudCByb3V0ZSBpc24ndFxuICAgICAgICAgKiBtYXRjaGVkIHRvIGFueXRoaW5nXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2Qgc2V0RGVmYXVsdFJvdXRlXG4gICAgICAgICAqIEBmb3IgJHJvdXRpbmdcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld0RlZmF1bHRSb3V0ZSBUaGUgZGVmYXVsdCBwYXRoIHRvIHJvdXRlIHRvIGlmIHRoZVxuICAgICAgICAgKiAgY3VycmVudCBwYXRoIHdhc24ndCBtYXRjaGVkIGJ5IGFueSBkZWZpbmVkIHJvdXRlXG4gICAgICAgICAqL1xuICAgICAgICAnc2V0RGVmYXVsdFJvdXRlJzogZnVuY3Rpb24obmV3RGVmYXVsdFJvdXRlKSB7XG4gICAgICAgICAgICBpZiAoISgodHlwZW9mIG5ld0RlZmF1bHRSb3V0ZSA9PT0gJ3N0cmluZycpIHx8IG5ld0RlZmF1bHRSb3V0ZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBkZWZhdWx0IHJvdXRlIG11c3QgYmUgZ2l2ZW4gYXMgYSBzdHJpbmcsIGUuZy4gXCIvYXBwXCInKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVmYXVsdFJvdXRlID0gbmV3RGVmYXVsdFJvdXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgYSBjdXN0b20gZmFjdG9yeSBmb3IgcmVuZGVyIGZ1bmN0aW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBSZW5kZXIgZmFjdG9yaWVzIHJlY2VpdmUgdGhlIERPTSB0YXJnZXQgbm9kZSBmb3IgdGhlIHJvdXRlIGFuZFxuICAgICAgICAgKiBwcm9kdWNlIGFuIGV4ZWN1dGFibGUgdGhhdCBjYW4gYmUgdXNlZCB0byByZW5kZXIgY29udGVudCAodGhhdFxuICAgICAgICAgKiBleGVjdXRhYmxlIGlzIGNhbGxlZCBgcmVuZGVyZXJgKS5cbiAgICAgICAgICpcbiAgICAgICAgICogQSBuZXcgcmVuZGVyZXIgaXMgY3JlYXRlZCBldmVyeSB0aW1lIGEgcm91dGUgaXMgbWF0Y2hlZCBieSBwYXNzaW5nXG4gICAgICAgICAqIHRoZSByb3V0ZXMgdGFyZ2V0IERPTSBub2RlIHRvIHRoZSBtYWtlUmVuZGVyZXIgZnVuY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFJlbmRlcmVyIGZ1bmN0aW9ucyBhcmUgcGFzc2VkIHRvIHRoZSBpbmplY3RhYmxlIHRoYXQgaXMgbWF0Y2hlZCB3aXRoXG4gICAgICAgICAqIHRoZSByb3V0ZS4gYHNldE1ha2VSZW5kZXJlcmAgc2V0cyB0aGUgZmFjdG9yeSB0aGF0IGNyZWF0ZXMgdGhlXG4gICAgICAgICAqIHJlbmRlciBmdW5jdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBkZWZhdWx0IG1ha2VSZW5kZXJlciBmYWN0b3J5IHByb2R1Y2VzIHJlbmRlcmVyIGZ1bmN0aW9ucyB0aGF0XG4gICAgICAgICAqIHNpbXBseSBzZXQgaW5uZXJIVE1MIG9uIHRoZSB0YXJnZXQgRE9NIG5vZGU6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZnVuY3Rpb24odGFyZ2V0QXNET01Ob2RlKSB7XG4gICAgICAgICAqICAgICAgICAgIHJldHVybiBmdW5jdGlvbih0b1JlbmRlcikge1xuICAgICAgICAgKiAgICAgICAgICAgICAgdGFyZ2V0QXNET01Ob2RlLmlubmVySFRNTCA9IHRvUmVuZGVyO1xuICAgICAgICAgKiAgICAgICAgICB9O1xuICAgICAgICAgKiAgICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGluamVjdGFibGUgZm9yIGFueSBnaXZlbiByb3V0ZSBjYW4gdXNlIHRoZSByZW5kZXIgbWV0aG9kIGxpa2VcbiAgICAgICAgICogdGhpczpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAgICAgICAgICogICAgICAgICAgLmNvbXBvbmVudChbJ2NvbXBvbmVudCcsICgpID0+ICgkY29udGV4dCwgJHJlbmRlcmVyKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAkcmVuZGVyZXIoJzxoMT5IZWFkbGluZSBjb250ZW50PC9oMT4nKTtcbiAgICAgICAgICogICAgICAgICAgfV0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiBXaGVuIHVzaW5nIGEgcmVuZGVyaW5nIGxpYnJhcnksIGl0J3Mgb2Z0ZW4gYmVuZWZpY2lhbCB0byBzZXQgYVxuICAgICAgICAgKiBjdXN0b21cbiAgICAgICAgICogcmVuZGVyZXIgZmFjdG9yeSB0byBzaW1wbGlmeSByZW5kZXJpbmcgaW4gdGhlIGNvbXBvbmVudC4gRS5nLiB3aXRoXG4gICAgICAgICAqIFJlYWN0LCBjdXN0b20gY29tcG9uZW50cyBhcmUgbW91bnRlZCBvbiBET00gbm9kZXMgdmlhXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgUmVhY3RET00ucmVuZGVyKDxDb21wb25lbnQvPiwgRE9NTm9kZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIEEgY3VzdG9tIGBzZXRNYWtlUmVuZGVyZXJgIGZvciBSZWFjdCB3b3VsZCBjcmVhdGUgYSBmdW5jdGlvbiB0aGF0XG4gICAgICAgICAqIGFjY2VwdHMgYSBSZWFjdCBjb21wb25lbnQgYW5kIG1vdW50cyBpdCB0byB0aGUgcm91dGVzIHRhcmdldCBET01cbiAgICAgICAgICogbm9kZTpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAkcm91dGluZy5zZXRNYWtlUmVuZGVyZXIoZnVuY3Rpb24odGFyZ2V0RE9NTm9kZSkge1xuICAgICAgICAgKiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY29tcG9uZW50KSB7XG4gICAgICAgICAqICAgICAgICAgICAgICBSZWFjdERPTS5yZW5kZXIoY29tcG9uZW50LCB0YXJnZXRET01Ob2RlKTtcbiAgICAgICAgICogICAgICAgICAgfVxuICAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIHNldE1ha2VSZW5kZXJlclxuICAgICAgICAgKiBAZm9yICRyb3V0aW5nXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5ld01ha2VSZW5kZXJlciAtIFNldCB0aGUgcmVuZGVyZXIgZmFjdG9yeS4gR2V0c1xuICAgICAgICAgKiB0aGUgcm91dGVzIHRhcmdldCBET00gbm9kZSBwYXNzZWQgaW5cbiAgICAgICAgICovXG4gICAgICAgICdzZXRNYWtlUmVuZGVyZXInOiBmdW5jdGlvbihuZXdNYWtlUmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGlmICghKG5ld01ha2VSZW5kZXJlciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIG1ha2VSZW5kZXJlciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWFrZVJlbmRlcmVyID0gbmV3TWFrZVJlbmRlcmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXRzIGEgaGFuZGxlciBmb3IgYSByb3V0ZS4gVGhlcmUgY2FuIGJlIG11bHRpcGxlIGhhbmRsZXJzIGZvciBhbnlcbiAgICAgICAgICogcm91dGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSByb3V0ZSBtYXRjaGluZyBpcyBoYW5kbGVkIGJ5ICh0aGUgcm91dGUtcmVjb2duaXplciBwYWNrYWdlLFxuICAgICAgICAgKiByZWFkIHRoZSBkb2NzIHJlZ2FyZGluZyB0aGUgcm91dGUgc3ludGF4XG4gICAgICAgICAqIGhlcmUpW2h0dHBzOi8vZ2l0aHViLmNvbS90aWxkZWlvL3JvdXRlLXJlY29nbml6ZXIjdXNhZ2VdLiBZb3UgY2FuXG4gICAgICAgICAqIGNhcHR1cmUgcGFydHMgb2YgdGhlIHVybCB3aXRoIGA6bmFtZWAgYW5kIGAqbmFtZWA6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgJHJvdXRpbmcuc2V0KCcvdXNlcnMvOmlkJylcbiAgICAgICAgICogICAgICAvLz0+IG1hdGNoZXMgL3VzZXJzLzEgdG8geyBpZDogMSB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgJHJvdXRpbmcuc2V0KCcvYWJvdXQvKnBhdGgnKVxuICAgICAgICAgKiAgICAgIC8vPT4gbWF0Y2hlcyAvYWJvdXQvbG9jYXRpb24vY2l0eSB0byB7IHBhdGg6ICdsb2NhdGlvbi9jaXR5JyB9XG4gICAgICAgICAqXG4gICAgICAgICAqIENhcHR1cmVkIHNlZ21lbnRzIG9mIHRoZSB1cmwgd2lsbCBiZSBhdmFpbGFibGUgaW4gYCRjb250ZXh0LnBhcmFtc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIFNldHRpbmcgYSByb3V0ZSBtYXRjaGVzIGFuIGluamVjdGFibGUgd2l0aCBhIHVybDpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAkcm91dGluZy5zZXQoJy9leGFtcGxlLXVybCcsIGV4YW1wbGVJbmplY3RhYmxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGluamVjdGFibGUgdGhhdCB3aWxsIHJlY2VpdmUgdGhyZWUgcGFyYW1ldGVyczpcbiAgICAgICAgICpcbiAgICAgICAgICogLSAkY29udGV4dCAtIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHJvdXRlIGFuZCBhY2Nlc3MgdG8gdXJsXG4gICAgICAgICAqIHBhcmFtZXRlcnNcbiAgICAgICAgICogLSAkcmVuZGVyZXIgLSB0aGUgcmVuZGVyZXIgJHJvdXRpbmcgaXMgY29uZmlndXJlZCB0byB1c2UuIERlZmF1bHRcbiAgICAgICAgICoganVzdCBzZXQgdGhlIGh0bWwgY29udGVudCBvZiB0aGUgdGFyZ2V0IERPTSBub2RlXG4gICAgICAgICAqIC0gJHRhcmdldCAtIERPTSBub2RlIHRoYXQgdGhlIGNvbnRlbnQgc2hvdWxkIGVuZCB1cCBpbi4gVXNlZnVsIGlmXG4gICAgICAgICAqIHlvdSBkb24ndCB3YW50IHRvIHVzZSAkcmVuZGVyZXIgZm9yIGEgc3BlY2lmaWMgcm91dGVcbiAgICAgICAgICpcbiAgICAgICAgICogU2V0IHJvdXRlcyBpbiBhIGAucnVuKClgIGJsb2NrIG9uIHlvdXIgcm9vdCBtb2R1bGU6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgbWltZW8uYm9vdHN0cmFwKCdleGFtcGxlJywgW10pXG4gICAgICAgICAqICAgICAgICAgIC5jb21wb25lbnQoWyd1c2VycycsICgpID0+ICgkY29udGV4dCwgJHJlbmRlcmVyKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAkcmVuZGVyZXIoJzx1bD48bGk+Sm9objwvbGk+PGxpPkFsaWNlPC9saTwvdWw+Jyk7XG4gICAgICAgICAqICAgICAgICAgIH1dKVxuICAgICAgICAgKiAgICAgICAgICAuY29tcG9uZW50KFsnbG9naW5Gb3JtJywgKCkgPT4gKCRjb250ZXh0LCAkcmVuZGVyZXIpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICRyZW5kZXJlcignPGZvcm0+PC9mb3JtPicpO1xuICAgICAgICAgKiAgICAgICAgICB9XSlcbiAgICAgICAgICogICAgICAgICAgLnJ1bihbXG4gICAgICAgICAqICAgICAgICAgICAgICAnJHJvdXRpbmcnLFxuICAgICAgICAgKiAgICAgICAgICAgICAgJ3VzZXJzJyxcbiAgICAgICAgICogICAgICAgICAgICAgICdsb2dpbkZvcm0nLFxuICAgICAgICAgKiAgICAgICAgICAgICAgKCRyb3V0aW5nLCB1c2VycywgbG9naW5Gb3JtKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgJHJvdXRpbmcuc2V0KCcvdXNlcnMnLCB1c2Vycyk7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgJHJvdXRpbmcuc2V0KCcvbG9naW4nLCBsb2dpbkZvcm0pO1xuICAgICAgICAgKiAgICAgICAgICAgICAgfVxuICAgICAgICAgKiAgICAgICAgICBdKTtcbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGAucnVuKClgIGJsb2NrIG5lZWRzIHRvIGhhdmUgYWxsIGNvbXBvbmVudC1pbmplY3RhYmxlcyB5b3Ugd2FudFxuICAgICAgICAgKiB0byBzZXQgYXMgcm91dGUgaGFuZGxlcnMgaW5qZWN0ZWQuIGAuc2V0KClgIHJlcXVpcmVzIHRoZSBhY3R1YWxcbiAgICAgICAgICogaW5qZWN0YWJsZXMgdG8gYmUgcGFzc2VkIGluLCBub3QgdGhlIGluamVjdGFibGVzIG5hbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqICRjb250ZXh0IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHJvdXRlLCBpdCBoYXMgdGhyZWVcbiAgICAgICAgICogYXR0cmlidXRlczpcbiAgICAgICAgICpcbiAgICAgICAgICogLSBgJGNvbnRleHQucGFyYW1zYCB3aWxsIGNvbnRhaW4gYW55IG1hdGNoZWQgc2VnbWVudHMgZnJvbSB0aGUgdXJsLlxuICAgICAgICAgKiAtIGAkY29udGV4dC5xdWVyeWAgd2lsbCBjb250YWluIGRlY29kZWQgcXVlcnkgcGFyYW1ldGVycyBhcyBhXG4gICAgICAgICAqIGtleS12YWx1ZSBoYXNoLiBSZXBlYXRpbmcga2V5cyB3aWxsIGNyZWF0ZSBhbiBhcnJheTpcbiAgICAgICAgICogYC9leGFtcGxlP2E9MSZiPTImYz0zIC8vPT4geyBhOiBbMSwgMiwgM10gfWBcbiAgICAgICAgICogLSBgJGNvbnRleHQudXJsYCByZXByZXNlbnRzIHRoZSBwYXJzZWQgdXJsIGFzIGEga2V5LXZhbHVlIHN0b3JlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBgJGNvbnRleHQudXJsYCBleGFtcGxlIGZvclxuICAgICAgICAgKiBgaHR0cDovL2xvY2FsaG9zdDozMDAwLz9leGFtcGxlLWtleT12YWx1ZWA6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgJGNvbnRleHQudXJsID0ge1xuICAgICAgICAgKiAgICAgICAgICBhbmNob3I6ICcnLFxuICAgICAgICAgKiAgICAgICAgICBhdXRob3JpdHk6ICdsb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgICAqICAgICAgICAgIGRpcmVjdG9yeTogJy8nLFxuICAgICAgICAgKiAgICAgICAgICBmaWxlOiAnJyxcbiAgICAgICAgICogICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAqICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICogICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgKiAgICAgICAgICBwb3J0OiAnMzAwMCcsXG4gICAgICAgICAqICAgICAgICAgIHByb3RvY29sOiAnaHR0cCcsXG4gICAgICAgICAqICAgICAgICAgIHF1ZXJ5OiAnZXhhbXBsZS1rZXk9dmFsdWUnLFxuICAgICAgICAgKiAgICAgICAgICByZWxhdGl2ZTogJy8/ZXhhbXBsZS1rZXk9dmFsdWUnLFxuICAgICAgICAgKiAgICAgICAgICBzb3VyY2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvP2V4YW1wbGUta2V5PXZhbHVlJyxcbiAgICAgICAgICogICAgICAgICAgdXNlcjogJycsXG4gICAgICAgICAqICAgICAgICAgIHVzZXJJbmZvOiAnJ1xuICAgICAgICAgKiAgICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBzZXRcbiAgICAgICAgICogQGZvciAkcm91dGluZ1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcm91dGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RhYmxlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAgICAgICAgICovXG4gICAgICAgICdzZXQnOiBmdW5jdGlvbihyb3V0ZSwgdGFyZ2V0LCBpbmplY3RhYmxlLCBuYW1lKSB7XG4gICAgICAgICAgICBpZiAoIShpbmplY3RhYmxlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSAnVG8gc2V0IGEgcm91dGUsIHlvdSBoYXZlIHRvIHByb3ZpZGUgYW4gaW5qZWN0YWJsZSB0aGF0IGlzIGV4ZWN1dGFibGUgKGkuZS4gaW5zdGFuY2VvZiBGdW5jdGlvbikuIFJvdXRlOiAnICsgcm91dGUgKyAnLCBzdHJpbmdpZmllZCBpbmplY3RhYmxlOiBcIicgKyBTdHJpbmcoXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RhYmxlICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgaWYgKCh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgJiYgKChpbmplY3RhYmxlIGluc3RhbmNlb2YgU3RyaW5nKSB8fCAodHlwZW9mIGluamVjdGFibGUgPT09ICdzdHJpbmcnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnLiBUYXJnZXQgaXMgYSBmdW5jdGlvbiBhbmQgaW5qZWN0YWJsZSBpcyBhIHN0cmluZy4gWW91IG1pZ2h0IGhhdmUgc3dpdGNoZWQgdGhlIHBhcmFtZXRlcnMsIHBsZWFzZSBkb3VibGUtY2hlY2sgdGhhdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcm91dGluZy5hZGQoW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcm91dGUsXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCRjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVuZGVyUmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEFzRE9NTm9kZSA9ICR3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG1ha2VSZW5kZXJlcih0YXJnZXRBc0RPTU5vZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5qZWN0YWJsZS5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJSZXR1cm4gPSBpbmplY3RhYmxlLnJlbmRlcigkY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFzRE9NTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclJldHVybiA9IGluamVjdGFibGUoJGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRBc0RPTU5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihyZW5kZXJSZXR1cm4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSwgeydhcyc6IG5hbWV9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWF0Y2hlcyBgcm91dGVgIGFuZCBleGVjdXRlcyBhbGwgYXNzb2NpYXRlZCBpbmplY3RhYmxlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgcmV0dXJuIHZhbHVlcyBmcm9tIHRoZSBtYXRjaGVkIGluamVjdGFibGVzIGFyZSB0dXJuZWQgaW50byBhXG4gICAgICAgICAqIHByb21pc2UgdXNpbmcge3sjY3Jvc3NMaW5rXG4gICAgICAgICAqIFwiJHEvd2hlbjptZXRob2RcIn19JHEud2hlbigpe3svY3Jvc3NMaW5rfX0sXG4gICAgICAgICAqIGFuZCB0aGVuIGFnZ3JlZ2F0ZWQgd2l0aCB7eyNjcm9zc0xpbmtcbiAgICAgICAgICogXCIkcS9hbGw6bWV0aG9kXCJ9fSRxLmFsbCgpe3svY3Jvc3NMaW5rfX0gYW5kIHRoZW4gcmV0dXJuZWQgYnlcbiAgICAgICAgICogYGdvdG8oKWAuIFRoaXMgYWxsb3dzIGhhbmRsaW5nIGFzeW5jaHJvbm91cyByZXF1ZXN0cyBvbiB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKS5cbiAgICAgICAgICogICAgICAgICAgLmNvbXBvbmVudCgnQmxvZycsIFsnJGh0dHAnLCAoJGh0dHApID0+ICgpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9leGFtcGxlLWFwaS9ibG9ncycpXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgLnRoZW4oKGJsb2dQb3N0cykgPT4ge1xuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLy90dXJuIGJsb2cgcG9zdHMgaW50byBodG1sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAqICAgICAgICAgIH0pXG4gICAgICAgICAqICAgICAgICAgIC5ydW4oWyckcm91dGluZycsICdCbG9nJywgKCRyb3V0aW5nLCBCbG9nKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy9ibG9ncycsIEJsb2cpO1xuICAgICAgICAgKiAgICAgICAgICB9XSlcbiAgICAgICAgICogICAgICAgICAgLnJ1bihbJyRyb3V0aW5nJywgKCRyb3V0aW5nKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAkcm91dGluZy5nb3RvKCcvYmxvZ3MnKS50aGVuKChibG9nSHRtbCkgPT4ge1xuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIC8vIHNhdmUgdG8gY2RuXG4gICAgICAgICAqICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgZ290b1xuICAgICAgICAgKiBAZm9yICRyb3V0aW5nXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByb3V0ZSBSb3V0ZSB0byBnbyB0b1xuICAgICAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZXNcbiAgICAgICAgICogIGZyb20gYWxsIG1hdGNoZWQgcm91dGVzXG4gICAgICAgICAqL1xuICAgICAgICAnZ290byc6IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZ290b1JvdXRlKHJvdXRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ1JvdXRpbmcnOiBSb3V0aW5nXG59OyIsIi8vdmFyIERlcGVuZGVuY3lSZXNvbHZlciA9IHJlcXVpcmUoJy4vRGVwZW5kZW5jeVJlc29sdmVyLmpzJyk7XG52YXIgR3JhcGggPSByZXF1aXJlKCcuL0dyYXBoLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcmV0dXJucyB7eyRuYW1lOiBzdHJpbmcsIHJlZ2lzdGVyOiByZWdpc3RlciwgaGFzQWxsRGVwZW5kZW5jaWVzOlxuICogICAgIGhhc0FsbERlcGVuZGVuY2llcywgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlLCBnZXRJbnN0YW5jZTogZ2V0SW5zdGFuY2V9fVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERlcGVuZGVuY3lNYW5hZ2VyKG5hbWUpIHtcbiAgICB2YXIgX3Byb3ZpZGVycyA9IHt9O1xuICAgIHZhciBfaW5zdGFuY2VzID0ge307XG4gICAgdmFyIF9ncmFwaCA9IG5ldyBHcmFwaCgpO1xuXG4gICAgdmFyIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSB1bmRlZmluZWQ7XG5cbiAgICBmdW5jdGlvbiByZWdpc3RlcihlbnRpdHkpIHtcbiAgICAgICAgaWYgKCFlbnRpdHkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZW50aXR5IHRvIHJlZ2lzdGVyIHdhcyBnaXZlbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbnRpdHkuJG5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW50aXR5IFwiJyArIGVudGl0eS4kbmFtZSArICdcIiBpcyBtaXNzaW5nIHByb3BlcnR5ICRuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWVudGl0eS4kaW5qZWN0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eSBcIicgKyBlbnRpdHkuJG5hbWUgKyAnXCIgaXMgbWlzc2luZyBwcm9wZXJ0eSAkaW5qZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoX3Byb3ZpZGVyc1tlbnRpdHkuJG5hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eSBcIicgKyBlbnRpdHkuJG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgX3Byb3ZpZGVyc1tlbnRpdHkuJG5hbWVdID0gZW50aXR5O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAqIE5hbWUgbWlnaHQndmUgYmVlbiByZWdpc3RlcmVkIGFzIGEgZGVwZW5kZW5jeSBvZiBhbm90aGVyIGVudGl0eVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFfZ3JhcGguaGFzTm9kZVZhbHVlKGVudGl0eS4kbmFtZSkpIHtcbiAgICAgICAgICAgIF9ncmFwaC5hZGQoZW50aXR5LiRuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVudGl0eS4kaW5qZWN0LmZvckVhY2goZnVuY3Rpb24oZGVwZW5kZW5jeSkge1xuICAgICAgICAgICAgaWYgKCFfZ3JhcGguaGFzTm9kZVZhbHVlKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgICAgX2dyYXBoLmFkZChkZXBlbmRlbmN5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX2dyYXBoLmFkZEVkZ2UoZGVwZW5kZW5jeSwgZW50aXR5LiRuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgaWYgKF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb3ZpZGVyc0luamVjdHMgPSBPYmplY3Qua2V5cyhfcHJvdmlkZXJzKS5tYXAoZnVuY3Rpb24ocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Byb3ZpZGVyc1twcm92aWRlck5hbWVdLiRpbmplY3Q7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGUgPSBbXS5jb25jYXQuYXBwbHkoW10sIHByb3ZpZGVyc0luamVjdHMpLmZpbHRlcihmdW5jdGlvbihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiAhQm9vbGVhbihfcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkubGVuZ3RoID09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFudGlhdGUoKSB7XG4gICAgICAgIF9ncmFwaC5nZXROb2Rlc1RvcG9sb2dpY2FsKCkuZm9yRWFjaChmdW5jdGlvbihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm92aWRlciA9IF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXTtcblxuICAgICAgICAgICAgX2luc3RhbmNlc1twcm92aWRlck5hbWVdID0gcHJvdmlkZXIuYXBwbHkocHJvdmlkZXIsIHByb3ZpZGVyLiRpbmplY3QubWFwKGZ1bmN0aW9uKGRlcGVuZGVuY3lOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pbnN0YW5jZXNbZGVwZW5kZW5jeU5hbWVdO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQcm92aWRlcihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRJbnN0YW5jZShwcm92aWRlck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9pbnN0YW5jZXNbcHJvdmlkZXJOYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAkbmFtZTogbmFtZSxcbiAgICAgICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxuICAgICAgICBoYXNBbGxEZXBlbmRlbmNpZXM6IGhhc0FsbERlcGVuZGVuY2llcyxcbiAgICAgICAgZ2V0TWlzc2luZ0RlcGVuZGVuY2llczogZ2V0TWlzc2luZ0RlcGVuZGVuY2llcyxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlLFxuICAgICAgICBnZXRQcm92aWRlcjogZ2V0UHJvdmlkZXIsXG4gICAgICAgIGdldEluc3RhbmNlOiBnZXRJbnN0YW5jZSxcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBwcm92aWRlcnM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoX3Byb3ZpZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5hbWUsIF9wcm92aWRlcnNbbmFtZV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc3RhbmNlczogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhfaW5zdGFuY2VzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmFtZSwgX2luc3RhbmNlc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcmV0dXJucyB7RGVwZW5kZW5jeU1hbmFnZXJ9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBuZXcgRGVwZW5kZW5jeU1hbmFnZXIobmFtZSk7XG59OyIsInZhciBOb2RlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgc3RyaW5ncyBhcmUgYWNjZXB0ZWQgYXMgbm9kZSB2YWx1ZXMnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cblxudmFyIEVkZ2UgPSBmdW5jdGlvbihub2RlRnJvbSwgbm9kZVRvKSB7XG4gICAgdGhpcy5faWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KTtcbiAgICB0aGlzLl9mcm9tID0gbm9kZUZyb207XG4gICAgdGhpcy5fdG8gPSBub2RlVG87XG59O1xuXG52YXIgbWFrZU5vZGVJZGVudGlmaWVyID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG4gICAgcmV0dXJuIG5vZGUxLl9pZCArICc6JyArIG5vZGUyLl9pZDtcbn07XG5cbkVkZ2UucHJvdG90eXBlLmdldE5vZGVJZGVudGlmaWVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG1ha2VOb2RlSWRlbnRpZmllcih0aGlzLl9mcm9tLCB0aGlzLl90byk7XG59O1xuXG4vKipcbiAqIERpcmVjdGVkIGdyYXBoIHRvIG9yZGVyIG5vZGVzIGJ5IGRlcGVuZGVuY2llcy4gT25seSBoYW5kbGVzIHZhbHVlcyB3aG9zZVxuICogLnRvU3RyaW5nKCkgZnVuY3Rpb24gcmV0dXJucyB1bmlxdWUgdmFsdWVzLiBGYXZvcnMgcHJlLWNvbXB1dGVkIGxvb2t1cFxuICogdGFibGVzIG92ZXIgbG9va3VwcyBhdCBzb3J0IHRpbWUuIE1vc3QgbWFjaGluZXMgaGF2ZSBsb3RzIG9mIHJhbSBhbmRcbiAqIGVzcGVjaWFsbHkgb24gbW9iaWxlIHRoZSBDUFUgaXMgbW9yZSByZXN0cmljdGVkLiBVc2luZyBtb3JlIHJhbSBhbmQgbGVzc1xuICogQ1BVIGN5Y2xlcyBpcyBwcmVmZXJhYmxlIGluIHRob3NlIGNvbmRpdGlvbnMsIGFsdGhvdWdoIGl0IHNob3VsZCBoYXJkbHlcbiAqIG1hdHRlciBzaW5jZSBtb3N0IGRlcGVuZGVuY3kgZ3JhcGhzICh3aGljaCB0aGlzIGltcGxlbWVudGF0aW9uIGlzIGZvY3VzZWRcbiAqIG9uKSBzaG91bGRuJ3QgZXhjZWVkIGEgZmV3IGh1bmRyZWQgbm9kZXMuXG4gKlxuICogQHJldHVybnMge3thZGQ6IEZ1bmN0aW9uLCBhZGRFZGdlOiBGdW5jdGlvbiwgaGFzTm9kZVZhbHVlOiBGdW5jdGlvbixcbiAqICAgICBnZXROb2Rlc1RvcG9sb2dpY2FsOiBGdW5jdGlvbn19XG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIEdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9ub2RlcyA9IFtdO1xuICAgIHZhciBfbm9kZXNCeUlkID0ge307XG4gICAgdmFyIF9ub2Rlc0J5VmFsdWUgPSB7fTtcbiAgICB2YXIgX3plcm9JbmdyZWVOb2RlcyA9IFtdO1xuICAgIHZhciBfZWRnZXMgPSBbXTtcbiAgICB2YXIgX2VkZ2VzQnlOb2RlcyA9IHt9O1xuICAgIHZhciBfZWRnZXNCeVRvID0ge307XG4gICAgdmFyIF9lZGdlc0J5RnJvbSA9IHt9O1xuXG4gICAgLypcbiAgICAgKiBUaGUgY3VycmVudCB0b3BvbG9naWNhbCBzb3J0IGltcGxlbWVudGF0aW9uIG11dGF0ZXMgdGhlIGdyYXBoLCBhZnRlclxuICAgICAqIHdoaWNoIGl0J3MgdW51c2FibGUuIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHRvIGNsZWFuIHRoZSBlbnRpcmUgZ3JhcGhcbiAgICAgKiB1cCwgcmVtb3ZpbmcgYW55IGRhbmdsaW5nIGRhdGEgdGhhdCBtaWdodCBiZSBsZWZ0IGFmdGVyIHRoZSBzb3J0LlxuICAgICAqL1xuICAgIHZhciByZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBfbm9kZXMgPSBbXTtcbiAgICAgICAgX25vZGVzQnlJZCA9IHt9O1xuICAgICAgICBfbm9kZXNCeVZhbHVlID0ge307XG4gICAgICAgIF96ZXJvSW5ncmVlTm9kZXMgPSBbXTtcbiAgICAgICAgX2VkZ2VzID0gW107XG4gICAgICAgIF9lZGdlc0J5Tm9kZXMgPSB7fTtcbiAgICAgICAgX2VkZ2VzQnlUbyA9IHt9O1xuICAgICAgICBfZWRnZXNCeUZyb20gPSB7fTtcbiAgICB9O1xuXG4gICAgdmFyIGFkZE5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChfbm9kZXNCeVZhbHVlW25vZGUudmFsdWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0R1cGxpY2F0ZSB2YWx1ZXMgbm90IGFsbG93ZWQuIE5vZGUgd2l0aCB2YWx1ZSBcIicgKyBub2RlLnZhbHVlICsgJ1wiIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBfbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgX25vZGVzQnlJZFtub2RlLl9pZF0gPSBub2RlO1xuICAgICAgICBfbm9kZXNCeVZhbHVlW25vZGUudmFsdWVdID0gbm9kZTtcblxuICAgICAgICBfemVyb0luZ3JlZU5vZGVzLnB1c2gobm9kZSk7XG4gICAgfTtcblxuICAgIHZhciBhZGRFZGdlID0gZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICBpZiAoX2VkZ2VzQnlOb2Rlc1tlZGdlLmdldE5vZGVJZGVudGlmaWVyKCldKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfZWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgX2VkZ2VzQnlOb2Rlc1tlZGdlLmdldE5vZGVJZGVudGlmaWVyKCldID0gZWRnZTtcblxuICAgICAgICBpZiAoIV9lZGdlc0J5RnJvbVtlZGdlLl9mcm9tLl9pZF0pIHtcbiAgICAgICAgICAgIF9lZGdlc0J5RnJvbVtlZGdlLl9mcm9tLl9pZF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBfZWRnZXNCeUZyb21bZWRnZS5fZnJvbS5faWRdLnB1c2goZWRnZSk7XG5cbiAgICAgICAgaWYgKCFfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0pIHtcbiAgICAgICAgICAgIF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXS5wdXNoKGVkZ2UpO1xuXG4gICAgICAgIF96ZXJvSW5ncmVlTm9kZXMgPSBfemVyb0luZ3JlZU5vZGVzLmZpbHRlcihmdW5jdGlvbihleGlzdGluZ05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ05vZGUuX2lkICE9IGVkZ2UuX3RvLl9pZDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgcmVtb3ZlRWRnZSA9IGZ1bmN0aW9uKGVkZ2VUb1JlbW92ZSkge1xuICAgICAgICBfZWRnZXMgPSBfZWRnZXMuZmlsdGVyKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGdlLl9pZCAhPSBlZGdlVG9SZW1vdmUuX2lkO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZWxldGUgX2VkZ2VzQnlOb2Rlc1tlZGdlVG9SZW1vdmUuZ2V0Tm9kZUlkZW50aWZpZXIoKV07XG5cbiAgICAgICAgX2VkZ2VzQnlGcm9tW2VkZ2VUb1JlbW92ZS5fZnJvbS5faWRdID0gX2VkZ2VzQnlGcm9tW2VkZ2VUb1JlbW92ZS5fZnJvbS5faWRdLmZpbHRlcihmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRnZS5faWQgIT0gZWRnZVRvUmVtb3ZlLl9pZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2VkZ2VzQnlUb1tlZGdlVG9SZW1vdmUuX3RvLl9pZF0gPSBfZWRnZXNCeVRvW2VkZ2VUb1JlbW92ZS5fdG8uX2lkXS5maWx0ZXIoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2UuX2lkICE9IGVkZ2VUb1JlbW92ZS5faWQ7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0Tm9kZUJ5VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gX25vZGVzQnlWYWx1ZVt2YWx1ZV07XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGFkZE5vZGUobmV3IE5vZGUodmFsdWUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkRWRnZTogZnVuY3Rpb24oZnJvbVZhbHVlLCB0b1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgZnJvbU5vZGUgPSBnZXROb2RlQnlWYWx1ZShmcm9tVmFsdWUpO1xuICAgICAgICAgICAgdmFyIHRvTm9kZSA9IGdldE5vZGVCeVZhbHVlKHRvVmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlICYmICF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnTmVpdGhlciBmcm9tLSBub3IgdG8tbm9kZSBleGlzdDogJyArIGZyb21WYWx1ZSArICcsICcgKyB0b1ZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0Zyb20tbm9kZSBkb2VzblxcJ3QgZXhpc3Q6ICcgKyBmcm9tVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RvLW5vZGUgZG9lc25cXCd0IGV4aXN0OiAnICsgdG9WYWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWRkRWRnZShuZXcgRWRnZShmcm9tTm9kZSwgdG9Ob2RlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc05vZGVWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBCb29sZWFuKGdldE5vZGVCeVZhbHVlKHZhbHVlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldE5vZGVzVG9wb2xvZ2ljYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNvcnRlZE5vZGVzID0gW107XG5cbiAgICAgICAgICAgIHdoaWxlIChfemVyb0luZ3JlZU5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSBfemVyb0luZ3JlZU5vZGVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHNvcnRlZE5vZGVzLnB1c2goY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIChfZWRnZXNCeUZyb21bY3VycmVudE5vZGUuX2lkXSB8fCBbXSkuc2xpY2UoMCkuZm9yRWFjaChmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUVkZ2UoZWRnZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdIHx8IF9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXS5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfemVyb0luZ3JlZU5vZGVzLnB1c2goZWRnZS5fdG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfZWRnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmdFZGdlcyA9IF9lZGdlcy5tYXAoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJygnICsgZWRnZS5fZnJvbS52YWx1ZSArICcsJyArIGVkZ2UuX3RvLnZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzZXQoKTtcblxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ3ljbGUgZGV0ZWN0ZWQsIHJlbWFpbmluZyBlZGdlczogJyArIHJlbWFpbmluZ0VkZ2VzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzZXQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHNvcnRlZE5vZGVzLm1hcChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyYXBoOyIsInZhciBEZXBlbmRlbmN5TWFuYWdlciA9IHJlcXVpcmUoJy4vRGVwZW5kZW5jeU1hbmFnZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5qZWN0YWJsZXMgPSBEZXBlbmRlbmN5TWFuYWdlcignaW5qZWN0YWJsZXMnKTtcblxuICAgIGZ1bmN0aW9uIGFkZChpbmplY3RhYmxlKSB7XG4gICAgICAgIGluamVjdGFibGVzLnJlZ2lzdGVyKGluamVjdGFibGUpO1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YW50aWF0ZUluamVjdGFibGVzKCkge1xuICAgICAgICBpZiAoIWluamVjdGFibGVzLmhhc0FsbERlcGVuZGVuY2llcygpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGVzIGRvblxcJ3QgZXhpc3Q6ICcgKyBpbmplY3RhYmxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0YWJsZXMuaW5zdGFudGlhdGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgICAgICByZXR1cm4gQm9vbGVhbihpbmplY3RhYmxlcy5nZXRQcm92aWRlcihuYW1lKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVzLmdldEluc3RhbmNlKG5hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVzLmhhc0FsbERlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBhZGQsXG4gICAgICAgIGdldDogZ2V0LFxuICAgICAgICBoYXM6IGhhcyxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlSW5qZWN0YWJsZXMsXG4gICAgICAgIGhhc0FsbERlcGVuZGVuY2llczogaGFzQWxsRGVwZW5kZW5jaWVzLFxuICAgICAgICBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzOiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzXG4gICAgfTtcbn07IiwidmFyIERlcGVuZGVuY3lNYW5hZ2VyID0gcmVxdWlyZSgnLi9EZXBlbmRlbmN5TWFuYWdlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2R1bGVzID0gRGVwZW5kZW5jeU1hbmFnZXIoJ21vZHVsZXMnKTtcblxuICAgIGZ1bmN0aW9uIGFkZChtb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlcy5yZWdpc3Rlcihtb2R1bGUpO1xuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFudGlhdGVNb2R1bGVzKCkge1xuICAgICAgICBtb2R1bGVzLmFsbC5wcm92aWRlcnMoZnVuY3Rpb24oXywgbW9kdWxlKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhlY3V0ZVJ1bigpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgICAgICByZXR1cm4gbW9kdWxlcy5nZXRQcm92aWRlcihuYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBhZGQsXG4gICAgICAgIGdldDogZ2V0LFxuICAgICAgICBpbnN0YW50aWF0ZTogaW5zdGFudGlhdGVNb2R1bGVzLFxuICAgICAgICBoYXNBbGxEZXBlbmRlbmNpZXM6IGhhc0FsbERlcGVuZGVuY2llcyxcbiAgICAgICAgZ2V0TWlzc2luZ0RlcGVuZGVuY2llczogZ2V0TWlzc2luZ0RlcGVuZGVuY2llc1xuICAgIH07XG59OyJdfQ==
