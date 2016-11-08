'use strict';
/**
 * @module Builtins
 */

var NodeHttp;
var NodeHttps;

function toQuery(object) {
    return Object.keys(object).map((key) => {
        if (Object.prototype.toString.call(object[key]) == '[object Array]') {
            return object[key]
                .map((arrayValue) => encodeURI(key) + '=' + encodeURI(arrayValue))
                .join('&');
        } else if (Object.prototype.toString.call(object[key]) == '[object Object]') {
            return encodeURI(key) + '=' + encodeURI(JSON.stringify(object[key]));
        } else {
            return encodeURI(key) + '=' + encodeURI(object[key].toString());
        }
    })
        .join('&');
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

        return headerString
            .split('\n')
            .filter(line => line.length)
            .map((line) => line.split(':').map(part => part.trim()))
            .reduce((headers, [header, value]) => {
                headers[header] = value;
                return headers;
            }, {})
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

    var url = config.host && config.protocol
        ? config.protocol + '://' + config.host + config.url
        : config.url;

    jQueryLike.ajax({
        type: config.method,
        headers: config.headers,
        contentType: config.headers['Content-Type'],
        url: url,
        data: isJsonContentType(config.headers['Content-Type']) ? JSON.stringify(
            config.data) : config.data
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
        }
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

    var request = switchByProtocol().request(configToNode(config),
        function(response) {
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
        }
    );

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

    config = config.pre.reduce((config, callback) => callback(config), config);
    vendorSpecificRequest($window)(config, function(data) {
        data = config.post.reduce((data, callback) => callback(data), data);
        defer.resolve(data);
    }, function(error) {
        error = config.post.reduce((error, callback) => callback(error), error);
        defer.reject(error);
    });

    return defer.promise;
}

module.exports = function($window, $q, $nodeHttp, $nodeHttps) {
    NodeHttp = $nodeHttp;
    NodeHttps = $nodeHttps;

    function clone(object) {
        let newObject = {};
        Object.keys(object).forEach((key) => {
            if (object[key].toString() == '[object Object]') {
                newObject[key] = clone(object[key]);
            } else {
                newObject[key] = object[key];
            }
        });

        return newObject;
    }

    function mergeConfig(defaultConfig, userConfig) {
        let targetConfig = clone(defaultConfig);
        Object.keys(userConfig).forEach((key) => {
            if (userConfig[key].toString() == '[object Object]') {
                targetConfig[key] = mergeConfig(targetConfig[key],
                    userConfig[key]);
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
    doHttp.get = function(url, params, config) {
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
    doHttp.head = function(url, params, config) {
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
    doHttp.post = function(url, data, config) {
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
    doHttp.put = function(url, data, config) {
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
    doHttp.patch = function(url, data, config) {
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
    doHttp.delete = function(url, config) {
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