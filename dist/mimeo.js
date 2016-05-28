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

var Module = require('./Module.js');

var Modules = require('./dependencies/Modules.js');
var Injectables = require('./dependencies/Injectables.js');

var registerBuiltIns = require('./builtins/Register.js');

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
        module: function module(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(injectables, name, dependencies));
            }

            return modules.get(name);
        },
        bootstrap: bootstrap
    };
};

module.exports = Mimeo();

},{"./Module.js":4,"./builtins/Register.js":8,"./dependencies/Injectables.js":12,"./dependencies/Modules.js":13}],4:[function(require,module,exports){
'use strict';

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

    this.factory = addInjectable;
    this.component = addInjectable;
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
    function responseToAngularResponse(data, _, jqXHR) {
        return {
            data: data,
            status: jqXHR.status, // response code,
            headers: jqXHR.getAllResponseHeaders(), // headers,
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
        type: config.method,
        headers: config.headers,
        contentType: config.headers['Content-Type'],
        url: config.url,
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

/**
 * Config accepts:
 *
 * method: HTTP method for request
 * params: hash of GET parameters
 * headers: HTTP headers
 * url: URL to request
 *
 * @param $window
 * @param $q
 * @param config
 * @returns {promise|*|r.promise|Function|a}
 * @constructor
 */
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

    vendorSpecificRequest($window)(config, function (data) {
        defer.resolve(data);
    }, function (error) {
        defer.reject(error);
    });

    return defer.promise;
}

module.exports = function ($window, $q, $nodeHttp, $nodeHttps) {
    NodeHttp = $nodeHttp;
    NodeHttps = $nodeHttps;

    function doHttp(config) {
        config = mergeConfig(doHttp.$config, config);
        config.host = doHttp.$host;
        config.protocol = doHttp.$protocol;
        return new Http($window, $q, config);
    }

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

    doHttp.$host = '';
    doHttp.$protocol = 'https';
    doHttp.$config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    doHttp.get = function (url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'GET';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.head = function (url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'HEAD';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.post = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'POST';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.put = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PUT';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.patch = function (url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PATCH';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.delete = function (url, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'DELETE';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };

    return doHttp;
};

},{}],7:[function(require,module,exports){
'use strict';

function isFunction(object) {
    return object && typeof object === 'function' && object instanceof Function;
}

function Promise() {
    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];
    var state = 'pending';
    var resolution;
    var rejection;

    var api = {
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

        'catch': function _catch(onReject) {
            return api.then(null, onReject);
        },

        notify: function notify(notifyWith) {
            notifyCallbacks.forEach(function (callback) {
                callback(notifyWith);
            });
        },

        reject: function reject(rejectWith) {
            rejectCallbacks.forEach(function (callback) {
                callback(rejectWith);
            });

            state = 'rejected';
            rejection = rejectWith;
        },

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

function Deferred(init) {
    var promise = new Promise();

    if (isFunction(init)) {
        init(promise.resolve, promise.reject, promise.notify);
    }

    return {
        resolve: promise.resolve,
        reject: promise.reject,
        notify: promise.notify,
        promise: promise
    };
}

function $q(callback) {
    return new Deferred(callback).promise;
}

$q.defer = function () {
    return new Deferred();
};

$q.resolve = $q.when = function (value, onResolve, onReject, onNotify) {
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

var RouteRecognizer = require('route-recognizer');
var parseUri = require('parseuri');

function Routing($q, $window) {
    var routing = new RouteRecognizer();
    var defaultRoute;
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
        doRouting($window.location.href);
    };

    return {
        'setDefaultRoute': function setDefaultRoute(newDefaultRoute) {
            if (!(typeof newDefaultRoute === 'string' || newDefaultRoute instanceof String)) {
                throw new Error('The default route must be given as a string, e.g. "/app"');
            }

            defaultRoute = newDefaultRoute;
        },
        'setMakeRenderer': function setMakeRenderer(newMakeRenderer) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGFyc2V1cmkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcm91dGUtcmVjb2duaXplci9kaXN0L3JvdXRlLXJlY29nbml6ZXIuanMiLCJzcmMvTWltZW8uanMiLCJzcmMvTW9kdWxlLmpzIiwic3JjL2J1aWx0aW5zL0dsb2JhbHNXcmFwcGVyLmpzIiwic3JjL2J1aWx0aW5zL0h0dHAuanMiLCJzcmMvYnVpbHRpbnMvUHJvbWlzZS5qcyIsInNyYy9idWlsdGlucy9SZWdpc3Rlci5qcyIsInNyYy9idWlsdGlucy9Sb3V0aW5nLmpzIiwic3JjL2RlcGVuZGVuY2llcy9EZXBlbmRlbmN5TWFuYWdlci5qcyIsInNyYy9kZXBlbmRlbmNpZXMvR3JhcGguanMiLCJzcmMvZGVwZW5kZW5jaWVzL0luamVjdGFibGVzLmpzIiwic3JjL2RlcGVuZGVuY2llcy9Nb2R1bGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QyxtQkFBTyxVQUFQO0FBQ0gsU0FGRDtBQUdIOztBQUVELGFBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUI7QUFDZixlQUFPLFFBQVEsV0FBUixDQUFvQixJQUFwQixDQUFQO0FBQ0g7O0FBRUQsYUFBUyxzQkFBVCxHQUFrQztBQUM5QixlQUFPLFFBQVEsc0JBQVIsRUFBUDtBQUNIOztBQUVELFdBQU87QUFDSCxhQUFLLEdBREY7QUFFSCxhQUFLLEdBRkY7QUFHSCxxQkFBYSxrQkFIVjtBQUlILDRCQUFvQixrQkFKakI7QUFLSCxnQ0FBd0I7QUFMckIsS0FBUDtBQU9ILENBakNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogUGFyc2VzIGFuIFVSSVxuICpcbiAqIEBhdXRob3IgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+IChNSVQgbGljZW5zZSlcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciByZSA9IC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKGh0dHB8aHR0cHN8d3N8d3NzKTpcXC9cXC8pPygoPzooKFteOkBdKikoPzo6KFteOkBdKikpPyk/QCk/KCg/OlthLWYwLTldezAsNH06KXsyLDd9W2EtZjAtOV17MCw0fXxbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvO1xuXG52YXIgcGFydHMgPSBbXG4gICAgJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdhbmNob3InXG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNldXJpKHN0cikge1xuICAgIHZhciBzcmMgPSBzdHIsXG4gICAgICAgIGIgPSBzdHIuaW5kZXhPZignWycpLFxuICAgICAgICBlID0gc3RyLmluZGV4T2YoJ10nKTtcblxuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBiKSArIHN0ci5zdWJzdHJpbmcoYiwgZSkucmVwbGFjZSgvOi9nLCAnOycpICsgc3RyLnN1YnN0cmluZyhlLCBzdHIubGVuZ3RoKTtcbiAgICB9XG5cbiAgICB2YXIgbSA9IHJlLmV4ZWMoc3RyIHx8ICcnKSxcbiAgICAgICAgdXJpID0ge30sXG4gICAgICAgIGkgPSAxNDtcblxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgdXJpW3BhcnRzW2ldXSA9IG1baV0gfHwgJyc7XG4gICAgfVxuXG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICB1cmkuc291cmNlID0gc3JjO1xuICAgICAgICB1cmkuaG9zdCA9IHVyaS5ob3N0LnN1YnN0cmluZygxLCB1cmkuaG9zdC5sZW5ndGggLSAxKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5hdXRob3JpdHkgPSB1cmkuYXV0aG9yaXR5LnJlcGxhY2UoJ1snLCAnJykucmVwbGFjZSgnXScsICcnKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5pcHY2dXJpID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXJpO1xufTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRUYXJnZXQocGF0aCwgbWF0Y2hlciwgZGVsZWdhdGUpIHtcbiAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLm1hdGNoZXIgPSBtYXRjaGVyO1xuICAgICAgdGhpcy5kZWxlZ2F0ZSA9IGRlbGVnYXRlO1xuICAgIH1cblxuICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJFRhcmdldC5wcm90b3R5cGUgPSB7XG4gICAgICB0bzogZnVuY3Rpb24odGFyZ2V0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZGVsZWdhdGUgPSB0aGlzLmRlbGVnYXRlO1xuXG4gICAgICAgIGlmIChkZWxlZ2F0ZSAmJiBkZWxlZ2F0ZS53aWxsQWRkUm91dGUpIHtcbiAgICAgICAgICB0YXJnZXQgPSBkZWxlZ2F0ZS53aWxsQWRkUm91dGUodGhpcy5tYXRjaGVyLnRhcmdldCwgdGFyZ2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWF0Y2hlci5hZGQodGhpcy5wYXRoLCB0YXJnZXQpO1xuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGlmIChjYWxsYmFjay5sZW5ndGggPT09IDApIHsgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgaGF2ZSBhbiBhcmd1bWVudCBpbiB0aGUgZnVuY3Rpb24gcGFzc2VkIHRvIGB0b2BcIik7IH1cbiAgICAgICAgICB0aGlzLm1hdGNoZXIuYWRkQ2hpbGQodGhpcy5wYXRoLCB0YXJnZXQsIGNhbGxiYWNrLCB0aGlzLmRlbGVnYXRlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkTWF0Y2hlcih0YXJnZXQpIHtcbiAgICAgIHRoaXMucm91dGVzID0ge307XG4gICAgICB0aGlzLmNoaWxkcmVuID0ge307XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB9XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyLnByb3RvdHlwZSA9IHtcbiAgICAgIGFkZDogZnVuY3Rpb24ocGF0aCwgaGFuZGxlcikge1xuICAgICAgICB0aGlzLnJvdXRlc1twYXRoXSA9IGhhbmRsZXI7XG4gICAgICB9LFxuXG4gICAgICBhZGRDaGlsZDogZnVuY3Rpb24ocGF0aCwgdGFyZ2V0LCBjYWxsYmFjaywgZGVsZWdhdGUpIHtcbiAgICAgICAgdmFyIG1hdGNoZXIgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkTWF0Y2hlcih0YXJnZXQpO1xuICAgICAgICB0aGlzLmNoaWxkcmVuW3BhdGhdID0gbWF0Y2hlcjtcblxuICAgICAgICB2YXIgbWF0Y2ggPSAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRnZW5lcmF0ZU1hdGNoKHBhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKTtcblxuICAgICAgICBpZiAoZGVsZWdhdGUgJiYgZGVsZWdhdGUuY29udGV4dEVudGVyZWQpIHtcbiAgICAgICAgICBkZWxlZ2F0ZS5jb250ZXh0RW50ZXJlZCh0YXJnZXQsIG1hdGNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKG1hdGNoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZ2VuZXJhdGVNYXRjaChzdGFydGluZ1BhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ocGF0aCwgbmVzdGVkQ2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZ1bGxQYXRoID0gc3RhcnRpbmdQYXRoICsgcGF0aDtcblxuICAgICAgICBpZiAobmVzdGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICBuZXN0ZWRDYWxsYmFjaygkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRnZW5lcmF0ZU1hdGNoKGZ1bGxQYXRoLCBtYXRjaGVyLCBkZWxlZ2F0ZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkVGFyZ2V0KHN0YXJ0aW5nUGF0aCArIHBhdGgsIG1hdGNoZXIsIGRlbGVnYXRlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRhZGRSb3V0ZShyb3V0ZUFycmF5LCBwYXRoLCBoYW5kbGVyKSB7XG4gICAgICB2YXIgbGVuID0gMDtcbiAgICAgIGZvciAodmFyIGk9MCwgbD1yb3V0ZUFycmF5Lmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgbGVuICs9IHJvdXRlQXJyYXlbaV0ucGF0aC5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cihsZW4pO1xuICAgICAgdmFyIHJvdXRlID0geyBwYXRoOiBwYXRoLCBoYW5kbGVyOiBoYW5kbGVyIH07XG4gICAgICByb3V0ZUFycmF5LnB1c2gocm91dGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciRkc2wkJGVhY2hSb3V0ZShiYXNlUm91dGUsIG1hdGNoZXIsIGNhbGxiYWNrLCBiaW5kaW5nKSB7XG4gICAgICB2YXIgcm91dGVzID0gbWF0Y2hlci5yb3V0ZXM7XG5cbiAgICAgIGZvciAodmFyIHBhdGggaW4gcm91dGVzKSB7XG4gICAgICAgIGlmIChyb3V0ZXMuaGFzT3duUHJvcGVydHkocGF0aCkpIHtcbiAgICAgICAgICB2YXIgcm91dGVBcnJheSA9IGJhc2VSb3V0ZS5zbGljZSgpO1xuICAgICAgICAgICQkcm91dGUkcmVjb2duaXplciRkc2wkJGFkZFJvdXRlKHJvdXRlQXJyYXksIHBhdGgsIHJvdXRlc1twYXRoXSk7XG5cbiAgICAgICAgICBpZiAobWF0Y2hlci5jaGlsZHJlbltwYXRoXSkge1xuICAgICAgICAgICAgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZWFjaFJvdXRlKHJvdXRlQXJyYXksIG1hdGNoZXIuY2hpbGRyZW5bcGF0aF0sIGNhbGxiYWNrLCBiaW5kaW5nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChiaW5kaW5nLCByb3V0ZUFycmF5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZGVmYXVsdCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBhZGRSb3V0ZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgbWF0Y2hlciA9IG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRNYXRjaGVyKCk7XG5cbiAgICAgIGNhbGxiYWNrKCQkcm91dGUkcmVjb2duaXplciRkc2wkJGdlbmVyYXRlTWF0Y2goXCJcIiwgbWF0Y2hlciwgdGhpcy5kZWxlZ2F0ZSkpO1xuXG4gICAgICAkJHJvdXRlJHJlY29nbml6ZXIkZHNsJCRlYWNoUm91dGUoW10sIG1hdGNoZXIsIGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgIGlmIChhZGRSb3V0ZUNhbGxiYWNrKSB7IGFkZFJvdXRlQ2FsbGJhY2sodGhpcywgcm91dGUpOyB9XG4gICAgICAgIGVsc2UgeyB0aGlzLmFkZChyb3V0ZSk7IH1cbiAgICAgIH0sIHRoaXMpO1xuICAgIH07XG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRzcGVjaWFscyA9IFtcbiAgICAgICcvJywgJy4nLCAnKicsICcrJywgJz8nLCAnfCcsXG4gICAgICAnKCcsICcpJywgJ1snLCAnXScsICd7JywgJ30nLCAnXFxcXCdcbiAgICBdO1xuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciQkZXNjYXBlUmVnZXggPSBuZXcgUmVnRXhwKCcoXFxcXCcgKyAkJHJvdXRlJHJlY29nbml6ZXIkJHNwZWNpYWxzLmpvaW4oJ3xcXFxcJykgKyAnKScsICdnJyk7XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJGlzQXJyYXkodGVzdCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0ZXN0KSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgIH1cblxuICAgIC8vIEEgU2VnbWVudCByZXByZXNlbnRzIGEgc2VnbWVudCBpbiB0aGUgb3JpZ2luYWwgcm91dGUgZGVzY3JpcHRpb24uXG4gICAgLy8gRWFjaCBTZWdtZW50IHR5cGUgcHJvdmlkZXMgYW4gYGVhY2hDaGFyYCBhbmQgYHJlZ2V4YCBtZXRob2QuXG4gICAgLy9cbiAgICAvLyBUaGUgYGVhY2hDaGFyYCBtZXRob2QgaW52b2tlcyB0aGUgY2FsbGJhY2sgd2l0aCBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJcbiAgICAvLyBzcGVjaWZpY2F0aW9ucy4gQSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBjb25zdW1lcyBvbmUgb3IgbW9yZSBpbnB1dFxuICAgIC8vIGNoYXJhY3RlcnMuXG4gICAgLy9cbiAgICAvLyBUaGUgYHJlZ2V4YCBtZXRob2QgcmV0dXJucyBhIHJlZ2V4IGZyYWdtZW50IGZvciB0aGUgc2VnbWVudC4gSWYgdGhlXG4gICAgLy8gc2VnbWVudCBpcyBhIGR5bmFtaWMgb2Ygc3RhciBzZWdtZW50LCB0aGUgcmVnZXggZnJhZ21lbnQgYWxzbyBpbmNsdWRlc1xuICAgIC8vIGEgY2FwdHVyZS5cbiAgICAvL1xuICAgIC8vIEEgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gY29udGFpbnM6XG4gICAgLy9cbiAgICAvLyAqIGB2YWxpZENoYXJzYDogYSBTdHJpbmcgd2l0aCBhIGxpc3Qgb2YgYWxsIHZhbGlkIGNoYXJhY3RlcnMsIG9yXG4gICAgLy8gKiBgaW52YWxpZENoYXJzYDogYSBTdHJpbmcgd2l0aCBhIGxpc3Qgb2YgYWxsIGludmFsaWQgY2hhcmFjdGVyc1xuICAgIC8vICogYHJlcGVhdGA6IHRydWUgaWYgdGhlIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGNhbiByZXBlYXRcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkU3RhdGljU2VnbWVudChzdHJpbmcpIHsgdGhpcy5zdHJpbmcgPSBzdHJpbmc7IH1cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXRpY1NlZ21lbnQucHJvdG90eXBlID0ge1xuICAgICAgZWFjaENoYXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzdHJpbmcgPSB0aGlzLnN0cmluZywgY2g7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPXN0cmluZy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgY2ggPSBzdHJpbmcuY2hhckF0KGkpO1xuICAgICAgICAgIGNhbGxiYWNrKHsgdmFsaWRDaGFyczogY2ggfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlZ2V4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyaW5nLnJlcGxhY2UoJCRyb3V0ZSRyZWNvZ25pemVyJCRlc2NhcGVSZWdleCwgJ1xcXFwkMScpO1xuICAgICAgfSxcblxuICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkRHluYW1pY1NlZ21lbnQobmFtZSkgeyB0aGlzLm5hbWUgPSBuYW1lOyB9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCREeW5hbWljU2VnbWVudC5wcm90b3R5cGUgPSB7XG4gICAgICBlYWNoQ2hhcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soeyBpbnZhbGlkQ2hhcnM6IFwiL1wiLCByZXBlYXQ6IHRydWUgfSk7XG4gICAgICB9LFxuXG4gICAgICByZWdleDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBcIihbXi9dKylcIjtcbiAgICAgIH0sXG5cbiAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtc1t0aGlzLm5hbWVdO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXJTZWdtZW50KG5hbWUpIHsgdGhpcy5uYW1lID0gbmFtZTsgfVxuICAgICQkcm91dGUkcmVjb2duaXplciQkU3RhclNlZ21lbnQucHJvdG90eXBlID0ge1xuICAgICAgZWFjaENoYXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHsgaW52YWxpZENoYXJzOiBcIlwiLCByZXBlYXQ6IHRydWUgfSk7XG4gICAgICB9LFxuXG4gICAgICByZWdleDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBcIiguKylcIjtcbiAgICAgIH0sXG5cbiAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtc1t0aGlzLm5hbWVdO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50KCkge31cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgIGVhY2hDaGFyOiBmdW5jdGlvbigpIHt9LFxuICAgICAgcmVnZXg6IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcIjsgfSxcbiAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXCI7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRwYXJzZShyb3V0ZSwgbmFtZXMsIHNwZWNpZmljaXR5KSB7XG4gICAgICAvLyBub3JtYWxpemUgcm91dGUgYXMgbm90IHN0YXJ0aW5nIHdpdGggYSBcIi9cIi4gUmVjb2duaXRpb24gd2lsbFxuICAgICAgLy8gYWxzbyBub3JtYWxpemUuXG4gICAgICBpZiAocm91dGUuY2hhckF0KDApID09PSBcIi9cIikgeyByb3V0ZSA9IHJvdXRlLnN1YnN0cigxKTsgfVxuXG4gICAgICB2YXIgc2VnbWVudHMgPSByb3V0ZS5zcGxpdChcIi9cIiksIHJlc3VsdHMgPSBbXTtcblxuICAgICAgLy8gQSByb3V0ZXMgaGFzIHNwZWNpZmljaXR5IGRldGVybWluZWQgYnkgdGhlIG9yZGVyIHRoYXQgaXRzIGRpZmZlcmVudCBzZWdtZW50c1xuICAgICAgLy8gYXBwZWFyIGluLiBUaGlzIHN5c3RlbSBtaXJyb3JzIGhvdyB0aGUgbWFnbml0dWRlIG9mIG51bWJlcnMgd3JpdHRlbiBhcyBzdHJpbmdzXG4gICAgICAvLyB3b3Jrcy5cbiAgICAgIC8vIENvbnNpZGVyIGEgbnVtYmVyIHdyaXR0ZW4gYXM6IFwiYWJjXCIuIEFuIGV4YW1wbGUgd291bGQgYmUgXCIyMDBcIi4gQW55IG90aGVyIG51bWJlciB3cml0dGVuXG4gICAgICAvLyBcInh5elwiIHdpbGwgYmUgc21hbGxlciB0aGFuIFwiYWJjXCIgc28gbG9uZyBhcyBgYSA+IHpgLiBGb3IgaW5zdGFuY2UsIFwiMTk5XCIgaXMgc21hbGxlclxuICAgICAgLy8gdGhlbiBcIjIwMFwiLCBldmVuIHRob3VnaCBcInlcIiBhbmQgXCJ6XCIgKHdoaWNoIGFyZSBib3RoIDkpIGFyZSBsYXJnZXIgdGhhbiBcIjBcIiAodGhlIHZhbHVlXG4gICAgICAvLyBvZiAoYGJgIGFuZCBgY2ApLiBUaGlzIGlzIGJlY2F1c2UgdGhlIGxlYWRpbmcgc3ltYm9sLCBcIjJcIiwgaXMgbGFyZ2VyIHRoYW4gdGhlIG90aGVyXG4gICAgICAvLyBsZWFkaW5nIHN5bWJvbCwgXCIxXCIuXG4gICAgICAvLyBUaGUgcnVsZSBpcyB0aGF0IHN5bWJvbHMgdG8gdGhlIGxlZnQgY2FycnkgbW9yZSB3ZWlnaHQgdGhhbiBzeW1ib2xzIHRvIHRoZSByaWdodFxuICAgICAgLy8gd2hlbiBhIG51bWJlciBpcyB3cml0dGVuIG91dCBhcyBhIHN0cmluZy4gSW4gdGhlIGFib3ZlIHN0cmluZ3MsIHRoZSBsZWFkaW5nIGRpZ2l0XG4gICAgICAvLyByZXByZXNlbnRzIGhvdyBtYW55IDEwMCdzIGFyZSBpbiB0aGUgbnVtYmVyLCBhbmQgaXQgY2FycmllcyBtb3JlIHdlaWdodCB0aGFuIHRoZSBtaWRkbGVcbiAgICAgIC8vIG51bWJlciB3aGljaCByZXByZXNlbnRzIGhvdyBtYW55IDEwJ3MgYXJlIGluIHRoZSBudW1iZXIuXG4gICAgICAvLyBUaGlzIHN5c3RlbSBvZiBudW1iZXIgbWFnbml0dWRlIHdvcmtzIHdlbGwgZm9yIHJvdXRlIHNwZWNpZmljaXR5LCB0b28uIEEgcm91dGUgd3JpdHRlbiBhc1xuICAgICAgLy8gYGEvYi9jYCB3aWxsIGJlIG1vcmUgc3BlY2lmaWMgdGhhbiBgeC95L3pgIGFzIGxvbmcgYXMgYGFgIGlzIG1vcmUgc3BlY2lmaWMgdGhhblxuICAgICAgLy8gYHhgLCBpcnJlc3BlY3RpdmUgb2YgdGhlIG90aGVyIHBhcnRzLlxuICAgICAgLy8gQmVjYXVzZSBvZiB0aGlzIHNpbWlsYXJpdHksIHdlIGFzc2lnbiBlYWNoIHR5cGUgb2Ygc2VnbWVudCBhIG51bWJlciB2YWx1ZSB3cml0dGVuIGFzIGFcbiAgICAgIC8vIHN0cmluZy4gV2UgY2FuIGZpbmQgdGhlIHNwZWNpZmljaXR5IG9mIGNvbXBvdW5kIHJvdXRlcyBieSBjb25jYXRlbmF0aW5nIHRoZXNlIHN0cmluZ3NcbiAgICAgIC8vIHRvZ2V0aGVyLCBmcm9tIGxlZnQgdG8gcmlnaHQuIEFmdGVyIHdlIGhhdmUgbG9vcGVkIHRocm91Z2ggYWxsIG9mIHRoZSBzZWdtZW50cyxcbiAgICAgIC8vIHdlIGNvbnZlcnQgdGhlIHN0cmluZyB0byBhIG51bWJlci5cbiAgICAgIHNwZWNpZmljaXR5LnZhbCA9ICcnO1xuXG4gICAgICBmb3IgKHZhciBpPTAsIGw9c2VnbWVudHMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICB2YXIgc2VnbWVudCA9IHNlZ21lbnRzW2ldLCBtYXRjaDtcblxuICAgICAgICBpZiAobWF0Y2ggPSBzZWdtZW50Lm1hdGNoKC9eOihbXlxcL10rKSQvKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCREeW5hbWljU2VnbWVudChtYXRjaFsxXSkpO1xuICAgICAgICAgIG5hbWVzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICAgIHNwZWNpZmljaXR5LnZhbCArPSAnMyc7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggPSBzZWdtZW50Lm1hdGNoKC9eXFwqKFteXFwvXSspJC8pKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyAkJHJvdXRlJHJlY29nbml6ZXIkJFN0YXJTZWdtZW50KG1hdGNoWzFdKSk7XG4gICAgICAgICAgc3BlY2lmaWNpdHkudmFsICs9ICcyJztcbiAgICAgICAgICBuYW1lcy5wdXNoKG1hdGNoWzFdKTtcbiAgICAgICAgfSBlbHNlIGlmKHNlZ21lbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobmV3ICQkcm91dGUkcmVjb2duaXplciQkRXBzaWxvblNlZ21lbnQoKSk7XG4gICAgICAgICAgc3BlY2lmaWNpdHkudmFsICs9ICcxJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gobmV3ICQkcm91dGUkcmVjb2duaXplciQkU3RhdGljU2VnbWVudChzZWdtZW50KSk7XG4gICAgICAgICAgc3BlY2lmaWNpdHkudmFsICs9ICc0JztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzcGVjaWZpY2l0eS52YWwgPSArc3BlY2lmaWNpdHkudmFsO1xuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvLyBBIFN0YXRlIGhhcyBhIGNoYXJhY3RlciBzcGVjaWZpY2F0aW9uIGFuZCAoYGNoYXJTcGVjYCkgYW5kIGEgbGlzdCBvZiBwb3NzaWJsZVxuICAgIC8vIHN1YnNlcXVlbnQgc3RhdGVzIChgbmV4dFN0YXRlc2ApLlxuICAgIC8vXG4gICAgLy8gSWYgYSBTdGF0ZSBpcyBhbiBhY2NlcHRpbmcgc3RhdGUsIGl0IHdpbGwgYWxzbyBoYXZlIHNldmVyYWwgYWRkaXRpb25hbFxuICAgIC8vIHByb3BlcnRpZXM6XG4gICAgLy9cbiAgICAvLyAqIGByZWdleGA6IEEgcmVndWxhciBleHByZXNzaW9uIHRoYXQgaXMgdXNlZCB0byBleHRyYWN0IHBhcmFtZXRlcnMgZnJvbSBwYXRoc1xuICAgIC8vICAgdGhhdCByZWFjaGVkIHRoaXMgYWNjZXB0aW5nIHN0YXRlLlxuICAgIC8vICogYGhhbmRsZXJzYDogSW5mb3JtYXRpb24gb24gaG93IHRvIGNvbnZlcnQgdGhlIGxpc3Qgb2YgY2FwdHVyZXMgaW50byBjYWxsc1xuICAgIC8vICAgdG8gcmVnaXN0ZXJlZCBoYW5kbGVycyB3aXRoIHRoZSBzcGVjaWZpZWQgcGFyYW1ldGVyc1xuICAgIC8vICogYHR5cGVzYDogSG93IG1hbnkgc3RhdGljLCBkeW5hbWljIG9yIHN0YXIgc2VnbWVudHMgaW4gdGhpcyByb3V0ZS4gVXNlZCB0b1xuICAgIC8vICAgZGVjaWRlIHdoaWNoIHJvdXRlIHRvIHVzZSBpZiBtdWx0aXBsZSByZWdpc3RlcmVkIHJvdXRlcyBtYXRjaCBhIHBhdGguXG4gICAgLy9cbiAgICAvLyBDdXJyZW50bHksIFN0YXRlIGlzIGltcGxlbWVudGVkIG5haXZlbHkgYnkgbG9vcGluZyBvdmVyIGBuZXh0U3RhdGVzYCBhbmRcbiAgICAvLyBjb21wYXJpbmcgYSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBhZ2FpbnN0IGEgY2hhcmFjdGVyLiBBIG1vcmUgZWZmaWNpZW50XG4gICAgLy8gaW1wbGVtZW50YXRpb24gd291bGQgdXNlIGEgaGFzaCBvZiBrZXlzIHBvaW50aW5nIGF0IG9uZSBvciBtb3JlIG5leHQgc3RhdGVzLlxuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZShjaGFyU3BlYykge1xuICAgICAgdGhpcy5jaGFyU3BlYyA9IGNoYXJTcGVjO1xuICAgICAgdGhpcy5uZXh0U3RhdGVzID0gW107XG4gICAgfVxuXG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRTdGF0ZS5wcm90b3R5cGUgPSB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKGNoYXJTcGVjKSB7XG4gICAgICAgIHZhciBuZXh0U3RhdGVzID0gdGhpcy5uZXh0U3RhdGVzO1xuXG4gICAgICAgIGZvciAodmFyIGk9MCwgbD1uZXh0U3RhdGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICB2YXIgY2hpbGQgPSBuZXh0U3RhdGVzW2ldO1xuXG4gICAgICAgICAgdmFyIGlzRXF1YWwgPSBjaGlsZC5jaGFyU3BlYy52YWxpZENoYXJzID09PSBjaGFyU3BlYy52YWxpZENoYXJzO1xuICAgICAgICAgIGlzRXF1YWwgPSBpc0VxdWFsICYmIGNoaWxkLmNoYXJTcGVjLmludmFsaWRDaGFycyA9PT0gY2hhclNwZWMuaW52YWxpZENoYXJzO1xuXG4gICAgICAgICAgaWYgKGlzRXF1YWwpIHsgcmV0dXJuIGNoaWxkOyB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHB1dDogZnVuY3Rpb24oY2hhclNwZWMpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgc3BlY2lmaWNhdGlvbiBhbHJlYWR5IGV4aXN0cyBpbiBhIGNoaWxkIG9mIHRoZSBjdXJyZW50XG4gICAgICAgIC8vIHN0YXRlLCBqdXN0IHJldHVybiB0aGF0IHN0YXRlLlxuICAgICAgICBpZiAoc3RhdGUgPSB0aGlzLmdldChjaGFyU3BlYykpIHsgcmV0dXJuIHN0YXRlOyB9XG5cbiAgICAgICAgLy8gTWFrZSBhIG5ldyBzdGF0ZSBmb3IgdGhlIGNoYXJhY3RlciBzcGVjXG4gICAgICAgIHN0YXRlID0gbmV3ICQkcm91dGUkcmVjb2duaXplciQkU3RhdGUoY2hhclNwZWMpO1xuXG4gICAgICAgIC8vIEluc2VydCB0aGUgbmV3IHN0YXRlIGFzIGEgY2hpbGQgb2YgdGhlIGN1cnJlbnQgc3RhdGVcbiAgICAgICAgdGhpcy5uZXh0U3RhdGVzLnB1c2goc3RhdGUpO1xuXG4gICAgICAgIC8vIElmIHRoaXMgY2hhcmFjdGVyIHNwZWNpZmljYXRpb24gcmVwZWF0cywgaW5zZXJ0IHRoZSBuZXcgc3RhdGUgYXMgYSBjaGlsZFxuICAgICAgICAvLyBvZiBpdHNlbGYuIE5vdGUgdGhhdCB0aGlzIHdpbGwgbm90IHRyaWdnZXIgYW4gaW5maW5pdGUgbG9vcCBiZWNhdXNlIGVhY2hcbiAgICAgICAgLy8gdHJhbnNpdGlvbiBkdXJpbmcgcmVjb2duaXRpb24gY29uc3VtZXMgYSBjaGFyYWN0ZXIuXG4gICAgICAgIGlmIChjaGFyU3BlYy5yZXBlYXQpIHtcbiAgICAgICAgICBzdGF0ZS5uZXh0U3RhdGVzLnB1c2goc3RhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZXcgc3RhdGVcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfSxcblxuICAgICAgLy8gRmluZCBhIGxpc3Qgb2YgY2hpbGQgc3RhdGVzIG1hdGNoaW5nIHRoZSBuZXh0IGNoYXJhY3RlclxuICAgICAgbWF0Y2g6IGZ1bmN0aW9uKGNoKSB7XG4gICAgICAgIC8vIERFQlVHIFwiUHJvY2Vzc2luZyBgXCIgKyBjaCArIFwiYDpcIlxuICAgICAgICB2YXIgbmV4dFN0YXRlcyA9IHRoaXMubmV4dFN0YXRlcyxcbiAgICAgICAgICAgIGNoaWxkLCBjaGFyU3BlYywgY2hhcnM7XG5cbiAgICAgICAgLy8gREVCVUcgXCIgIFwiICsgZGVidWdTdGF0ZSh0aGlzKVxuICAgICAgICB2YXIgcmV0dXJuZWQgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGw9bmV4dFN0YXRlcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgY2hpbGQgPSBuZXh0U3RhdGVzW2ldO1xuXG4gICAgICAgICAgY2hhclNwZWMgPSBjaGlsZC5jaGFyU3BlYztcblxuICAgICAgICAgIGlmICh0eXBlb2YgKGNoYXJzID0gY2hhclNwZWMudmFsaWRDaGFycykgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoY2hhcnMuaW5kZXhPZihjaCkgIT09IC0xKSB7IHJldHVybmVkLnB1c2goY2hpbGQpOyB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGNoYXJzID0gY2hhclNwZWMuaW52YWxpZENoYXJzKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChjaGFycy5pbmRleE9mKGNoKSA9PT0gLTEpIHsgcmV0dXJuZWQucHVzaChjaGlsZCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XG4gICAgICB9XG5cbiAgICAgIC8qKiBJRiBERUJVR1xuICAgICAgLCBkZWJ1ZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjaGFyU3BlYyA9IHRoaXMuY2hhclNwZWMsXG4gICAgICAgICAgICBkZWJ1ZyA9IFwiW1wiLFxuICAgICAgICAgICAgY2hhcnMgPSBjaGFyU3BlYy52YWxpZENoYXJzIHx8IGNoYXJTcGVjLmludmFsaWRDaGFycztcblxuICAgICAgICBpZiAoY2hhclNwZWMuaW52YWxpZENoYXJzKSB7IGRlYnVnICs9IFwiXlwiOyB9XG4gICAgICAgIGRlYnVnICs9IGNoYXJzO1xuICAgICAgICBkZWJ1ZyArPSBcIl1cIjtcblxuICAgICAgICBpZiAoY2hhclNwZWMucmVwZWF0KSB7IGRlYnVnICs9IFwiK1wiOyB9XG5cbiAgICAgICAgcmV0dXJuIGRlYnVnO1xuICAgICAgfVxuICAgICAgRU5EIElGICoqL1xuICAgIH07XG5cbiAgICAvKiogSUYgREVCVUdcbiAgICBmdW5jdGlvbiBkZWJ1Zyhsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKGxvZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVidWdTdGF0ZShzdGF0ZSkge1xuICAgICAgcmV0dXJuIHN0YXRlLm5leHRTdGF0ZXMubWFwKGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgaWYgKG4ubmV4dFN0YXRlcy5sZW5ndGggPT09IDApIHsgcmV0dXJuIFwiKCBcIiArIG4uZGVidWcoKSArIFwiIFthY2NlcHRpbmddIClcIjsgfVxuICAgICAgICByZXR1cm4gXCIoIFwiICsgbi5kZWJ1ZygpICsgXCIgPHRoZW4+IFwiICsgbi5uZXh0U3RhdGVzLm1hcChmdW5jdGlvbihzKSB7IHJldHVybiBzLmRlYnVnKCkgfSkuam9pbihcIiBvciBcIikgKyBcIiApXCI7XG4gICAgICB9KS5qb2luKFwiLCBcIilcbiAgICB9XG4gICAgRU5EIElGICoqL1xuXG4gICAgLy8gU29ydCB0aGUgcm91dGVzIGJ5IHNwZWNpZmljaXR5XG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRzb3J0U29sdXRpb25zKHN0YXRlcykge1xuICAgICAgcmV0dXJuIHN0YXRlcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIuc3BlY2lmaWNpdHkudmFsIC0gYS5zcGVjaWZpY2l0eS52YWw7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJHJlY29nbml6ZUNoYXIoc3RhdGVzLCBjaCkge1xuICAgICAgdmFyIG5leHRTdGF0ZXMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaT0wLCBsPXN0YXRlcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tpXTtcblxuICAgICAgICBuZXh0U3RhdGVzID0gbmV4dFN0YXRlcy5jb25jYXQoc3RhdGUubWF0Y2goY2gpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRTdGF0ZXM7XG4gICAgfVxuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciQkb0NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24ocHJvdG8pIHtcbiAgICAgIGZ1bmN0aW9uIEYoKSB7fVxuICAgICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgIHJldHVybiBuZXcgRigpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJFJlY29nbml6ZVJlc3VsdHMocXVlcnlQYXJhbXMpIHtcbiAgICAgIHRoaXMucXVlcnlQYXJhbXMgPSBxdWVyeVBhcmFtcyB8fCB7fTtcbiAgICB9XG4gICAgJCRyb3V0ZSRyZWNvZ25pemVyJCRSZWNvZ25pemVSZXN1bHRzLnByb3RvdHlwZSA9ICQkcm91dGUkcmVjb2duaXplciQkb0NyZWF0ZSh7XG4gICAgICBzcGxpY2U6IEFycmF5LnByb3RvdHlwZS5zcGxpY2UsXG4gICAgICBzbGljZTogIEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIHB1c2g6ICAgQXJyYXkucHJvdG90eXBlLnB1c2gsXG4gICAgICBsZW5ndGg6IDAsXG4gICAgICBxdWVyeVBhcmFtczogbnVsbFxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gJCRyb3V0ZSRyZWNvZ25pemVyJCRmaW5kSGFuZGxlcihzdGF0ZSwgcGF0aCwgcXVlcnlQYXJhbXMpIHtcbiAgICAgIHZhciBoYW5kbGVycyA9IHN0YXRlLmhhbmRsZXJzLCByZWdleCA9IHN0YXRlLnJlZ2V4O1xuICAgICAgdmFyIGNhcHR1cmVzID0gcGF0aC5tYXRjaChyZWdleCksIGN1cnJlbnRDYXB0dXJlID0gMTtcbiAgICAgIHZhciByZXN1bHQgPSBuZXcgJCRyb3V0ZSRyZWNvZ25pemVyJCRSZWNvZ25pemVSZXN1bHRzKHF1ZXJ5UGFyYW1zKTtcblxuICAgICAgZm9yICh2YXIgaT0wLCBsPWhhbmRsZXJzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBoYW5kbGVyc1tpXSwgbmFtZXMgPSBoYW5kbGVyLm5hbWVzLCBwYXJhbXMgPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBqPTAsIG09bmFtZXMubGVuZ3RoOyBqPG07IGorKykge1xuICAgICAgICAgIHBhcmFtc1tuYW1lc1tqXV0gPSBjYXB0dXJlc1tjdXJyZW50Q2FwdHVyZSsrXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdC5wdXNoKHsgaGFuZGxlcjogaGFuZGxlci5oYW5kbGVyLCBwYXJhbXM6IHBhcmFtcywgaXNEeW5hbWljOiAhIW5hbWVzLmxlbmd0aCB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiAkJHJvdXRlJHJlY29nbml6ZXIkJGFkZFNlZ21lbnQoY3VycmVudFN0YXRlLCBzZWdtZW50KSB7XG4gICAgICBzZWdtZW50LmVhY2hDaGFyKGZ1bmN0aW9uKGNoKSB7XG4gICAgICAgIHZhciBzdGF0ZTtcblxuICAgICAgICBjdXJyZW50U3RhdGUgPSBjdXJyZW50U3RhdGUucHV0KGNoKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gY3VycmVudFN0YXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uICQkcm91dGUkcmVjb2duaXplciQkZGVjb2RlUXVlcnlQYXJhbVBhcnQocGFydCkge1xuICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDQwMS9pbnRlcmFjdC9mb3Jtcy5odG1sI2gtMTcuMTMuNC4xXG4gICAgICBwYXJ0ID0gcGFydC5yZXBsYWNlKC9cXCsvZ20sICclMjAnKTtcbiAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGFydCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIG1haW4gaW50ZXJmYWNlXG5cbiAgICB2YXIgJCRyb3V0ZSRyZWNvZ25pemVyJCRSb3V0ZVJlY29nbml6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucm9vdFN0YXRlID0gbmV3ICQkcm91dGUkcmVjb2duaXplciQkU3RhdGUoKTtcbiAgICAgIHRoaXMubmFtZXMgPSB7fTtcbiAgICB9O1xuXG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplci5wcm90b3R5cGUgPSB7XG4gICAgICBhZGQ6IGZ1bmN0aW9uKHJvdXRlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgY3VycmVudFN0YXRlID0gdGhpcy5yb290U3RhdGUsIHJlZ2V4ID0gXCJeXCIsXG4gICAgICAgICAgICBzcGVjaWZpY2l0eSA9IHt9LFxuICAgICAgICAgICAgaGFuZGxlcnMgPSBbXSwgYWxsU2VnbWVudHMgPSBbXSwgbmFtZTtcblxuICAgICAgICB2YXIgaXNFbXB0eSA9IHRydWU7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPXJvdXRlcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHJvdXRlID0gcm91dGVzW2ldLCBuYW1lcyA9IFtdO1xuXG4gICAgICAgICAgdmFyIHNlZ21lbnRzID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRwYXJzZShyb3V0ZS5wYXRoLCBuYW1lcywgc3BlY2lmaWNpdHkpO1xuXG4gICAgICAgICAgYWxsU2VnbWVudHMgPSBhbGxTZWdtZW50cy5jb25jYXQoc2VnbWVudHMpO1xuXG4gICAgICAgICAgZm9yICh2YXIgaj0wLCBtPXNlZ21lbnRzLmxlbmd0aDsgajxtOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBzZWdtZW50ID0gc2VnbWVudHNbal07XG5cbiAgICAgICAgICAgIGlmIChzZWdtZW50IGluc3RhbmNlb2YgJCRyb3V0ZSRyZWNvZ25pemVyJCRFcHNpbG9uU2VnbWVudCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICBpc0VtcHR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEFkZCBhIFwiL1wiIGZvciB0aGUgbmV3IHNlZ21lbnRcbiAgICAgICAgICAgIGN1cnJlbnRTdGF0ZSA9IGN1cnJlbnRTdGF0ZS5wdXQoeyB2YWxpZENoYXJzOiBcIi9cIiB9KTtcbiAgICAgICAgICAgIHJlZ2V4ICs9IFwiL1wiO1xuXG4gICAgICAgICAgICAvLyBBZGQgYSByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2VnbWVudCB0byB0aGUgTkZBIGFuZCByZWdleFxuICAgICAgICAgICAgY3VycmVudFN0YXRlID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRhZGRTZWdtZW50KGN1cnJlbnRTdGF0ZSwgc2VnbWVudCk7XG4gICAgICAgICAgICByZWdleCArPSBzZWdtZW50LnJlZ2V4KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGhhbmRsZXIgPSB7IGhhbmRsZXI6IHJvdXRlLmhhbmRsZXIsIG5hbWVzOiBuYW1lcyB9O1xuICAgICAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNFbXB0eSkge1xuICAgICAgICAgIGN1cnJlbnRTdGF0ZSA9IGN1cnJlbnRTdGF0ZS5wdXQoeyB2YWxpZENoYXJzOiBcIi9cIiB9KTtcbiAgICAgICAgICByZWdleCArPSBcIi9cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRTdGF0ZS5oYW5kbGVycyA9IGhhbmRsZXJzO1xuICAgICAgICBjdXJyZW50U3RhdGUucmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4ICsgXCIkXCIpO1xuICAgICAgICBjdXJyZW50U3RhdGUuc3BlY2lmaWNpdHkgPSBzcGVjaWZpY2l0eTtcblxuICAgICAgICBpZiAobmFtZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5hcykge1xuICAgICAgICAgIHRoaXMubmFtZXNbbmFtZV0gPSB7XG4gICAgICAgICAgICBzZWdtZW50czogYWxsU2VnbWVudHMsXG4gICAgICAgICAgICBoYW5kbGVyczogaGFuZGxlcnNcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBoYW5kbGVyc0ZvcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgcm91dGUgPSB0aGlzLm5hbWVzW25hbWVdLCByZXN1bHQgPSBbXTtcbiAgICAgICAgaWYgKCFyb3V0ZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJUaGVyZSBpcyBubyByb3V0ZSBuYW1lZCBcIiArIG5hbWUpOyB9XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPXJvdXRlLmhhbmRsZXJzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICByZXN1bHQucHVzaChyb3V0ZS5oYW5kbGVyc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcblxuICAgICAgaGFzUm91dGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5uYW1lc1tuYW1lXTtcbiAgICAgIH0sXG5cbiAgICAgIGdlbmVyYXRlOiBmdW5jdGlvbihuYW1lLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIHJvdXRlID0gdGhpcy5uYW1lc1tuYW1lXSwgb3V0cHV0ID0gXCJcIjtcbiAgICAgICAgaWYgKCFyb3V0ZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJUaGVyZSBpcyBubyByb3V0ZSBuYW1lZCBcIiArIG5hbWUpOyB9XG5cbiAgICAgICAgdmFyIHNlZ21lbnRzID0gcm91dGUuc2VnbWVudHM7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsPXNlZ21lbnRzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICB2YXIgc2VnbWVudCA9IHNlZ21lbnRzW2ldO1xuXG4gICAgICAgICAgaWYgKHNlZ21lbnQgaW5zdGFuY2VvZiAkJHJvdXRlJHJlY29nbml6ZXIkJEVwc2lsb25TZWdtZW50KSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICBvdXRwdXQgKz0gXCIvXCI7XG4gICAgICAgICAgb3V0cHV0ICs9IHNlZ21lbnQuZ2VuZXJhdGUocGFyYW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdXRwdXQuY2hhckF0KDApICE9PSAnLycpIHsgb3V0cHV0ID0gJy8nICsgb3V0cHV0OyB9XG5cbiAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMucXVlcnlQYXJhbXMpIHtcbiAgICAgICAgICBvdXRwdXQgKz0gdGhpcy5nZW5lcmF0ZVF1ZXJ5U3RyaW5nKHBhcmFtcy5xdWVyeVBhcmFtcywgcm91dGUuaGFuZGxlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgIH0sXG5cbiAgICAgIGdlbmVyYXRlUXVlcnlTdHJpbmc6IGZ1bmN0aW9uKHBhcmFtcywgaGFuZGxlcnMpIHtcbiAgICAgICAgdmFyIHBhaXJzID0gW107XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvcih2YXIga2V5IGluIHBhcmFtcykge1xuICAgICAgICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGtleXMuc29ydCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgdmFyIHZhbHVlID0gcGFyYW1zW2tleV07XG4gICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcGFpciA9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpO1xuICAgICAgICAgIGlmICgkJHJvdXRlJHJlY29nbml6ZXIkJGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaiA8IGw7IGorKykge1xuICAgICAgICAgICAgICB2YXIgYXJyYXlQYWlyID0ga2V5ICsgJ1tdJyArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZVtqXSk7XG4gICAgICAgICAgICAgIHBhaXJzLnB1c2goYXJyYXlQYWlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFpciArPSBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICBwYWlycy5wdXNoKHBhaXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWlycy5sZW5ndGggPT09IDApIHsgcmV0dXJuICcnOyB9XG5cbiAgICAgICAgcmV0dXJuIFwiP1wiICsgcGFpcnMuam9pbihcIiZcIik7XG4gICAgICB9LFxuXG4gICAgICBwYXJzZVF1ZXJ5U3RyaW5nOiBmdW5jdGlvbihxdWVyeVN0cmluZykge1xuICAgICAgICB2YXIgcGFpcnMgPSBxdWVyeVN0cmluZy5zcGxpdChcIiZcIiksIHF1ZXJ5UGFyYW1zID0ge307XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgcGFpcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgcGFpciAgICAgID0gcGFpcnNbaV0uc3BsaXQoJz0nKSxcbiAgICAgICAgICAgICAga2V5ICAgICAgID0gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWNvZGVRdWVyeVBhcmFtUGFydChwYWlyWzBdKSxcbiAgICAgICAgICAgICAga2V5TGVuZ3RoID0ga2V5Lmxlbmd0aCxcbiAgICAgICAgICAgICAgaXNBcnJheSA9IGZhbHNlLFxuICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICBpZiAocGFpci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHZhbHVlID0gJ3RydWUnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL0hhbmRsZSBhcnJheXNcbiAgICAgICAgICAgIGlmIChrZXlMZW5ndGggPiAyICYmIGtleS5zbGljZShrZXlMZW5ndGggLTIpID09PSAnW10nKSB7XG4gICAgICAgICAgICAgIGlzQXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgICBrZXkgPSBrZXkuc2xpY2UoMCwga2V5TGVuZ3RoIC0gMik7XG4gICAgICAgICAgICAgIGlmKCFxdWVyeVBhcmFtc1trZXldKSB7XG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXNba2V5XSA9IFtdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHBhaXJbMV0gPyAkJHJvdXRlJHJlY29nbml6ZXIkJGRlY29kZVF1ZXJ5UGFyYW1QYXJ0KHBhaXJbMV0pIDogJyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgICAgICBxdWVyeVBhcmFtc1trZXldLnB1c2godmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxdWVyeVBhcmFtc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBxdWVyeVBhcmFtcztcbiAgICAgIH0sXG5cbiAgICAgIHJlY29nbml6ZTogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICB2YXIgc3RhdGVzID0gWyB0aGlzLnJvb3RTdGF0ZSBdLFxuICAgICAgICAgICAgcGF0aExlbiwgaSwgbCwgcXVlcnlTdGFydCwgcXVlcnlQYXJhbXMgPSB7fSxcbiAgICAgICAgICAgIGlzU2xhc2hEcm9wcGVkID0gZmFsc2U7XG5cbiAgICAgICAgcXVlcnlTdGFydCA9IHBhdGguaW5kZXhPZignPycpO1xuICAgICAgICBpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcbiAgICAgICAgICB2YXIgcXVlcnlTdHJpbmcgPSBwYXRoLnN1YnN0cihxdWVyeVN0YXJ0ICsgMSwgcGF0aC5sZW5ndGgpO1xuICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KTtcbiAgICAgICAgICBxdWVyeVBhcmFtcyA9IHRoaXMucGFyc2VRdWVyeVN0cmluZyhxdWVyeVN0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXRoID0gZGVjb2RlVVJJKHBhdGgpO1xuXG4gICAgICAgIC8vIERFQlVHIEdST1VQIHBhdGhcblxuICAgICAgICBpZiAocGF0aC5jaGFyQXQoMCkgIT09IFwiL1wiKSB7IHBhdGggPSBcIi9cIiArIHBhdGg7IH1cblxuICAgICAgICBwYXRoTGVuID0gcGF0aC5sZW5ndGg7XG4gICAgICAgIGlmIChwYXRoTGVuID4gMSAmJiBwYXRoLmNoYXJBdChwYXRoTGVuIC0gMSkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKDAsIHBhdGhMZW4gLSAxKTtcbiAgICAgICAgICBpc1NsYXNoRHJvcHBlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGk9MCwgbD1wYXRoLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICBzdGF0ZXMgPSAkJHJvdXRlJHJlY29nbml6ZXIkJHJlY29nbml6ZUNoYXIoc3RhdGVzLCBwYXRoLmNoYXJBdChpKSk7XG4gICAgICAgICAgaWYgKCFzdGF0ZXMubGVuZ3RoKSB7IGJyZWFrOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFTkQgREVCVUcgR1JPVVBcblxuICAgICAgICB2YXIgc29sdXRpb25zID0gW107XG4gICAgICAgIGZvciAoaT0wLCBsPXN0YXRlcy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHN0YXRlc1tpXS5oYW5kbGVycykgeyBzb2x1dGlvbnMucHVzaChzdGF0ZXNbaV0pOyB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZXMgPSAkJHJvdXRlJHJlY29nbml6ZXIkJHNvcnRTb2x1dGlvbnMoc29sdXRpb25zKTtcblxuICAgICAgICB2YXIgc3RhdGUgPSBzb2x1dGlvbnNbMF07XG5cbiAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLmhhbmRsZXJzKSB7XG4gICAgICAgICAgLy8gaWYgYSB0cmFpbGluZyBzbGFzaCB3YXMgZHJvcHBlZCBhbmQgYSBzdGFyIHNlZ21lbnQgaXMgdGhlIGxhc3Qgc2VnbWVudFxuICAgICAgICAgIC8vIHNwZWNpZmllZCwgcHV0IHRoZSB0cmFpbGluZyBzbGFzaCBiYWNrXG4gICAgICAgICAgaWYgKGlzU2xhc2hEcm9wcGVkICYmIHN0YXRlLnJlZ2V4LnNvdXJjZS5zbGljZSgtNSkgPT09IFwiKC4rKSRcIikge1xuICAgICAgICAgICAgcGF0aCA9IHBhdGggKyBcIi9cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICQkcm91dGUkcmVjb2duaXplciQkZmluZEhhbmRsZXIoc3RhdGUsIHBhdGgsIHF1ZXJ5UGFyYW1zKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAkJHJvdXRlJHJlY29nbml6ZXIkJFJvdXRlUmVjb2duaXplci5wcm90b3R5cGUubWFwID0gJCRyb3V0ZSRyZWNvZ25pemVyJGRzbCQkZGVmYXVsdDtcblxuICAgICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyLlZFUlNJT04gPSAnMC4xLjknO1xuXG4gICAgdmFyICQkcm91dGUkcmVjb2duaXplciQkZGVmYXVsdCA9ICQkcm91dGUkcmVjb2duaXplciQkUm91dGVSZWNvZ25pemVyO1xuXG4gICAgLyogZ2xvYmFsIGRlZmluZTp0cnVlIG1vZHVsZTp0cnVlIHdpbmRvdzogdHJ1ZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZVsnYW1kJ10pIHtcbiAgICAgIGRlZmluZSgncm91dGUtcmVjb2duaXplcicsIGZ1bmN0aW9uKCkgeyByZXR1cm4gJCRyb3V0ZSRyZWNvZ25pemVyJCRkZWZhdWx0OyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9ICQkcm91dGUkcmVjb2duaXplciQkZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpc1snUm91dGVSZWNvZ25pemVyJ10gPSAkJHJvdXRlJHJlY29nbml6ZXIkJGRlZmF1bHQ7XG4gICAgfVxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGUtcmVjb2duaXplci5qcy5tYXAiLCJ2YXIgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUuanMnKTtcblxudmFyIE1vZHVsZXMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcy9Nb2R1bGVzLmpzJyk7XG52YXIgSW5qZWN0YWJsZXMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcy9JbmplY3RhYmxlcy5qcycpO1xuXG52YXIgcmVnaXN0ZXJCdWlsdElucyA9IHJlcXVpcmUoJy4vYnVpbHRpbnMvUmVnaXN0ZXIuanMnKTtcblxudmFyIE1pbWVvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1vZHVsZXMgPSBNb2R1bGVzKCk7XG4gICAgdmFyIGluamVjdGFibGVzID0gSW5qZWN0YWJsZXMoKTtcblxuICAgIHJlZ2lzdGVyQnVpbHRJbnMoaW5qZWN0YWJsZXMpO1xuXG4gICAgZnVuY3Rpb24gYm9vdHN0cmFwKGluamVjdGFibGVOYW1lKSB7XG4gICAgICAgIGlmICghaW5qZWN0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGVmaW5lIGFuIGluamVjdGFibGUgdG8gYm9vdHN0cmFwIScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtb2R1bGVzLmhhc0FsbERlcGVuZGVuY2llcygpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZXMgZG9uXFwndCBleGlzdDogJyArIG1vZHVsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaW5qZWN0YWJsZXMuaGFzQWxsRGVwZW5kZW5jaWVzKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0YWJsZXMgZG9uXFwndCBleGlzdDogJyArIGluamVjdGFibGVzLmdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmplY3RhYmxlcy5pbnN0YW50aWF0ZSgpO1xuXG4gICAgICAgIG1vZHVsZXMuaW5zdGFudGlhdGUoKTtcblxuICAgICAgICB2YXIgZW50cnlJbmplY3RhYmxlID0gaW5qZWN0YWJsZXMuZ2V0KGluamVjdGFibGVOYW1lKTtcblxuICAgICAgICBpZiAoIUJvb2xlYW4oZW50cnlJbmplY3RhYmxlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlIFwiJyArIGluamVjdGFibGVOYW1lICsgJ1wiIHRvIGJvb3RzdHJhcCBub3QgZm91bmQuIFN0cmluZ3lmaWVkIGluamVjdGFibGU6ICcgKyBlbnRyeUluamVjdGFibGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEoZW50cnlJbmplY3RhYmxlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdGFibGUgXCInICsgaW5qZWN0YWJsZU5hbWUgKyAnXCIgaXMgbm90IGV4ZWN1dGFibGUuIFN0cmluZ3lmaWVkIGluamVjdGFibGU6ICcgKyBTdHJpbmcoZW50cnlJbmplY3RhYmxlKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW50cnlJbmplY3RhYmxlLmFwcGx5KGVudHJ5SW5qZWN0YWJsZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbW9kdWxlOiBmdW5jdGlvbihuYW1lLCBkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIGlmIChkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kdWxlcy5hZGQobmV3IE1vZHVsZShpbmplY3RhYmxlcywgbmFtZSwgZGVwZW5kZW5jaWVzKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtb2R1bGVzLmdldChuYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgYm9vdHN0cmFwOiBib290c3RyYXBcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbWVvKCk7XG4iLCJmdW5jdGlvbiBNb2R1bGUoaW5qZWN0YWJsZXMsIG5hbWUsIGRlcGVuZGVuY2llcykge1xuICAgIHZhciBtb2R1bGUgPSB0aGlzO1xuXG4gICAgdmFyIHRvUnVuID0gW107XG5cbiAgICB0aGlzLiRuYW1lID0gbmFtZTtcbiAgICB0aGlzLiRpbmplY3QgPSBkZXBlbmRlbmNpZXM7XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlSW5qZWN0YWJsZShuYW1lLCBwYXJhbWV0ZXJzKSB7XG4gICAgICAgIGlmIChpbmplY3RhYmxlcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0YWJsZSBcIicgKyBuYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5qZWN0YWJsZTtcblxuICAgICAgICBpZiAocGFyYW1ldGVycyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBpbmplY3RhYmxlID0gcGFyYW1ldGVycztcbiAgICAgICAgICAgIGlmICghaW5qZWN0YWJsZS4kaW5qZWN0KSB7XG4gICAgICAgICAgICAgICAgaW5qZWN0YWJsZS4kaW5qZWN0ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZGVwZW5kZW5jaWVzID0gcGFyYW1ldGVycy5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICBpbmplY3RhYmxlID0gcGFyYW1ldGVycy5zbGljZSgtMSlbMF07XG4gICAgICAgICAgICBpbmplY3RhYmxlLiRpbmplY3QgPSBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpbmplY3RhYmxlLiRuYW1lID0gbmFtZTtcblxuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRJbmplY3RhYmxlKG5hbWUsIHBhcmFtZXRlcnMpIHtcbiAgICAgICAgaW5qZWN0YWJsZXMuYWRkKHByZXBhcmVJbmplY3RhYmxlKG5hbWUsIHBhcmFtZXRlcnMpKTtcblxuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH1cblxuICAgIHRoaXMuZXhlY3V0ZVJ1biA9IGZ1bmN0aW9uIGV4ZWN1dGVSdW4oKSB7XG4gICAgICAgIHRvUnVuLmZvckVhY2goZnVuY3Rpb24oaW5qZWN0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGluamVjdGFibGVzLmdldChpbmplY3RhYmxlTmFtZSkoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogSSBkb24ndCBsaWtlIHRoZSB3cmFwcGVyIGFuZCBhdXRvLWdlbmVyYXRlZCBuYW1lLCBidXQgZm9yIG5vdyBJIGNhbid0XG4gICAgICogY29tZSB1cCB3aXRoIGEgYmV0dGVyIHNvbHV0aW9uLiBUaGUgcHJvYmxlbSBpcyB0aGF0IHRoZSBydW4tZnVuY3Rpb25cbiAgICAgKiBuZWVkcyB0byB3b3JrIHdpdGggdGhlIGluamVjdGlvbiBzeXN0ZW0gKHNpbmNlIGl0IGNhbiBoYXZlIG90aGVyXG4gICAgICogaW5qZWN0YWJsZXMgaW5qZWN0ZWQpLCBhbmQgdGhlIHdob2xlIHN5c3RlbSBpc24ndCBkZXNpZ25lZCB0byBkZWFsIHdpdGhcbiAgICAgKiB1bm5hbWVkIHRoaW5ncy5cbiAgICAgKlxuICAgICAqIEluIGZhY3QsIEkgZmVlbCB0aGF0IGFuIGluamVjdGlvbiBzeXN0ZW0gdGhhdCBjYW4gaGFuZGxlIHVubmFtZWQgaXRlbXNcbiAgICAgKiB3b3VsZCBiZSB3cm9uZy4gSG93IHdvdWxkIHlvdSBpZGVudGlmeSB3aGF0IHRvIGluamVjdD8gSGF2aW5nIG5hbWVzIGZvclxuICAgICAqIGluamVjdGFibGVzIChvciBhdCBsZWFzdCBJRHMpIGlzIGEgY29yZSBhc3BlY3Qgb2YgYW4gaW5qZWN0aW9uIHN5c3RlbS5cbiAgICAgKlxuICAgICAqIFNvIHRoaXMgd291bGQgaGF2ZSB0byBsaXZlIG91dHNpZGUgb2YgaXQuIEJ1dCB0aGF0IG1lYW5zIGhhdmluZyBpdCdzIG93blxuICAgICAqIFwibWFrZSBzdXJlIGFsbCB0aGVzZSBpbmplY3RhYmxlcyBleGlzdFwiIHN5c3RlbS4gVGhlbiB3ZSBjb3VsZCBqdXN0IGdldFxuICAgICAqIHRoZSBuYW1lZCBpbmplY3RhYmxlcyB0aGUgcnVuLWZ1bmN0aW9uIG5lZWRzIGFuZCBjYWxsIHRoZSBydW4tZnVuY3Rpb25cbiAgICAgKiB3aXRoIHRob3NlLlxuICAgICAqXG4gICAgICogSSBjYW4ndCB0aGluayBvZiBhIGdvb2Qgd2F5IHRvIGRlLWR1cGxpY2F0ZWQgdGhhdCBkZXBlbmRlbmN5IHJlc29sdXRpb25cbiAgICAgKiBzeXN0ZW0gdGhvdWdoLCBzbyB0aGVyZSdkIGJlIG9uZSBmb3IgYWxsIG5hbWVkIGluamVjdGFibGVzIGFuZCBvbmUgZm9yXG4gICAgICogdGhlIHJ1bi1mdW5jdGlvbnMuXG4gICAgICpcbiAgICAgKiBJIGRvbid0IHBsYW4gb24gaGF2aW5nIG90aGVyIHVubmFtZWQgaW5qZWN0YWJsZXMsIHNvIEkgZmVlbCB0aGF0IGVmZm9ydFxuICAgICAqIHdvdWxkIGJlIHdhc3RlZC4gSGVuY2UgdGhlIFwiaGFja1wiIGhlcmUgd2l0aCBhbiBhdXRvLWdlbmVyYXRlZCBuYW1lIGFuZFxuICAgICAqIGEgd3JhcHBlciB0aGF0IGV4ZWN1dGVzIHRoZSBydW4tZnVuY3Rpb24gd2l0aCBwYXNzLXRocm91Z2ggYXJndW1lbnRzLlxuICAgICAqL1xuICAgIHRoaXMucnVuID0gZnVuY3Rpb24ocGFyYW1ldGVycykge1xuICAgICAgICB2YXIgbmFtZSA9IG1vZHVsZS4kbmFtZSArICctcnVuLicgKyB0b1J1bi5sZW5ndGg7XG4gICAgICAgIHRvUnVuLnB1c2gobmFtZSk7XG5cbiAgICAgICAgdmFyIHByb3ZpZGVyID0gZnVuY3Rpb24gcHJvdmlkZXJSdW4oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1ldGVycyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbWV0ZXJzLmFwcGx5KHBhcmFtZXRlcnMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0RW50cnkgPSBwYXJhbWV0ZXJzLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RFbnRyeS5hcHBseShsYXN0RW50cnksIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAocGFyYW1ldGVycyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBwcm92aWRlci4kaW5qZWN0ID0gcGFyYW1ldGVycy4kaW5qZWN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvdmlkZXIuJGluamVjdCA9IHBhcmFtZXRlcnMuc2xpY2UoMCwgLTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFkZEluamVjdGFibGUobmFtZSwgcHJvdmlkZXIpO1xuICAgIH07XG5cbiAgICB0aGlzLmZhY3RvcnkgPSBhZGRJbmplY3RhYmxlO1xuICAgIHRoaXMuY29tcG9uZW50ID0gYWRkSW5qZWN0YWJsZTtcbiAgICB0aGlzLnZhbHVlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGFkZEluamVjdGFibGUobmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7IiwiZnVuY3Rpb24gV2luZG93KCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgbm9PcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJGZha2U6IHRydWUsXG4gICAgICAgICAgICBvbnBvcHN0YXRlOiBub09wLFxuICAgICAgICAgICAgb25jbGljazogbm9PcCxcbiAgICAgICAgICAgIG9ubG9hZDogbm9PcCxcbiAgICAgICAgICAgIGRvY3VtZW50OiB7XG4gICAgICAgICAgICAgICAgZ2V0RWxlbWVudEJ5SWQ6IG5vT3BcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaXN0b3J5OiB7XG4gICAgICAgICAgICAgICAgcHVzaFN0YXRlOiBub09wLFxuICAgICAgICAgICAgICAgIHJlcGxhY2VTdGF0ZTogbm9PcFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB3aW5kb3c7XG59XG5cbmZ1bmN0aW9uIE5vZGVIdHRwKCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcmVxdWlyZSgnaHR0cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIE5vZGVIdHRwcygpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJ2h0dHBzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgV2luZG93OiBXaW5kb3csXG4gICAgTm9kZUh0dHA6IE5vZGVIdHRwLFxuICAgIE5vZGVIdHRwczogTm9kZUh0dHBzXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIE5vZGVIdHRwO1xudmFyIE5vZGVIdHRwcztcblxuZnVuY3Rpb24gdG9RdWVyeShvYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdFtrZXldKSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0W2tleV1cbiAgICAgICAgICAgICAgICAubWFwKChhcnJheVZhbHVlKSA9PiBlbmNvZGVVUkkoa2V5KSArICc9JyArIGVuY29kZVVSSShhcnJheVZhbHVlKSlcbiAgICAgICAgICAgICAgICAuam9pbignJicpO1xuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3Rba2V5XSkgPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVVUkkoa2V5KSArICc9JyArIGVuY29kZVVSSShKU09OLnN0cmluZ2lmeShvYmplY3Rba2V5XSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSShrZXkpICsgJz0nICsgZW5jb2RlVVJJKG9iamVjdFtrZXldLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLmpvaW4oJyYnKTtcbn1cblxuZnVuY3Rpb24gaXNKc29uQ29udGVudFR5cGUoY29udGVudFR5cGUpIHtcbiAgICBpZiAoIWNvbnRlbnRUeXBlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudFR5cGUgPT0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyaW5nLCBzdGFydCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cigwLCBzdGFydC5sZW5ndGgpID09IHN0YXJ0O1xuICAgIH1cblxuICAgIHZhciB0ZXh0SnNvbiA9ICd0ZXh0L2pzb24nO1xuICAgIHZhciBhcHBsaWNhdGlvbkpzb24gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICB2YXIgdHlwZSA9IGNvbnRlbnRUeXBlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgaWYgKHN0YXJ0c1dpdGgodHlwZSwgdGV4dEpzb24pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoc3RhcnRzV2l0aCh0eXBlLCBhcHBsaWNhdGlvbkpzb24pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZS5tYXRjaCgvXmFwcGxpY2F0aW9uXFwvdm5kXFwuLipcXCtqc29uJC8pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24galF1ZXJ5TGlrZVJlcXVlc3QoalF1ZXJ5TGlrZSwgY29uZmlnLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiByZXNwb25zZVRvQW5ndWxhclJlc3BvbnNlKGRhdGEsIF8sIGpxWEhSKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgc3RhdHVzOiBqcVhIUi5zdGF0dXMsIC8vIHJlc3BvbnNlIGNvZGUsXG4gICAgICAgICAgICBoZWFkZXJzOiBqcVhIUi5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSwvLyBoZWFkZXJzLFxuICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiBqcVhIUi5zdGF0dXNUZXh0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xuICAgICAgICByZXNvbHZlKHJlc3BvbnNlVG9Bbmd1bGFyUmVzcG9uc2UoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihqcVhIUiwgdGV4dFN0YXR1cykge1xuICAgICAgICByZWplY3QocmVzcG9uc2VUb0FuZ3VsYXJSZXNwb25zZSh7fSwgdGV4dFN0YXR1cywganFYSFIpKTtcbiAgICB9XG5cbiAgICBqUXVlcnlMaWtlLmFqYXgoe1xuICAgICAgICB0eXBlOiBjb25maWcubWV0aG9kLFxuICAgICAgICBoZWFkZXJzOiBjb25maWcuaGVhZGVycyxcbiAgICAgICAgY29udGVudFR5cGU6IGNvbmZpZy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSxcbiAgICAgICAgdXJsOiBjb25maWcudXJsLFxuICAgICAgICBkYXRhOiBpc0pzb25Db250ZW50VHlwZShjb25maWcuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pID8gSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpIDogY29uZmlnLmRhdGFcbiAgICB9KS50aGVuKHN1Y2Nlc3MsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24galF1ZXJ5UmVxdWVzdCgkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGpRdWVyeUxpa2VSZXF1ZXN0KCR3aW5kb3cualF1ZXJ5LCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB6ZXB0b1JlcXVlc3QoJHdpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBqUXVlcnlMaWtlUmVxdWVzdCgkd2luZG93LlplcHRvLCBjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub2RlUmVxdWVzdChjb25maWcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIGZ1bmN0aW9uIGNvbmZpZ1RvTm9kZShjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5ob3N0ICYmIGNvbmZpZy5ob3N0LmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBob3N0UGFydHMgPSBjb25maWcuaG9zdC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdmFyIGhvc3QgPSBob3N0UGFydHNbMF07XG4gICAgICAgICAgICB2YXIgcG9ydCA9IGhvc3RQYXJ0c1sxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBob3N0ID0gY29uZmlnLmhvc3Q7XG4gICAgICAgICAgICB2YXIgcG9ydCA9ICc4MCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhvc3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2hlbiB1c2luZyBub2RlcyBodHRwIGxpYnJhcmllcywgeW91IGhhdmUgdG8gc2V0ICRodHRwLiRob3N0LCBvdGhlcndpc2Ugbm9kZSBkb2VzIG5vdCBrbm93IHdoZXJlIHRvIHNlbmQgdGhlIHJlcXVlc3QgdG8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2Q6IGNvbmZpZy5tZXRob2QsXG4gICAgICAgICAgICBwYXRoOiBjb25maWcucHJvdG9jb2wgKyAnOi8vJyArIGNvbmZpZy5ob3N0ICsgY29uZmlnLnVybCxcbiAgICAgICAgICAgIGhlYWRlcnM6IGNvbmZpZy5oZWFkZXJzLFxuICAgICAgICAgICAgaG9zdDogaG9zdCxcbiAgICAgICAgICAgIHBvcnQ6IHBvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogY29uZmlnLnByb3RvY29sICsgJzonXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzd2l0Y2hCeVByb3RvY29sKCkge1xuICAgICAgICBpZiAoY29uZmlnLnByb3RvY29sID09PSAnaHR0cCcpIHtcbiAgICAgICAgICAgIHJldHVybiBOb2RlSHR0cDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBOb2RlSHR0cHM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBqc29uRW5jb2RlKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqZWN0KTtcbiAgICB9XG5cbiAgICB2YXIgcmVxdWVzdCA9IHN3aXRjaEJ5UHJvdG9jb2woKS5yZXF1ZXN0KGNvbmZpZ1RvTm9kZShjb25maWcpLFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgcmVzcG9uc2Uuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblxuICAgICAgICAgICAgdmFyIGJvZHkgPSAnJztcbiAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgZnVuY3Rpb24oY2h1bmspIHtcbiAgICAgICAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIGpRdWVyeSB3aWxsIHBhcnNlIEpTT04gcmVwbGllcyBhdXRvbWF0aWNhbGx5LCBzbyByZXBsaWNhdGUgdGhhdFxuICAgICAgICAgICAgICAgICAqIGJlaGF2aW91ciBmb3Igbm9kZWpzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKGJvZHkgJiYgcmVzcG9uc2UuaGVhZGVyc1snY29udGVudC10eXBlJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LXR5cGUnXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNKc29uQ29udGVudFR5cGUodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGJvZHksXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHJlc3BvbnNlLmhlYWRlcnMsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiByZXNwb25zZS5zdGF0dXNNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1c0NvZGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIGlmIChjb25maWcubWV0aG9kID09PSAnUE9TVCcgfHwgY29uZmlnLm1ldGhvZCA9PT0gJ1BVVCcgfHwgY29uZmlnLm1ldGhvZCA9PT0gJ1BBVENIJykge1xuICAgICAgICBpZiAoY29uZmlnLmRhdGEpIHtcbiAgICAgICAgICAgIGlmIChpc0pzb25Db250ZW50VHlwZShjb25maWcuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC53cml0ZShqc29uRW5jb2RlKGNvbmZpZy5kYXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qud3JpdGUoY29uZmlnLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdC5lbmQoKTtcbn1cblxuZnVuY3Rpb24gdmVuZG9yU3BlY2lmaWNSZXF1ZXN0KCR3aW5kb3cpIHtcbiAgICBpZiAoJHdpbmRvdy4kZmFrZSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gbm9kZVJlcXVlc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCR3aW5kb3cualF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4galF1ZXJ5UmVxdWVzdCgkd2luZG93KTtcbiAgICAgICAgfSBlbHNlIGlmICgkd2luZG93LlplcHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gemVwdG9SZXF1ZXN0KCR3aW5kb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdXBwb3J0ZWQgeGhyIGxpYnJhcnkgZm91bmQgKGpRdWVyeSBvciBaZXB0byBhcmUgc3VwcG9ydGVkKScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIENvbmZpZyBhY2NlcHRzOlxuICpcbiAqIG1ldGhvZDogSFRUUCBtZXRob2QgZm9yIHJlcXVlc3RcbiAqIHBhcmFtczogaGFzaCBvZiBHRVQgcGFyYW1ldGVyc1xuICogaGVhZGVyczogSFRUUCBoZWFkZXJzXG4gKiB1cmw6IFVSTCB0byByZXF1ZXN0XG4gKlxuICogQHBhcmFtICR3aW5kb3dcbiAqIEBwYXJhbSAkcVxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnMge3Byb21pc2V8KnxyLnByb21pc2V8RnVuY3Rpb258YX1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpIHtcbiAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xuXG4gICAgaWYgKGNvbmZpZy5wYXJhbXMpIHtcbiAgICAgICAgaWYgKGNvbmZpZy51cmwuaW5kZXhPZignPycpID09PSAtMSkge1xuICAgICAgICAgICAgY29uZmlnLnVybCArPSAnPyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnVybFtjb25maWcudXJsLmxlbmd0aCAtIDFdICE9ICcmJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy51cmwgKz0gJyYnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLnVybCArPSB0b1F1ZXJ5KGNvbmZpZy5wYXJhbXMpO1xuICAgICAgICBkZWxldGUgY29uZmlnLnBhcmFtcztcbiAgICB9XG5cbiAgICB2ZW5kb3JTcGVjaWZpY1JlcXVlc3QoJHdpbmRvdykoY29uZmlnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGRlZmVyLnJlc29sdmUoZGF0YSk7XG4gICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCR3aW5kb3csICRxLCAkbm9kZUh0dHAsICRub2RlSHR0cHMpIHtcbiAgICBOb2RlSHR0cCA9ICRub2RlSHR0cDtcbiAgICBOb2RlSHR0cHMgPSAkbm9kZUh0dHBzO1xuXG4gICAgZnVuY3Rpb24gZG9IdHRwKGNvbmZpZykge1xuICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZyhkb0h0dHAuJGNvbmZpZywgY29uZmlnKTtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9uZShvYmplY3QpIHtcbiAgICAgICAgbGV0IG5ld09iamVjdCA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvYmplY3QpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKG9iamVjdFtrZXldLnRvU3RyaW5nKCkgPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgICAgICBuZXdPYmplY3Rba2V5XSA9IGNsb25lKG9iamVjdFtrZXldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3T2JqZWN0W2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ld09iamVjdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZXJnZUNvbmZpZyhkZWZhdWx0Q29uZmlnLCB1c2VyQ29uZmlnKSB7XG4gICAgICAgIGxldCB0YXJnZXRDb25maWcgPSBjbG9uZShkZWZhdWx0Q29uZmlnKTtcbiAgICAgICAgT2JqZWN0LmtleXModXNlckNvbmZpZykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckNvbmZpZ1trZXldLnRvU3RyaW5nKCkgPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRDb25maWdba2V5XSA9IG1lcmdlQ29uZmlnKHRhcmdldENvbmZpZ1trZXldLFxuICAgICAgICAgICAgICAgICAgICB1c2VyQ29uZmlnW2tleV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRDb25maWdba2V5XSA9IHVzZXJDb25maWdba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldENvbmZpZztcbiAgICB9XG5cbiAgICBkb0h0dHAuJGhvc3QgPSAnJztcbiAgICBkb0h0dHAuJHByb3RvY29sID0gJ2h0dHBzJztcbiAgICBkb0h0dHAuJGNvbmZpZyA9IHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGRvSHR0cC5nZXQgPSBmdW5jdGlvbih1cmwsIHBhcmFtcywgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgIGNvbmZpZy5wYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcbiAgICBkb0h0dHAuaGVhZCA9IGZ1bmN0aW9uKHVybCwgcGFyYW1zLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnSEVBRCc7XG4gICAgICAgIGNvbmZpZy5wYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcbiAgICBkb0h0dHAucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlnKGRvSHR0cC4kY29uZmlnLCBjb25maWcgfHwge30pO1xuICAgICAgICBjb25maWcudXJsID0gdXJsO1xuICAgICAgICBjb25maWcubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBjb25maWcuZGF0YSA9IGRhdGE7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcbiAgICBkb0h0dHAucHV0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnUFVUJztcbiAgICAgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuICAgICAgICBjb25maWcucHJvdG9jb2wgPSBkb0h0dHAuJHByb3RvY29sO1xuICAgICAgICBjb25maWcuaG9zdCA9IGRvSHR0cC4kaG9zdDtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwKCR3aW5kb3csICRxLCBjb25maWcpO1xuICAgIH07XG4gICAgZG9IdHRwLnBhdGNoID0gZnVuY3Rpb24odXJsLCBkYXRhLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnUEFUQ0gnO1xuICAgICAgICBjb25maWcuZGF0YSA9IGRhdGE7XG4gICAgICAgIGNvbmZpZy5wcm90b2NvbCA9IGRvSHR0cC4kcHJvdG9jb2w7XG4gICAgICAgIGNvbmZpZy5ob3N0ID0gZG9IdHRwLiRob3N0O1xuICAgICAgICByZXR1cm4gbmV3IEh0dHAoJHdpbmRvdywgJHEsIGNvbmZpZyk7XG4gICAgfTtcbiAgICBkb0h0dHAuZGVsZXRlID0gZnVuY3Rpb24odXJsLCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWcoZG9IdHRwLiRjb25maWcsIGNvbmZpZyB8fCB7fSk7XG4gICAgICAgIGNvbmZpZy51cmwgPSB1cmw7XG4gICAgICAgIGNvbmZpZy5tZXRob2QgPSAnREVMRVRFJztcbiAgICAgICAgY29uZmlnLnByb3RvY29sID0gZG9IdHRwLiRwcm90b2NvbDtcbiAgICAgICAgY29uZmlnLmhvc3QgPSBkb0h0dHAuJGhvc3Q7XG4gICAgICAgIHJldHVybiBuZXcgSHR0cCgkd2luZG93LCAkcSwgY29uZmlnKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRvSHR0cDtcbn07IiwiZnVuY3Rpb24gaXNGdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ICYmICgodHlwZW9mIG9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgJiYgKG9iamVjdCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSk7XG59XG5cbmZ1bmN0aW9uIFByb21pc2UoKSB7XG4gICAgdmFyIHJlc29sdmVDYWxsYmFja3MgPSBbXTtcbiAgICB2YXIgcmVqZWN0Q2FsbGJhY2tzID0gW107XG4gICAgdmFyIG5vdGlmeUNhbGxiYWNrcyA9IFtdO1xuICAgIHZhciBzdGF0ZSA9ICdwZW5kaW5nJztcbiAgICB2YXIgcmVzb2x1dGlvbjtcbiAgICB2YXIgcmVqZWN0aW9uO1xuXG4gICAgdmFyIGFwaSA9IHtcbiAgICAgICAgdGhlbjogZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKTtcblxuICAgICAgICAgICAgaWYgKCgoc3RhdGUgPT09ICdwZW5kaW5nJykgfHwgKHN0YXRlID09PSAncmVzb2x2ZWQnKSkgJiYgaXNGdW5jdGlvbihcbiAgICAgICAgICAgICAgICAgICAgb25SZXNvbHZlKSkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVXcmFwcGVyKHJlc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlID0gb25SZXNvbHZlKHJlc29sdXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXR1cm5WYWx1ZSAmJiBpc0Z1bmN0aW9uKHJldHVyblZhbHVlLnRoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZS50aGVuKGZ1bmN0aW9uKG5leHRSZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKG5leHRSZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKG5leHRSZWplY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXh0UmVqZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3Jlc29sdmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlV3JhcHBlcihyZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2tzLnB1c2gocmVzb2x2ZVdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChzdGF0ZSA9PT0gJ3BlbmRpbmcnKSB8fCAoc3RhdGUgPT09ICdyZWplY3RlZCcpKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVqZWN0aW9uV3JhcHBlcihyZWplY3RXaXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKG9uUmVqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25SZWplY3QocmVqZWN0V2l0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChyZWplY3RXaXRoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09ICdyZWplY3RlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0aW9uV3JhcHBlcihyZWplY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdENhbGxiYWNrcy5wdXNoKHJlamVjdGlvbldyYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm90aWZ5Q2FsbGJhY2tzLnB1c2goZnVuY3Rpb24obm90aWZ5V2l0aCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKG9uTm90aWZ5KSkge1xuICAgICAgICAgICAgICAgICAgICBvbk5vdGlmeShub3RpZnlXaXRoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlLm5vdGlmeShub3RpZnlXaXRoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwaS50aGVuKG51bGwsIG9uUmVqZWN0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBub3RpZnk6IGZ1bmN0aW9uKG5vdGlmeVdpdGgpIHtcbiAgICAgICAgICAgIG5vdGlmeUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobm90aWZ5V2l0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICByZWplY3Q6IGZ1bmN0aW9uKHJlamVjdFdpdGgpIHtcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVqZWN0V2l0aCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc3RhdGUgPSAncmVqZWN0ZWQnO1xuICAgICAgICAgICAgcmVqZWN0aW9uID0gcmVqZWN0V2l0aDtcbiAgICAgICAgfSxcblxuICAgICAgICByZXNvbHZlOiBmdW5jdGlvbihyZXNvbHZlV2l0aCkge1xuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzb2x2ZVdpdGgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHN0YXRlID0gJ3Jlc29sdmVkJztcbiAgICAgICAgICAgIHJlc29sdXRpb24gPSByZXNvbHZlV2l0aDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xufVxuXG5mdW5jdGlvbiBEZWZlcnJlZChpbml0KSB7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgpO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oaW5pdCkpIHtcbiAgICAgICAgaW5pdChwcm9taXNlLnJlc29sdmUsIHByb21pc2UucmVqZWN0LCBwcm9taXNlLm5vdGlmeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzb2x2ZTogcHJvbWlzZS5yZXNvbHZlLFxuICAgICAgICByZWplY3Q6IHByb21pc2UucmVqZWN0LFxuICAgICAgICBub3RpZnk6IHByb21pc2Uubm90aWZ5LFxuICAgICAgICBwcm9taXNlOiBwcm9taXNlXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gJHEoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gKG5ldyBEZWZlcnJlZChjYWxsYmFjaykpLnByb21pc2U7XG59XG5cbiRxLmRlZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEZWZlcnJlZCgpO1xufTtcblxuJHEucmVzb2x2ZSA9ICRxLndoZW4gPSBmdW5jdGlvbih2YWx1ZSwgb25SZXNvbHZlLCBvblJlamVjdCwgb25Ob3RpZnkpIHtcbiAgICB2YXIgZGVmZXIgPSBuZXcgRGVmZXJyZWQoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0LCBub3RpZnkpIHtcbiAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnRoZW4pIHtcbiAgICAgICAgICAgIHZhbHVlLnRoZW4oZnVuY3Rpb24ocmVzb2x2ZVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNvbHZlVmFsdWUpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24obm90aWZ5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICBub3RpZnkobm90aWZ5VmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmZXIucHJvbWlzZS50aGVuKG9uUmVzb2x2ZSwgb25SZWplY3QsIG9uTm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xufTtcblxuJHEuYWxsID0gZnVuY3Rpb24ocHJvbWlzZXMpIHtcbiAgICBpZiAoIShwcm9taXNlcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb21pc2VzIG5lZWQgdG8gYmUgcGFzc2VkIHRvICRxLmFsbCBpbiBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgcmVzb2x1dGlvbnMgPSBbXTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tDb21wbGV0ZSgpIHtcbiAgICAgICAgaWYgKGNvdW50ZXIgPT09IHByb21pc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNvbHV0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbihyZXNvbHV0aW9uKSB7XG4gICAgICAgICAgICByZXNvbHV0aW9uc1tpbmRleF0gPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgKytjb3VudGVyO1xuICAgICAgICAgICAgY2hlY2tDb21wbGV0ZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHE7XG59OyIsInZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9Qcm9taXNlLmpzJyk7XG52YXIgUm91dGluZyA9IHJlcXVpcmUoJy4vUm91dGluZy5qcycpO1xudmFyIEh0dHAgPSByZXF1aXJlKCcuL0h0dHAuanMnKTtcbnZhciBHbG9iYWxzV3JhcHBlciA9IHJlcXVpcmUoJy4vR2xvYmFsc1dyYXBwZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbmplY3RhYmxlcykge1xuICAgIEdsb2JhbHNXcmFwcGVyLldpbmRvdy4kbmFtZSA9ICckd2luZG93JztcbiAgICBHbG9iYWxzV3JhcHBlci5XaW5kb3cuJGluamVjdCA9IFtdO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKEdsb2JhbHNXcmFwcGVyLldpbmRvdyk7XG5cbiAgICBHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cC4kbmFtZSA9ICckbm9kZUh0dHAnO1xuICAgIEdsb2JhbHNXcmFwcGVyLk5vZGVIdHRwLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cCk7XG5cbiAgICBHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cHMuJG5hbWUgPSAnJG5vZGVIdHRwcyc7XG4gICAgR2xvYmFsc1dyYXBwZXIuTm9kZUh0dHBzLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChHbG9iYWxzV3JhcHBlci5Ob2RlSHR0cHMpO1xuXG4gICAgUm91dGluZy5Sb3V0aW5nLiRuYW1lID0gJyRyb3V0aW5nJztcbiAgICBSb3V0aW5nLlJvdXRpbmcuJGluamVjdCA9IFsnJHEnLCAnJHdpbmRvdyddO1xuXG4gICAgaW5qZWN0YWJsZXMuYWRkKFJvdXRpbmcuUm91dGluZyk7XG5cbiAgICBQcm9taXNlLiRuYW1lID0gJyRxJztcbiAgICBQcm9taXNlLiRpbmplY3QgPSBbXTtcblxuICAgIGluamVjdGFibGVzLmFkZChQcm9taXNlKTtcblxuICAgIEh0dHAuJG5hbWUgPSAnJGh0dHAnO1xuICAgIEh0dHAuJGluamVjdCA9IFsnJHdpbmRvdycsICckcScsICckbm9kZUh0dHAnLCAnJG5vZGVIdHRwcyddO1xuICAgIGluamVjdGFibGVzLmFkZChIdHRwKTtcbn07XG4iLCJ2YXIgUm91dGVSZWNvZ25pemVyID0gcmVxdWlyZSgncm91dGUtcmVjb2duaXplcicpO1xudmFyIHBhcnNlVXJpID0gcmVxdWlyZSgncGFyc2V1cmknKTtcblxuZnVuY3Rpb24gUm91dGluZygkcSwgJHdpbmRvdykge1xuICAgIHZhciByb3V0aW5nID0gbmV3IFJvdXRlUmVjb2duaXplcigpO1xuICAgIHZhciBkZWZhdWx0Um91dGU7XG4gICAgdmFyIG1ha2VSZW5kZXJlciA9IGZ1bmN0aW9uKHRhcmdldEFzRE9NTm9kZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odG9SZW5kZXIpIHtcbiAgICAgICAgICAgIHRhcmdldEFzRE9NTm9kZS5pbm5lckhUTUwgPSB0b1JlbmRlcjtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcHJldmVudERlZmF1bHQoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEludGVybmV0IGV4cGxvcmVyIHN1cHBvcnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZShlbGVtZW50LCBhdHRyaWJ1dGUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnRbYXR0cmlidXRlXSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRbYXR0cmlidXRlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQuYXR0cmlidXRlc1tpXS5ub2RlTmFtZSA9PT0gYXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBlbGVtZW50LmF0dHJpYnV0ZXNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvRGVmYXVsdFJvdXRlKHJvdXRlKSB7XG4gICAgICAgICR3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgJycsIHJvdXRlKTtcbiAgICAgICAgcmV0dXJuIGRvUm91dGluZyhyb3V0ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHF1ZXJ5VG9EaWN0KHF1ZXJ5KSB7XG4gICAgICAgIHZhciBkaWN0ID0ge307XG4gICAgICAgIHF1ZXJ5LnNwbGl0KCcmJykubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJ0LnNwbGl0KCc9JykubWFwKGRlY29kZVVSSUNvbXBvbmVudCk7XG4gICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24ocGFydCkge1xuICAgICAgICAgICAgZGljdFtwYXJ0WzBdXSA9IHBhcnRbMV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkaWN0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvUm91dGluZyh1cmwsIGRvRGVmYXVsdCkge1xuICAgICAgICB2YXIgdXJsUGFydHMgPSBwYXJzZVVyaSh1cmwpO1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSByb3V0aW5nLnJlY29nbml6ZSh1cmxQYXJ0cy5wYXRoKTtcbiAgICAgICAgdmFyIHByb21pc2VzID0gW107XG4gICAgICAgIGlmIChoYW5kbGVycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciAkY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxQYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBoYW5kbGVyc1tpXS5wYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVRvRGljdCh1cmxQYXJ0cy5xdWVyeSlcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyc1tpXS5oYW5kbGVyKCRjb250ZXh0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoKGRvRGVmYXVsdCAhPT0gZmFsc2UpICYmIGRlZmF1bHRSb3V0ZSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChkb0RlZmF1bHRSb3V0ZShkZWZhdWx0Um91dGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdvdG9Sb3V0ZShyb3V0ZSkge1xuICAgICAgICAkd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsXG4gICAgICAgICAgICAnJyxcbiAgICAgICAgICAgIHJvdXRlKTtcbiAgICAgICAgcmV0dXJuIGRvUm91dGluZyhyb3V0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwbGFjZVJvdXRlKHJvdXRlKSB7XG4gICAgICAgICR3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCxcbiAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgcm91dGUpO1xuXG4gICAgICAgIHJldHVybiBkb1JvdXRpbmcocm91dGUpO1xuICAgIH1cblxuICAgICR3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBkb1JvdXRpbmcoJHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB9O1xuXG4gICAgJHdpbmRvdy5vbmNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAqIFJlbGF0ZWQgdG8gU2FmYXJpIGZpcmluZyBldmVudHMgb24gdGV4dCBub2Rlc1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2RhdGEtaW50ZXJuYWwnKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcHJldmVudERlZmF1bHQoZXZlbnQpO1xuXG4gICAgICAgICAgICBpZiAoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2RhdGEtbm8taGlzdG9yeScpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVwbGFjZVJvdXRlKGdldEF0dHJpYnV0ZSh0YXJnZXQsICdocmVmJykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnb3RvUm91dGUoZ2V0QXR0cmlidXRlKHRhcmdldCwgJ2hyZWYnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9Sb3V0aW5nKCR3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgICdzZXREZWZhdWx0Um91dGUnOiBmdW5jdGlvbihuZXdEZWZhdWx0Um91dGUpIHtcbiAgICAgICAgICAgIGlmICghKCh0eXBlb2YgbmV3RGVmYXVsdFJvdXRlID09PSAnc3RyaW5nJykgfHwgbmV3RGVmYXVsdFJvdXRlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGRlZmF1bHQgcm91dGUgbXVzdCBiZSBnaXZlbiBhcyBhIHN0cmluZywgZS5nLiBcIi9hcHBcIicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWZhdWx0Um91dGUgPSBuZXdEZWZhdWx0Um91dGU7XG4gICAgICAgIH0sXG4gICAgICAgICdzZXRNYWtlUmVuZGVyZXInOiBmdW5jdGlvbihuZXdNYWtlUmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGlmICghKG5ld01ha2VSZW5kZXJlciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIG1ha2VSZW5kZXJlciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWFrZVJlbmRlcmVyID0gbmV3TWFrZVJlbmRlcmVyO1xuICAgICAgICB9LFxuICAgICAgICAvKlxuICAgICAgICAgKiBTZXRzIGEgaGFuZGxlciBmb3IgYSByb3V0ZS4gVGhlcmUgY2FuIGJlIG11bHRpcGxlIGhhbmRsZXJzIGZvciBhbnlcbiAgICAgICAgICogcm91dGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEEgaGFuZGxlciBpcyBhbiBpbmplY3RhYmxlIHRoYXQgd2lsbCByZWNlaXZlIHRocmVlIHBhcmFtZXRlcnM6XG4gICAgICAgICAqXG4gICAgICAgICAqICRjb250ZXh0IC0gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgcm91dGUgYW5kIGFjY2VzcyB0byB1cmwgcGFyYW1ldGVyc1xuICAgICAgICAgKiAkcmVuZGVyZXIgLSB0aGUgcmVuZGVyZXIgJHJvdXRpbmcgaXMgY29uZmlndXJlZCB0byB1c2UuIERlZmF1bHQganVzdFxuICAgICAgICAgKiAgICAgIHNldCB0aGUgaHRtbCBjb250ZW50IG9mIHRoZSB0YXJnZXQgRE9NIG5vZGVcbiAgICAgICAgICogJHRhcmdldCAtIERPTSBub2RlIHRoYXQgdGhlIGNvbnRlbnQgc2hvdWxkIGVuZCB1cCBpbi4gVXNlZnVsIGlmIHlvdVxuICAgICAgICAgKiAgICAgIGRvbid0IHdhbnQgdG8gdXNlICRyZW5kZXJlciBmb3IgYSBzcGVjaWZpYyByb3V0ZVxuICAgICAgICAgKi9cbiAgICAgICAgJ3NldCc6IGZ1bmN0aW9uKHJvdXRlLCB0YXJnZXQsIGluamVjdGFibGUsIG5hbWUpIHtcbiAgICAgICAgICAgIGlmICghKGluamVjdGFibGUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9ICdUbyBzZXQgYSByb3V0ZSwgeW91IGhhdmUgdG8gcHJvdmlkZSBhbiBpbmplY3RhYmxlIHRoYXQgaXMgZXhlY3V0YWJsZSAoaS5lLiBpbnN0YW5jZW9mIEZ1bmN0aW9uKS4gUm91dGU6ICcgKyByb3V0ZSArICcsIHN0cmluZ2lmaWVkIGluamVjdGFibGU6IFwiJyArIFN0cmluZyhpbmplY3RhYmxlICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgaWYgKCh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgJiYgKChpbmplY3RhYmxlIGluc3RhbmNlb2YgU3RyaW5nKSB8fCAodHlwZW9mIGluamVjdGFibGUgPT09ICdzdHJpbmcnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnLiBUYXJnZXQgaXMgYSBmdW5jdGlvbiBhbmQgaW5qZWN0YWJsZSBpcyBhIHN0cmluZy4gWW91IG1pZ2h0IGhhdmUgc3dpdGNoZWQgdGhlIHBhcmFtZXRlcnMsIHBsZWFzZSBkb3VibGUtY2hlY2sgdGhhdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcm91dGluZy5hZGQoW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcm91dGUsXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCRjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVuZGVyUmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEFzRE9NTm9kZSA9ICR3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG1ha2VSZW5kZXJlcih0YXJnZXRBc0RPTU5vZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5qZWN0YWJsZS5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJSZXR1cm4gPSBpbmplY3RhYmxlLnJlbmRlcigkY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFzRE9NTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclJldHVybiA9IGluamVjdGFibGUoJGNvbnRleHQsIHJlbmRlcmVyLCB0YXJnZXRBc0RPTU5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihyZW5kZXJSZXR1cm4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSwgeydhcyc6IG5hbWV9KTtcbiAgICAgICAgfSxcbiAgICAgICAgJ2dvdG8nOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGdvdG9Sb3V0ZShyb3V0ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdSb3V0aW5nJzogUm91dGluZ1xufTsiLCIvL3ZhciBEZXBlbmRlbmN5UmVzb2x2ZXIgPSByZXF1aXJlKCcuL0RlcGVuZGVuY3lSZXNvbHZlci5qcycpO1xudmFyIEdyYXBoID0gcmVxdWlyZSgnLi9HcmFwaC5qcycpO1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHJldHVybnMge3skbmFtZTogc3RyaW5nLCByZWdpc3RlcjogcmVnaXN0ZXIsIGhhc0FsbERlcGVuZGVuY2llczpcbiAqICAgICBoYXNBbGxEZXBlbmRlbmNpZXMsIGluc3RhbnRpYXRlOiBpbnN0YW50aWF0ZSwgZ2V0SW5zdGFuY2U6IGdldEluc3RhbmNlfX1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBEZXBlbmRlbmN5TWFuYWdlcihuYW1lKSB7XG4gICAgdmFyIF9wcm92aWRlcnMgPSB7fTtcbiAgICB2YXIgX2luc3RhbmNlcyA9IHt9O1xuICAgIHZhciBfZ3JhcGggPSBuZXcgR3JhcGgoKTtcblxuICAgIHZhciBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlID0gdW5kZWZpbmVkO1xuXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXIoZW50aXR5KSB7XG4gICAgICAgIGlmICghZW50aXR5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVudGl0eSB0byByZWdpc3RlciB3YXMgZ2l2ZW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZW50aXR5LiRuYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eSBcIicgKyBlbnRpdHkuJG5hbWUgKyAnXCIgaXMgbWlzc2luZyBwcm9wZXJ0eSAkbmFtZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbnRpdHkuJGluamVjdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkgXCInICsgZW50aXR5LiRuYW1lICsgJ1wiIGlzIG1pc3NpbmcgcHJvcGVydHkgJGluamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9wcm92aWRlcnNbZW50aXR5LiRuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkgXCInICsgZW50aXR5LiRuYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIF9wcm92aWRlcnNbZW50aXR5LiRuYW1lXSA9IGVudGl0eTtcblxuICAgICAgICAvKlxuICAgICAgICAgKiBOYW1lIG1pZ2h0J3ZlIGJlZW4gcmVnaXN0ZXJlZCBhcyBhIGRlcGVuZGVuY3kgb2YgYW5vdGhlciBlbnRpdHlcbiAgICAgICAgICovXG4gICAgICAgIGlmICghX2dyYXBoLmhhc05vZGVWYWx1ZShlbnRpdHkuJG5hbWUpKSB7XG4gICAgICAgICAgICBfZ3JhcGguYWRkKGVudGl0eS4kbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbnRpdHkuJGluamVjdC5mb3JFYWNoKGZ1bmN0aW9uKGRlcGVuZGVuY3kpIHtcbiAgICAgICAgICAgIGlmICghX2dyYXBoLmhhc05vZGVWYWx1ZShkZXBlbmRlbmN5KSkge1xuICAgICAgICAgICAgICAgIF9ncmFwaC5hZGQoZGVwZW5kZW5jeSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9ncmFwaC5hZGRFZGdlKGRlcGVuZGVuY3ksIGVudGl0eS4kbmFtZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE1pc3NpbmdEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIGlmIChfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm4gX2dldE1pc3NpbmdEZXBlbmRlbmNpZXNDYWNoZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm92aWRlcnNJbmplY3RzID0gT2JqZWN0LmtleXMoX3Byb3ZpZGVycykubWFwKGZ1bmN0aW9uKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIF9wcm92aWRlcnNbcHJvdmlkZXJOYW1lXS4kaW5qZWN0O1xuICAgICAgICB9KTtcblxuICAgICAgICBfZ2V0TWlzc2luZ0RlcGVuZGVuY2llc0NhY2hlID0gW10uY29uY2F0LmFwcGx5KFtdLCBwcm92aWRlcnNJbmplY3RzKS5maWx0ZXIoZnVuY3Rpb24ocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gIUJvb2xlYW4oX3Byb3ZpZGVyc1twcm92aWRlck5hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIF9nZXRNaXNzaW5nRGVwZW5kZW5jaWVzQ2FjaGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxsRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICByZXR1cm4gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpLmxlbmd0aCA9PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbnRpYXRlKCkge1xuICAgICAgICBfZ3JhcGguZ2V0Tm9kZXNUb3BvbG9naWNhbCgpLmZvckVhY2goZnVuY3Rpb24ocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgICAgICB2YXIgcHJvdmlkZXIgPSBfcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV07XG5cbiAgICAgICAgICAgIF9pbnN0YW5jZXNbcHJvdmlkZXJOYW1lXSA9IHByb3ZpZGVyLmFwcGx5KHByb3ZpZGVyLCBwcm92aWRlci4kaW5qZWN0Lm1hcChmdW5jdGlvbihkZXBlbmRlbmN5TmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaW5zdGFuY2VzW2RlcGVuZGVuY3lOYW1lXTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBfcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SW5zdGFuY2UocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBfaW5zdGFuY2VzW3Byb3ZpZGVyTmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgJG5hbWU6IG5hbWUsXG4gICAgICAgIHJlZ2lzdGVyOiByZWdpc3RlcixcbiAgICAgICAgaGFzQWxsRGVwZW5kZW5jaWVzOiBoYXNBbGxEZXBlbmRlbmNpZXMsXG4gICAgICAgIGdldE1pc3NpbmdEZXBlbmRlbmNpZXM6IGdldE1pc3NpbmdEZXBlbmRlbmNpZXMsXG4gICAgICAgIGluc3RhbnRpYXRlOiBpbnN0YW50aWF0ZSxcbiAgICAgICAgZ2V0UHJvdmlkZXI6IGdldFByb3ZpZGVyLFxuICAgICAgICBnZXRJbnN0YW5jZTogZ2V0SW5zdGFuY2UsXG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgcHJvdmlkZXJzOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKF9wcm92aWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuYW1lLCBfcHJvdmlkZXJzW25hbWVdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbnN0YW5jZXM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoX2luc3RhbmNlcykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5hbWUsIF9pbnN0YW5jZXNbbmFtZV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHJldHVybnMge0RlcGVuZGVuY3lNYW5hZ2VyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbmV3IERlcGVuZGVuY3lNYW5hZ2VyKG5hbWUpO1xufTsiLCJ2YXIgTm9kZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKCEodmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IHN0cmluZ3MgYXJlIGFjY2VwdGVkIGFzIG5vZGUgdmFsdWVzJyk7XG4gICAgfVxuXG4gICAgdGhpcy5faWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG5cbnZhciBFZGdlID0gZnVuY3Rpb24obm9kZUZyb20sIG5vZGVUbykge1xuICAgIHRoaXMuX2lkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNik7XG4gICAgdGhpcy5fZnJvbSA9IG5vZGVGcm9tO1xuICAgIHRoaXMuX3RvID0gbm9kZVRvO1xufTtcblxudmFyIG1ha2VOb2RlSWRlbnRpZmllciA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuICAgIHJldHVybiBub2RlMS5faWQgKyAnOicgKyBub2RlMi5faWQ7XG59O1xuXG5FZGdlLnByb3RvdHlwZS5nZXROb2RlSWRlbnRpZmllciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBtYWtlTm9kZUlkZW50aWZpZXIodGhpcy5fZnJvbSwgdGhpcy5fdG8pO1xufTtcblxuLyoqXG4gKiBEaXJlY3RlZCBncmFwaCB0byBvcmRlciBub2RlcyBieSBkZXBlbmRlbmNpZXMuIE9ubHkgaGFuZGxlcyB2YWx1ZXMgd2hvc2VcbiAqIC50b1N0cmluZygpIGZ1bmN0aW9uIHJldHVybnMgdW5pcXVlIHZhbHVlcy4gRmF2b3JzIHByZS1jb21wdXRlZCBsb29rdXBcbiAqIHRhYmxlcyBvdmVyIGxvb2t1cHMgYXQgc29ydCB0aW1lLiBNb3N0IG1hY2hpbmVzIGhhdmUgbG90cyBvZiByYW0gYW5kXG4gKiBlc3BlY2lhbGx5IG9uIG1vYmlsZSB0aGUgQ1BVIGlzIG1vcmUgcmVzdHJpY3RlZC4gVXNpbmcgbW9yZSByYW0gYW5kIGxlc3NcbiAqIENQVSBjeWNsZXMgaXMgcHJlZmVyYWJsZSBpbiB0aG9zZSBjb25kaXRpb25zLCBhbHRob3VnaCBpdCBzaG91bGQgaGFyZGx5XG4gKiBtYXR0ZXIgc2luY2UgbW9zdCBkZXBlbmRlbmN5IGdyYXBocyAod2hpY2ggdGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBmb2N1c2VkXG4gKiBvbikgc2hvdWxkbid0IGV4Y2VlZCBhIGZldyBodW5kcmVkIG5vZGVzLlxuICpcbiAqIEByZXR1cm5zIHt7YWRkOiBGdW5jdGlvbiwgYWRkRWRnZTogRnVuY3Rpb24sIGhhc05vZGVWYWx1ZTogRnVuY3Rpb24sXG4gKiAgICAgZ2V0Tm9kZXNUb3BvbG9naWNhbDogRnVuY3Rpb259fVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBHcmFwaCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfbm9kZXMgPSBbXTtcbiAgICB2YXIgX25vZGVzQnlJZCA9IHt9O1xuICAgIHZhciBfbm9kZXNCeVZhbHVlID0ge307XG4gICAgdmFyIF96ZXJvSW5ncmVlTm9kZXMgPSBbXTtcbiAgICB2YXIgX2VkZ2VzID0gW107XG4gICAgdmFyIF9lZGdlc0J5Tm9kZXMgPSB7fTtcbiAgICB2YXIgX2VkZ2VzQnlUbyA9IHt9O1xuICAgIHZhciBfZWRnZXNCeUZyb20gPSB7fTtcblxuICAgIC8qXG4gICAgICogVGhlIGN1cnJlbnQgdG9wb2xvZ2ljYWwgc29ydCBpbXBsZW1lbnRhdGlvbiBtdXRhdGVzIHRoZSBncmFwaCwgYWZ0ZXJcbiAgICAgKiB3aGljaCBpdCdzIHVudXNhYmxlLiBUaGlzIGZ1bmN0aW9uIGFsbG93cyB0byBjbGVhbiB0aGUgZW50aXJlIGdyYXBoXG4gICAgICogdXAsIHJlbW92aW5nIGFueSBkYW5nbGluZyBkYXRhIHRoYXQgbWlnaHQgYmUgbGVmdCBhZnRlciB0aGUgc29ydC5cbiAgICAgKi9cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgX25vZGVzID0gW107XG4gICAgICAgIF9ub2Rlc0J5SWQgPSB7fTtcbiAgICAgICAgX25vZGVzQnlWYWx1ZSA9IHt9O1xuICAgICAgICBfemVyb0luZ3JlZU5vZGVzID0gW107XG4gICAgICAgIF9lZGdlcyA9IFtdO1xuICAgICAgICBfZWRnZXNCeU5vZGVzID0ge307XG4gICAgICAgIF9lZGdlc0J5VG8gPSB7fTtcbiAgICAgICAgX2VkZ2VzQnlGcm9tID0ge307XG4gICAgfTtcblxuICAgIHZhciBhZGROb2RlID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBpZiAoX25vZGVzQnlWYWx1ZVtub2RlLnZhbHVlXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEdXBsaWNhdGUgdmFsdWVzIG5vdCBhbGxvd2VkLiBOb2RlIHdpdGggdmFsdWUgXCInICsgbm9kZS52YWx1ZSArICdcIiBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgX25vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIF9ub2Rlc0J5SWRbbm9kZS5faWRdID0gbm9kZTtcbiAgICAgICAgX25vZGVzQnlWYWx1ZVtub2RlLnZhbHVlXSA9IG5vZGU7XG5cbiAgICAgICAgX3plcm9JbmdyZWVOb2Rlcy5wdXNoKG5vZGUpO1xuICAgIH07XG5cbiAgICB2YXIgYWRkRWRnZSA9IGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgaWYgKF9lZGdlc0J5Tm9kZXNbZWRnZS5nZXROb2RlSWRlbnRpZmllcigpXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX2VkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIF9lZGdlc0J5Tm9kZXNbZWRnZS5nZXROb2RlSWRlbnRpZmllcigpXSA9IGVkZ2U7XG5cbiAgICAgICAgaWYgKCFfZWRnZXNCeUZyb21bZWRnZS5fZnJvbS5faWRdKSB7XG4gICAgICAgICAgICBfZWRnZXNCeUZyb21bZWRnZS5fZnJvbS5faWRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgX2VkZ2VzQnlGcm9tW2VkZ2UuX2Zyb20uX2lkXS5wdXNoKGVkZ2UpO1xuXG4gICAgICAgIGlmICghX2VkZ2VzQnlUb1tlZGdlLl90by5faWRdKSB7XG4gICAgICAgICAgICBfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0ucHVzaChlZGdlKTtcblxuICAgICAgICBfemVyb0luZ3JlZU5vZGVzID0gX3plcm9JbmdyZWVOb2Rlcy5maWx0ZXIoZnVuY3Rpb24oZXhpc3RpbmdOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdOb2RlLl9pZCAhPSBlZGdlLl90by5faWQ7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgdmFyIHJlbW92ZUVkZ2UgPSBmdW5jdGlvbihlZGdlVG9SZW1vdmUpIHtcbiAgICAgICAgX2VkZ2VzID0gX2VkZ2VzLmZpbHRlcihmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRnZS5faWQgIT0gZWRnZVRvUmVtb3ZlLl9pZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVsZXRlIF9lZGdlc0J5Tm9kZXNbZWRnZVRvUmVtb3ZlLmdldE5vZGVJZGVudGlmaWVyKCldO1xuXG4gICAgICAgIF9lZGdlc0J5RnJvbVtlZGdlVG9SZW1vdmUuX2Zyb20uX2lkXSA9IF9lZGdlc0J5RnJvbVtlZGdlVG9SZW1vdmUuX2Zyb20uX2lkXS5maWx0ZXIoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2UuX2lkICE9IGVkZ2VUb1JlbW92ZS5faWQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9lZGdlc0J5VG9bZWRnZVRvUmVtb3ZlLl90by5faWRdID0gX2VkZ2VzQnlUb1tlZGdlVG9SZW1vdmUuX3RvLl9pZF0uZmlsdGVyKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGdlLl9pZCAhPSBlZGdlVG9SZW1vdmUuX2lkO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGdldE5vZGVCeVZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9ub2Rlc0J5VmFsdWVbdmFsdWVdO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBhZGROb2RlKG5ldyBOb2RlKHZhbHVlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZEVkZ2U6IGZ1bmN0aW9uKGZyb21WYWx1ZSwgdG9WYWx1ZSkge1xuICAgICAgICAgICAgdmFyIGZyb21Ob2RlID0gZ2V0Tm9kZUJ5VmFsdWUoZnJvbVZhbHVlKTtcbiAgICAgICAgICAgIHZhciB0b05vZGUgPSBnZXROb2RlQnlWYWx1ZSh0b1ZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSAmJiAhdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ05laXRoZXIgZnJvbS0gbm9yIHRvLW5vZGUgZXhpc3Q6ICcgKyBmcm9tVmFsdWUgKyAnLCAnICsgdG9WYWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdGcm9tLW5vZGUgZG9lc25cXCd0IGV4aXN0OiAnICsgZnJvbVZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdUby1ub2RlIGRvZXNuXFwndCBleGlzdDogJyArIHRvVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFkZEVkZ2UobmV3IEVkZ2UoZnJvbU5vZGUsIHRvTm9kZSkpO1xuICAgICAgICB9LFxuICAgICAgICBoYXNOb2RlVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gQm9vbGVhbihnZXROb2RlQnlWYWx1ZSh2YWx1ZSkpO1xuICAgICAgICB9LFxuICAgICAgICBnZXROb2Rlc1RvcG9sb2dpY2FsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzb3J0ZWROb2RlcyA9IFtdO1xuXG4gICAgICAgICAgICB3aGlsZSAoX3plcm9JbmdyZWVOb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnROb2RlID0gX3plcm9JbmdyZWVOb2Rlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBzb3J0ZWROb2Rlcy5wdXNoKGN1cnJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICAoX2VkZ2VzQnlGcm9tW2N1cnJlbnROb2RlLl9pZF0gfHwgW10pLnNsaWNlKDApLmZvckVhY2goZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVFZGdlKGVkZ2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIV9lZGdlc0J5VG9bZWRnZS5fdG8uX2lkXSB8fCBfZWRnZXNCeVRvW2VkZ2UuX3RvLl9pZF0ubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3plcm9JbmdyZWVOb2Rlcy5wdXNoKGVkZ2UuX3RvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoX2VkZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVtYWluaW5nRWRnZXMgPSBfZWRnZXMubWFwKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcoJyArIGVkZ2UuX2Zyb20udmFsdWUgKyAnLCcgKyBlZGdlLl90by52YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJlc2V0KCk7XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0N5Y2xlIGRldGVjdGVkLCByZW1haW5pbmcgZWRnZXM6ICcgKyByZW1haW5pbmdFZGdlcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc2V0KCk7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3J0ZWROb2Rlcy5tYXAoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmFwaDsiLCJ2YXIgRGVwZW5kZW5jeU1hbmFnZXIgPSByZXF1aXJlKCcuL0RlcGVuZGVuY3lNYW5hZ2VyLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluamVjdGFibGVzID0gRGVwZW5kZW5jeU1hbmFnZXIoJ2luamVjdGFibGVzJyk7XG5cbiAgICBmdW5jdGlvbiBhZGQoaW5qZWN0YWJsZSkge1xuICAgICAgICBpbmplY3RhYmxlcy5yZWdpc3RlcihpbmplY3RhYmxlKTtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFudGlhdGVJbmplY3RhYmxlcygpIHtcbiAgICAgICAgaWYgKCFpbmplY3RhYmxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RhYmxlcyBkb25cXCd0IGV4aXN0OiAnICsgaW5qZWN0YWJsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluamVjdGFibGVzLmluc3RhbnRpYXRlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oaW5qZWN0YWJsZXMuZ2V0UHJvdmlkZXIobmFtZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldChuYW1lKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlcy5nZXRJbnN0YW5jZShuYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlcy5oYXNBbGxEZXBlbmRlbmNpZXMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRNaXNzaW5nRGVwZW5kZW5jaWVzKCkge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgaGFzOiBoYXMsXG4gICAgICAgIGluc3RhbnRpYXRlOiBpbnN0YW50aWF0ZUluamVjdGFibGVzLFxuICAgICAgICBoYXNBbGxEZXBlbmRlbmNpZXM6IGhhc0FsbERlcGVuZGVuY2llcyxcbiAgICAgICAgZ2V0TWlzc2luZ0RlcGVuZGVuY2llczogZ2V0TWlzc2luZ0RlcGVuZGVuY2llc1xuICAgIH07XG59OyIsInZhciBEZXBlbmRlbmN5TWFuYWdlciA9IHJlcXVpcmUoJy4vRGVwZW5kZW5jeU1hbmFnZXIuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlcyA9IERlcGVuZGVuY3lNYW5hZ2VyKCdtb2R1bGVzJyk7XG5cbiAgICBmdW5jdGlvbiBhZGQobW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZXMucmVnaXN0ZXIobW9kdWxlKTtcbiAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxEZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVzLmhhc0FsbERlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbnRpYXRlTW9kdWxlcygpIHtcbiAgICAgICAgbW9kdWxlcy5hbGwucHJvdmlkZXJzKGZ1bmN0aW9uKF8sIG1vZHVsZSkge1xuICAgICAgICAgICAgbW9kdWxlLmV4ZWN1dGVSdW4oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuZ2V0UHJvdmlkZXIobmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuZ2V0TWlzc2luZ0RlcGVuZGVuY2llcygpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgaW5zdGFudGlhdGU6IGluc3RhbnRpYXRlTW9kdWxlcyxcbiAgICAgICAgaGFzQWxsRGVwZW5kZW5jaWVzOiBoYXNBbGxEZXBlbmRlbmNpZXMsXG4gICAgICAgIGdldE1pc3NpbmdEZXBlbmRlbmNpZXM6IGdldE1pc3NpbmdEZXBlbmRlbmNpZXNcbiAgICB9O1xufTsiXX0=
