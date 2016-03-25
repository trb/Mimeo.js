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

    function formEncode(object) {
        return Object
            .keys(object)
            .map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(object[key]);
            })
            .join('&');
    }

    function jsonEncode(object) {
        return JSON.stringify(object);
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
                    statusText: response.statusText,
                    status: response.statusCode
                });
            });
        });

    if (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') {
        if (isJsonContentType(config.contentType)) {
            request.write(jsonEncode(config.params));
        } else {
            request.write(formEncode(config.params));
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