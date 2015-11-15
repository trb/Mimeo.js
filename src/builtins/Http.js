var Promise = require('./Promise.js');



function jQueryRequest(config, resolve, reject) {
    function jQueryResponseToAngularResponse(data, textStatus, jqXHR) {
        return {
            data: data,
            status: jqXHR.status, // response code,
            headers: jqXHR.getAllResponseHeaders(),// headers,
            config: config,
            statusText: jqXHR.statusText
        };
    }

    function jQuerySuccess(data, textStatus, jqXHR) {
        resolve(jQueryResponseToAngularResponse(data, textStatus, jqXHR));
    }

    function jQueryError(jqXHR, textStatus) {
        reject(jQueryResponseToAngularResponse({}, textStatus, jqXHR));
    }

    jQuery.ajax({
        method: config.method || 'GET',
        data: config.params || {},
        headers: config.headers || {},
        url: config.url || {}
    }).then(jQuerySuccess, jQueryError);
}

function zeptoRequest(config, resolve, reject) {

}

function nodeRequest(config, resolve, reject) {

}

function vendorSpecificRequest($window) {
    if (typeof $window !== 'undefined') {
        if ($window.jQuery) {
            return jQueryRequest;
        } else if ($window.Zepto) {
            return zeptoRequest;
        } else {
            throw new Error('No supported ajax library found (jQuery or Zepto)');
        }
    } else {
        return nodeRequest;
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
        return new Http($window, config);
    }

    doHttp.get = function(url, config) {
        config = config || {};
        config.url = url;
        config.method = 'GET';
        return Http($window, config);
    };
    doHttp.post = function(url, config) {
        config.url = url;
        config.method = 'POST';
        return Http($window, config);
    };
    doHttp.put = function(url, config) {
        config.url = url;
        config.method = 'PUT';
        return Http($window, config);
    };
    doHttp.delete = function(url, config) {
        config.url = url;
        config.method = 'DELETE';
        return Http($window, config);
    };

    return doHttp;
};