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
        method: config.method,
        headers: config.headers,
        url: config.url,
        data: config.data
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
        if (config.data) {
            if (isJsonContentType(config.contentType)) {
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
function Http($window, $q, config) {
    var defer = $q.defer();

    if (config.params) {
        if (config.url.indexOf('?') == -1) {
            config.url += '?';
        } else {
            if (config.url[config.url - 1] != '&') {
                config.url += '&';
            }
        }

        config.url += toQuery(config.params);
        delete config.params;
    }

    vendorSpecificRequest($window)(config, function(data) {
        defer.resolve(data);
    }, function(error) {
        defer.reject(error);
    });

    return defer.promise;
}

module.exports = function($window, $q, $nodeHttp, $nodeHttps) {
    NodeHttp = $nodeHttp;
    NodeHttps = $nodeHttps;

    function doHttp(config) {
        config = mergeConfig(doHttp.$config, config);
        config.host = doHttp.$host;
        config.protocol = doHttp.$protocol;
        return new Http($window, $q, config);
    }

    function mergeConfig(defaultConfig, userConfig) {
        Object.keys(userConfig).forEach((key) => {
            if (userConfig[key].toString() == '[object Object]') {
                defaultConfig[key] = mergeConfig(defaultConfig[key],
                    userConfig[key]);
            } else {
                defaultConfig[key] = userConfig[key];
            }
        });

        return defaultConfig;
    }

    doHttp.$host = '';
    doHttp.$protocol = 'https';
    doHttp.$config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    doHttp.get = function(url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'GET';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.head = function(url, params, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'HEAD';
        config.params = params;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.post = function(url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'POST';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.put = function(url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PUT';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.patch = function(url, data, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'PATCH';
        config.data = data;
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };
    doHttp.delete = function(url, config) {
        config = mergeConfig(doHttp.$config, config || {});
        config.url = url;
        config.method = 'DELETE';
        config.protocol = doHttp.$protocol;
        config.host = doHttp.$host;
        return new Http($window, $q, config);
    };

    return doHttp;
};