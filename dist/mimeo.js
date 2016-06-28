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
                    }

                    promise.reject(rejectWith);
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

        if (getAttribute(target, 'data-internal') !== null) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGFyc2V1cmkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcm91dGUtcmVjb2duaXplci9kaXN0L3JvdXRlLXJlY29nbml6ZXIuanMiLCJzcmMvTWltZW8uanMiLCJzcmMvTW9kdWxlLmpzIiwic3JjL2J1aWx0aW5zL0dsb2JhbHNXcmFwcGVyLmpzIiwic3JjL2J1aWx0aW5zL0h0dHAuanMiLCJzcmMvYnVpbHRpbnMvUHJvbWlzZS5qcyIsInNyYy9idWlsdGlucy9SZWdpc3Rlci5qcyIsInNyYy9idWlsdGlucy9Sb3V0aW5nLmpzIiwic3JjL2RlcGVuZGVuY2llcy9EZXBlbmRlbmN5TWFuYWdlci5qcyIsInNyYy9kZXBlbmRlbmNpZXMvR3JhcGguanMiLCJzcmMvZGVwZW5kZW5jaWVzL0luamVjdGFibGVzLmpzIiwic3JjL2RlcGVuZGVuY2llcy9Nb2R1bGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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ZDs7QUFFQSxhQUFTLEdBQVQsQ0FBYSxNQUFiLEVBQXFCO0FBQ2pCLGdCQUFRLFFBQVIsQ0FBaUIsTUFBakI7QUFDQSxlQUFPLE1BQVA7QUFDSDs7QUFFRCxhQUFTLGtCQUFULEdBQThCO0FBQzFCLGVBQU8sUUFBUSxrQkFBUixFQUFQO0FBQ0g7O0FBRUQsYUFBUyxrQkFBVCxHQUE4QjtBQUMxQixnQkFBUSxHQUFSLENBQVksU0FBWixDQUFzQixVQUFTLENBQVQsRUFBWSxNQUFaLEVBQW9CO0FBQ3RDLG1CQUFPLFVBQVA7QUFDSCxTQUZEO0FBR0g7O0FBRUQsYUFBUyxHQUFULENBQWEsSUFBYixFQUFtQjtBQUNmLGVBQU8sUUFBUSxXQUFSLENBQW9CLElBQXBCLENBQVA7QUFDSDs7QUFFRCxhQUFTLHNCQUFULEdBQWtDO0FBQzlCLGVBQU8sUUFBUSxzQkFBUixFQUFQO0FBQ0g7O0FBRUQsV0FBTztBQUNILGFBQUssR0FERjtBQUVILGFBQUssR0FGRjtBQUdILHFCQUFhLGtCQUhWO0FBSUgsNEJBQW9CLGtCQUpqQjtBQUtILGdDQUF3QjtBQUxyQixLQUFQO0FBT0gsQ0FqQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBQYXJzZXMgYW4gVVJJXG4gKlxuICogQGF1dGhvciBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT4gKE1JVCBsaWNlbnNlKVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHJlID0gL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoaHR0cHxodHRwc3x3c3x3c3MpOlxcL1xcLyk/KCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oKD86W2EtZjAtOV17MCw0fTopezIsN31bYS1mMC05XXswLDR9fFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS87XG5cbnZhciBwYXJ0cyA9IFtcbiAgICAnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2FuY2hvcidcbl07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2V1cmkoc3RyKSB7XG4gICAgdmFyIHNyYyA9IHN0cixcbiAgICAgICAgYiA9IHN0ci5pbmRleE9mKCdbJyksXG4gICAgICAgIGUgPSBzdHIuaW5kZXhPZignXScpO1xuXG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIGIpICsgc3RyLnN1YnN0cmluZyhiLCBlKS5yZXBsYWNlKC86L2csICc7JykgKyBzdHIuc3Vic3RyaW5nKGUsIHN0ci5sZW5ndGgpO1xuICAgIH1cblxuICAgIHZhciBtID0gcmUuZXhlYyhzdHIgfHwgJycpLFxuICAgICAgICB1cmkgPSB7fSxcbiAgICAgICAgaSA9IDE0O1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcbiAgICB9XG5cbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHVyaS5zb3VyY2UgPSBzcmM7XG4gICAgICAgIHVyaS5ob3N0ID0gdXJpLmhvc3Quc3Vic3RyaW5nKDEsIHVyaS5ob3N0Lmxlbmd0aCAtIDEpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmF1dGhvcml0eSA9IHVyaS5hdXRob3JpdHkucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmlwdjZ1cmkgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB1cmk7XG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJFRhcmdldChwYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSkge1xuICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7XG4gICAgICB0aGlzLmRlbGVnYXRlID0gZGVsZWdhdGU7XG4gICAgfVxuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkVGFyZ2V0LnByb3RvdHlwZSA9IHtcbiAgICAgIHRvOiBmdW5jdGlvbih0YXJnZXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9IHRoaXMuZGVsZWdhdGU7XG5cbiAgICAgICAgaWYgKGRlbGVnYXRlICYmIGRlbGVnYXRlLndpbGxBZGRSb3V0ZSkge1xuICAgICAgICAgIHRhcmdldCA9IGRlbGVnYXRlLndpbGxBZGRSb3V0ZSh0aGlzLm1hdGNoZXIudGFyZ2V0LCB0YXJnZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXRjaGVyLmFkZCh0aGlzLnBhdGgsIHRhcmdldCk7XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrLmxlbmd0aCA9PT0gMCkgeyB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBoYXZlIGFuIGFyZ3VtZW50IGluIHRoZSBmdW5jdGlvbiBwYXNzZWQgdG8gYHRvYFwiKTsgfVxuICAgICAgICAgIHRoaXMubWF0Y2hlci5hZGRDaGlsZCh0aGlzLnBhdGgsIHRhcmdldCwgY2FsbGJhY2ssIHRoaXMuZGVsZWdhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyKHRhcmdldCkge1xuICAgICAgdGhpcy5yb3V0ZXMgPSB7fTtcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fTtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIH1cblxuICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIucHJvdG90eXBlID0ge1xuICAgICAgYWRkOiBmdW5jdGlvbihwYXRoLCBoYW5kbGVyKSB7XG4gICAgICAgIHRoaXMucm91dGVzW3BhdGhdID0gaGFuZGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIGFkZENoaWxkOiBmdW5jdGlvbihwYXRoLCB0YXJnZXQsIGNhbGxiYWNrLCBkZWxlZ2F0ZSkge1xuICAgICAgICB2YXIgbWF0Y2hlciA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyKHRhcmdldCk7XG4gICAgICAgIHRoaXMuY2hpbGRyZW5bcGF0aF0gPSBtYXRjaGVyO1xuXG4gICAgICAgIHZhciBtYXRjaCA9ICQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2gocGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpO1xuXG4gICAgICAgIGlmIChkZWxlZ2F0ZSAmJiBkZWxlZ2F0ZS5jb250ZXh0RW50ZXJlZCkge1xuICAgICAgICAgIGRlbGVnYXRlLmNvbnRleHRFbnRlcmVkKHRhcmdldCwgbWF0Y2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2sobWF0Y2gpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRnZW5lcmF0ZU1hdGNoKHN0YXJ0aW5nUGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihwYXRoLCBuZXN0ZWRDYWxsYmFjaykge1xuICAgICAgICB2YXIgZnVsbFBhdGggPSBzdGFydGluZ1BhdGggKyBwYXRoO1xuXG4gICAgICAgIGlmIChuZXN0ZWRDYWxsYmFjaykge1xuICAgICAgICAgIG5lc3RlZENhbGxiYWNrKCQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2goZnVsbFBhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRUYXJnZXQoc3RhcnRpbmdQYXRoICsgcGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJGFkZFJvdXRlKHJvdXRlQXJyYXksIHBhdGgsIGhhbmRsZXIpIHtcbiAgICAgIHZhciBsZW4gPSAwO1xuICAgICAgZm9yICh2YXIgaT0wLCBsPXJvdXRlQXJyYXkubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICBsZW4gKz0gcm91dGVBcnJheVtpXS5wYXRoLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKGxlbik7XG4gICAgICB2YXIgcm91dGUgPSB7IHBhdGg6IHBhdGgsIGhhbmRsZXI6IGhhbmRsZXIgfTtcbiAgICAgIHJvdXRlQXJyYXkucHVzaChyb3V0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZWFjaFJvdXRlKGJhc2VSb3V0ZSwgbWF0Y2hlciwgY2FsbGJhY2ssIGJpbmRpbmcpIHtcbiAgICAgIHZhciByb3V0ZXMgPSBtYXRjaGVyLnJvdXRlcztcblxuICAgICAgZm9yICh2YXIgcGF0aCBpbiByb3V0ZXMpIHtcbiAgICAgICAgaWYgKHJvdXRlcy5oYXNPd25Qcm9wZXJ0eShwYXRoKSkge1xuICAgICAgICAgIHZhciByb3V0ZUFycmF5ID0gYmFzZVJvdXRlLnNsaWNlKCk7XG4gICAgICAgICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkYWRkUm91dGUocm91dGVBcnJheSwgcGF0aCwgcm91dGVzW3BhdGhdKTtcblxuICAgICAgICAgIGlmIChtYXRjaGVyLmNoaWxkcmVuW3BhdGhdKSB7XG4gICAgICAgICAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRlYWNoUm91dGUocm91dGVBcnJheSwgbWF0Y2hlci5jaGlsZHJlbltwYXRoXSwgY2FsbGJhY2ssIGJpbmRpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGJpbmRpbmcsIHJvdXRlQXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRkZWZhdWx0ID0gZnVuY3Rpb24oY2FsbGJhY2ssIGFkZFJvdXRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBtYXRjaGVyID0gbmV3ICQkcm91dGUkcmVjb2duaXplciRkc2wkJE1hdGNoZXIoKTtcblxuICAgICAgY2FsbGJhY2soJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZ2VuZXJhdGVNYXRjaChcIlwiLCBtYXRjaGVyLCB0aGlzLmRlbGVnYXRlKSk7XG5cbiAgICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJGVhY2hSb3V0ZShbXSwgbWF0Y2hlciwgZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgaWYgKGFkZFJvdXRlQ2FsbGJhY2spIHsgYWRkUm91dGVDYWxsYmFjayh0aGlzLCByb3V0ZSk7IH1cbiAgICAgICAgZWxzZSB7IHRoaXMuYWRkKHJvdXRlKTsgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfTtcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJHNwZWNpYWxzID0gW1xuICAgICAgJy8nLCAnLicsICcqJywgJysnLCAnPycsICd8JyxcbiAgICAgICcoJywgJyknLCAnWycsICddJywgJ3snLCAnfScsICdcXFxcJ1xuICAgIF07XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRlc2NhcGVSZWdleCA9IG5ldyBSZWdFeHAoJyhcXFxcJyArICQkcm91dGUkcmVjb2duaXplciQkc3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnKTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkaXNBcnJheSh0ZXN0KSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRlc3QpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgfVxuXG4gICAgLy8gQSBTZWdtZW50IHJlcHJlc2VudHMgYSBzZWdtZW50IGluIHRoZSBvcmlnaW5hbCByb3V0ZSBkZXNjcmlwdGlvbi5cbiAgICAvLyBFYWNoIFNlZ21lbnQgdHlwZSBwcm92aWRlcyBhbiBgZWFjaENoYXJgIGFuZCBgcmVnZXhgIG1ldGhvZC5cbiAgICAvL1xuICAgIC8vIFRoZSBgZWFjaENoYXJgIG1ldGhvZCBpbnZva2VzIHRoZSBjYWxsYmFjayB3aXRoIG9uZSBvciBtb3JlIGNoYXJhY3RlclxuICAgIC8vIHNwZWNpZmljYXRpb25zLiBBIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGNvbnN1bWVzIG9uZSBvciBtb3JlIGlucHV0XG4gICAgLy8gY2hhcmFjdGVycy5cbiAgICAvL1xuICAgIC8vIFRoZSBgcmVnZXhgIG1ldGhvZCByZXR1cm5zIGEgcmVnZXggZnJhZ21lbnQgZm9yIHRoZSBzZWdtZW50LiBJZiB0aGVcbiAgICAvLyBzZWdtZW50IGlzIGEgZHluYW1pYyBvZiBzdGFyIHNlZ21lbnQsIHRoZSByZWdleCBmcmFnbWVudCBhbHNvIGluY2x1ZGVzXG4gICAgLy8gYSBjYXB0dXJlLlxuICAgIC8vXG4gICAgLy8gQSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBjb250YWluczpcbiAgICAvL1xuICAgIC8vICogYHZhbGlkQ2hhcnNgOiBhIFN0cmluZyB3aXRoIGEgbGlzdCBvZiBhbGwgdmFsaWQgY2hhcmFjdGVycywgb3JcbiAgICAvLyAqIGBpbnZhbGlkQ2hhcnNgOiBhIFN0cmluZyB3aXRoIGEgbGlzdCBvZiBhbGwgaW52YWxpZCBjaGFyYWN0ZXJzXG4gICAgLy8gKiBgcmVwZWF0YDogdHJ1ZSBpZiB0aGUgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gY2FuIHJlcGVhdFxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0aWNTZWdtZW50KHN0cmluZykgeyB0aGlzLnN0cmluZyA9IHN0cmluZzsgfVxuICAgICQkcm91dGUkcmVjb2duaXplciQkU3RhdGljU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IHRoaXMuc3RyaW5nLCBjaDtcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9c3RyaW5nLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBjaCA9IHN0cmluZy5jaGFyQXQoaSk7XG4gICAgICAgICAgY2FsbGJhY2soeyB2YWxpZENoYXJzOiBjaCB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVnZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmcucmVwbGFjZSgkJHJvdXRlJHJlY29nbml6ZXIkJGVzY2FwZVJlZ2V4LCAnXFxcXCQxJyk7XG4gICAgICB9LFxuXG4gICAgICBnZW5lcmF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmluZztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCREeW5hbWljU2VnbWVudChuYW1lKSB7IHRoaXMubmFtZSA9IG5hbWU7IH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJER5bmFtaWNTZWdtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGVhY2hDaGFyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayh7IGludmFsaWRDaGFyczogXCIvXCIsIHJlcGVhdDogdHJ1ZSB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiKFteL10rKVwiO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gcGFyYW1zW3RoaXMubmFtZV07XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkU3RhclNlZ21lbnQobmFtZSkgeyB0aGlzLm5hbWUgPSBuYW1lOyB9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGFyU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soeyBpbnZhbGlkQ2hhcnM6IFwiXCIsIHJlcGVhdDogdHJ1ZSB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiKC4rKVwiO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICByZXR1cm4gcGFyYW1zW3RoaXMubmFtZV07XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQoKSB7fVxuICAgICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQucHJvdG90eXBlID0ge1xuICAgICAgZWFjaENoYXI6IGZ1bmN0aW9uKCkge30sXG4gICAgICByZWdleDogZnVuY3Rpb24oKSB7IHJldHVybiBcIlwiOyB9LFxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcIjsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJHBhcnNlKHJvdXRlLCBuYW1lcywgc3BlY2lmaWNpdHkpIHtcbiAgICAgIC8vIG5vcm1hbGl6ZSByb3V0ZSBhcyBub3Qgc3RhcnRpbmcgd2l0aCBhIFwiL1wiLiBSZWNvZ25pdGlvbiB3aWxsXG4gICAgICAvLyBhbHNvIG5vcm1hbGl6ZS5cbiAgICAgIGlmIChyb3V0ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7IHJvdXRlID0gcm91dGUuc3Vic3RyKDEpOyB9XG5cbiAgICAgIHZhciBzZWdtZW50cyA9IHJvdXRlLnNwbGl0KFwiL1wiKSwgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAvLyBBIHJvdXRlcyBoYXMgc3BlY2lmaWNpdHkgZGV0ZXJtaW5lZCBieSB0aGUgb3JkZXIgdGhhdCBpdHMgZGlmZmVyZW50IHNlZ21lbnRzXG4gICAgICAvLyBhcHBlYXIgaW4uIFRoaXMgc3lzdGVtIG1pcnJvcnMgaG93IHRoZSBtYWduaXR1ZGUgb2YgbnVtYmVycyB3cml0dGVuIGFzIHN0cmluZ3NcbiAgICAgIC8vIHdvcmtzLlxuICAgICAgLy8gQ29uc2lkZXIgYSBudW1iZXIgd3JpdHRlbiBhczogXCJhYmNcIi4gQW4gZXhhbXBsZSB3b3VsZCBiZSBcIjIwMFwiLiBBbnkgb3RoZXIgbnVtYmVyIHdyaXR0ZW5cbiAgICAgIC8vIFwieHl6XCIgd2lsbCBiZSBzbWFsbGVyIHRoYW4gXCJhYmNcIiBzbyBsb25nIGFzIGBhID4gemAuIEZvciBpbnN0YW5jZSwgXCIxOTlcIiBpcyBzbWFsbGVyXG4gICAgICAvLyB0aGVuIFwiMjAwXCIsIGV2ZW4gdGhvdWdoIFwieVwiIGFuZCBcInpcIiAod2hpY2ggYXJlIGJvdGggOSkgYXJlIGxhcmdlciB0aGFuIFwiMFwiICh0aGUgdmFsdWVcbiAgICAgIC8vIG9mIChgYmAgYW5kIGBjYCkuIFRoaXMgaXMgYmVjYXVzZSB0aGUgbGVhZGluZyBzeW1ib2wsIFwiMlwiLCBpcyBsYXJnZXIgdGhhbiB0aGUgb3RoZXJcbiAgICAgIC8vIGxlYWRpbmcgc3ltYm9sLCBcIjFcIi5cbiAgICAgIC8vIFRoZSBydWxlIGlzIHRoYXQgc3ltYm9scyB0byB0aGUgbGVmdCBjYXJyeSBtb3JlIHdlaWdodCB0aGFuIHN5bWJvbHMgdG8gdGhlIHJpZ2h0XG4gICAgICAvLyB3aGVuIGEgbnVtYmVyIGlzIHdyaXR0ZW4gb3V0IGFzIGEgc3RyaW5nLiBJbiB0aGUgYWJvdmUgc3RyaW5ncywgdGhlIGxlYWRpbmcgZGlnaXRcbiAgICAgIC8vIHJlcHJlc2VudHMgaG93IG1hbnkgMTAwJ3MgYXJlIGluIHRoZSBudW1iZXIsIGFuZCBpdCBjYXJyaWVzIG1vcmUgd2VpZ2h0IHRoYW4gdGhlIG1pZGRsZVxuICAgICAgLy8gbnVtYmVyIHdoaWNoIHJlcHJlc2VudHMgaG93IG1hbnkgMTAncyBhcmUgaW4gdGhlIG51bWJlci5cbiAgICAgIC8vIFRoaXMgc3lzdGVtIG9mIG51bWJlciBtYWduaXR1ZGUgd29ya3Mgd2VsbCBmb3Igcm91dGUgc3BlY2lmaWNpdHksIHRvby4gQSByb3V0ZSB3cml0dGVuIGFzXG4gICAgICAvLyBgYS9iL2NgIHdpbGwgYmUgbW9yZSBzcGVjaWZpYyB0aGFuIGB4L3kvemAgYXMgbG9uZyBhcyBgYWAgaXMgbW9yZSBzcGVjaWZpYyB0aGFuXG4gICAgICAvLyBgeGAsIGlycmVzcGVjdGl2ZSBvZiB0aGUgb3RoZXIgcGFydHMuXG4gICAgICAvLyBCZWNhdXNlIG9mIHRoaXMgc2ltaWxhcml0eSwgd2UgYXNzaWduIGVhY2ggdHlwZSBvZiBzZWdtZW50IGEgbnVtYmVyIHZhbHVlIHdyaXR0ZW4gYXMgYVxuICAgICAgLy8gc3RyaW5nLiBXZSBjYW4gZmluZCB0aGUgc3BlY2lmaWNpdHkgb2YgY29tcG91bmQgcm91dGVzIGJ5IGNvbmNhdGVuYXRpbmcgdGhlc2Ugc3RyaW5nc1xuICAgICAgLy8gdG9nZXRoZXIsIGZyb20gbGVmdCB0byByaWdodC4gQWZ0ZXIgd2UgaGF2ZSBsb29wZWQgdGhyb3VnaCBhbGwgb2YgdGhlIHNlZ21lbnRzLFxuICAgICAgLy8gd2UgY29udmVydCB0aGUgc3RyaW5nIHRvIGEgbnVtYmVyLlxuICAgICAgc3BlY2lmaWNpdHkudmFsID0gJyc7XG5cbiAgICAgIGZvciAodmFyIGk9MCwgbD1zZWdtZW50cy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbaV0sIG1hdGNoO1xuXG4gICAgICAgIGlmIChtYXRjaCA9IHNlZ21lbnQubWF0Y2goL146KFteXFwvXSspJC8pKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJER5bmFtaWNTZWdtZW50KG1hdGNoWzFdKSk7XG4gICAgICAgICAgbmFtZXMucHVzaChtYXRjaFsxXSk7XG4gICAgICAgICAgc3BlY2lmaWNpdHkudmFsICs9ICczJztcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaCA9IHNlZ21lbnQubWF0Y2goL15cXCooW15cXC9dKykkLykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobmV3ICQkcm91dGUkcmVjb2duaXplciQkU3RhclNlZ21lbnQobWF0Y2hbMV0pKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzInO1xuICAgICAgICAgIG5hbWVzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICB9IGVsc2UgaWYoc2VnbWVudCA9PT0gXCJcIikge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudCgpKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0aWNTZWdtZW50KHNlZ21lbnQpKTtcbiAgICAgICAgICBzcGVjaWZpY2l0eS52YWwgKz0gJzQnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNwZWNpZmljaXR5LnZhbCA9ICtzcGVjaWZpY2l0eS52YWw7XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIEEgU3RhdGUgaGFzIGEgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gYW5kIChgY2hhclNwZWNgKSBhbmQgYSBsaXN0IG9mIHBvc3NpYmxlXG4gICAgLy8gc3Vic2VxdWVudCBzdGF0ZXMgKGBuZXh0U3RhdGVzYCkuXG4gICAgLy9cbiAgICAvLyBJZiBhIFN0YXRlIGlzIGFuIGFjY2VwdGluZyBzdGF0ZSwgaXQgd2lsbCBhbHNvIGhhdmUgc2V2ZXJhbCBhZGRpdGlvbmFsXG4gICAgLy8gcHJvcGVydGllczpcbiAgICAvL1xuICAgIC8vICogYHJlZ2V4YDogQSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBpcyB1c2VkIHRvIGV4dHJhY3QgcGFyYW1ldGVycyBmcm9tIHBhdGhzXG4gICAgLy8gICB0aGF0IHJlYWNoZWQgdGhpcyBhY2NlcHRpbmcgc3RhdGUuXG4gICAgLy8gKiBgaGFuZGxlcnNgOiBJbmZvcm1hdGlvbiBvbiBob3cgdG8gY29udmVydCB0aGUgbGlzdCBvZiBjYXB0dXJlcyBpbnRvIGNhbGxzXG4gICAgLy8gICB0byByZWdpc3RlcmVkIGhhbmRsZXJzIHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzXG4gICAgLy8gKiBgdHlwZXNgOiBIb3cgbWFueSBzdGF0aWMsIGR5bmFtaWMgb3Igc3RhciBzZWdtZW50cyBpbiB0aGlzIHJvdXRlLiBVc2VkIHRvXG4gICAgLy8gICBkZWNpZGUgd2hpY2ggcm91dGUgdG8gdXNlIGlmIG11bHRpcGxlIHJlZ2lzdGVyZWQgcm91dGVzIG1hdGNoIGEgcGF0aC5cbiAgICAvL1xuICAgIC8vIEN1cnJlbnRseSwgU3RhdGUgaXMgaW1wbGVtZW50ZWQgbmFpdmVseSBieSBsb29waW5nIG92ZXIgYG5leHRTdGF0ZXNgIGFuZFxuICAgIC8vIGNvbXBhcmluZyBhIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGFnYWluc3QgYSBjaGFyYWN0ZXIuIEEgbW9yZSBlZmZpY2llbnRcbiAgICAvLyBpbXBsZW1lbnRhdGlvbiB3b3VsZCB1c2UgYSBoYXNoIG9mIGtleXMgcG9pbnRpbmcgYXQgb25lIG9yIG1vcmUgbmV4dCBzdGF0ZXMuXG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlKGNoYXJTcGVjKSB7XG4gICAgICB0aGlzLmNoYXJTcGVjID0gY2hhclNwZWM7XG4gICAgICB0aGlzLm5leHRTdGF0ZXMgPSBbXTtcbiAgICB9XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRlLnByb3RvdHlwZSA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24oY2hhclNwZWMpIHtcbiAgICAgICAgdmFyIG5leHRTdGF0ZXMgPSB0aGlzLm5leHRTdGF0ZXM7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPW5leHRTdGF0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHZhciBjaGlsZCA9IG5leHRTdGF0ZXNbaV07XG5cbiAgICAgICAgICB2YXIgaXNFcXVhbCA9IGNoaWxkLmNoYXJTcGVjLnZhbGlkQ2hhcnMgPT09IGNoYXJTcGVjLnZhbGlkQ2hhcnM7XG4gICAgICAgICAgaXNFcXVhbCA9IGlzRXF1YWwgJiYgY2hpbGQuY2hhclNwZWMuaW52YWxpZENoYXJzID09PSBjaGFyU3BlYy5pbnZhbGlkQ2hhcnM7XG5cbiAgICAgICAgICBpZiAoaXNFcXVhbCkgeyByZXR1cm4gY2hpbGQ7IH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcHV0OiBmdW5jdGlvbihjaGFyU3BlYykge1xuICAgICAgICB2YXIgc3RhdGU7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGFscmVhZHkgZXhpc3RzIGluIGEgY2hpbGQgb2YgdGhlIGN1cnJlbnRcbiAgICAgICAgLy8gc3RhdGUsIGp1c3QgcmV0dXJuIHRoYXQgc3RhdGUuXG4gICAgICAgIGlmIChzdGF0ZSA9IHRoaXMuZ2V0KGNoYXJTcGVjKSkgeyByZXR1cm4gc3RhdGU7IH1cblxuICAgICAgICAvLyBNYWtlIGEgbmV3IHN0YXRlIGZvciB0aGUgY2hhcmFjdGVyIHNwZWNcbiAgICAgICAgc3RhdGUgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZShjaGFyU3BlYyk7XG5cbiAgICAgICAgLy8gSW5zZXJ0IHRoZSBuZXcgc3RhdGUgYXMgYSBjaGlsZCBvZiB0aGUgY3VycmVudCBzdGF0ZVxuICAgICAgICB0aGlzLm5leHRTdGF0ZXMucHVzaChzdGF0ZSk7XG5cbiAgICAgICAgLy8gSWYgdGhpcyBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiByZXBlYXRzLCBpbnNlcnQgdGhlIG5ldyBzdGF0ZSBhcyBhIGNoaWxkXG4gICAgICAgIC8vIG9mIGl0c2VsZi4gTm90ZSB0aGF0IHRoaXMgd2lsbCBub3QgdHJpZ2dlciBhbiBpbmZpbml0ZSBsb29wIGJlY2F1c2UgZWFjaFxuICAgICAgICAvLyB0cmFuc2l0aW9uIGR1cmluZyByZWNvZ25pdGlvbiBjb25zdW1lcyBhIGNoYXJhY3Rlci5cbiAgICAgICAgaWYgKGNoYXJTcGVjLnJlcGVhdCkge1xuICAgICAgICAgIHN0YXRlLm5leHRTdGF0ZXMucHVzaChzdGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG5ldyBzdGF0ZVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9LFxuXG4gICAgICAvLyBGaW5kIGEgbGlzdCBvZiBjaGlsZCBzdGF0ZXMgbWF0Y2hpbmcgdGhlIG5leHQgY2hhcmFjdGVyXG4gICAgICBtYXRjaDogZnVuY3Rpb24oY2gpIHtcbiAgICAgICAgLy8gREVCVUcgXCJQcm9jZXNzaW5nIGBcIiArIGNoICsgXCJgOlwiXG4gICAgICAgIHZhciBuZXh0U3RhdGVzID0gdGhpcy5uZXh0U3RhdGVzLFxuICAgICAgICAgICAgY2hpbGQsIGNoYXJTcGVjLCBjaGFycztcblxuICAgICAgICAvLyBERUJVRyBcIiAgXCIgKyBkZWJ1Z1N0YXRlKHRoaXMpXG4gICAgICAgIHZhciByZXR1cm5lZCA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1uZXh0U3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBjaGlsZCA9IG5leHRTdGF0ZXNbaV07XG5cbiAgICAgICAgICBjaGFyU3BlYyA9IGNoaWxkLmNoYXJTcGVjO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiAoY2hhcnMgPSBjaGFyU3BlYy52YWxpZENoYXJzKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChjaGFycy5pbmRleE9mKGNoKSAhPT0gLTEpIHsgcmV0dXJuZWQucHVzaChjaGlsZCk7IH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoY2hhcnMgPSBjaGFyU3BlYy5pbnZhbGlkQ2hhcnMpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGNoYXJzLmluZGV4T2YoY2gpID09PSAtMSkgeyByZXR1cm5lZC5wdXNoKGNoaWxkKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5lZDtcbiAgICAgIH1cblxuICAgICAgLyoqIElGIERFQlVHXG4gICAgICAsIGRlYnVnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNoYXJTcGVjID0gdGhpcy5jaGFyU3BlYyxcbiAgICAgICAgICAgIGRlYnVnID0gXCJbXCIsXG4gICAgICAgICAgICBjaGFycyA9IGNoYXJTcGVjLnZhbGlkQ2hhcnMgfHwgY2hhclNwZWMuaW52YWxpZENoYXJzO1xuXG4gICAgICAgIGlmIChjaGFyU3BlYy5pbnZhbGlkQ2hhcnMpIHsgZGVidWcgKz0gXCJeXCI7IH1cbiAgICAgICAgZGVidWcgKz0gY2hhcnM7XG4gICAgICAgIGRlYnVnICs9IFwiXVwiO1xuXG4gICAgICAgIGlmIChjaGFyU3BlYy5yZXBlYXQpIHsgZGVidWcgKz0gXCIrXCI7IH1cblxuICAgICAgICByZXR1cm4gZGVidWc7XG4gICAgICB9XG4gICAgICBFTkQgSUYgKiovXG4gICAgfTtcblxuICAgIC8qKiBJRiBERUJVR1xuICAgIGZ1bmN0aW9uIGRlYnVnKGxvZykge1xuICAgICAgY29uc29sZS5sb2cobG9nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWJ1Z1N0YXRlKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubmV4dFN0YXRlcy5tYXAoZnVuY3Rpb24obikge1xuICAgICAgICBpZiAobi5uZXh0U3RhdGVzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gXCIoIFwiICsgbi5kZWJ1ZygpICsgXCIgW2FjY2VwdGluZ10gKVwiOyB9XG4gICAgICAgIHJldHVybiBcIiggXCIgKyBuLmRlYnVnKCkgKyBcIiA8dGhlbj4gXCIgKyBuLm5leHRTdGF0ZXMubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMuZGVidWcoKSB9KS5qb2luKFwiIG9yIFwiKSArIFwiIClcIjtcbiAgICAgIH0pLmpvaW4oXCIsIFwiKVxuICAgIH1cbiAgICBFTkQgSUYgKiovXG5cbiAgICAvLyBTb3J0IHRoZSByb3V0ZXMgYnkgc3BlY2lmaWNpdHlcbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJHNvcnRTb2x1dGlvbnMoc3RhdGVzKSB7XG4gICAgICByZXR1cm4gc3RhdGVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gYi5zcGVjaWZpY2l0eS52YWwgLSBhLnNwZWNpZmljaXR5LnZhbDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkcmVjb2duaXplQ2hhcihzdGF0ZXMsIGNoKSB7XG4gICAgICB2YXIgbmV4dFN0YXRlcyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9c3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVzW2ldO1xuXG4gICAgICAgIG5leHRTdGF0ZXMgPSBuZXh0U3RhdGVzLmNvbmNhdChzdGF0ZS5tYXRjaChjaCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV4dFN0YXRlcztcbiAgICB9XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRvQ3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbihwcm90bykge1xuICAgICAgZnVuY3Rpb24gRigpIHt9XG4gICAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgICAgcmV0dXJuIG5ldyBGKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkUmVjb2duaXplUmVzdWx0cyhxdWVyeVBhcmFtcykge1xuICAgICAgdGhpcy5xdWVyeVBhcmFtcyA9IHF1ZXJ5UGFyYW1zIHx8IHt9O1xuICAgIH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFJlY29nbml6ZVJlc3VsdHMucHJvdG90eXBlID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRvQ3JlYXRlKHtcbiAgICAgIHNwbGljZTogQXJyYXkucHJvdG90eXBlLnNwbGljZSxcbiAgICAgIHNsaWNlOiAgQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgcHVzaDogICBBcnJheS5wcm90b3R5cGUucHVzaCxcbiAgICAgIGxlbmd0aDogMCxcbiAgICAgIHF1ZXJ5UGFyYW1zOiBudWxsXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJGZpbmRIYW5kbGVyKHN0YXRlLCBwYXRoLCBxdWVyeVBhcmFtcykge1xuICAgICAgdmFyIGhhbmRsZXJzID0gc3RhdGUuaGFuZGxlcnMsIHJlZ2V4ID0gc3RhdGUucmVnZXg7XG4gICAgICB2YXIgY2FwdHVyZXMgPSBwYXRoLm1hdGNoKHJlZ2V4KSwgY3VycmVudENhcHR1cmUgPSAxO1xuICAgICAgdmFyIHJlc3VsdCA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFJlY29nbml6ZVJlc3VsdHMocXVlcnlQYXJhbXMpO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9aGFuZGxlcnMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IGhhbmRsZXJzW2ldLCBuYW1lcyA9IGhhbmRsZXIubmFtZXMsIHBhcmFtcyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGo9MCwgbT1uYW1lcy5sZW5ndGg7IGo8bTsgaisrKSB7XG4gICAgICAgICAgcGFyYW1zW25hbWVzW2pdXSA9IGNhcHR1cmVzW2N1cnJlbnRDYXB0dXJlKytdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0LnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLmhhbmRsZXIsIHBhcmFtczogcGFyYW1zLCBpc0R5bmFtaWM6ICEhbmFtZXMubGVuZ3RoIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkYWRkU2VnbWVudChjdXJyZW50U3RhdGUsIHNlZ21lbnQpIHtcbiAgICAgIHNlZ21lbnQuZWFjaENoYXIoZnVuY3Rpb24oY2gpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIGN1cnJlbnRTdGF0ZSA9IGN1cnJlbnRTdGF0ZS5wdXQoY2gpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjdXJyZW50U3RhdGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWNvZGVRdWVyeVBhcmFtUGFydChwYXJ0KSB7XG4gICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNDAxL2ludGVyYWN0L2Zvcm1zLmh0bWwjaC0xNy4xMy40LjFcbiAgICAgIHBhcnQgPSBwYXJ0LnJlcGxhY2UoL1xcKy9nbSwgJyUyMCcpO1xuICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXJ0KTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbWFpbiBpbnRlcmZhY2VcblxuICAgIHZhciAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yb290U3RhdGUgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZSgpO1xuICAgICAgdGhpcy5uYW1lcyA9IHt9O1xuICAgIH07XG5cblxuICAgICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyLnByb3RvdHlwZSA9IHtcbiAgICAgIGFkZDogZnVuY3Rpb24ocm91dGVzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBjdXJyZW50U3RhdGUgPSB0aGlzLnJvb3RTdGF0ZSwgcmVnZXggPSBcIl5cIixcbiAgICAgICAgICAgIHNwZWNpZmljaXR5ID0ge30sXG4gICAgICAgICAgICBoYW5kbGVycyA9IFtdLCBhbGxTZWdtZW50cyA9IFtdLCBuYW1lO1xuXG4gICAgICAgIHZhciBpc0VtcHR5ID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9cm91dGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbaV0sIG5hbWVzID0gW107XG5cbiAgICAgICAgICB2YXIgc2VnbWVudHMgPSAkJHJvdXRlJHJlY29nbml6ZXIkJHBhcnNlKHJvdXRlLnBhdGgsIG5hbWVzLCBzcGVjaWZpY2l0eSk7XG5cbiAgICAgICAgICBhbGxTZWdtZW50cyA9IGFsbFNlZ21lbnRzLmNvbmNhdChzZWdtZW50cyk7XG5cbiAgICAgICAgICBmb3IgKHZhciBqPTAsIG09c2VnbWVudHMubGVuZ3RoOyBqPG07IGorKykge1xuICAgICAgICAgICAgdmFyIHNlZ21lbnQgPSBzZWdtZW50c1tqXTtcblxuICAgICAgICAgICAgaWYgKHNlZ21lbnQgaW5zdGFuY2VvZiAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50KSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgIGlzRW1wdHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gQWRkIGEgXCIvXCIgZm9yIHRoZSBuZXcgc2VnbWVudFxuICAgICAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFN0YXRlLnB1dCh7IHZhbGlkQ2hhcnM6IFwiL1wiIH0pO1xuICAgICAgICAgICAgcmVnZXggKz0gXCIvXCI7XG5cbiAgICAgICAgICAgIC8vIEFkZCBhIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzZWdtZW50IHRvIHRoZSBORkEgYW5kIHJlZ2V4XG4gICAgICAgICAgICBjdXJyZW50U3RhdGUgPSAkJHJvdXRlJHJlY29nbml6ZXIkJGFkZFNlZ21lbnQoY3VycmVudFN0YXRlLCBzZWdtZW50KTtcbiAgICAgICAgICAgIHJlZ2V4ICs9IHNlZ21lbnQucmVnZXgoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgaGFuZGxlciA9IHsgaGFuZGxlcjogcm91dGUuaGFuZGxlciwgbmFtZXM6IG5hbWVzIH07XG4gICAgICAgICAgaGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0VtcHR5KSB7XG4gICAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFN0YXRlLnB1dCh7IHZhbGlkQ2hhcnM6IFwiL1wiIH0pO1xuICAgICAgICAgIHJlZ2V4ICs9IFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFN0YXRlLmhhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgICAgIGN1cnJlbnRTdGF0ZS5yZWdleCA9IG5ldyBSZWdFeHAocmVnZXggKyBcIiRcIik7XG4gICAgICAgIGN1cnJlbnRTdGF0ZS5zcGVjaWZpY2l0eSA9IHNwZWNpZmljaXR5O1xuXG4gICAgICAgIGlmIChuYW1lID0gb3B0aW9ucyAmJiBvcHRpb25zLmFzKSB7XG4gICAgICAgICAgdGhpcy5uYW1lc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIHNlZ21lbnRzOiBhbGxTZWdtZW50cyxcbiAgICAgICAgICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGhhbmRsZXJzRm9yOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciByb3V0ZSA9IHRoaXMubmFtZXNbbmFtZV0sIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAoIXJvdXRlKSB7IHRocm93IG5ldyBFcnJvcihcIlRoZXJlIGlzIG5vIHJvdXRlIG5hbWVkIFwiICsgbmFtZSk7IH1cblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9cm91dGUuaGFuZGxlcnMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJvdXRlLmhhbmRsZXJzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuXG4gICAgICBoYXNSb3V0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gISF0aGlzLm5hbWVzW25hbWVdO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKG5hbWUsIHBhcmFtcykge1xuICAgICAgICB2YXIgcm91dGUgPSB0aGlzLm5hbWVzW25hbWVdLCBvdXRwdXQgPSBcIlwiO1xuICAgICAgICBpZiAoIXJvdXRlKSB7IHRocm93IG5ldyBFcnJvcihcIlRoZXJlIGlzIG5vIHJvdXRlIG5hbWVkIFwiICsgbmFtZSk7IH1cblxuICAgICAgICB2YXIgc2VnbWVudHMgPSByb3V0ZS5zZWdtZW50cztcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9c2VnbWVudHMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbaV07XG5cbiAgICAgICAgICBpZiAoc2VnbWVudCBpbnN0YW5jZW9mICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgIG91dHB1dCArPSBcIi9cIjtcbiAgICAgICAgICBvdXRwdXQgKz0gc2VnbWVudC5nZW5lcmF0ZShwYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG91dHB1dC5jaGFyQXQoMCkgIT09ICcvJykgeyBvdXRwdXQgPSAnLycgKyBvdXRwdXQ7IH1cblxuICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5xdWVyeVBhcmFtcykge1xuICAgICAgICAgIG91dHB1dCArPSB0aGlzLmdlbmVyYXRlUXVlcnlTdHJpbmcocGFyYW1zLnF1ZXJ5UGFyYW1zLCByb3V0ZS5oYW5kbGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGVRdWVyeVN0cmluZzogZnVuY3Rpb24ocGFyYW1zLCBoYW5kbGVycykge1xuICAgICAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5zb3J0KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJhbXNba2V5XTtcbiAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBwYWlyID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSk7XG4gICAgICAgICAgaWYgKCQkcm91dGUkcmVjb2duaXplciQkaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBqIDwgbDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBhcnJheVBhaXIgPSBrZXkgKyAnW10nICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKTtcbiAgICAgICAgICAgICAgcGFpcnMucHVzaChhcnJheVBhaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYWlyICs9IFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgIHBhaXJzLnB1c2gocGFpcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhaXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJyc7IH1cblxuICAgICAgICByZXR1cm4gXCI/XCIgKyBwYWlycy5qb2luKFwiJlwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHBhcnNlUXVlcnlTdHJpbmc6IGZ1bmN0aW9uKHF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgIHZhciBwYWlycyA9IHF1ZXJ5U3RyaW5nLnNwbGl0KFwiJlwiKSwgcXVlcnlQYXJhbXMgPSB7fTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBwYWlycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBwYWlyICAgICAgPSBwYWlyc1tpXS5zcGxpdCgnPScpLFxuICAgICAgICAgICAgICBrZXkgICAgICAgPSAkJHJvdXRlJHJlY29nbml6ZXIkJGRlY29kZVF1ZXJ5UGFyYW1QYXJ0KHBhaXJbMF0pLFxuICAgICAgICAgICAgICBrZXlMZW5ndGggPSBrZXkubGVuZ3RoLFxuICAgICAgICAgICAgICBpc0FycmF5ID0gZmFsc2UsXG4gICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgIGlmIChwYWlyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdmFsdWUgPSAndHJ1ZSc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vSGFuZGxlIGFycmF5c1xuICAgICAgICAgICAgaWYgKGtleUxlbmd0aCA+IDIgJiYga2V5LnNsaWNlKGtleUxlbmd0aCAtMikgPT09ICdbXScpIHtcbiAgICAgICAgICAgICAgaXNBcnJheSA9IHRydWU7XG4gICAgICAgICAgICAgIGtleSA9IGtleS5zbGljZSgwLCBrZXlMZW5ndGggLSAyKTtcbiAgICAgICAgICAgICAgaWYoIXF1ZXJ5UGFyYW1zW2tleV0pIHtcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtc1trZXldID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gcGFpclsxXSA/ICQkcm91dGUkcmVjb2duaXplciQkZGVjb2RlUXVlcnlQYXJhbVBhcnQocGFpclsxXSkgOiAnJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zW2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHF1ZXJ5UGFyYW1zO1xuICAgICAgfSxcblxuICAgICAgcmVjb2duaXplOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHZhciBzdGF0ZXMgPSBbIHRoaXMucm9vdFN0YXRlIF0sXG4gICAgICAgICAgICBwYXRoTGVuLCBpLCBsLCBxdWVyeVN0YXJ0LCBxdWVyeVBhcmFtcyA9IHt9LFxuICAgICAgICAgICAgaXNTbGFzaERyb3BwZWQgPSBmYWxzZTtcblxuICAgICAgICBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xuICAgICAgICAgIHZhciBxdWVyeVN0cmluZyA9IHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCk7XG4gICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKDAsIHF1ZXJ5U3RhcnQpO1xuICAgICAgICAgIHF1ZXJ5UGFyYW1zID0gdGhpcy5wYXJzZVF1ZXJ5U3RyaW5nKHF1ZXJ5U3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhdGggPSBkZWNvZGVVUkkocGF0aCk7XG5cbiAgICAgICAgLy8gREVCVUcgR1JPVVAgcGF0aFxuXG4gICAgICAgIGlmIChwYXRoLmNoYXJBdCgwKSAhPT0gXCIvXCIpIHsgcGF0aCA9IFwiL1wiICsgcGF0aDsgfVxuXG4gICAgICAgIHBhdGhMZW4gPSBwYXRoLmxlbmd0aDtcbiAgICAgICAgaWYgKHBhdGhMZW4gPiAxICYmIHBhdGguY2hhckF0KHBhdGhMZW4gLSAxKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoMCwgcGF0aExlbiAtIDEpO1xuICAgICAgICAgIGlzU2xhc2hEcm9wcGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaT0wLCBsPXBhdGgubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgIHN0YXRlcyA9ICQkcm91dGUkcmVjb2duaXplciQkcmVjb2duaXplQ2hhcihzdGF0ZXMsIHBhdGguY2hhckF0KGkpKTtcbiAgICAgICAgICBpZiAoIXN0YXRlcy5sZW5ndGgpIHsgYnJlYWs7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVORCBERUJVRyBHUk9VUFxuXG4gICAgICAgIHZhciBzb2x1dGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChpPTAsIGw9c3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBpZiAoc3RhdGVzW2ldLmhhbmRsZXJzKSB7IHNvbHV0aW9ucy5wdXNoKHN0YXRlc1tpXSk7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlcyA9ICQkcm91dGUkcmVjb2duaXplciQkc29ydFNvbHV0aW9ucyhzb2x1dGlvbnMpO1xuXG4gICAgICAgIHZhciBzdGF0ZSA9IHNvbHV0aW9uc1swXTtcblxuICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuaGFuZGxlcnMpIHtcbiAgICAgICAgICAvLyBpZiBhIHRyYWlsaW5nIHNsYXNoIHdhcyBkcm9wcGVkIGFuZCBhIHN0YXIgc2VnbWVudCBpcyB0aGUgbGFzdCBzZWdtZW50XG4gICAgICAgICAgLy8gc3BlY2lmaWVkLCBwdXQgdGhlIHRyYWlsaW5nIHNsYXNoIGJhY2tcbiAgICAgICAgICBpZiAoaXNTbGFzaERyb3BwZWQgJiYgc3RhdGUucmVnZXguc291cmNlLnNsaWNlKC01KSA9PT0gXCIoLispJFwiKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aCArIFwiL1wiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJCRyb3V0ZSRyZWNvZ25pemVyJCRmaW5kSGFuZGxlcihzdGF0ZSwgcGF0aCwgcXVlcnlQYXJhbXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyLnByb3RvdHlwZS5tYXAgPSAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRkZWZhdWx0O1xuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXIuVkVSU0lPTiA9ICcwLjEuOSc7XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0ID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXI7XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKCdyb3V0ZS1yZWNvZ25pemVyJywgZnVuY3Rpb24oKSB7IHJldHVybiAkJHJvdXRlJHJlY29nbml6ZXIkJGRlZmF1bHQ7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlWydleHBvcnRzJ10pIHtcbiAgICAgIG1vZHVsZVsnZXhwb3J0cyddID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydSb3V0ZVJlY29nbml6ZXInXSA9ICQkcm91dGUkcmVjb2duaXplciQkZGVmYXVsdDtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yb3V0ZS1yZWNvZ25pemVyLmpzLm1hcCIsIi8qKlxuICogVGhlIG1pbWVvIG1vZHVsZXMgZGVzY3JpYmVzIHRoZSB1c2Ugb2YgdGhlIG1pbWVvIGZyYW1ld29yay5cbiAqXG4gKiBAbW9kdWxlIE1pbWVvXG4gKi9cbnZhciBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZS5qcycpO1xuXG52YXIgTW9kdWxlcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzL01vZHVsZXMuanMnKTtcbnZhciBJbmplY3RhYmxlcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzL0luamVjdGFibGVzLmpzJyk7XG5cbnZhciByZWdpc3RlckJ1aWx0SW5zID0gcmVxdWlyZSgnLi9idWlsdGlucy9SZWdpc3Rlci5qcycpO1xuLyoqXG4gKiBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgdGhlIE1pbWVvIGZyYW1ld29yay4gQ3JlYXRlIG1vZHVsZXMgb3IgYm9vdHN0cmFwXG4gKiBhbiBpbmplY3RhYmxlLlxuICpcbiAqIEBjbGFzcyBNaW1lb1xuICogQHN0YXRpY1xuICovXG52YXIgTWltZW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlcyA9IE1vZHVsZXMoKTtcbiAgICB2YXIgaW5qZWN0YWJsZXMgPSBJbmplY3RhYmxlcygpO1xuXG4gICAgcmVnaXN0ZXJCdWlsdElucyhpbmplY3RhYmxlcyk7XG5cbiAgICBmdW5jdGlvbiBib290c3RyYXAoaW5qZWN0YWJsZU5hbWUpIHtcbiAgICAgICAgaWYgKCFpbmplY3RhYmxlTmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZpbmUgYW4gaW5qZWN0YWJsZSB0byBib290c3RyYXAhJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW1vZHVsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlcyBkb25cXCd0IGV4aXN0OiAnICsgbW9kdWxlcy5nZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpbmplY3RhYmxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlcyBkb25cXCd0IGV4aXN0OiAnICsgaW5qZWN0YWJsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluamVjdGFibGVzLmluc3RhbnRpYXRlKCk7XG5cbiAgICAgICAgbW9kdWxlcy5pbnN0YW50aWF0ZSgpO1xuXG4gICAgICAgIHZhciBlbnRyeUluamVjdGFibGUgPSBpbmplY3RhYmxlcy5nZXQoaW5qZWN0YWJsZU5hbWUpO1xuXG4gICAgICAgIGlmICghQm9vbGVhbihlbnRyeUluamVjdGFibGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGUgXCInICsgaW5qZWN0YWJsZU5hbWUgKyAnXCIgdG8gYm9vdHN0cmFwIG5vdCBmb3VuZC4gU3RyaW5neWZpZWQgaW5qZWN0YWJsZTogJyArIGVudHJ5SW5qZWN0YWJsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShlbnRyeUluamVjdGFibGUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0YWJsZSBcIicgKyBpbmplY3RhYmxlTmFtZSArICdcIiBpcyBub3QgZXhlY3V0YWJsZS4gU3RyaW5neWZpZWQgaW5qZWN0YWJsZTogJyArIFN0cmluZyhlbnRyeUluamVjdGFibGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbnRyeUluamVjdGFibGUuYXBwbHkoZW50cnlJbmplY3RhYmxlLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW4gTWltZW8sIG1vZHVsZXMgYXJlIHRvcC1sZXZlbCBjb25zdHJ1Y3RzIHRoYXQgb3duIGFuZCBtYW5hZ2VcbiAgICAgICAgICogaW5qZWN0YWJsZXMuIE1vZHVsZXMgY2FuIGRlcGVuZCBvbiBvdGhlciBtb2R1bGUgYW5kIHdpbGwgYmUgaW5zdGFudGlhdGVkXG4gICAgICAgICAqIGluIGRlcGVuZGVuY3ktb3JkZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgbW9kdWxlXG4gICAgICAgICAqIEBmb3IgTWltZW9cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAgICAgICAgICogICAgICAgICAgLmNvbXBvbmVudCgnZ3JlZXRpbmcnLCAoKSA9PiAobmFtZSkgPT4gY29uc29sZS5sb2coJ0hpLCAnICsgbmFtZSk7XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIG1vZHVsZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbZGVwZW5kZW5jaWVzXSBBcnJheSBvZiBtb2R1bGUgbmFtZXMgdGhhdCB0aGlzXG4gICAgICAgICAqICBtb2R1bGUgZGVwZW5kcyBvblxuICAgICAgICAgKiBAcmV0dXJuIHtNb2R1bGV9XG4gICAgICAgICAqL1xuICAgICAgICBtb2R1bGU6IGZ1bmN0aW9uKG5hbWUsIGRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgaWYgKGRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2R1bGVzLmFkZChuZXcgTW9kdWxlKGluamVjdGFibGVzLCBuYW1lLCBkZXBlbmRlbmNpZXMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZXMuZ2V0KG5hbWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbWV0aG9kIGJvb3RzdHJhcFxuICAgICAgICAgKiBAZm9yIE1pbWVvXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gICAgICAgICAqICAgICAgICAgIC5jb21wb25lbnQoJ2dyZWV0aW5nJywgKCkgPT4gKG5hbWUpID0+IGNvbnNvbGUubG9nKCdIaSwgJyArIG5hbWUpO1xuICAgICAgICAgKiAgICAgIG1pbWVvLmJvb3RzdHJhcCgnZ3JlZXRpbmcnLCAnSm9obicpXG4gICAgICAgICAqICAgICAgLy89PiBcIkhpLCBKb2huXCJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGluamVjdGFibGVOYW1lXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbLi4ucGFyYW1ldGVyc10gUGFzc2VkIHRocm91Z2ggdG8gaW5qZWN0YWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgYm9vdHN0cmFwOiBib290c3RyYXBcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbWVvKCk7XG4iLCIvKipcbiAqIEBtb2R1bGUgTWltZW9cbiAqL1xuXG4vKipcbiAqIE1vZHVsZXMgYXJlIHRoZSBwcmltYXJ5IGludGVyZmFjZSB0byBtaW1lby4gT24gYSBtb2R1bGUsIHlvdSBjYW4gZGVmaW5lXG4gKiBpbmplY3RhYmxlcy4gRWFjaCBpbmplY3RhYmxlIGRlZmluaXRpb24gd2lsbCByZXR1cm4gdGhlIGN1cnJlbnQgbW9kdWxlLFxuICogYWxsb3dpbmcgeW91IHRvIGNoYWluIGluamVjdGFibGUgZGVmaW5pdGlvbnMuXG4gKlxuICogSW5qZWN0YWJsZXMgY29uc2lzdCBvZiB0aHJlZSBwYXJ0czogQSBuYW1lLCBhIGxpc3Qgb2YgZGVwZW5kZW5jaWVzIGFuZCBhblxuICogZXhlY3V0YWJsZS4gVGhlIGRlcGVuZGVuY2llcyBhcmUgbmFtZXMgb2Ygb3RoZXIgaW5qZWN0YWJsZXMgdGhhdCB3aWxsIGJlXG4gKiBwYXNzZWQgdG8gdGhlIGV4ZWN1dGFibGUuXG4gKlxuICogVGhlcmUgYXJlIHR3byB3YXlzIG9mIGRlZmluaW5nIGFuIGluamVjdGFibGUuIFRoZSBmaXJzdCBpcyBhbiBhcnJheSBub3RhdGlvblxuICogd2hlcmUgdGhlIGxhc3QgZW50cnkgaW4gdGhlIGFycmF5IGlzIHRoZSBleGVjdXRhYmxlLiBUaGUgb3RoZXIgaXMgYW5cbiAqIGV4ZWN1dGFibGUgdGhhdCBoYXMgdGhlIHNwZWNpYWwgcHJvcGVydGllcyAkbmFtZSBhbmQgJGluamVjdC5cbiAqXG4gKiBIZXJlIGlzIGFuIGV4YW1wbGUgb2YgdGhlIGFycmF5LXN0eWxlLiBUd28gZmFjdG9yaWVzIEEgYW5kIEIgYXJlIGRlZmluZWQsXG4gKiB3aXRoIEIgaGF2aW5nIGEgZGVwZW5kZW5jeSBvbiBBOlxuICpcbiAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gKiAgICAgICAgICAuZmFjdG9yeSgnQScsIFsoKSA9PiB7fV0pXG4gKiAgICAgICAgICAuZmFjdG9yeSgnQicsIFsnQicsIChiKSA9PiB7fV0pXG4gKlxuICogQW5kIGhlcmUncyBob3cgdGhlIHNhbWUgZXhhbXBsZSB3b3VsZCBsb29rIGxpa2Ugd2l0aCB0aGUgZXhlY3V0YWJsZSBzdHlsZTpcbiAqXG4gKiAgICAgIGZ1bmN0aW9uIEEoKSB7fVxuICogICAgICBBLiRuYW1lID0gJ0EnO1xuICogICAgICBBLiRpbmplY3QgPSBbXTtcbiAqXG4gKiAgICAgIGZ1bmN0aW9uIEIoKSB7fVxuICogICAgICBCLiRuYW1lID0gJ0InO1xuICogICAgICBCLiRpbmplY3QgPSBbJ0EnXTtcbiAqXG4gKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICogICAgICAgICAgLmZhY3RvcnkoQSlcbiAqICAgICAgICAgIC5mYWN0b3J5KEIpO1xuICpcbiAqIFRoZSBleGVjdXRhYmxlLXN0eWxlIG1ha2VzIGl0IHZlcnkgZWFzeSB0byBzZXBhcmF0ZSBvdXQgeW91ciBjb2RlIGZyb20gdGhlXG4gKiBtaW1lbyBiaW5kaW5ncy4gSW4gdGhlIGV4YW1wbGUsIGZ1bmN0aW9uIEEgYW5kIEIgY2FuIGJlIHVzZWQgaW5kZXBlbmRlbnQgb2ZcbiAqIG1pbWVvLiBUaGlzIGlzIGdyZWF0IG9mIHVuaXQtdGVzdGluZyB5b3VyIGNvZGUsIGFzIHlvdSBjYW4gaW1wb3J0IHRoZVxuICogZXhlY3V0YWJsZXMgaW50byB5b3VyIHRlc3Qgc3VpdGUgd2l0aG91dCBoYXZpbmcgdG8gd29ycnkgYWJvdXQgbWltZW8uXG4gKlxuICogQGNsYXNzIE1vZHVsZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1vZHVsZShpbmplY3RhYmxlcywgbmFtZSwgZGVwZW5kZW5jaWVzKSB7XG4gICAgdmFyIG1vZHVsZSA9IHRoaXM7XG5cbiAgICB2YXIgdG9SdW4gPSBbXTtcblxuICAgIHRoaXMuJG5hbWUgPSBuYW1lO1xuICAgIHRoaXMuJGluamVjdCA9IGRlcGVuZGVuY2llcztcblxuICAgIGZ1bmN0aW9uIHByZXBhcmVJbmplY3RhYmxlKG5hbWUsIHBhcmFtZXRlcnMpIHtcbiAgICAgICAgaWYgKGluamVjdGFibGVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlIFwiJyArIG5hbWUgKyAnXCIgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmplY3RhYmxlO1xuXG4gICAgICAgIGlmIChwYXJhbWV0ZXJzIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGluamVjdGFibGUgPSBwYXJhbWV0ZXJzO1xuICAgICAgICAgICAgaWYgKCFpbmplY3RhYmxlLiRpbmplY3QpIHtcbiAgICAgICAgICAgICAgICBpbmplY3RhYmxlLiRpbmplY3QgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBkZXBlbmRlbmNpZXMgPSBwYXJhbWV0ZXJzLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgIGluamVjdGFibGUgPSBwYXJhbWV0ZXJzLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgIGluamVjdGFibGUuJGluamVjdCA9IGRlcGVuZGVuY2llcztcbiAgICAgICAgfVxuXG4gICAgICAgIGluamVjdGFibGUuJG5hbWUgPSBuYW1lO1xuXG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZEluamVjdGFibGUobmFtZSwgcGFyYW1ldGVycykge1xuICAgICAgICBpbmplY3RhYmxlcy5hZGQocHJlcGFyZUluamVjdGFibGUobmFtZSwgcGFyYW1ldGVycykpO1xuXG4gICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgfVxuXG4gICAgdGhpcy5leGVjdXRlUnVuID0gZnVuY3Rpb24gZXhlY3V0ZVJ1bigpIHtcbiAgICAgICAgdG9SdW4uZm9yRWFjaChmdW5jdGlvbihpbmplY3RhYmxlTmFtZSkge1xuICAgICAgICAgICAgaW5qZWN0YWJsZXMuZ2V0KGluamVjdGFibGVOYW1lKSgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBJIGRvbid0IGxpa2UgdGhlIHdyYXBwZXIgYW5kIGF1dG8tZ2VuZXJhdGVkIG5hbWUsIGJ1dCBmb3Igbm93IEkgY2FuJ3RcbiAgICAgKiBjb21lIHVwIHdpdGggYSBiZXR0ZXIgc29sdXRpb24uIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIHJ1bi1mdW5jdGlvblxuICAgICAqIG5lZWRzIHRvIHdvcmsgd2l0aCB0aGUgaW5qZWN0aW9uIHN5c3RlbSAoc2luY2UgaXQgY2FuIGhhdmUgb3RoZXJcbiAgICAgKiBpbmplY3RhYmxlcyBpbmplY3RlZCksIGFuZCB0aGUgd2hvbGUgc3lzdGVtIGlzbid0IGRlc2lnbmVkIHRvIGRlYWwgd2l0aFxuICAgICAqIHVubmFtZWQgdGhpbmdzLlxuICAgICAqXG4gICAgICogSW4gZmFjdCwgSSBmZWVsIHRoYXQgYW4gaW5qZWN0aW9uIHN5c3RlbSB0aGF0IGNhbiBoYW5kbGUgdW5uYW1lZCBpdGVtc1xuICAgICAqIHdvdWxkIGJlIHdyb25nLiBIb3cgd291bGQgeW91IGlkZW50aWZ5IHdoYXQgdG8gaW5qZWN0PyBIYXZpbmcgbmFtZXMgZm9yXG4gICAgICogaW5qZWN0YWJsZXMgKG9yIGF0IGxlYXN0IElEcykgaXMgYSBjb3JlIGFzcGVjdCBvZiBhbiBpbmplY3Rpb24gc3lzdGVtLlxuICAgICAqXG4gICAgICogU28gdGhpcyB3b3VsZCBoYXZlIHRvIGxpdmUgb3V0c2lkZSBvZiBpdC4gQnV0IHRoYXQgbWVhbnMgaGF2aW5nIGl0J3Mgb3duXG4gICAgICogXCJtYWtlIHN1cmUgYWxsIHRoZXNlIGluamVjdGFibGVzIGV4aXN0XCIgc3lzdGVtLiBUaGVuIHdlIGNvdWxkIGp1c3QgZ2V0XG4gICAgICogdGhlIG5hbWVkIGluamVjdGFibGVzIHRoZSBydW4tZnVuY3Rpb24gbmVlZHMgYW5kIGNhbGwgdGhlIHJ1bi1mdW5jdGlvblxuICAgICAqIHdpdGggdGhvc2UuXG4gICAgICpcbiAgICAgKiBJIGNhbid0IHRoaW5rIG9mIGEgZ29vZCB3YXkgdG8gZGUtZHVwbGljYXRlZCB0aGF0IGRlcGVuZGVuY3kgcmVzb2x1dGlvblxuICAgICAqIHN5c3RlbSB0aG91Z2gsIHNvIHRoZXJlJ2QgYmUgb25lIGZvciBhbGwgbmFtZWQgaW5qZWN0YWJsZXMgYW5kIG9uZSBmb3JcbiAgICAgKiB0aGUgcnVuLWZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEkgZG9uJ3QgcGxhbiBvbiBoYXZpbmcgb3RoZXIgdW5uYW1lZCBpbmplY3RhYmxlcywgc28gSSBmZWVsIHRoYXQgZWZmb3J0XG4gICAgICogd291bGQgYmUgd2FzdGVkLiBIZW5jZSB0aGUgXCJoYWNrXCIgaGVyZSB3aXRoIGFuIGF1dG8tZ2VuZXJhdGVkIG5hbWUgYW5kXG4gICAgICogYSB3cmFwcGVyIHRoYXQgZXhlY3V0ZXMgdGhlIHJ1bi1mdW5jdGlvbiB3aXRoIHBhc3MtdGhyb3VnaCBhcmd1bWVudHMuXG4gICAgICovXG4gICAgLyoqXG4gICAgICogRGVmaW5lcyBhbiBpbmplY3RhYmxlIHRoYXQgd2lsbCBiZSBydW4gYWZ0ZXIgbW9kdWxlcyBhcmUgaW5zdGFudGlhdGVkLlxuICAgICAqXG4gICAgICogQG1ldGhvZCBydW5cbiAgICAgKiBAZm9yIE1vZHVsZVxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fEZ1bmN0aW9ufSBJbmplY3RhYmxlIGRlZmluaXRpb25cbiAgICAgKiBAcmV0dXJuIHtNb2R1bGV9XG4gICAgICovXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihwYXJhbWV0ZXJzKSB7XG4gICAgICAgIHZhciBuYW1lID0gbW9kdWxlLiRuYW1lICsgJy1ydW4uJyArIHRvUnVuLmxlbmd0aDtcbiAgICAgICAgdG9SdW4ucHVzaChuYW1lKTtcblxuICAgICAgICB2YXIgcHJvdmlkZXIgPSBmdW5jdGlvbiBwcm92aWRlclJ1bigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbWV0ZXJzIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtZXRlcnMuYXBwbHkocGFyYW1ldGVycywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RFbnRyeSA9IHBhcmFtZXRlcnMuc2xpY2UoLTEpWzBdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFzdEVudHJ5LmFwcGx5KGxhc3RFbnRyeSwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChwYXJhbWV0ZXJzIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHByb3ZpZGVyLiRpbmplY3QgPSBwYXJhbWV0ZXJzLiRpbmplY3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm92aWRlci4kaW5qZWN0ID0gcGFyYW1ldGVycy5zbGljZSgwLCAtMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWRkSW5qZWN0YWJsZShuYW1lLCBwcm92aWRlcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVzZSBmYWN0b3JpZXMgZm9yIGFueXRoaW5nIHRoYXQgZG9lc24ndCBjcmVhdGUgb3V0cHV0XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZhY3RvcnlcbiAgICAgKiBAZm9yIE1vZHVsZVxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fEZ1bmN0aW9ufSBJbmplY3RhYmxlIGRlZmluaXRpb25cbiAgICAgKiBAcmV0dXJuIHtNb2R1bGV9XG4gICAgICovXG4gICAgdGhpcy5mYWN0b3J5ID0gYWRkSW5qZWN0YWJsZTtcblxuICAgIC8qKlxuICAgICAqIENvbXBvbmVudHMgYXJlIG1lYW50IHRvIHByb2R1Y2Ugc29tZSBvdXRwdXQsIHJlZ2FyZGxlc3Mgb2Ygd2hhdCByZW5kZXJpbmdcbiAgICAgKiB0ZWNobmlxdWUgeW91IHVzZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBjb21wb25lbnRcbiAgICAgKiBAZm9yIE1vZHVsZVxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fEZ1bmN0aW9ufSBJbmplY3RhYmxlIGRlZmluaXRpb25cbiAgICAgKiBAcmV0dXJuIHtNb2R1bGV9XG4gICAgICovXG4gICAgdGhpcy5jb21wb25lbnQgPSBhZGRJbmplY3RhYmxlO1xuXG4gICAgLyoqXG4gICAgICogVmFsdWVzIGFyZSBkaWZmZXJlbnQgZnJvbSBmYWN0b3JpZXMgYW5kIGNvbXBvbmVudHMgaW4gdGhhdCB0aGVyZSdzIG5vXG4gICAgICogZXhlY3V0YWJsZS4gSXQncyBqdXN0IGEgbmFtZSBhbmQgYSB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAgICAgKiAgICAgICAgICAudmFsdWUoJ25hbWUnLCAndmFsdWUnKVxuICAgICAqXG4gICAgICogQG1ldGhvZCB2YWx1ZVxuICAgICAqIEBmb3IgTW9kdWxlXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2YgdmFsdWVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHlvdSB3YW50IGF2YWlsYWJsZSBmb3IgaW5qZWN0aW9uXG4gICAgICogQHJldHVybiB7TW9kdWxlfVxuICAgICAqL1xuICAgIHRoaXMudmFsdWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYWRkSW5qZWN0YWJsZShuYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTsiLCJmdW5jdGlvbiBXaW5kb3coKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBub09wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAkZmFrZTogdHJ1ZSxcbiAgICAgICAgICAgIG9ucG9wc3RhdGU6IG5vT3AsXG4gICAgICAgICAgICBvbmNsaWNrOiBub09wLFxuICAgICAgICAgICAgb25sb2FkOiBub09wLFxuICAgICAgICAgICAgZG9jdW1lbnQ6IHtcbiAgICAgICAgICAgICAgICBnZXRFbGVtZW50QnlJZDogbm9PcFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpc3Rvcnk6IHtcbiAgICAgICAgICAgICAgICBwdXNoU3RhdGU6IG5vT3AsXG4gICAgICAgICAgICAgICAgcmVwbGFjZVN0YXRlOiBub09wXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHdpbmRvdztcbn1cblxuZnVuY3Rpb24gTm9kZUh0dHAoKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCdodHRwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gTm9kZUh0dHBzKCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcmVxdWlyZSgnaHR0cHMnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBXaW5kb3c6IFdpbmRvdyxcbiAgICBOb2RlSHR0cDogTm9kZUh0dHAsXG4gICAgTm9kZUh0dHBzOiBOb2RlSHR0cHNcbn07IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBAbW9kdWxlIEJ1aWx0aW5zXG4gKi9cblxudmFyIE5vZGVIdHRwO1xudmFyIE5vZGVIdHRwcztcblxuZnVuY3Rpb24gdG9RdWVyeShvYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdFtrZXldKSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0W2tleV1cbiAgICAgICAgICAgICAgICAubWFwKChhcnJheVZhbHVlKSA9PiBlbmNvZGVVUkkoa2V5KSArICc9JyArIGVuY29kZVVSSShhcnJheVZhbHVlKSlcbiAgICAgICAgICAgICAgICAuam9pbignJicpO1xuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3Rba2V5XSkgPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVVUkkoa2V5KSArICc9JyArIGVuY29kZVVSSShKU09OLnN0cmluZ2lmeShvYmplY3Rba2V5XSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSShrZXkpICsgJz0nICsgZW5jb2RlVVJJKG9iamVjdFtrZXldLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLmpvaW4oJyYnKTtcbn1cblxuZnVuY3Rpb24gaXNKc29uQ29udGVudFR5cGUoY29udGVudFR5cGUpIHtcbiAgICBpZiAoIWNvbnRlbnRUeXBlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudFR5cGUgPT0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyaW5nLCBzdGFydCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cigwLCBzdGFydC5sZW5ndGgpID09IHN0YXJ0O1xuICAgIH1cblxuICAgIHZhciB0ZXh0SnNvbiA9ICd0ZXh0L2pzb24nO1xuICAgIHZhciBhcHBsaWNhdGlvbkpzb24gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICB2YXIgdHlwZSA9IGNvbnRlbnRUeXBlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgaWYgKHN0YXJ0c1dpdGgodHlwZSwgdGV4dEpzb24pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoc3RhcnRzV2l0aCh0eXBlLCBhcHBsaWNhdGlvbkpzb24pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZS5tYXRjaCgvXmFwcGxpY2F0aW9uXFwvdm5kXFwuLipcXCtqc29uJC8pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24galF1ZXJ5TGlrZVJlcXVlc3QoalF1ZXJ5TGlrZSwgY29uZmlnLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiBwYXJzZUpxWEhSSGVhZGVycyhoZWFkZXJTdHJpbmcpIHtcbiAgICAgICAgaWYgKCFoZWFkZXJTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZWFkZXJTdHJpbmdcbiAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgIC5maWx0ZXIobGluZSA9PiBsaW5lLmxlbmd0aClcbiAgICAgICAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUuc3BsaXQoJzonKS5tYXAocGFydCA9PiBwYXJ0LnRyaW0oKSkpXG4gICAgICAgICAgICAucmVkdWNlKChoZWFkZXJzLCBbaGVhZGVyLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzW2hlYWRlcl0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICAgICAgICAgIH0sIHt9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc3BvbnNlVG9Bbmd1bGFyUmVzcG9uc2UoZGF0YSwgXywganFYSFIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBzdGF0dXM6IGpxWEhSLnN0YXR1cywgLy8gcmVzcG9uc2UgY29kZSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSnFYSFJIZWFkZXJzKGpxWEhSLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSxcbiAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDoganFYSFIuc3RhdHVzVGV4dFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZVRvQW5ndWxhclJlc3BvbnNlKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IoanFYSFIsIHRleHRTdGF0dXMpIHtcbiAgICAgICAgcmVqZWN0KHJlc3BvbnNlVG9Bbmd1bGFyUmVzcG9uc2Uoe30sIHRleHRTdGF0dXMsIGpxWEhSKSk7XG4gICAgfVxuXG4gICAgdmFyIHVybCA9IGNvbmZpZy5ob3N0ICYmIGNvbmZpZy5wcm90b2NvbFxuICAgICAgICA/IGNvbmZpZy5wcm90b2NvbCArICc6Ly8nICsgY29uZmlnLmhvc3QgKyBjb25maWcudXJsXG4gICAgICAgIDogY29uZmlnLnVybDtcblxuICAgIGpRdWVyeUxpa2UuYWpheCh7XG4gICAgICAgIHR5cGU6IGNvbmZpZy5tZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IGNvbmZpZy5oZWFkZXJzLFxuICAgICAgICBjb250ZW50VHlwZTogY29uZmlnLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddLFxuICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgZGF0YTogaXNKc29uQ29udGVudFR5cGUoY29uZmlnLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKSA/IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgY29uZmlnLmRhdGEpIDogY29uZmlnLmRhdGFcbiAgICB9KS50aGVuKHN1Y2Nlc3MsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24galF1ZXJ5UmVxdWVzdCgkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGpRdWVyeUxpa2VSZXF1ZXN0KCR3aW5kb3cualF1ZXJ5LCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB6ZXB0b1JlcXVlc3QoJHdpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBqUXVlcnlMaWtlUmVxdWVzdCgkd2luZG93LlplcHRvLCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub2RlUmVxdWVzdChjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIGZ1bmN0aW9uIGNvbmZpZ1RvTm9kZShjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5ob3N0ICYmIGNvbmZpZy5ob3N0LmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBob3N0UGFydHMgPSBjb25maWcuaG9zdC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdmFyIGhvc3QgPSBob3N0UGFydHNbMF07XG4gICAgICAgICAgICB2YXIgcG9ydCA9IGhvc3RQYXJ0c1sxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBob3N0ID0gY29uZmlnLmhvc3Q7XG4gICAgICAgICAgICB2YXIgcG9ydCA9ICc4MCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhvc3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2hlbiB1c2luZyBub2RlcyBodHRwIGxpYnJhcmllcywgeW91IGhhdmUgdG8gc2V0ICRodHRwLiRob3N0LCBvdGhlcndpc2Ugbm9kZSBkb2VzIG5vdCBrbm93IHdoZXJlIHRvIHNlbmQgdGhlIHJlcXVlc3QgdG8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2Q6IGNvbmZpZy5tZXRob2QsXG4gICAgICAgICAgICBwYXRoOiBjb25maWcucHJvdG9jb2wgKyAnOi8vJyArIGNvbmZpZy5ob3N0ICsgY29uZmlnLnVybCxcbiAgICAgICAgICAgIGhlYWRlcnM6IGNvbmZpZy5oZWFkZXJzLFxuICAgICAgICAgICAgaG9zdDogaG9zdCxcbiAgICAgICAgICAgIHBvcnQ6IHBvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogY29uZmlnLnByb3RvY29sICsgJzonXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzd2l0Y2hCeVByb3RvY29sKCkge1xuICAgICAgICBpZiAoY29uZmlnLnByb3RvY29sID09PSAnaHR0cCcpIHtcbiAgICAgICAgICAgIHJldHVybiBOb2RlSHR0cDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBOb2RlSHR0cHM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBqc29uRW5jb2RlKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqZWN0KTtcbiAgICB9XG5cbiAgICB2YXIgcmVxdWVzdCA9IHN3aXRjaEJ5UHJvdG9jb2woKS5yZXF1ZXN0KGNvbmZpZ1RvTm9kZShjb25maWcpLFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgcmVzcG9uc2Uuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblxuICAgICAgICAgICAgdmFyIGJvZHkgPSAnJztcbiAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgZnVuY3Rpb24oY2h1bmspIHtcbiAgICAgICAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIGpRdWVyeSB3aWxsIHBhcnNlIEpTT04gcmVwbGllcyBhdXRvbWF0aWNhbGx5LCBzbyByZXBsaWNhdGUgdGhhdFxuICAgICAgICAgICAgICAgICAqIGJlaGF2aW91ciBmb3Igbm9kZWpzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKGJvZHkgJiYgcmVzcG9uc2UuaGVhZGVyc1snY29udGVudC10eXBlJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LXR5cGUnXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNKc29uQ29udGVudFR5cGUodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGJvZHksXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHJlc3BvbnNlLmhlYWRlcnMsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiByZXNwb25zZS5zdGF0dXNNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1c0NvZGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIGlmIChjb25maWcubWV0aG9kID09PSAnUE9TVCcgfHwgY29uZmlnLm1ldGhvZCA9PT0gJ1BVVCcgfHwgY29uZmlnLm1ldGhvZCA9PT0gJ1BBVENIJykge1xuICAgICAgICBpZiAoY29uZmlnLmRhdGEpIHtcbiAgICAgICAgICAgIGlmIChpc0pzb25Db250ZW50VHlwZShjb25maWcuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC53cml0ZShqc29uRW5jb2RlKGNvbmZpZy5kYXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qud3JpdGUoY29uZmlnLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdC5lbmQoKTtcbn1cblxuZnVuY3Rpb24gdmVuZG9yU3BlY2lmaWNSZXF1ZXN0KCR3aW5kb3cpIHtcbiAgICBpZiAoJHdpbmRvdy4kZmFrZSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gbm9kZVJlcXVlc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCR3aW5kb3cualF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4galF1ZXJ5UmVxdWVzdCgkd2luZG93KTtcbiAgICAgICAgfSBlbHNlIGlmICgkd2luZG93LlplcHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gemVwdG9SZXF1ZXN0KCR3aW5kb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdXBwb3J0ZWQgeGhyIGxpYnJhcnkgZm91bmQgKGpRdWVyeSBvciBaZXB0byBhcmUgc3VwcG9ydGVkKScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpIHtcbiAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgaWYgKGNvbmZpZy5wYXJhbXMpIHtcbiAgICAgICAgaWYgKGNvbmZpZy51cmwuaW5kZXhPZignPycpID09PSAtMSkge1xuICAgICAgICAgICAgY29uZmlnLnVybCArPSAnPyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnVybFtjb25maWcudXJsLmxlbmd0aCAtIDFdICE9ICcmJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy51cmwgKz0gJyYnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLnVybCArPSB0b1F1ZXJ5KGNvbmZpZy5wYXJhbXMpO1xuICAgICAgICBkZWxldGUgY29uZmlnLnBhcmFtcztcbiAgICB9XG5cbiAgICBjb25maWcgPSBjb25maWcucHJlLnJlZHVjZSgoY29uZmlnLCBjYWxsYmFjaykgPT4gY2FsbGJhY2soY29uZmlnKSwgY29uZmlnKTtcbiAgICB2ZW5kb3JTcGVjaWZpY1JlcXVlc3QoJHdpbmRvdykoY29uZmlnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGRhdGEgPSBjb25maWcucG9zdC5yZWR1Y2UoKGRhdGEsIGNhbGxiYWNrKSA9PiBjYWxsYmFjayhkYXRhKSwgZGF0YSk7XG4gICAgICAgIGRlZmVyLnJlc29sdmUoZGF0YSk7XG4gICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCR3aW5kb3csICRxLCAkbm9kZUh0dHAsICRub2RlSHR0cHMpIHtcbiAgICBOb2RlSHR0cCA9ICRub2RlSHR0cDtcbiAgICBOb2RlSHR0cHMgPSAkbm9kZUh0dHBzO1xuXG4gICAgZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gICAgICAgIGxldCBuZXdPYmplY3QgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChvYmplY3Rba2V5XS50b1N0cmluZygpID09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICAgICAgbmV3T2JqZWN0W2tleV0gPSBjbG9uZShvYmplY3Rba2V5XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld09iamVjdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXdPYmplY3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VDb25maWcoZGVmYXVsdENvbmZpZywgdXNlckNvbmZpZykge1xuICAgICAgICBsZXQgdGFyZ2V0Q29uZmlnID0gY2xvbmUoZGVmYXVsdENvbmZpZyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHVzZXJDb25maWcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJDb25maWdba2V5XS50b1N0cmluZygpID09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Q29uZmlnW2tleV0gPSBtZXJnZUNvbmZpZyh0YXJnZXRDb25maWdba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgdXNlckNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Q29uZmlnW2tleV0gPSB1c2VyQ29uZmlnW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRDb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIyBTZW5kIGh0dHAocykgcmVxdWVzdHMgdG8gYSBzZXJ2ZXJcbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlICRodHRwIGluIHR3byB3YXlzLCBlaXRoZXIgYXMgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYVxuICAgICAqIGNvbmZpZ3VyYXRpb24gb2JqZWN0LCBvciB1c2Ugc2hvcnRoYW5kIG1ldGhvZHMgZm9yIGNvbW1vbiBIVFRQIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBUbyB1c2UgJGh0dHAgYXMgYSBmdW5jdGlvbiwgdGhlIGNvbmZpZyBvYmplY3QgbmVlZHMgdG8gaW5jbHVkZSB0aGUgdXJsXG4gICAgICogYW5kIGh0dHAgbWV0aG9kOlxuICAgICAqXG4gICAgICogICAgICAkaHR0cCh7XG4gICAgICogICAgICAgICAgdXJsOiAnL2V4YW1wbGUnLFxuICAgICAqICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogRm9yIGNvbW1vbiBodHRwIG1ldGhvZHMgdGhlcmUgYXJlIHNob3J0aGFuZCBmdW5jdGlvbnM6XG4gICAgICpcbiAgICAgKiAgICAgICRodHRwLmdldCgnL3VybCcpO1xuICAgICAqICAgICAgJGh0dHAucG9zdCgnL2V4YW1wbGUnLCB7IGtleTogJ3ZhbHVlJyB9KTtcbiAgICAgKlxuICAgICAqIEJvdGggdmFyaWF0aW9ucyB3aWxsIHJldHVybiBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSByZXNwb25zZVxuICAgICAqIGZyb20gdGhlIHNlcnZlcjpcbiAgICAgKlxuICAgICAqICAgICAgJGh0dHAuZ2V0KCcvZXhhbXBsZScpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICogICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqIFRoZSByZXNwb25zZSBvYmplY3QgaGFzIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKlxuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAqICAgICAgICAgIC8vRGF0YSBpcyB0aGUgcmVzcG9uc2UgYm9keS4gSWYgcmVzcG9uc2UgY29udGVudCB0eXBlIGlzXG4gICAgICogICAgICAgICAgLy8nYXBwbGljYXRpb24vanNvbicgdGhlIHJlc3BvbnNlIGJvZHkgd2lsbCBiZSBKU09OIGRlY29kZWQgYW5kXG4gICAgICogICAgICAgICAgLy90aGUgZGVjb2RlZCBvYmplY3Qgd2lsbCBiZSBhY2Nlc3NpYmxlIGluIGBkYXRhYFxuICAgICAqICAgICAgICAgIHN0YXR1czogMjAwLCAvLyBodHRwIHJlc3BvbnNlIGNvZGUsXG4gICAgICogICAgICAgICAgaGVhZGVyczoge1xuICAgICAqICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICogICAgICAgICAgfSwvLyByZXNwb25zZSBodHRwLWhlYWRlcnMsXG4gICAgICogICAgICAgICAgY29uZmlnOiBjb25maWcsIC8vIGNvbmZpZyBvYmplY3Qgc2VuZCB3aXRoIHJlcXVlc3RcbiAgICAgKiAgICAgICAgICBzdGF0dXNUZXh0OiAnMjAwIFN1Y2Nlc3MnIC8vIGh0dHAgc3RhdHVzIHRleHRcbiAgICAgKiAgICAgIH1cbiAgICAgKlxuICAgICAqIEFsbCBzaG9ydGhhbmQtbWV0aG9kcyBhcmUgZG9jdW1lbnRlZCBzZXBhcmF0ZWx5IGFuZCBvcHRpb25hbGx5IGFjY2VwdFxuICAgICAqIHRoZSBzYW1lIGNvbmZpZy1vYmplY3QgYCRodHRwYCBhcyBhIGZ1bmN0aW9uIGFjY2VwdHMuIFNob3VsZCB0aGUgY29uZmlnXG4gICAgICogb2JqZWN0IGNvbnRhaW4gZGlmZmVyZW50IGRhdGEgdGhhbiB0aGUgYXJndW1lbnRzIGZvciB0aGUgc2hvcnRoYW5kXG4gICAgICogbWV0aG9kLCB0aGVuIHRoZSBhcmd1bWVudHMgdG8gdGhlIG1ldGhvZCB0YWtlIHByZWNlZGVudDpcbiAgICAgKlxuICAgICAqICAgICAgJGh0dHAuZ2V0KCcvZXhhbXBsZScsIHt9LCB7IHVybDogJy9ub3QtdXNlZCcgfSk7XG4gICAgICogICAgICAvLz0+IFNlbmRzIHJlcXVlc3QgdG8gJy9leGFtcGxlJ1xuICAgICAqXG4gICAgICogIyMgQ29uZmlndXJhdGlvblxuICAgICAqXG4gICAgICogVGhlIGNvbmZpZyBvYmplY3QgY2FuIGhhdmUgdGhlc2Uga2V5czpcbiAgICAgKlxuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIHByZTogW10sXG4gICAgICogICAgICAgICAgcG9zdDogW10sXG4gICAgICogICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgKiAgICAgICAgICB1cmw6ICcvZXhhbXBsZScsXG4gICAgICogICAgICAgICAgZGF0YToge1xuICAgICAqICAgICAgICAgICAgICBrZXk6ICd2YWx1ZSdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIHBhcmFtczoge1xuICAgICAqICAgICAgICAgICAgICBzZWFyY2g6ICdhIHNlYXJjaCBjcml0ZXJpYSdcbiAgICAgKiAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgKiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH1cbiAgICAgKlxuICAgICAqIERlZmF1bHQgc2V0dGluZ3MgY2FuIGJlIHNldCBkaXJlY3RseSBvbiBgJGh0dHBgIGFuZCB3aWxsIGJlIHVzZWQgZm9yIGFsbFxuICAgICAqIGZ1dHVyZSByZXF1ZXN0czpcbiAgICAgKlxuICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gICAgICogICAgICAgICAgLnJ1bihbJyRodHRwJywgKCRodHRwKSA9PiB7XG4gICAgICogICAgICAgICAgICAgICRodHRwLiRjb25maWcuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gJ0Jhc2ljIFdAM2pvbGIyJ1xuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogYHByZWAgYW5kIGBwb3N0YCBhcmUgY2FsbGJhY2stY2hhaW5zIHRoYXQgY2FuXG4gICAgICogICAgICAxLiBNb2RpZnkgdGhlIGNvbmZpZyBiZWZvcmUgYSByZXF1ZXN0IChpbiBjYXNlIG9mIGBwcmVgKVxuICAgICAqICAgICAgMi4gTW9kaWZ5IHRoZSByZXNwb25zZSAoaW4gY2FzZSBvZiBgcG9zdGApXG4gICAgICpcbiAgICAgKiBUbyBhZGQgY2FsbGJhY2tzIHNpbXBseSBwdXNoIHRoZW0gdG8gdGhlIGFycmF5LiBJdCdzIHVwIHRvIHlvdSB0byBtYW5hZ2VcbiAgICAgKiB0aGUgY2hhaW4gYW5kIGFkZC9yZW1vdmUgZnVuY3Rpb25zIGZyb20gdGhlIGFycmF5LlxuICAgICAqXG4gICAgICogVGhlIGZ1bmN0aW9uIGl0c2VsZiB3aWxsIHJlY2VpdmUgdGhlIGNvbmZpZyBmb3IgdGhlIHJlcXVlc3QgKGZvciBgcHJlYClcbiAgICAgKiBvciB0aGUgcmVzcG9uc2UgKGZvciBgcG9zdGApLiBUaGUgZnVuY3Rpb25zIGluIHRoZSBjaGFpbiB3aWxsIHJlY2VpdmVcbiAgICAgKiB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uIGFzIGlucHV0LiBUaGUgZmlyc3QgZnVuY3Rpb25cbiAgICAgKiB3aWxsIHJlY2VpdmUgdGhlIG9yaWdpbmFsIGNvbmZpZy9yZXNwb25zZSBhcyBpbnB1dC5cbiAgICAgKlxuICAgICAqIElmIHlvdSBjaGFuZ2UgdmFsdWVzIGluIHRoZSBoZWFkZXJzLW9iamVjdCBtYWtlIHN1cmUgbm90IHRvIG92ZXJyaWRlIHRoZVxuICAgICAqIGhlYWRlcnMgb2JqZWN0IG9yIGlmIHlvdSBkbywgdG8gcHJvdmlkZSBhICdDb250ZW50LVR5cGUnIGhlYWRlcixcbiAgICAgKiBvdGhlcndpc2UgcmVxdWVzdHMgbWlnaHQgZmFpbCBkZXBlbmRpbmcgb24gdGhlIGVudmlyb25tZW50ICh1bnNwZWNpZmllZFxuICAgICAqIGNvbnRlbnQgdHlwZXMgc2hvdWxkIGJlIGF2b2lkZWQpLiBJbnN0ZWFkLCBzaW1wbHkgYWRkIG9yIG1vZGlmeSBoZWFkZXJzXG4gICAgICogb24gdGhlIGV4aXN0aW5nIGhlYWRlcnMgb2JqZWN0LlxuICAgICAqXG4gICAgICogVGhlIGBkYXRhYCBmaWVsZCBpcyBzZW5kIGFzIHRoZSByZXF1ZXN0IGJvZHkgYW5kIHRoZSBgcGFyYW1zYCBrZXkgaXNcbiAgICAgKiBzZW5kIGFzIGEgcXVlcnkgc3RyaW5nIGluIHRoZSB1cmwuIFRoZSBgaGVhZGVyc2AgZmllbGQgYWxsb3dzIHlvdSB0byBzZXRcbiAgICAgKiBodHRwIGhlYWRlcnMgZm9yIG9ubHkgdGhpcyByZXF1ZXN0LCB1c3VhbGx5IHVzZWQgdG8gc2V0IGEgY29udGVudCB0eXBlLlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgY29udGVudCB0eXBlIGlzICdhcHBsaWNhdGlvbi9qc29uJywgc28gYnkgZGVmYXVsdCwgYGRhdGFgXG4gICAgICogd2lsbCBiZSBzZW5kIGFzIGEgSlNPTiBzdHJpbmcgdG8gdGhlIHNlcnZlci4gSWYgeW91IHdhbnQgdG8gc2VuZCBhXG4gICAgICogYnJvd3Nlci1saWtlIGZvcm0gc3RyaW5nIChjb250ZW50IHR5cGVcbiAgICAgKiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJykgeW91IGhhdmUgdG8gc2V0IHRoZSBjb250ZW50IHR5cGVcbiAgICAgKiBpbiB0aGUgYGhlYWRlcnNgIGZpZWxkIGFuZCBgZGF0YWAgbXVzdCBiZSBhIHN0cmluZy4gSXQncyB1cCB0byB5b3UgdG9cbiAgICAgKiBidWlsZCB0aGUgZm9ybS11cmxlbmNvZGVkIHN0cmluZy5cbiAgICAgKlxuICAgICAqICMjIERlZmF1bHRzXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCB2YWx1ZXMgYCRodHRwYCB1c2VzIGNhbiBiZSBjaGFuZ2VkIGFuZCB3aWxsIGJlIGFwcGxpZWQgdG9cbiAgICAgKiBldmVyeSByZXF1ZXN0LiBUaGVyZSBhcmUgdGhyZWUgY29uZmlndXJhYmxlIHByb3BlcnRpZXM6XG4gICAgICpcbiAgICAgKiAtIGAkaHR0cC4kaG9zdGBcbiAgICAgKiAtIGAkaHR0cC4kcHJvdG9jb2xgXG4gICAgICogLSBgJGh0dHAuJGNvbmZpZ2BcbiAgICAgKlxuICAgICAqIGAkaHR0cC4kaG9zdGAgaXMgdGhlIGhvc3QgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGV2ZXJ5IHJlcXVlc3QuIEJ5XG4gICAgICogZGVmYXVsdCwgbm8gaG9zdCBpcyB1c2VkLiBGb3IgdXNlIGluIHRoZSBicm93c2VyIHRoaXMgaXMgZmluZSwgYXMgdGhlXG4gICAgICogYnJvd3NlciBzaW1wbHkgdXNlcyB0aGUgY3VycmVudCBob3N0LiBGb3IgdXNlIHdpdGggTm9kZUpTIGAkaHR0cC4kaG9zdGBcbiAgICAgKiBoYXMgdG8gYmUgc2V0IGFzIHRoZXJlIGlzIG5vdCBkZWZhdWx0IGhvc3QuIFNldHRpbmcgdGhlIGhvc3QgZm9yIHRoZVxuICAgICAqIGJyb3dzZXIgd2lsbCBzZW5kIGFsbCByZXF1ZXN0cyB0byB0aGUgc3BlY2lmaWVkIGhvc3QsIGFuZCBub3QgdGhlXG4gICAgICogY3VycmVudCBob3N0LiBJbiB0aGF0IGNhc2UgdGhlIGhvc3QgaGFzIHRvIHN1cHBvcnRcbiAgICAgKiBbY3Jvc3Mtb3JpZ2luIEhUVFBcbiAgICAgKiByZXF1ZXN0c10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9BY2Nlc3NfY29udHJvbF9DT1JTKS5cbiAgICAgKlxuICAgICAqIGAkaHR0cC4kcHJvdG9jb2xgIHNob3VsZCBiZSBvbmUgb2YgJ2h0dHAnIG9yICdodHRwcycsIGRlcGVuZGluZyBvbiB3aGF0XG4gICAgICogeW91ciBhcHAgdXNlcy5cbiAgICAgKlxuICAgICAqIGAkaHR0cC4kY29uZmlnYCBpcyBtZXJnZWQgaW50byB0aGUgY29uZmlnIG9iamVjdCBwYXNzZWQgdG8gYCRodHRwYCBvclxuICAgICAqIG9uZVxuICAgICAqIG9mIHRoZSBzaG9ydGhhbmQgbWV0aG9kcy4gVGhlIHNldHRpbmdzIGluIHRoZSBjb25maWcgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIGAkaHR0cGAgb3IgdGhlIHNob3J0aGFuZCBtZXRob2QgdGFrZXMgcHJlY2VkZW50OlxuICAgICAqXG4gICAgICogICAgICAkaHR0cC4kY29uZmlnLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9ICdCYXNpYyBGQEwjQic7XG4gICAgICogICAgICAkaHR0cC5wb3N0KCcvZXhhbXBsZScsIHsga2V5OiAndmFsdWUnIH0sIHtcbiAgICAgKiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICogICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ05vbmUnXG4gICAgICogICAgICAgICAgfVxuICAgICAqICAgICAgKTtcbiAgICAgKiAgICAgIC8vPT4gV2lsbCBzZW5kICdOb25lJyBhcyB0aGUgJ0F1dGhvcml6YXRpb24nIGhlYWRlci5cbiAgICAgKlxuICAgICAqIEFuIGV4YW1wbGUgY2hhbmdpbmcgYWxsIHRoZSBhdmFpbGFibGUgcHJvcGVydGllczpcbiAgICAgKlxuICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pXG4gICAgICogICAgICAgICAgLnJ1bihbJyRodHRwJywgKCRodHRwKSA9PiB7XG4gICAgICogICAgICAgICAgICAgICRodHRwLiRob3N0ID0gJ2h0dHA6Ly93d3cuZXhhbXBsZS5jb20nO1xuICAgICAqICAgICAgICAgICAgICAkaHR0cC4kcHJvdG9jb2wgPSAnaHR0cHMnO1xuICAgICAqICAgICAgICAgICAgICAkaHR0cC4kY29uZmlnLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9ICdCYXNpYyBGQEwjQidcbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqIEBjbGFzcyAkaHR0cFxuICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRvSHR0cChjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyk7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlVHlwZXNcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gdXNpbmcgTWltZW8gb24gTm9kZUpTLCBzZXR0aW5nICRob3N0IHRvIHRoZSBob3N0IHlvdSB3YW50IHRvIHNlbmRcbiAgICAgKiByZXF1ZXN0cyB0byBpcyBhIHJlcXVpcmVtZW50LlxuICAgICAqXG4gICAgICogQHByb3BlcnR5ICRob3N0XG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZG9IdHRwLiRob3N0ID0gJyc7XG4gICAgZG9IdHRwLiRwcm90b2NvbCA9ICdodHRwcyc7XG4gICAgZG9IdHRwLiRjb25maWcgPSB7XG4gICAgICAgIHByZTogW10sXG4gICAgICAgIHBvc3Q6IFtdLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIEdFVCByZXF1ZXN0XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGdldFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIFF1ZXJ5IHBhcmFtZXRlcnMgYXMgYSBoYXNoXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb25maWddIENvbmZpZyBmb3IgdGhpcyByZXF1ZXN0XG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZG9IdHRwLmdldCA9IGZ1bmN0aW9uKHVybCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgY29uZmlnLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVmFsaWRhdGVUeXBlc1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSBIRUFEIHJlcXVlc3QuIFRoZSBzZXJ2ZXIgcmVzcG9uc2Ugd2lsbCBub3QgaW5jbHVkZSBhIGJvZHlcbiAgICAgKlxuICAgICAqIEBtZXRob2QgaGVhZFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIFF1ZXJ5IHBhcmFtZXRlcnMgYXMgYSBoYXNoXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb25maWddIENvbmZpZyBmb3IgdGhpcyByZXF1ZXN0XG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZG9IdHRwLmhlYWQgPSBmdW5jdGlvbih1cmwsIHBhcmFtcywgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ0hFQUQnO1xuICAgICAgICBjb25maWcucGFyYW1zID0gcGFyYW1zO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZVR5cGVzXG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIFBPU1QgcmVxdWVzdC4gQnkgZGVmYXVsdCwgYGRhdGFgIHdpbGwgYmUgSlNPTiBlbmNvZGVkIGFuZCBzZW5kIGFzXG4gICAgICogdGhlIHJlcXVlc3QgYm9keS5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgcG9zdFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBPYmplY3QgdG8gc2VuZCBhcyByZXF1ZXN0IGJvZHkuIElmIGNvbnRlbnQtdHlwZVxuICAgICAqIGlzIHNldCB0byAnYXBwbGljYXRpb24vanNvbicgKHdoaWNoIGlzIHRoZSBkZWZhdWx0KSwgYGRhdGFgIHdpbGwgYmVcbiAgICAgKiBKU09OLWVuY29kZWQgYmVmb3JlIHNlbmRpbmdcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBjb25maWcuZGF0YSA9IGRhdGE7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlVHlwZXNcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgUFVUIHJlcXVlc3QuIEJ5IGRlZmF1bHQsIGBkYXRhYCB3aWxsIGJlIEpTT04gZW5jb2RlZCBhbmQgc2VuZCBhc1xuICAgICAqIHRoZSByZXF1ZXN0IGJvZHkuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHB1dFxuICAgICAqIEBmb3IgJGh0dHBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVcmwgeW91IHdhbnQgdG8gc2VuZCByZXF1ZXN0IHRvXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBPYmplY3QgdG8gc2VuZCBhcyByZXF1ZXN0IGJvZHkuIElmIGNvbnRlbnQtdHlwZVxuICAgICAqIGlzIHNldCB0byAnYXBwbGljYXRpb24vanNvbicgKHdoaWNoIGlzIHRoZSBkZWZhdWx0KSwgYGRhdGFgIHdpbGwgYmVcbiAgICAgKiBKU09OLWVuY29kZWQgYmVmb3JlIHNlbmRpbmdcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAucHV0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnUFVUJztcbiAgICAgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZVR5cGVzXG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIFBBVENIIHJlcXVlc3QuIEJ5IGRlZmF1bHQsIGBkYXRhYCB3aWxsIGJlIEpTT04gZW5jb2RlZCBhbmQgc2VuZCBhc1xuICAgICAqIHRoZSByZXF1ZXN0IGJvZHkuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHBhdGNoXG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVybCB5b3Ugd2FudCB0byBzZW5kIHJlcXVlc3QgdG9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIE9iamVjdCB0byBzZW5kIGFzIHJlcXVlc3QgYm9keS4gSWYgY29udGVudC10eXBlXG4gICAgICogaXMgc2V0IHRvICdhcHBsaWNhdGlvbi9qc29uJyAod2hpY2ggaXMgdGhlIGRlZmF1bHQpLCBgZGF0YWAgd2lsbCBiZVxuICAgICAqIEpTT04tZW5jb2RlZCBiZWZvcmUgc2VuZGluZ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29uZmlnXSBDb25maWcgZm9yIHRoaXMgcmVxdWVzdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGRvSHR0cC5wYXRjaCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BBVENIJztcbiAgICAgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogU2VuZCBhIERFTEVURSByZXF1ZXN0LiBEb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMgb3IgZGF0YSB0byBzZW5kXG4gICAgICogd2l0aCB0aGUgcmVxdWVzdCwgYXMgdGhlIFVSTCBzaG91bGQgaWRlbnRpZnkgdGhlIGVudGl0eSB0byBkZWxldGVcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZGVsZXRlXG4gICAgICogQGZvciAkaHR0cFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVybCB5b3Ugd2FudCB0byBzZW5kIHJlcXVlc3QgdG9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ10gQ29uZmlnIGZvciB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkb0h0dHAuZGVsZXRlID0gZnVuY3Rpb24odXJsLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnREVMRVRFJztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVmFsaWRhdGVUeXBlc1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIHJldHVybiBkb0h0dHA7XG59OyIsImZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCAmJiAoKHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbicpICYmIChvYmplY3QgaW5zdGFuY2VvZiBGdW5jdGlvbikpO1xufVxuXG4vKipcbiAqIEFuIGluc3RhbmNlIG9mIGEgcHJvbWlzZS4gQ3JlYXRlZCBhbmQgYWNjZXNzZWQgdGhyb3VnaCAkcS5cbiAqXG4gKiBAY2xhc3MgUHJvbWlzZVxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICAgIHZhciByZXNvbHZlQ2FsbGJhY2tzID0gW107XG4gICAgdmFyIHJlamVjdENhbGxiYWNrcyA9IFtdO1xuICAgIHZhciBub3RpZnlDYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgc3RhdGUgPSAncGVuZGluZyc7XG4gICAgdmFyIHJlc29sdXRpb247XG4gICAgdmFyIHJlamVjdGlvbjtcblxuICAgIHZhciBhcGkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBdHRhY2ggcmVzb2x1dGlvbiwgcmVqZWN0aW9uIGFuZCBub3RpZmljYXRpb24gaGFuZGxlcnMgdG8gdGhlIHByb21pc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgdGhlblxuICAgICAgICAgKiBAZm9yIFByb21pc2VcbiAgICAgICAgICogQGNoYWluYWJsZVxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlc29sdmUgRXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZC5cbiAgICAgICAgICogIElmIGFub3RoZXIgcHJvbWlzZSBpcyByZXR1cm5lZCwgdGhlIG5leHQgcHJvbWlzZSBpbiB0aGUgY2hhaW4gaXNcbiAgICAgICAgICogIGF0dGFjaGVkIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlLiBJZiBhIHZhbHVlIGlzIHJldHVybmVkLCB0aGUgbmV4dFxuICAgICAgICAgKiAgcHJvbWlzZSBpbiB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuZWQgdmFsdWUgaW1tZWRpYXRlbHkuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0IEV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25Ob3RpZnkgRXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBub3RpZmllZFxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhlbjogZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKTtcblxuICAgICAgICAgICAgaWYgKCgoc3RhdGUgPT09ICdwZW5kaW5nJykgfHwgKHN0YXRlID09PSAncmVzb2x2ZWQnKSkgJiYgaXNGdW5jdGlvbihcbiAgICAgICAgICAgICAgICAgICAgb25SZXNvbHZlKSkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVXcmFwcGVyKHJlc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlID0gb25SZXNvbHZlKHJlc29sdXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXR1cm5WYWx1ZSAmJiBpc0Z1bmN0aW9uKHJldHVyblZhbHVlLnRoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZS50aGVuKGZ1bmN0aW9uKG5leHRSZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKG5leHRSZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKG5leHRSZWplY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXh0UmVqZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3Jlc29sdmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlV3JhcHBlcihyZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2tzLnB1c2gocmVzb2x2ZVdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChzdGF0ZSA9PT0gJ3BlbmRpbmcnKSB8fCAoc3RhdGUgPT09ICdyZWplY3RlZCcpKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVqZWN0aW9uV3JhcHBlcihyZWplY3RXaXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKG9uUmVqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25SZWplY3QocmVqZWN0V2l0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChyZWplY3RXaXRoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09ICdyZWplY3RlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0aW9uV3JhcHBlcihyZWplY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdENhbGxiYWNrcy5wdXNoKHJlamVjdGlvbldyYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm90aWZ5Q2FsbGJhY2tzLnB1c2goZnVuY3Rpb24obm90aWZ5V2l0aCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKG9uTm90aWZ5KSkge1xuICAgICAgICAgICAgICAgICAgICBvbk5vdGlmeShub3RpZnlXaXRoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlLm5vdGlmeShub3RpZnlXaXRoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXJzIGEgcmVqZWN0aW9uIGhhbmRsZXIuIFNob3J0aGFuZCBmb3IgYC50aGVuKF8sIG9uUmVqZWN0KWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgY2F0Y2hcbiAgICAgICAgICogQGZvciBQcm9taXNlXG4gICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICogQHBhcmFtIG9uUmVqZWN0IEV4ZWN1dGVkIHdoZW5cbiAgICAgICAgICogIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkLiBSZWNlaXZlcyB0aGUgcmVqZWN0aW9uIHJlYXNvbiBhcyBhcmd1bWVudC5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXBpLnRoZW4obnVsbCwgb25SZWplY3QpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIGEgbm90aWZpY2F0aW9uIHRvIHRoZSBwcm9taXNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIG5vdGlmeVxuICAgICAgICAgKiBAZm9yIFByb21pc2VcbiAgICAgICAgICogQHBhcmFtIHsqfSBub3RpZnlXaXRoIE5vdGlmaWNhdGlvbiB2YWx1ZVxuICAgICAgICAgKi9cbiAgICAgICAgbm90aWZ5OiBmdW5jdGlvbihub3RpZnlXaXRoKSB7XG4gICAgICAgICAgICBub3RpZnlDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5vdGlmeVdpdGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlamVjdHMgdGhlIHByb21pc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgcmVqZWN0XG4gICAgICAgICAqIEBmb3IgUHJvbWlzZVxuICAgICAgICAgKiBAcGFyYW0geyp9IHJlamVjdFdpdGggUmVqZWN0aW9uIHJlYXNvbi4gV2lsbCBiZSBwYXNzZWQgb24gdG8gdGhlXG4gICAgICAgICAqICByZWplY3Rpb24gaGFuZGxlcnNcbiAgICAgICAgICovXG4gICAgICAgIHJlamVjdDogZnVuY3Rpb24ocmVqZWN0V2l0aCkge1xuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZWplY3RXaXRoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzdGF0ZSA9ICdyZWplY3RlZCc7XG4gICAgICAgICAgICByZWplY3Rpb24gPSByZWplY3RXaXRoO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXNvbHZlcyB0aGUgcHJvbWlzZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCByZXNvbHZlXG4gICAgICAgICAqIEBmb3IgUHJvbWlzZVxuICAgICAgICAgKiBAcGFyYW0geyp9IHJlc29sdmVXaXRoIFRoaXMgdmFsdWUgaXMgcGFzc2VkIG9uIHRvIHRoZSByZXNvbHV0aW9uXG4gICAgICAgICAqICBoYW5kbGVycyBhdHRhY2hlZCB0byB0aGUgcHJvbWlzZS5cbiAgICAgICAgICovXG4gICAgICAgIHJlc29sdmU6IGZ1bmN0aW9uKHJlc29sdmVXaXRoKSB7XG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXNvbHZlV2l0aCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc3RhdGUgPSAncmVzb2x2ZWQnO1xuICAgICAgICAgICAgcmVzb2x1dGlvbiA9IHJlc29sdmVXaXRoO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG59XG5cbi8qKlxuICogVGhlIGRlZmVycmVkIG9iamVjdCB0aGF0J3Mgd3JhcHBlZCBieSAkcVxuICpcbiAqIEBjbGFzcyBEZWZlcnJlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gaW5pdCBUaGlzIGNhbGxiYWNrIGlzIHBhc3NlZCB0aHJlZSBhcmd1bWVudHMsIGByZXNvbHZlYCxcbiAqICBgcmVqZWN0YCBhbmQgYG5vdGlmeWAgdGhhdCByZXNwZWN0aXZlbHkgcmVzb2x2ZSwgcmVqZWN0IG9yIG5vdGlmeSB0aGVcbiAqICBkZWZlcnJlZHMgcHJvbWlzZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBEZWZlcnJlZChpbml0KSB7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgpO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oaW5pdCkpIHtcbiAgICAgICAgaW5pdChwcm9taXNlLnJlc29sdmUsIHByb21pc2UucmVqZWN0LCBwcm9taXNlLm5vdGlmeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlZSB7eyNjcm9zc0xpbmsgXCJQcm9taXNlL3Jlc29sdmU6bWV0aG9kXCJ9fXRoZSB1bmRlcmx5aW5nXG4gICAgICAgICAqIHByb21pc2VzIHJlc29sdmV7ey9jcm9zc0xpbmt9fSBkb2N1bWVudGF0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIHJlc29sdmVcbiAgICAgICAgICogQGZvciBEZWZlcnJlZFxuICAgICAgICAgKi9cbiAgICAgICAgcmVzb2x2ZTogcHJvbWlzZS5yZXNvbHZlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZWUge3sjY3Jvc3NMaW5rIFwiUHJvbWlzZS9yZWplY3Q6bWV0aG9kXCJ9fXRoZSB1bmRlcmx5aW5nXG4gICAgICAgICAqIHByb21pc2VzIHJlamVjdHt7L2Nyb3NzTGlua319IGRvY3VtZW50YXRpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgcmVqZWN0XG4gICAgICAgICAqIEBmb3IgRGVmZXJyZWRcbiAgICAgICAgICovXG4gICAgICAgIHJlamVjdDogcHJvbWlzZS5yZWplY3QsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlZSB7eyNjcm9zc0xpbmsgXCJQcm9taXNlL25vdGlmeTptZXRob2RcIn19dGhlIHVuZGVybHlpbmdcbiAgICAgICAgICogcHJvbWlzZXMgbm90aWZ5e3svY3Jvc3NMaW5rfX0gZG9jdW1lbnRhdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBub3RpZnlcbiAgICAgICAgICogQGZvciBEZWZlcnJlZFxuICAgICAgICAgKi9cbiAgICAgICAgbm90aWZ5OiBwcm9taXNlLm5vdGlmeSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtQcm9taXNlfSBwcm9taXNlXG4gICAgICAgICAqIEBmb3IgRGVmZXJyZWRcbiAgICAgICAgICovXG4gICAgICAgIHByb21pc2U6IHByb21pc2VcbiAgICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIG1hbmFnZXMgcHJvbWlzZXMuIFVzZWQgYnkgJGh0dHAgYW5kICRyb3V0aW5nLlxuICpcbiAqICRxIGlzIHVzZWQgdG8gY3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0LCB3aGljaCBjb250YWlucyBhIHByb21pc2UuIFRoZVxuICogZGVmZXJyZWQgaXMgdXNlZCB0byBjcmVhdGUgYW5kIG1hbmFnZSBwcm9taXNlcy5cbiAqXG4gKiBBIHByb21pc2UgYWNjZXB0cyByZXNvbHV0aW9uLCByZWplY3Rpb24gYW5kIG5vdGlmaWNhdGlvbiBoYW5kbGVycyB0aGF0IGFyZVxuICogZXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBpdHNlbGYgaXMgcmVzb2x2ZWQsIHJlamVjdGVkIG9yIG5vdGlmaWVkLiBUaGVcbiAqIGhhbmRsZXJzIGFyZSBhdHRhY2hlZCB0byB0aGUgcHJvbWlzZSB2aWEgdGhlIHt7I2Nyb3NzTGluayBcIlByb21pc2UvdGhlbjptZXRob2RcIn19XG4gKiAudGhlbigpe3svY3Jvc3NMaW5rfX0gbWV0aG9kLlxuICpcbiAqIFlvdSBjYW4gYXR0YWNoIG11bHRpcGxlIGhhbmRsZXJzIGJ5IGNhbGxpbmcgLnRoZW4oKSBtdWx0aXBsZSB0aW1lcyB3aXRoXG4gKiBkaWZmZXJlbnQgaGFuZGxlcnMuIEluIGFkZGl0aW9uLCB5b3UgY2FuIGNoYWluIC50aGVuKCkgY2FsbHMuIEluIHRoaXMgY2FzZSxcbiAqIHRoZSByZXR1cm4gdmFsdWUgZnJvbSAudGhlbigpIGlzIGEgbmV3IHByb21pc2UgdGhhdCdzIGF0dGFjaGVkIHRvIHRoZSByZXNvbHZlXG4gKiBoYW5kbGVyIHBhc3NlZCB0byAudGhlbigpLiBUaGlzIHdheSB5b3UgY2FuIHJldHVybiBwcm9taXNlcyBmcm9tIHlvdXIgcmVzb2x2ZVxuICogaGFuZGxlciBhbmQgdGhlIG5leHQgLnRoZW4oKSB3aWxsIHdhaXQgdW50aWwgdGhhdCBwcm9taXNlIGlzIHJlc29sdmVkIHRvXG4gKiBjb250aW51ZS4gVXN1YWxseSB1c2VkIHRvIGRvIG11bHRpcGxlIGFzeW5jcm9ub3VzIGNhbGxzIGluIHNlcXVlbmNlLlxuICpcbiAqIEBjbGFzcyAkcVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIGluaXRpYWxpemVkIHRoZSBkZWZlcnJlZCBvYmplY3RcbiAqIHdpdGhcbiAqIEBjb25zdHJ1Y3RvclxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqL1xuZnVuY3Rpb24gJHEoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gKG5ldyBEZWZlcnJlZChjYWxsYmFjaykpLnByb21pc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGRlZmVyLiBUaGlzIG1ldGhvZCByZXF1aXJlcyBubyBhcmd1bWVudHMsIHRoZSByZXR1cm5lZCBkZWZlciBoYXNcbiAqIHRoZSBtZXRob2RzIHJlcXVpcmVkIHRvIHJlc29sdmUvcmVqZWN0L25vdGlmeSB0aGUgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICBsZXQgZGVmZXIgPSAkcS5kZWZlcigpO1xuICogICAgICBkZWZlci5wcm9taXNlLnRoZW4oKG5hbWUpID0+IGNvbnNvbGUubG9nKCdIaSAnICsgbmFtZSkpO1xuICogICAgICBkZWZlci5yZXNvbHZlKCdKb2huJyk7XG4gKiAgICAgIC8vPT4gXCJIaSBKb2huXCJcbiAqIEBtZXRob2QgZGVmZXJcbiAqIEBmb3IgJHFcbiAqIEByZXR1cm4ge0RlZmVycmVkfVxuICovXG4kcS5kZWZlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGVmZXJyZWQoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBwcm9taXNlIGFuZCByZXNvbHZlcyBpdCB3aXRoIGB2YWx1ZWAuIElmIGB2YWx1ZWAgaXMgYSBwcm9taXNlLFxuICogdGhlIHJldHVybmVkIHByb21pc2UgaXMgYXR0YWNoZWQgdG8gYHZhbHVlYC4gSWYgb25SZXNvbHZlLCBvblJlamVjdCBvclxuICogb25Ob3RpZnkgYXJlIGdpdmVuLCB0aGV5IGFyZSBhdHRhY2hlZCB0byB0aGUgbmV3IHByb21pc2UuXG4gKlxuICogQG1ldGhvZCB3aGVuXG4gKiBAZm9yICRxXG4gKiBAZXhhbXBsZVxuICogICAgICAkcS53aGVuKCdKb2huJykudGhlbigobmFtZSkgPT4gY29uc29sZS5sb2coJ0hpICcgKyBuYW1lKSk7XG4gKiAgICAgIC8vPT4gXCJIaSBKb2huXCJcbiAqIEBwYXJhbSB7KnxQcm9taXNlfSB2YWx1ZSBWYWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHJlc29sdmUgd2l0aC4gSWZcbiAqICB2YWx1ZSBpcyBhIHByb21pc2UsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIGF0dGFjaGVkIHRvIHZhbHVlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW29uUmVzb2x2ZV0gUmVzb2x2ZSBoYW5kbGVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb25SZWplY3RdIFJlamVjdGlvbiBoYW5kbGVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb25Ob3RpZnldIE5vdGlmaWNhdGlvbiBoYW5kbGVyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICovXG4kcS53aGVuID0gZnVuY3Rpb24odmFsdWUsIG9uUmVzb2x2ZSwgb25SZWplY3QsIG9uTm90aWZ5KSB7XG4gICAgdmFyIGRlZmVyID0gbmV3IERlZmVycmVkKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCwgbm90aWZ5KSB7XG4gICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS50aGVuKSB7XG4gICAgICAgICAgICB2YWx1ZS50aGVuKGZ1bmN0aW9uKHJlc29sdmVWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzb2x2ZVZhbHVlKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKG5vdGlmeVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbm90aWZ5KG5vdGlmeVZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlZmVyLnByb21pc2UudGhlbihvblJlc29sdmUsIG9uUmVqZWN0LCBvbk5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHt7I2Nyb3NzTGluayBcIiRxL3doZW46bWV0aG9kXCJ9fSRxLndoZW57ey9jcm9zc0xpbmt9fVxuICogQG1ldGhvZCByZXNvbHZlXG4gKiBAZm9yICRxXG4gKi9cbiRxLnJlc29sdmUgPSAkcS53aGVuO1xuXG4vKipcbiAqIFRha2VzIGFuIGFycmF5IG9mIHByb21pc2VzIChjYWxsZWQgaW5uZXIgcHJvbWlzZXMpIGFuZCBjcmVhdGVzIGEgbmV3IHByb21pc2VcbiAqIChjYWxsZWQgb3V0ZXIgcHJvbWlzZSkgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCB0aGUgaW5uZXIgcHJvbWlzZXMgcmVzb2x2ZS5cbiAqIElmIGFueSBvZiB0aGUgaW5uZXIgcHJvbWlzZXMgYXJlIHJlamVjdGVkLCB0aGUgb3V0ZXIgcHJvbWlzZSBpc1xuICogaW1tZWRpYXRlbHkgcmVqZWN0ZWQgYXMgd2VsbCBhbmQgYW55IG90aGVyIGlubmVyIHByb21pc2VzIGxlZnQgb3ZlciBhcmVcbiAqIGRpc2NhcmRlZC5cbiAqXG4gKiBFLmcuIGlmIHlvdSBoYXZlIHRocmVlIGlubmVyIHByb21pc2VzLCBBLCBCLCBhbmQgQywgdGhlbiB0aGUgb3V0ZXIgcHJvbWlzZSBPXG4gKiBpcyByZXNvbHZlZCBvbmNlIGFsbCB0aHJlZSBBLCBCIGFuZCBDIGFyZSByZXNvbHZlZC5cbiAqXG4gKiBJZiBBIGlzIHJlc29sdmVkLCBhbmQgQiBpcyByZWplY3RlZCwgYW5kIEMgaXMgcGVuZGluZywgdGhlbiBPIHdpbGwgYmVcbiAqIHJlamVjdGVkIHJlZ2FyZGxlc3Mgb2YgQydzIG91dGNvbWUuXG4gKlxuICogQG1ldGhvZCBhbGxcbiAqIEBleGFtcGxlXG4gKiAgICAgIGxldCBncmVldGluZyA9ICRxLmRlZmVyKCk7XG4gKiAgICAgIGxldCBuYW1lID0gJHEuZGVmZXIoKTtcbiAqXG4gKiAgICAgICRxLmFsbChbZ3JlZXRpbmcucHJvbWlzZSwgbmFtZS5wcm9taXNlXSlcbiAqICAgICAgICAgIC50aGVuKChncmVldGluZywgbmFtZSkgPT4gY29uc29sZS5sb2coZ3JlZXRpbmcgKyAnICcgKyBuYW1lKSk7XG4gKlxuICogICAgICBncmVldGluZy5yZXNvbHZlKCdXZWxjb21lJyk7XG4gKiAgICAgIG5hbWUucmVzb2x2ZSgnSm9obicpXG4gKiAgICAgIC8vPT4gXCJXZWxjb21lIEpvaG5cIlxuICogQHBhcmFtIHtBcnJheX0gcHJvbWlzZXMgQXJyYXkgb2YgcHJvbWlzZXNcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKi9cbiRxLmFsbCA9IGZ1bmN0aW9uKHByb21pc2VzKSB7XG4gICAgaWYgKCEocHJvbWlzZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9taXNlcyBuZWVkIHRvIGJlIHBhc3NlZCB0byAkcS5hbGwgaW4gYW4gYXJyYXknKTtcbiAgICB9XG5cbiAgICB2YXIgY291bnRlciA9IDA7XG4gICAgdmFyIHJlc29sdXRpb25zID0gW107XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcblxuICAgIGZ1bmN0aW9uIGNoZWNrQ29tcGxldGUoKSB7XG4gICAgICAgIGlmIChjb3VudGVyID09PSBwcm9taXNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzb2x1dGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlLCBpbmRleCkge1xuICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24ocmVzb2x1dGlvbikge1xuICAgICAgICAgICAgcmVzb2x1dGlvbnNbaW5kZXhdID0gcmVzb2x1dGlvbjtcbiAgICAgICAgICAgICsrY291bnRlcjtcbiAgICAgICAgICAgIGNoZWNrQ29tcGxldGUoKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVqZWN0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRxO1xufTsiLCIvKipcbiAqIE1pbWVvIHNoaXBzIHdpdGggYSBmZXcgYnVpbHQtaW4gaW5qZWN0YWJsZXMsIG5hbWVseSB7eyNjcm9zc0xpbmsgXCIkcVwifX1hXG4gKiBwcm9taXNlIGxpYnJhcnkgY2FsbGVkICRxe3svY3Jvc3NMaW5rfX0sIGEgbmV0d29ya2luZyB3cmFwcGVyIGNhbGxlZCAkaHR0cFxuICogYW5kIGEgcm91dGluZyBmYWNpbGl0eSBjYWxsZWQgJHJvdXRpbmcuXG4gKlxuICogQG1vZHVsZSBCdWlsdGluc1xuICovXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9Qcm9taXNlLmpzJyk7XG52YXIgUm91dGluZyA9IHJlcXVpcmUoJy4vUm91dGluZy5qcycpO1xudmFyIEh0dHAgPSByZXF1aXJlKCcuL0h0dHAuanMnKTtcbnZhciBHbG9iYWxzV3JhcHBlciA9IHJlcXVpcmUoJy4vR2xvYmFsc1dyYXBwZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbmplY3RhYmxlcykge1xuICAgIEdsb2JhbHNXcmFwcGVyLldpbmRvdy4kbmFtZSA9ICckd2luZG93JztcbiAgICBHbG9iYWxzV3JhcHBlci5XaW5kb3cuJGluamVjdCA9IFtdO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKEdsb2JhbHNXcmFwcGVyLldpbmRvdyk7XG5cbiAgICBHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cC4kbmFtZSA9ICckbm9kZUh0dHAnO1xuICAgIEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cCk7XG5cbiAgICBHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cHMuJG5hbWUgPSAnJG5vZGVIdHRwcyc7XG4gICAgR2xvYmFsc1dyYXBwZXIuTm9kZUh0dHBzLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cHMpO1xuXG4gICAgUm91dGluZy5Sb3V0aW5nLiRuYW1lID0gJyRyb3V0aW5nJztcbiAgICBSb3V0aW5nLlJvdXRpbmcuJGluamVjdCA9IFsnJHEnLCAnJHdpbmRvdyddO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKFJvdXRpbmcuUm91dGluZyk7XG5cbiAgICBQcm9taXNlLiRuYW1lID0gJyRxJztcbiAgICBQcm9taXNlLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChQcm9taXNlKTtcblxuICAgIEh0dHAuJG5hbWUgPSAnJGh0dHAnO1xuICAgIEh0dHAuJGluamVjdCA9IFsnJHdpbmRvdycsICckcScsICckbm9kZUh0dHAnLCAnJG5vZGVIdHRwcyddO1xuICAgIGluamVjdGFibGVzLmFkZChIdHRwKTtcbn07XG4iLCIvKipcbiAqIEBtb2R1bGUgQnVpbHRpbnNcbiAqL1xuXG52YXIgUm91dGVSZWNvZ25pemVyID0gcmVxdWlyZSgncm91dGUtcmVjb2duaXplcicpO1xudmFyIHBhcnNlVXJpID0gcmVxdWlyZSgncGFyc2V1cmknKTtcblxuLyoqXG4gKiAjIFJvdXRpbmcgZm9yIE1pbWVvXG4gKlxuICogVGhpcyBidWlsdGluIGhhbmRsZXMgcm91dGluZyBieSBtYW5hZ2luZyB0aGUgYnJvd3NlcnMgaGlzdG9yeSBhbmQgbWF0Y2hpbmdcbiAqIHJvdXRlcyB3aXRoIGluamVjdGFibGVzICh1c3VhbGx5IGNvbXBvbmVudHMuKVxuICpcbiAqIFRoZSBnZW5lcmFsIHdvcmtmbG93IHdvdWxkIGJlIHRvIGluamVjdCBgJHJvdXRpbmdgIGludG8gYVxuICoge3sjY3Jvc3NMaW5rIFwiTW9kdWxlL3J1bjptZXRob2RcIn19YC5ydW4oKWB7ey9jcm9zc0xpbmt9fSBpbmplY3RhYmxlIG9uIHlvdXJcbiAqIHJvb3QgbW9kdWxlIGFsb25nIHdpdGggdGhlIGluamVjdGFibGVzIHlvdSB3YW50IHRvIG1hdGNoIHRvIHRoZSByb3V0ZXMsIGFuZFxuICoge3sjY3Jvc3NMaW5rIFwiJHJvdXRpbmcvc2V0Om1ldGhvZFwifX1kZWZpbmUgcm91dGVzIHRoZXJle3svY3Jvc3NMaW5rfX06XG4gKlxuICogICAgICBtaW1lby5tb2R1bGUoJ2V4YW1wbGUnLCBbXSlcbiAqICAgICAgICAgIC5ydW4oW1xuICogICAgICAgICAgICAgICckcm91dGluZycsXG4gKiAgICAgICAgICAgICAgJ3VzZXJzQ29tcG9uZW50JyxcbiAqICAgICAgICAgICAgICAnbG9naW5Db21wb25lbnQnLFxuICogICAgICAgICAgICAgICgkcm91dGluZykgPT4ge1xuICogICAgICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy91c2VycycsIHVzZXJzQ29tcG9uZW50KTtcbiAqICAgICAgICAgICAgICAgICAgJHJvdXRpbmcuc2V0KCcvbG9naW4nLCBsb2dpbkNvbXBvbmVudCk7XG4gKiAgICAgICAgICAgICAgfVxuICogICAgICAgICAgKTtcbiAqXG4gKiAjIyBHZW5lcmF0aW5nIG91dHB1dFxuICpcbiAqIEhvdyBvdXRwdXQgaXMgZ2VuZXJhdGVkIGlzIHVwIHRvIHRoZSBtYXRjaGVkIGluamVjdGFibGUuIE9uY2UgYW4gaW5qZWN0YWJsZVxuICogaXMgbWF0Y2hlZCB0byBhIHJvdXRlLCBpdCBpcyBpbnZva2VkIHdpdGggdGhyZWUgcGFyYW1ldGVyczpcbiAqXG4gKiAtIGNvbnRleHRcbiAqIC0gcmVuZGVyZXJcbiAqIC0gdGFyZ2V0RE9NTm9kZVxuICpcbiAqIENvbnRleHQgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG1hdGNoZWQgcm91dGUuIFNlZVxuICoge3sjY3Jvc3NMaW5rIFwiJHJvdXRpbmcvc2V0Om1ldGhvZFwifX10aGUgYHNldGAgbWV0aG9kIGZvciBtb3JlIGRldGFpbHNcbiAqIHt7L2Nyb3NzTGlua319LiBSZW5kZXJlciBpcyBhIGhlbHBlciB0byBwcm9kdWNlIG91dHB1dCBhbmQgY2FuIGJlXG4gKiBjb25maWd1cmVkLlxuICogdGFyZ2V0RE9NTm9kZSBpcyB0aGUgRE9NIG5vZGUgdGhhdCB3YXMgYXNzb2NpYXRlZCB3aXRoIHRoZSByb3V0ZS5cbiAqXG4gKiBTaW5jZSB0aGUgaW5qZWN0YWJsZSBoYXMgYWNjZXNzIHRvIHRoZSBET00gbm9kZSwgaXQgY2FuIHNpbXBseSB1cGRhdGUgdGhlXG4gKiBub2RlcyBjb250ZW50IHRvIHByb2R1Y2Ugb3V0cHV0LiBUaGUgYHJlbmRlcmVyYCBpcyBub3Qgc3RyaWN0bHkgbmVjZXNzYXJ5LlxuICogSG93ZXZlciwgd2hlbiB1c2luZyBhIHJlbmRlcmluZyBsaWJyYXJ5IGxpa2UgUmVhY3QsIG1hbnVhbGx5IGNhbGxpbmdcbiAqIFJlYWN0RE9NLnJlbmRlcihleGFtcGxlQ29tcG9uZW50LCB0YXJnZXRET01Ob2RlKSBpcyBhbm5veWluZyBhbmQgYWxzbyBtYWtlc1xuICogaXQgaW1wb3NzaWJsZSB0byBzd2l0Y2ggdG8gZS5nLlxuICogUmVhY3RET01TZXJ2ZXIucmVuZGVyVG9TdGF0aWNNYXJrdXAoZXhhbXBsZUNvbXBvbmVudCkgdG8gcHJvZHVjZSBvdXRwdXRcbiAqIGluIE5vZGVKUy5cbiAqXG4gKiBVc2luZyBhIHJlbmRlcmVyIGhhcyB0aGUgYWR2YW50YWdlIG9mIGJlaW5nIGFibGUgdG8gY2hhbmdlIHRoZSByZW5kZXJpbmdcbiAqIG1ldGhvZCBkZXBlbmRpbmcgb24gdGhlIGVudmlyb25tZW50IHRoZSBhcHAgaXMgaW4uIFVzaW5nXG4gKiB7eyNjcm9zc0xpbmtcbiAqIFwiJHJvdXRpbmcvc2V0TWFrZVJlbmRlcmVyOm1ldGhvZFwifX1gc2V0TWFrZVJlbmRlcmVyYHt7L2Nyb3NzTGlua319XG4gKiB0byBkZWZpbmUgYSBkZWZhdWx0IHJlbmRlcmVyIGFsbG93cyB0aGUgbWF0Y2hlZCBpbmplY3RhYmxlIHRvIHNpbXBseSBjYWxsXG4gKiBgcmVuZGVyZXIoZXhhbXBsZUNvbXBvbmVudClgIGFuZCBub3QgZGVhbCB3aXRoIHRoZSBzcGVjaWZpY3Mgb2YgZ2VuZXJhdGluZ1xuICogb3V0cHV0LiBBbiBleGFtcGxlIGZvciBSZWFjdDpcbiAqXG4gKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICogICAgICAgICAgLy8gdGFyZ2V0IGlzIG5vdCB1c2VkIHNpbmNlIHRoZSBjdXN0b20gcmVuZGVyZXIgd2lsbCB0YWtlIGNhcmUgb2ZcbiAqICAgICAgICAgIC8vIG1vdW50aW5nIHRoZSByZWFjdCBub2RlXG4gKiAgICAgICAgICAuY29tcG9uZW50KFsndXNlcnNDb21wb25lbnQnLCAoKSA9PiAoJGNvbnRleHQsICRyZW5kZXIpID0+IHtcbiAqICAgICAgICAgICAgICBsZXQgVXNlcnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7fSk7IC8vIGV4YW1wbGUgY29tcG9uZW50XG4gKlxuICogICAgICAgICAgICAgIHJldHVybiAkcmVuZGVyKDxVc2VycyAvPik7XG4gKiAgICAgICAgICB9KVxuICogICAgICAgICAgLnJ1bihbJyRyb3V0aW5nJywgJ3VzZXJzQ29tcG9uZW50JywgKCRyb3V0aW5nLCB1c2Vyc0NvbXBvbmVudCkgPT4ge1xuICogICAgICAgICAgICAgICRyb3V0aW5nLnNldE1ha2VSZW5kZXJlcihmdW5jdGlvbih0YXJnZXRET01Ob2RlKSB7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihyZWFjdE5vZGUpIHtcbiAqICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSZWFjdERPTS5yZW5kZXIocmVhY3ROb2RlLCB0YXJnZXRET01Ob2RlKTtcbiAqICAgICAgICAgICAgICAgICAgfTtcbiAqICAgICAgICAgICAgICB9KTtcbiAqXG4gKiAgICAgICAgICAgICAgJHJvdXRpbmcuc2V0KCcvdXNlcnMnLCB1c2Vyc0NvbXBvbmVudCk7XG4gKiAgICAgICAgICB9KTtcbiAqXG4gKiAjIyBJbml0aWF0ZSByb3V0aW5nXG4gKlxuICogVGhlcmUgYXJlIHRocmVlIHdheXMgdG8gY2hhbmdlIHRoZSBjdXJyZW50IHJvdXRlOlxuICpcbiAqIC0ge3sjY3Jvc3NMaW5rIFwiJHJvdXRpbmcvZ290bzptZXRob2RcIn19Z290b3t7L2Nyb3NzTGlua319XG4gKiAtIGEtdGFnIHdpdGggYSBocmVmIGFuZCBhICdkYXRhLWludGVybmFsJyBhdHRyaWJ1dGVcbiAqIC0gYS10YWcgd2l0aCBhIGhyZWYsIGEgJ2RhdGEtaW50ZXJuYWwnIGFuZCAnZGF0YS1uby1oaXN0b3J5JyBhdHRyaWJ1dGVcbiAqXG4gKiBgLmdvdG8oKWAgaXMgbWFpbmx5IHVzZWQgZm9yIHNlcnZlci1zaWRlIHJlbmRlcmluZy4gSWYgeW91IHNldCBhXG4gKiB7eyNjcm9zc0xpbmsgXCIkcm91dGluZy9zZXRNYWtlUmVuZGVyZXI6bWV0aG9kXCJ9fWEgcmVuZGVyZXJ7ey9jcm9zc0xpbmt9fSB0aGF0XG4gKiBzdXBwb3J0cyBzZXJ2ZXItc2lkZSBvdXRwdXQsIHlvdSB3b24ndCBoYXZlIHRvIGNoYW5nZSB5b3VyIGNvbXBvbmVudHMgdG9cbiAqIGdlbmVyYXRlIHRoZSBvdXRwdXQuIGAuZ290bygpYCB3aWxsIHJldHVybiBhIHByb21pc2UgdGhhdCBpcyBmdWxsLWZpbGxlZFxuICogd2l0aCB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGNvbXBvbmVudC4gWW91IGNhbiBoYXZlIHlvdXIgc2VydmVyLXNpZGVcbiAqIGVudHJ5LXBvaW50IGF0dGFjaCB0byB0aGF0IHByb21pc2UgYW5kIHRoZW4gZG8gd2l0aCB0aGUgb3V0cHV0IHdoYXQgeW91XG4gKiBuZWVkIChlLmcuIHNlbmQgYW4gZW1haWwsIHNhdmUgdG8gYSBzdGF0aWMgLmh0bWwgZmlsZSwgZXRjLilcbiAqXG4gKiBUaGUgb3RoZXIgdHdvIGFyZSBzaW1wbHkgYS10YWdzIGluIHlvdXIgaHRtbC4gYCRyb3V0aW5nYCBhdHRhY2hlcyBhbiBldmVudFxuICogaGFuZGxlciB0byB0aGUgZG9jdW1lbnQgdGhhdCBsaXN0ZW5zIHRvIGNsaWNrcyBvbiBhLXRhZ3Mgd2l0aCBhXG4gKiAnZGF0YS1pbnRlcm5hbCcgYXR0cmlidXRlLiBUaGUgdmFsdWUgZnJvbSB0aGUgJ2hyZWYnIGF0dHJpYnV0ZSBpcyB1c2VkIGFzIHRoZVxuICogcm91dGUgdG8gaGFuZGxlLiBUaGUgJ2RhdGEtbm8taGlzdG9yeScgYXR0cmlidXRlIGNvbnRyb2xzIHdoZXRoZXIgYSBuZXdcbiAqIGJyb3dzZXItaGlzdG9yeSBlbnRyeSBpcyBjcmVhdGVkLiBJZiB0aGUgYXR0cmlidXRlIGlzIHByZXNlbnQsIG5vIGhpc3RvcnlcbiAqIGlzIGNyZWF0ZWQuXG4gKlxuICogQGNsYXNzICRyb3V0aW5nXG4gKiBAc3RhdGljXG4gKi9cbmZ1bmN0aW9uIFJvdXRpbmcoJHEsICR3aW5kb3cpIHtcbiAgICB2YXIgcm91dGluZyA9IG5ldyBSb3V0ZVJlY29nbml6ZXIoKTtcbiAgICB2YXIgZGVmYXVsdFJvdXRlO1xuICAgIHZhciBhbnlSb3V0ZUhhbmRsZWQgPSBmYWxzZTtcbiAgICB2YXIgbWFrZVJlbmRlcmVyID0gZnVuY3Rpb24odGFyZ2V0QXNET01Ob2RlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih0b1JlbmRlcikge1xuICAgICAgICAgICAgdGFyZ2V0QXNET01Ob2RlLmlubmVySFRNTCA9IHRvUmVuZGVyO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogSW50ZXJuZXQgZXhwbG9yZXIgc3VwcG9ydFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuICAgICAgICBpZiAoZWxlbWVudFthdHRyaWJ1dGVdKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudFthdHRyaWJ1dGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZSA9IG51bGw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5vZGVOYW1lID09PSBhdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS5ub2RlVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9EZWZhdWx0Um91dGUocm91dGUpIHtcbiAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCAnJywgcm91dGUpO1xuICAgICAgICByZXR1cm4gZG9Sb3V0aW5nKHJvdXRlLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcXVlcnlUb0RpY3QocXVlcnkpIHtcbiAgICAgICAgdmFyIGRpY3QgPSB7fTtcbiAgICAgICAgcXVlcnkuc3BsaXQoJyYnKS5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnQuc3BsaXQoJz0nKS5tYXAoZGVjb2RlVVJJQ29tcG9uZW50KTtcbiAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgICAgICBpZiAoZGljdFtwYXJ0WzBdXSkge1xuICAgICAgICAgICAgICAgIGlmICghKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkaWN0W3BhcnRbMF1dKSA9PSAnW29iamVjdCBBcnJheV0nKSkge1xuICAgICAgICAgICAgICAgICAgICBkaWN0W3BhcnRbMF1dID0gW2RpY3RbcGFydFswXV1dO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRpY3RbcGFydFswXV0ucHVzaChwYXJ0WzFdKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0W3BhcnRbMF1dID0gcGFydFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRpY3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9Sb3V0aW5nKHVybCwgZG9EZWZhdWx0KSB7XG4gICAgICAgIGFueVJvdXRlSGFuZGxlZCA9IHRydWU7XG4gICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhcnNlVXJpKHVybCk7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHJvdXRpbmcucmVjb2duaXplKHVybFBhcnRzLnBhdGgpO1xuICAgICAgICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyICRjb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybFBhcnRzLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IGhhbmRsZXJzW2ldLnBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5VG9EaWN0KHVybFBhcnRzLnF1ZXJ5KVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJzW2ldLmhhbmRsZXIoJGNvbnRleHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgoZG9EZWZhdWx0ICE9PSBmYWxzZSkgJiYgZGVmYXVsdFJvdXRlKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRvRGVmYXVsdFJvdXRlKGRlZmF1bHRSb3V0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ290b1JvdXRlKHJvdXRlKSB7XG4gICAgICAgICR3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCxcbiAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgcm91dGUpO1xuICAgICAgICByZXR1cm4gZG9Sb3V0aW5nKHJvdXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlUm91dGUocm91dGUpIHtcbiAgICAgICAgJHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLFxuICAgICAgICAgICAgJycsXG4gICAgICAgICAgICByb3V0ZSk7XG5cbiAgICAgICAgcmV0dXJuIGRvUm91dGluZyhyb3V0ZSk7XG4gICAgfVxuXG4gICAgJHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvUm91dGluZygkd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgIH07XG5cbiAgICAkd2luZG93Lm9uY2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogUmVsYXRlZCB0byBTYWZhcmkgZmlyaW5nIGV2ZW50cyBvbiB0ZXh0IG5vZGVzXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnZGF0YS1pbnRlcm5hbCcpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwcmV2ZW50RGVmYXVsdChldmVudCk7XG5cbiAgICAgICAgICAgIGlmIChnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnZGF0YS1uby1oaXN0b3J5JykgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlUm91dGUoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2hyZWYnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvdG9Sb3V0ZShnZXRBdHRyaWJ1dGUodGFyZ2V0LCAnaHJlZicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvKlxuICAgICAgICAgKiBJZiBhIHJvdXRlIGlzIGhhbmRsZWQgYmVmb3JlIC5vbmxvYWQgaXMgZmlyZWQgKGUuZy4gYnkgY2FsbGluZ1xuICAgICAgICAgKiAuZ290bygpKSwgdGhlbiBkb24ndCBkbyByb3V0aW5nLiBUaGlzIHByZXZlbnRzIGEgZG91YmxlLWxvYWQgYXMgdGhlXG4gICAgICAgICAqIHJvdXRlIGhhcyBhbHJlYWR5IGJlZW4gaGFuZGxlZC5cbiAgICAgICAgICovXG4gICAgICAgIGlmICghYW55Um91dGVIYW5kbGVkKSB7XG4gICAgICAgICAgICBkb1JvdXRpbmcoJHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IGEgZGVmYXVsdCByb3V0ZSB0byByZWRpcmVjdCB0byB3aGVuIHRoZSBjdXJyZW50IHJvdXRlIGlzbid0XG4gICAgICAgICAqIG1hdGNoZWQgdG8gYW55dGhpbmdcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBzZXREZWZhdWx0Um91dGVcbiAgICAgICAgICogQGZvciAkcm91dGluZ1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3RGVmYXVsdFJvdXRlIFRoZSBkZWZhdWx0IHBhdGggdG8gcm91dGUgdG8gaWYgdGhlXG4gICAgICAgICAqICBjdXJyZW50IHBhdGggd2Fzbid0IG1hdGNoZWQgYnkgYW55IGRlZmluZWQgcm91dGVcbiAgICAgICAgICovXG4gICAgICAgICdzZXREZWZhdWx0Um91dGUnOiBmdW5jdGlvbihuZXdEZWZhdWx0Um91dGUpIHtcbiAgICAgICAgICAgIGlmICghKCh0eXBlb2YgbmV3RGVmYXVsdFJvdXRlID09PSAnc3RyaW5nJykgfHwgbmV3RGVmYXVsdFJvdXRlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGRlZmF1bHQgcm91dGUgbXVzdCBiZSBnaXZlbiBhcyBhIHN0cmluZywgZS5nLiBcIi9hcHBcIicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWZhdWx0Um91dGUgPSBuZXdEZWZhdWx0Um91dGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBhIGN1c3RvbSBmYWN0b3J5IGZvciByZW5kZXIgZnVuY3Rpb25zXG4gICAgICAgICAqXG4gICAgICAgICAqIFJlbmRlciBmYWN0b3JpZXMgcmVjZWl2ZSB0aGUgRE9NIHRhcmdldCBub2RlIGZvciB0aGUgcm91dGUgYW5kXG4gICAgICAgICAqIHByb2R1Y2UgYW4gZXhlY3V0YWJsZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlbmRlciBjb250ZW50ICh0aGF0XG4gICAgICAgICAqIGV4ZWN1dGFibGUgaXMgY2FsbGVkIGByZW5kZXJlcmApLlxuICAgICAgICAgKlxuICAgICAgICAgKiBBIG5ldyByZW5kZXJlciBpcyBjcmVhdGVkIGV2ZXJ5IHRpbWUgYSByb3V0ZSBpcyBtYXRjaGVkIGJ5IHBhc3NpbmdcbiAgICAgICAgICogdGhlIHJvdXRlcyB0YXJnZXQgRE9NIG5vZGUgdG8gdGhlIG1ha2VSZW5kZXJlciBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogUmVuZGVyZXIgZnVuY3Rpb25zIGFyZSBwYXNzZWQgdG8gdGhlIGluamVjdGFibGUgdGhhdCBpcyBtYXRjaGVkIHdpdGhcbiAgICAgICAgICogdGhlIHJvdXRlLiBgc2V0TWFrZVJlbmRlcmVyYCBzZXRzIHRoZSBmYWN0b3J5IHRoYXQgY3JlYXRlcyB0aGVcbiAgICAgICAgICogcmVuZGVyIGZ1bmN0aW9ucy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGRlZmF1bHQgbWFrZVJlbmRlcmVyIGZhY3RvcnkgcHJvZHVjZXMgcmVuZGVyZXIgZnVuY3Rpb25zIHRoYXRcbiAgICAgICAgICogc2ltcGx5IHNldCBpbm5lckhUTUwgb24gdGhlIHRhcmdldCBET00gbm9kZTpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBmdW5jdGlvbih0YXJnZXRBc0RPTU5vZGUpIHtcbiAgICAgICAgICogICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRvUmVuZGVyKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICB0YXJnZXRBc0RPTU5vZGUuaW5uZXJIVE1MID0gdG9SZW5kZXI7XG4gICAgICAgICAqICAgICAgICAgIH07XG4gICAgICAgICAqICAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgaW5qZWN0YWJsZSBmb3IgYW55IGdpdmVuIHJvdXRlIGNhbiB1c2UgdGhlIHJlbmRlciBtZXRob2QgbGlrZVxuICAgICAgICAgKiB0aGlzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIG1pbWVvLm1vZHVsZSgnZXhhbXBsZScsIFtdKVxuICAgICAgICAgKiAgICAgICAgICAuY29tcG9uZW50KFsnY29tcG9uZW50JywgKCkgPT4gKCRjb250ZXh0LCAkcmVuZGVyZXIpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICRyZW5kZXJlcignPGgxPkhlYWRsaW5lIGNvbnRlbnQ8L2gxPicpO1xuICAgICAgICAgKiAgICAgICAgICB9XSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoZW4gdXNpbmcgYSByZW5kZXJpbmcgbGlicmFyeSwgaXQncyBvZnRlbiBiZW5lZmljaWFsIHRvIHNldCBhXG4gICAgICAgICAqIGN1c3RvbVxuICAgICAgICAgKiByZW5kZXJlciBmYWN0b3J5IHRvIHNpbXBsaWZ5IHJlbmRlcmluZyBpbiB0aGUgY29tcG9uZW50LiBFLmcuIHdpdGhcbiAgICAgICAgICogUmVhY3QsIGN1c3RvbSBjb21wb25lbnRzIGFyZSBtb3VudGVkIG9uIERPTSBub2RlcyB2aWFcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBSZWFjdERPTS5yZW5kZXIoPENvbXBvbmVudC8+LCBET01Ob2RlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogQSBjdXN0b20gYHNldE1ha2VSZW5kZXJlcmAgZm9yIFJlYWN0IHdvdWxkIGNyZWF0ZSBhIGZ1bmN0aW9uIHRoYXRcbiAgICAgICAgICogYWNjZXB0cyBhIFJlYWN0IGNvbXBvbmVudCBhbmQgbW91bnRzIGl0IHRvIHRoZSByb3V0ZXMgdGFyZ2V0IERPTVxuICAgICAgICAgKiBub2RlOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICRyb3V0aW5nLnNldE1ha2VSZW5kZXJlcihmdW5jdGlvbih0YXJnZXRET01Ob2RlKSB7XG4gICAgICAgICAqICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICogICAgICAgICAgICAgIFJlYWN0RE9NLnJlbmRlcihjb21wb25lbnQsIHRhcmdldERPTU5vZGUpO1xuICAgICAgICAgKiAgICAgICAgICB9XG4gICAgICAgICAqICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2Qgc2V0TWFrZVJlbmRlcmVyXG4gICAgICAgICAqIEBmb3IgJHJvdXRpbmdcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV3TWFrZVJlbmRlcmVyIC0gU2V0IHRoZSByZW5kZXJlciBmYWN0b3J5LiBHZXRzXG4gICAgICAgICAqIHRoZSByb3V0ZXMgdGFyZ2V0IERPTSBub2RlIHBhc3NlZCBpblxuICAgICAgICAgKi9cbiAgICAgICAgJ3NldE1ha2VSZW5kZXJlcic6IGZ1bmN0aW9uKG5ld01ha2VSZW5kZXJlcikge1xuICAgICAgICAgICAgaWYgKCEobmV3TWFrZVJlbmRlcmVyIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgbWFrZVJlbmRlcmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtYWtlUmVuZGVyZXIgPSBuZXdNYWtlUmVuZGVyZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldHMgYSBoYW5kbGVyIGZvciBhIHJvdXRlLiBUaGVyZSBjYW4gYmUgbXVsdGlwbGUgaGFuZGxlcnMgZm9yIGFueVxuICAgICAgICAgKiByb3V0ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIHJvdXRlIG1hdGNoaW5nIGlzIGhhbmRsZWQgYnkgKHRoZSByb3V0ZS1yZWNvZ25pemVyIHBhY2thZ2UsXG4gICAgICAgICAqIHJlYWQgdGhlIGRvY3MgcmVnYXJkaW5nIHRoZSByb3V0ZSBzeW50YXhcbiAgICAgICAgICogaGVyZSlbaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcm91dGUtcmVjb2duaXplciN1c2FnZV0uIFlvdSBjYW5cbiAgICAgICAgICogY2FwdHVyZSBwYXJ0cyBvZiB0aGUgdXJsIHdpdGggYDpuYW1lYCBhbmQgYCpuYW1lYDpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAkcm91dGluZy5zZXQoJy91c2Vycy86aWQnKVxuICAgICAgICAgKiAgICAgIC8vPT4gbWF0Y2hlcyAvdXNlcnMvMSB0byB7IGlkOiAxIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAkcm91dGluZy5zZXQoJy9hYm91dC8qcGF0aCcpXG4gICAgICAgICAqICAgICAgLy89PiBtYXRjaGVzIC9hYm91dC9sb2NhdGlvbi9jaXR5IHRvIHsgcGF0aDogJ2xvY2F0aW9uL2NpdHknIH1cbiAgICAgICAgICpcbiAgICAgICAgICogQ2FwdHVyZWQgc2VnbWVudHMgb2YgdGhlIHVybCB3aWxsIGJlIGF2YWlsYWJsZSBpbiBgJGNvbnRleHQucGFyYW1zYC5cbiAgICAgICAgICpcbiAgICAgICAgICogU2V0dGluZyBhIHJvdXRlIG1hdGNoZXMgYW4gaW5qZWN0YWJsZSB3aXRoIGEgdXJsOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICRyb3V0aW5nLnNldCgnL2V4YW1wbGUtdXJsJywgZXhhbXBsZUluamVjdGFibGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgaW5qZWN0YWJsZSB0aGF0IHdpbGwgcmVjZWl2ZSB0aHJlZSBwYXJhbWV0ZXJzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAtICRjb250ZXh0IC0gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgcm91dGUgYW5kIGFjY2VzcyB0byB1cmxcbiAgICAgICAgICogcGFyYW1ldGVyc1xuICAgICAgICAgKiAtICRyZW5kZXJlciAtIHRoZSByZW5kZXJlciAkcm91dGluZyBpcyBjb25maWd1cmVkIHRvIHVzZS4gRGVmYXVsdFxuICAgICAgICAgKiBqdXN0IHNldCB0aGUgaHRtbCBjb250ZW50IG9mIHRoZSB0YXJnZXQgRE9NIG5vZGVcbiAgICAgICAgICogLSAkdGFyZ2V0IC0gRE9NIG5vZGUgdGhhdCB0aGUgY29udGVudCBzaG91bGQgZW5kIHVwIGluLiBVc2VmdWwgaWZcbiAgICAgICAgICogeW91IGRvbid0IHdhbnQgdG8gdXNlICRyZW5kZXJlciBmb3IgYSBzcGVjaWZpYyByb3V0ZVxuICAgICAgICAgKlxuICAgICAgICAgKiBTZXQgcm91dGVzIGluIGEgYC5ydW4oKWAgYmxvY2sgb24geW91ciByb290IG1vZHVsZTpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBtaW1lby5ib290c3RyYXAoJ2V4YW1wbGUnLCBbXSlcbiAgICAgICAgICogICAgICAgICAgLmNvbXBvbmVudChbJ3VzZXJzJywgKCkgPT4gKCRjb250ZXh0LCAkcmVuZGVyZXIpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICRyZW5kZXJlcignPHVsPjxsaT5Kb2huPC9saT48bGk+QWxpY2U8L2xpPC91bD4nKTtcbiAgICAgICAgICogICAgICAgICAgfV0pXG4gICAgICAgICAqICAgICAgICAgIC5jb21wb25lbnQoWydsb2dpbkZvcm0nLCAoKSA9PiAoJGNvbnRleHQsICRyZW5kZXJlcikgPT4ge1xuICAgICAgICAgKiAgICAgICAgICAgICAgJHJlbmRlcmVyKCc8Zm9ybT48L2Zvcm0+Jyk7XG4gICAgICAgICAqICAgICAgICAgIH1dKVxuICAgICAgICAgKiAgICAgICAgICAucnVuKFtcbiAgICAgICAgICogICAgICAgICAgICAgICckcm91dGluZycsXG4gICAgICAgICAqICAgICAgICAgICAgICAndXNlcnMnLFxuICAgICAgICAgKiAgICAgICAgICAgICAgJ2xvZ2luRm9ybScsXG4gICAgICAgICAqICAgICAgICAgICAgICAoJHJvdXRpbmcsIHVzZXJzLCBsb2dpbkZvcm0pID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy91c2VycycsIHVzZXJzKTtcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAkcm91dGluZy5zZXQoJy9sb2dpbicsIGxvZ2luRm9ybSk7XG4gICAgICAgICAqICAgICAgICAgICAgICB9XG4gICAgICAgICAqICAgICAgICAgIF0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgYC5ydW4oKWAgYmxvY2sgbmVlZHMgdG8gaGF2ZSBhbGwgY29tcG9uZW50LWluamVjdGFibGVzIHlvdSB3YW50XG4gICAgICAgICAqIHRvIHNldCBhcyByb3V0ZSBoYW5kbGVycyBpbmplY3RlZC4gYC5zZXQoKWAgcmVxdWlyZXMgdGhlIGFjdHVhbFxuICAgICAgICAgKiBpbmplY3RhYmxlcyB0byBiZSBwYXNzZWQgaW4sIG5vdCB0aGUgaW5qZWN0YWJsZXMgbmFtZS5cbiAgICAgICAgICpcbiAgICAgICAgICogJGNvbnRleHQgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgcm91dGUsIGl0IGhhcyB0aHJlZVxuICAgICAgICAgKiBhdHRyaWJ1dGVzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAtIGAkY29udGV4dC5wYXJhbXNgIHdpbGwgY29udGFpbiBhbnkgbWF0Y2hlZCBzZWdtZW50cyBmcm9tIHRoZSB1cmwuXG4gICAgICAgICAqIC0gYCRjb250ZXh0LnF1ZXJ5YCB3aWxsIGNvbnRhaW4gZGVjb2RlZCBxdWVyeSBwYXJhbWV0ZXJzIGFzIGFcbiAgICAgICAgICoga2V5LXZhbHVlIGhhc2guIFJlcGVhdGluZyBrZXlzIHdpbGwgY3JlYXRlIGFuIGFycmF5OlxuICAgICAgICAgKiBgL2V4YW1wbGU/YT0xJmI9MiZjPTMgLy89PiB7IGE6IFsxLCAyLCAzXSB9YFxuICAgICAgICAgKiAtIGAkY29udGV4dC51cmxgIHJlcHJlc2VudHMgdGhlIHBhcnNlZCB1cmwgYXMgYSBrZXktdmFsdWUgc3RvcmUuXG4gICAgICAgICAqXG4gICAgICAgICAqIGAkY29udGV4dC51cmxgIGV4YW1wbGUgZm9yXG4gICAgICAgICAqIGBodHRwOi8vbG9jYWxob3N0OjMwMDAvP2V4YW1wbGUta2V5PXZhbHVlYDpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAkY29udGV4dC51cmwgPSB7XG4gICAgICAgICAqICAgICAgICAgIGFuY2hvcjogJycsXG4gICAgICAgICAqICAgICAgICAgIGF1dGhvcml0eTogJ2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgICogICAgICAgICAgZGlyZWN0b3J5OiAnLycsXG4gICAgICAgICAqICAgICAgICAgIGZpbGU6ICcnLFxuICAgICAgICAgKiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICogICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgKiAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAqICAgICAgICAgIHBvcnQ6ICczMDAwJyxcbiAgICAgICAgICogICAgICAgICAgcHJvdG9jb2w6ICdodHRwJyxcbiAgICAgICAgICogICAgICAgICAgcXVlcnk6ICdleGFtcGxlLWtleT12YWx1ZScsXG4gICAgICAgICAqICAgICAgICAgIHJlbGF0aXZlOiAnLz9leGFtcGxlLWtleT12YWx1ZScsXG4gICAgICAgICAqICAgICAgICAgIHNvdXJjZTogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8/ZXhhbXBsZS1rZXk9dmFsdWUnLFxuICAgICAgICAgKiAgICAgICAgICB1c2VyOiAnJyxcbiAgICAgICAgICogICAgICAgICAgdXNlckluZm86ICcnXG4gICAgICAgICAqICAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIHNldFxuICAgICAgICAgKiBAZm9yICRyb3V0aW5nXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByb3V0ZVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0XG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGluamVjdGFibGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICAgICAgICAgKi9cbiAgICAgICAgJ3NldCc6IGZ1bmN0aW9uKHJvdXRlLCB0YXJnZXQsIGluamVjdGFibGUsIG5hbWUpIHtcbiAgICAgICAgICAgIGlmICghKGluamVjdGFibGUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9ICdUbyBzZXQgYSByb3V0ZSwgeW91IGhhdmUgdG8gcHJvdmlkZSBhbiBpbmplY3RhYmxlIHRoYXQgaXMgZXhlY3V0YWJsZSAoaS5lLiBpbnN0YW5jZW9mIEZ1bmN0aW9uKS4gUm91dGU6ICcgKyByb3V0ZSArICcsIHN0cmluZ2lmaWVkIGluamVjdGFibGU6IFwiJyArIFN0cmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGUgKyAnXCInKTtcbiAgICAgICAgICAgICAgICBpZiAoKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSAmJiAoKGluamVjdGFibGUgaW5zdGFuY2VvZiBTdHJpbmcpIHx8ICh0eXBlb2YgaW5qZWN0YWJsZSA9PT0gJ3N0cmluZycpKSkge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcuIFRhcmdldCBpcyBhIGZ1bmN0aW9uIGFuZCBpbmplY3RhYmxlIGlzIGEgc3RyaW5nLiBZb3UgbWlnaHQgaGF2ZSBzd2l0Y2hlZCB0aGUgcGFyYW1ldGVycywgcGxlYXNlIGRvdWJsZS1jaGVjayB0aGF0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb3V0aW5nLmFkZChbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiByb3V0ZSxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oJGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW5kZXJSZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0QXNET01Ob2RlID0gJHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gbWFrZVJlbmRlcmVyKHRhcmdldEFzRE9NTm9kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmplY3RhYmxlLnJlbmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclJldHVybiA9IGluamVjdGFibGUucmVuZGVyKCRjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXNET01Ob2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyUmV0dXJuID0gaW5qZWN0YWJsZSgkY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFzRE9NTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKHJlbmRlclJldHVybik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLCB7J2FzJzogbmFtZX0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXRjaGVzIGByb3V0ZWAgYW5kIGV4ZWN1dGVzIGFsbCBhc3NvY2lhdGVkIGluamVjdGFibGVzXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSByZXR1cm4gdmFsdWVzIGZyb20gdGhlIG1hdGNoZWQgaW5qZWN0YWJsZXMgYXJlIHR1cm5lZCBpbnRvIGFcbiAgICAgICAgICogcHJvbWlzZSB1c2luZyB7eyNjcm9zc0xpbmtcbiAgICAgICAgICogXCIkcS93aGVuOm1ldGhvZFwifX0kcS53aGVuKCl7ey9jcm9zc0xpbmt9fSxcbiAgICAgICAgICogYW5kIHRoZW4gYWdncmVnYXRlZCB3aXRoIHt7I2Nyb3NzTGlua1xuICAgICAgICAgKiBcIiRxL2FsbDptZXRob2RcIn19JHEuYWxsKCl7ey9jcm9zc0xpbmt9fSBhbmQgdGhlbiByZXR1cm5lZCBieVxuICAgICAgICAgKiBgZ290bygpYC4gVGhpcyBhbGxvd3MgaGFuZGxpbmcgYXN5bmNocm9ub3VzIHJlcXVlc3RzIG9uIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICAgbWltZW8ubW9kdWxlKCdleGFtcGxlJywgW10pLlxuICAgICAgICAgKiAgICAgICAgICAuY29tcG9uZW50KCdCbG9nJywgWyckaHR0cCcsICgkaHR0cCkgPT4gKCkgPT4ge1xuICAgICAgICAgKiAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2V4YW1wbGUtYXBpL2Jsb2dzJylcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAudGhlbigoYmxvZ1Bvc3RzKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAvL3R1cm4gYmxvZyBwb3N0cyBpbnRvIGh0bWxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICogICAgICAgICAgfSlcbiAgICAgICAgICogICAgICAgICAgLnJ1bihbJyRyb3V0aW5nJywgJ0Jsb2cnLCAoJHJvdXRpbmcsIEJsb2cpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICRyb3V0aW5nLnNldCgnL2Jsb2dzJywgQmxvZyk7XG4gICAgICAgICAqICAgICAgICAgIH1dKVxuICAgICAgICAgKiAgICAgICAgICAucnVuKFsnJHJvdXRpbmcnLCAoJHJvdXRpbmcpID0+IHtcbiAgICAgICAgICogICAgICAgICAgICAgICRyb3V0aW5nLmdvdG8oJy9ibG9ncycpLnRoZW4oKGJsb2dIdG1sKSA9PiB7XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgLy8gc2F2ZSB0byBjZG5cbiAgICAgICAgICogICAgICAgICAgICAgIH0pO1xuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBnb3RvXG4gICAgICAgICAqIEBmb3IgJHJvdXRpbmdcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJvdXRlIFJvdXRlIHRvIGdvIHRvXG4gICAgICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlc1xuICAgICAgICAgKiAgZnJvbSBhbGwgbWF0Y2hlZCByb3V0ZXNcbiAgICAgICAgICovXG4gICAgICAgICdnb3RvJzogZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgICAgIHJldHVybiBnb3RvUm91dGUocm91dGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnUm91dGluZyc6IFJvdXRpbmdcbn07IiwiLy92YXIgRGVwZW5kZW5jeVJlc29sdmVyID0gcmVxdWlyZSgnLi9EZXBlbmRlbmN5UmVzb2x2ZXIuanMnKTtcbnZhciBHcmFwaCA9IHJlcXVpcmUoJy4vR3JhcGguanMnKTtcblxuLyoqXG4gKlxuICogQHBhcmFtIG5hbWVcbiAqIEByZXR1cm5zIHt7JG5hbWU6IHN0cmluZywgcmVnaXN0ZXI6IHJlZ2lzdGVyLCBoYXNBbGxEZXBlbmRlbmNpZXM6XG4gKiAgICAgaGFzQWxsRGVwZW5kZW5jaWVzLCBpbnN0YW50aWF0ZTogaW5zdGFudGlhdGUsIGdldEluc3RhbmNlOiBnZXRJbnN0YW5jZX19XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRGVwZW5kZW5jeU1hbmFnZXIobmFtZSkge1xuICAgIHZhciBfcHJvdmlkZXJzID0ge307XG4gICAgdmFyIF9pbnN0YW5jZXMgPSB7fTtcbiAgICB2YXIgX2dyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgICB2YXIgX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZSA9IHVuZGVmaW5lZDtcblxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKGVudGl0eSkge1xuICAgICAgICBpZiAoIWVudGl0eSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbnRpdHkgdG8gcmVnaXN0ZXIgd2FzIGdpdmVuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWVudGl0eS4kbmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkgXCInICsgZW50aXR5LiRuYW1lICsgJ1wiIGlzIG1pc3NpbmcgcHJvcGVydHkgJG5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZW50aXR5LiRpbmplY3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW50aXR5IFwiJyArIGVudGl0eS4kbmFtZSArICdcIiBpcyBtaXNzaW5nIHByb3BlcnR5ICRpbmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfcHJvdmlkZXJzW2VudGl0eS4kbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW50aXR5IFwiJyArIGVudGl0eS4kbmFtZSArICdcIiBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICBfcHJvdmlkZXJzW2VudGl0eS4kbmFtZV0gPSBlbnRpdHk7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogTmFtZSBtaWdodCd2ZSBiZWVuIHJlZ2lzdGVyZWQgYXMgYSBkZXBlbmRlbmN5IG9mIGFub3RoZXIgZW50aXR5XG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIV9ncmFwaC5oYXNOb2RlVmFsdWUoZW50aXR5LiRuYW1lKSkge1xuICAgICAgICAgICAgX2dyYXBoLmFkZChlbnRpdHkuJG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW50aXR5LiRpbmplY3QuZm9yRWFjaChmdW5jdGlvbihkZXBlbmRlbmN5KSB7XG4gICAgICAgICAgICBpZiAoIV9ncmFwaC5oYXNOb2RlVmFsdWUoZGVwZW5kZW5jeSkpIHtcbiAgICAgICAgICAgICAgICBfZ3JhcGguYWRkKGRlcGVuZGVuY3kpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfZ3JhcGguYWRkRWRnZShkZXBlbmRlbmN5LCBlbnRpdHkuJG5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICBpZiAoX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvdmlkZXJzSW5qZWN0cyA9IE9iamVjdC5rZXlzKF9wcm92aWRlcnMpLm1hcChmdW5jdGlvbihwcm92aWRlck5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBfcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0uJGluamVjdDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZSA9IFtdLmNvbmNhdC5hcHBseShbXSwgcHJvdmlkZXJzSW5qZWN0cykuZmlsdGVyKGZ1bmN0aW9uKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuICFCb29sZWFuKF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIGdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKS5sZW5ndGggPT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YW50aWF0ZSgpIHtcbiAgICAgICAgX2dyYXBoLmdldE5vZGVzVG9wb2xvZ2ljYWwoKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICAgICAgdmFyIHByb3ZpZGVyID0gX3Byb3ZpZGVyc1twcm92aWRlck5hbWVdO1xuXG4gICAgICAgICAgICBfaW5zdGFuY2VzW3Byb3ZpZGVyTmFtZV0gPSBwcm92aWRlci5hcHBseShwcm92aWRlciwgcHJvdmlkZXIuJGluamVjdC5tYXAoZnVuY3Rpb24oZGVwZW5kZW5jeU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2luc3RhbmNlc1tkZXBlbmRlbmN5TmFtZV07XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByb3ZpZGVyKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICByZXR1cm4gX3Byb3ZpZGVyc1twcm92aWRlck5hbWVdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEluc3RhbmNlKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICByZXR1cm4gX2luc3RhbmNlc1twcm92aWRlck5hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgICRuYW1lOiBuYW1lLFxuICAgICAgICByZWdpc3RlcjogcmVnaXN0ZXIsXG4gICAgICAgIGhhc0FsbERlcGVuZGVuY2llczogaGFzQWxsRGVwZW5kZW5jaWVzLFxuICAgICAgICBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzOiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzLFxuICAgICAgICBpbnN0YW50aWF0ZTogaW5zdGFudGlhdGUsXG4gICAgICAgIGdldFByb3ZpZGVyOiBnZXRQcm92aWRlcixcbiAgICAgICAgZ2V0SW5zdGFuY2U6IGdldEluc3RhbmNlLFxuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHByb3ZpZGVyczogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhfcHJvdmlkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmFtZSwgX3Byb3ZpZGVyc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5zdGFuY2VzOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKF9pbnN0YW5jZXMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuYW1lLCBfaW5zdGFuY2VzW25hbWVdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIG5hbWVcbiAqIEByZXR1cm5zIHtEZXBlbmRlbmN5TWFuYWdlcn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBEZXBlbmRlbmN5TWFuYWdlcihuYW1lKTtcbn07IiwidmFyIE5vZGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICghKHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBzdHJpbmdzIGFyZSBhY2NlcHRlZCBhcyBub2RlIHZhbHVlcycpO1xuICAgIH1cblxuICAgIHRoaXMuX2lkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNik7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufTtcblxuXG52YXIgRWRnZSA9IGZ1bmN0aW9uKG5vZGVGcm9tLCBub2RlVG8pIHtcbiAgICB0aGlzLl9pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpO1xuICAgIHRoaXMuX2Zyb20gPSBub2RlRnJvbTtcbiAgICB0aGlzLl90byA9IG5vZGVUbztcbn07XG5cbnZhciBtYWtlTm9kZUlkZW50aWZpZXIgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcbiAgICByZXR1cm4gbm9kZTEuX2lkICsgJzonICsgbm9kZTIuX2lkO1xufTtcblxuRWRnZS5wcm90b3R5cGUuZ2V0Tm9kZUlkZW50aWZpZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbWFrZU5vZGVJZGVudGlmaWVyKHRoaXMuX2Zyb20sIHRoaXMuX3RvKTtcbn07XG5cbi8qKlxuICogRGlyZWN0ZWQgZ3JhcGggdG8gb3JkZXIgbm9kZXMgYnkgZGVwZW5kZW5jaWVzLiBPbmx5IGhhbmRsZXMgdmFsdWVzIHdob3NlXG4gKiAudG9TdHJpbmcoKSBmdW5jdGlvbiByZXR1cm5zIHVuaXF1ZSB2YWx1ZXMuIEZhdm9ycyBwcmUtY29tcHV0ZWQgbG9va3VwXG4gKiB0YWJsZXMgb3ZlciBsb29rdXBzIGF0IHNvcnQgdGltZS4gTW9zdCBtYWNoaW5lcyBoYXZlIGxvdHMgb2YgcmFtIGFuZFxuICogZXNwZWNpYWxseSBvbiBtb2JpbGUgdGhlIENQVSBpcyBtb3JlIHJlc3RyaWN0ZWQuIFVzaW5nIG1vcmUgcmFtIGFuZCBsZXNzXG4gKiBDUFUgY3ljbGVzIGlzIHByZWZlcmFibGUgaW4gdGhvc2UgY29uZGl0aW9ucywgYWx0aG91Z2ggaXQgc2hvdWxkIGhhcmRseVxuICogbWF0dGVyIHNpbmNlIG1vc3QgZGVwZW5kZW5jeSBncmFwaHMgKHdoaWNoIHRoaXMgaW1wbGVtZW50YXRpb24gaXMgZm9jdXNlZFxuICogb24pIHNob3VsZG4ndCBleGNlZWQgYSBmZXcgaHVuZHJlZCBub2Rlcy5cbiAqXG4gKiBAcmV0dXJucyB7e2FkZDogRnVuY3Rpb24sIGFkZEVkZ2U6IEZ1bmN0aW9uLCBoYXNOb2RlVmFsdWU6IEZ1bmN0aW9uLFxuICogICAgIGdldE5vZGVzVG9wb2xvZ2ljYWw6IEZ1bmN0aW9ufX1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgR3JhcGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX25vZGVzID0gW107XG4gICAgdmFyIF9ub2Rlc0J5SWQgPSB7fTtcbiAgICB2YXIgX25vZGVzQnlWYWx1ZSA9IHt9O1xuICAgIHZhciBfemVyb0luZ3JlZU5vZGVzID0gW107XG4gICAgdmFyIF9lZGdlcyA9IFtdO1xuICAgIHZhciBfZWRnZXNCeU5vZGVzID0ge307XG4gICAgdmFyIF9lZGdlc0J5VG8gPSB7fTtcbiAgICB2YXIgX2VkZ2VzQnlGcm9tID0ge307XG5cbiAgICAvKlxuICAgICAqIFRoZSBjdXJyZW50IHRvcG9sb2dpY2FsIHNvcnQgaW1wbGVtZW50YXRpb24gbXV0YXRlcyB0aGUgZ3JhcGgsIGFmdGVyXG4gICAgICogd2hpY2ggaXQncyB1bnVzYWJsZS4gVGhpcyBmdW5jdGlvbiBhbGxvd3MgdG8gY2xlYW4gdGhlIGVudGlyZSBncmFwaFxuICAgICAqIHVwLCByZW1vdmluZyBhbnkgZGFuZ2xpbmcgZGF0YSB0aGF0IG1pZ2h0IGJlIGxlZnQgYWZ0ZXIgdGhlIHNvcnQuXG4gICAgICovXG4gICAgdmFyIHJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIF9ub2RlcyA9IFtdO1xuICAgICAgICBfbm9kZXNCeUlkID0ge307XG4gICAgICAgIF9ub2Rlc0J5VmFsdWUgPSB7fTtcbiAgICAgICAgX3plcm9JbmdyZWVOb2RlcyA9IFtdO1xuICAgICAgICBfZWRnZXMgPSBbXTtcbiAgICAgICAgX2VkZ2VzQnlOb2RlcyA9IHt9O1xuICAgICAgICBfZWRnZXNCeVRvID0ge307XG4gICAgICAgIF9lZGdlc0J5RnJvbSA9IHt9O1xuICAgIH07XG5cbiAgICB2YXIgYWRkTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKF9ub2Rlc0J5VmFsdWVbbm9kZS52YWx1ZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRHVwbGljYXRlIHZhbHVlcyBub3QgYWxsb3dlZC4gTm9kZSB3aXRoIHZhbHVlIFwiJyArIG5vZGUudmFsdWUgKyAnXCIgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBfbm9kZXNCeUlkW25vZGUuX2lkXSA9IG5vZGU7XG4gICAgICAgIF9ub2Rlc0J5VmFsdWVbbm9kZS52YWx1ZV0gPSBub2RlO1xuXG4gICAgICAgIF96ZXJvSW5ncmVlTm9kZXMucHVzaChub2RlKTtcbiAgICB9O1xuXG4gICAgdmFyIGFkZEVkZ2UgPSBmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgIGlmIChfZWRnZXNCeU5vZGVzW2VkZ2UuZ2V0Tm9kZUlkZW50aWZpZXIoKV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIF9lZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBfZWRnZXNCeU5vZGVzW2VkZ2UuZ2V0Tm9kZUlkZW50aWZpZXIoKV0gPSBlZGdlO1xuXG4gICAgICAgIGlmICghX2VkZ2VzQnlGcm9tW2VkZ2UuX2Zyb20uX2lkXSkge1xuICAgICAgICAgICAgX2VkZ2VzQnlGcm9tW2VkZ2UuX2Zyb20uX2lkXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIF9lZGdlc0J5RnJvbVtlZGdlLl9mcm9tLl9pZF0ucHVzaChlZGdlKTtcblxuICAgICAgICBpZiAoIV9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXSkge1xuICAgICAgICAgICAgX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdLnB1c2goZWRnZSk7XG5cbiAgICAgICAgX3plcm9JbmdyZWVOb2RlcyA9IF96ZXJvSW5ncmVlTm9kZXMuZmlsdGVyKGZ1bmN0aW9uKGV4aXN0aW5nTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nTm9kZS5faWQgIT0gZWRnZS5fdG8uX2lkO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHZhciByZW1vdmVFZGdlID0gZnVuY3Rpb24oZWRnZVRvUmVtb3ZlKSB7XG4gICAgICAgIF9lZGdlcyA9IF9lZGdlcy5maWx0ZXIoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2UuX2lkICE9IGVkZ2VUb1JlbW92ZS5faWQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlbGV0ZSBfZWRnZXNCeU5vZGVzW2VkZ2VUb1JlbW92ZS5nZXROb2RlSWRlbnRpZmllcigpXTtcblxuICAgICAgICBfZWRnZXNCeUZyb21bZWRnZVRvUmVtb3ZlLl9mcm9tLl9pZF0gPSBfZWRnZXNCeUZyb21bZWRnZVRvUmVtb3ZlLl9mcm9tLl9pZF0uZmlsdGVyKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGdlLl9pZCAhPSBlZGdlVG9SZW1vdmUuX2lkO1xuICAgICAgICB9KTtcblxuICAgICAgICBfZWRnZXNCeVRvW2VkZ2VUb1JlbW92ZS5fdG8uX2lkXSA9IF9lZGdlc0J5VG9bZWRnZVRvUmVtb3ZlLl90by5faWRdLmZpbHRlcihmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRnZS5faWQgIT0gZWRnZVRvUmVtb3ZlLl9pZDtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBnZXROb2RlQnlWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBfbm9kZXNCeVZhbHVlW3ZhbHVlXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgYWRkTm9kZShuZXcgTm9kZSh2YWx1ZSkpO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFZGdlOiBmdW5jdGlvbihmcm9tVmFsdWUsIHRvVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBmcm9tTm9kZSA9IGdldE5vZGVCeVZhbHVlKGZyb21WYWx1ZSk7XG4gICAgICAgICAgICB2YXIgdG9Ob2RlID0gZ2V0Tm9kZUJ5VmFsdWUodG9WYWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbU5vZGUgJiYgIXRvTm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdOZWl0aGVyIGZyb20tIG5vciB0by1ub2RlIGV4aXN0OiAnICsgZnJvbVZhbHVlICsgJywgJyArIHRvVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZnJvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnRnJvbS1ub2RlIGRvZXNuXFwndCBleGlzdDogJyArIGZyb21WYWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVG8tbm9kZSBkb2VzblxcJ3QgZXhpc3Q6ICcgKyB0b1ZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhZGRFZGdlKG5ldyBFZGdlKGZyb21Ob2RlLCB0b05vZGUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTm9kZVZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oZ2V0Tm9kZUJ5VmFsdWUodmFsdWUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0Tm9kZXNUb3BvbG9naWNhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc29ydGVkTm9kZXMgPSBbXTtcblxuICAgICAgICAgICAgd2hpbGUgKF96ZXJvSW5ncmVlTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IF96ZXJvSW5ncmVlTm9kZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgc29ydGVkTm9kZXMucHVzaChjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgKF9lZGdlc0J5RnJvbVtjdXJyZW50Tm9kZS5faWRdIHx8IFtdKS5zbGljZSgwKS5mb3JFYWNoKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRWRnZShlZGdlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0gfHwgX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF96ZXJvSW5ncmVlTm9kZXMucHVzaChlZGdlLl90byk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9lZGdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZ0VkZ2VzID0gX2VkZ2VzLm1hcChmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnKCcgKyBlZGdlLl9mcm9tLnZhbHVlICsgJywnICsgZWRnZS5fdG8udmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXNldCgpO1xuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsZSBkZXRlY3RlZCwgcmVtYWluaW5nIGVkZ2VzOiAnICsgcmVtYWluaW5nRWRnZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNldCgpO1xuXG4gICAgICAgICAgICByZXR1cm4gc29ydGVkTm9kZXMubWFwKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGg7IiwidmFyIERlcGVuZGVuY3lNYW5hZ2VyID0gcmVxdWlyZSgnLi9EZXBlbmRlbmN5TWFuYWdlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbmplY3RhYmxlcyA9IERlcGVuZGVuY3lNYW5hZ2VyKCdpbmplY3RhYmxlcycpO1xuXG4gICAgZnVuY3Rpb24gYWRkKGluamVjdGFibGUpIHtcbiAgICAgICAgaW5qZWN0YWJsZXMucmVnaXN0ZXIoaW5qZWN0YWJsZSk7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbnRpYXRlSW5qZWN0YWJsZXMoKSB7XG4gICAgICAgIGlmICghaW5qZWN0YWJsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0YWJsZXMgZG9uXFwndCBleGlzdDogJyArIGluamVjdGFibGVzLmdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmplY3RhYmxlcy5pbnN0YW50aWF0ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhcyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKGluamVjdGFibGVzLmdldFByb3ZpZGVyKG5hbWUpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZXMuZ2V0SW5zdGFuY2UobmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxsRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVzLmdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgZ2V0OiBnZXQsXG4gICAgICAgIGhhczogaGFzLFxuICAgICAgICBpbnN0YW50aWF0ZTogaW5zdGFudGlhdGVJbmplY3RhYmxlcyxcbiAgICAgICAgaGFzQWxsRGVwZW5kZW5jaWVzOiBoYXNBbGxEZXBlbmRlbmNpZXMsXG4gICAgICAgIGdldE1pc3NpbmdEZXBlbmRlbmNpZXM6IGdldE1pc3NpbmdEZXBlbmRlbmNpZXNcbiAgICB9O1xufTsiLCJ2YXIgRGVwZW5kZW5jeU1hbmFnZXIgPSByZXF1aXJlKCcuL0RlcGVuZGVuY3lNYW5hZ2VyLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1vZHVsZXMgPSBEZXBlbmRlbmN5TWFuYWdlcignbW9kdWxlcycpO1xuXG4gICAgZnVuY3Rpb24gYWRkKG1vZHVsZSkge1xuICAgICAgICBtb2R1bGVzLnJlZ2lzdGVyKG1vZHVsZSk7XG4gICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxsRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YW50aWF0ZU1vZHVsZXMoKSB7XG4gICAgICAgIG1vZHVsZXMuYWxsLnByb3ZpZGVycyhmdW5jdGlvbihfLCBtb2R1bGUpIHtcbiAgICAgICAgICAgIG1vZHVsZS5leGVjdXRlUnVuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldChuYW1lKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVzLmdldFByb3ZpZGVyKG5hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVzLmdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgZ2V0OiBnZXQsXG4gICAgICAgIGluc3RhbnRpYXRlOiBpbnN0YW50aWF0ZU1vZHVsZXMsXG4gICAgICAgIGhhc0FsbERlcGVuZGVuY2llczogaGFzQWxsRGVwZW5kZW5jaWVzLFxuICAgICAgICBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzOiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzXG4gICAgfTtcbn07Il19
