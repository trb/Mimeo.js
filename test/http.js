'use strict';

let Http = require('../src/builtins/Http.js');
let Promise = require('../src/builtins/Promise.js');

let expect = require('chai').expect;

describe('Http', function() {
    let $window;
    let $q;
    let $nodeHttp;
    let $nodeHttps;

    let $http;

    let noOp = () => {
    };

    beforeEach(() => {
        $window = {
            '$fake': true
        };
        $q = Promise();
        $nodeHttp = $nodeHttps = {
            'request': () => {
                return {
                    end: noOp
                }
            }
        };

        $http = new Http($window, $q, $nodeHttp, $nodeHttps);
    });

    it('should provide shorthands for GET, HEAD, POST, PUT, PATCH and DELETE',
        function() {
            $http.$host = 'localhost';

            [
                'GET',
                'HEAD',
                'POST',
                'PUT',
                'PATCH',
                'DELETE'
            ].forEach((method) => {
                    $nodeHttp.request = (config) => {
                        expect(config.method).to.equal(method);

                        return {
                            end: noOp
                        }
                    };

                    $http[method.toLowerCase()]('/test');
                }
            );
        }
    );

    it('should do a request when called as a function', function() {
        let url = '/test';

        $http.$host = 'localhost';

        $nodeHttp.request = (config) => {
            expect(config.path).to.equal('https://localhost' + url);
            expect(config.method).to.equal('GET');
            expect(config.headers['Content-Type']).to.equal('application/json');

            return {end: noOp};
        };

        $http({
            url: '/test'
        });
    });

    it('should throw an exception when sending a node-http request without setting a host',
        function() {
            expect(() => $http({})).to.throw('you have to set $http.$host');
        }
    );

    it('should throw an exception when no xhr-library is found', function() {
            $window.$fake = false;
            expect(() => $http({})).to.throw('No supported xhr library found');
        }
    );

    it('should set the port when using node', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config) => {
            expect(config.host).to.equal('localhost');
            expect(config.port).to.equal('80');
            return {end: noOp};
        };

        $http.get('/test');
    });

    it('should set the port from the host if the host has a port when using node',
        function() {
            $http.$host = 'localhost:3000';

            $nodeHttp.request = (config) => {
                expect(config.host).to.equal('localhost');
                expect(config.port).to.equal('3000');
                return {end: noOp};
            };

            $http.get('/test');
        }
    );

    it('should use nodeHttp when protocol is http', function() {
        $http.$host = 'localhost';
        $http.$protocol = 'http';

        $nodeHttp.request = (config) => {
            expect(config.path).to.equal('http://localhost/test');
            return {end: noOp};
        };

        $http.get('/test');
    });

    it('should build url params correctly', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config) => {
            expect(config.path).to.equal(
                'https://localhost/test?a=1&b=2&b=3&c=%7B%22x%22:%22y%22%7D');
            return {end: noOp};
        };

        $http.get('/test', {
            a: 1,
            b: [2, 3],
            c: {x: 'y'}
        });
    });

    it('should append params correctly if url includes params already',
        function() {
            $http.$host = 'localhost';

            $nodeHttp.request = (config) => {
                expect(config.path).to.equal('https://localhost/test?a=1&b=2')
                return {end: noOp};
            };

            $http.get('/test?a=1', {b: '2'});
        }
    );

    it('should append params correctly if url ends with an ampersand',
        function() {
            $http.$host = 'localhost';

            $nodeHttp.request = (config) => {
                expect(config.path).to.equal('https://localhost/test?a=1&b=2')
                return {end: noOp};
            };

            $http.get('/test?a=1&', {b: '2'});
        }
    );

    it('should set headers', function() {
        $http.$host = 'localhost';
        $http.$config.headers['Content-Type'] = 'text/html';
        $http.$config.headers['X-Test'] = '1';

        $nodeHttp.request = (config) => {
            expect(config.headers['Content-Type']).to.equal('text/html');
            expect(config.headers['X-Test']).to.equal('1');
            return {end: noOp};
        };

        $http.get('/test');

        $http.$config.headers = {'Content-Type': 'application/json'};

        $nodeHttp.request = (config) => {
            expect(config.headers['Content-Type']).to.equal('text/xml');
            expect(config.headers['X-Test']).to.equal('100');
            return {end: noOp};
        };

        $http.get('/test', {}, {
            headers: {
                'Content-Type': 'text/xml',
                'X-Test': '100'
            }
        });
    });

    function makejQueryLikeTest(library) {
        return function() {
            $window.$fake = false;
            $window[library] = {
                ajax: function(config) {
                    expect(config.headers['Content-Type']).to.equal('text/html');
                    expect(config.url).to.equal('/test?a=1&b=2&b=3');

                    return {
                        then: noOp
                    }
                }
            };

            $http.get('/test',
                {
                    a: 1,
                    b: [2, 3]
                },
                {
                    headers: {
                        'Content-Type': 'text/html'
                    }
                });
        }
    }

    it('should use jQuery when available', makejQueryLikeTest('jQuery'));
    it('should use Zepto when available', makejQueryLikeTest('Zepto'));

    it('should convert a jQuery-like response to an angular response',
        function() {
            $window.$fake = false;
            $window.jQuery = {
                ajax: function() {
                    return {
                        then: (success) => success({a: '1'}, 'success', {
                            readyState: 'completed',
                            status: 200,
                            statusText: 'success',
                            responseText: '{"a": "1"}',
                            getAllResponseHeaders: () => {
                                return {'Content-Type': 'application/json'}
                            },
                            getResponseHeader: () => 'application/json',
                            statusCode: () => 200
                        })
                    }
                }
            };

            $http.get('/test').then((response) => {
                expect(response.data).to.deep.equal({a: '1'});
                expect(response.headers['Content-Type']).to.equal(
                    'application/json');
                expect(response.statusText).to.equal('success');
                expect(response.status).to.equal(200);
                expect(response.config).to.deep.equal({
                    method: 'GET',
                    headers: {'Content-Type': 'application/json'},
                    url: '/test',
                    params: undefined,
                    protocol: 'https',
                    host: ''
                });
            });
        }
    );

    it('should reset config object between requests',
        function() {
            $window.$fake = false;
            $window.jQuery = {
                ajax: function(config) {
                    if (config.type == 'GET') {
                        expect(config.data).to.be.empty;
                        /*
                         * The content type header was set to 'Invalid' in the
                         * POST response handler and should be re-set to the
                         * default value for this request. It should not equal
                         * the value it was set to in the POST response.
                         */
                        expect(config.headers['Content-Type']).to.not.equal(
                            'Invalid');
                    }
                    return {
                        then: (success) => success({a: '1'}, 'success', {
                            readyState: 'completed',
                            status: 200,
                            statusText: 'success',
                            responseText: '{"a": "1"}',
                            getAllResponseHeaders: () => {
                                return {'Content-Type': 'application/json'}
                            },
                            getResponseHeader: () => 'application/json',
                            statusCode: () => 200
                        })
                    }
                }
            };

            $http.post('/test', {a: 1}).then((response) => {
                /*
                 * If the clone of `$http.$config` is not deep, then
                 * `response.config.headers` will be a dangling reference to the
                 * default config object (`$http.$config.headers`). Changing the
                 * header here should NOT change the default config, which we
                 * can test for in the next request.
                 */
                response.config.headers['Content-Type'] = 'Invalid';
            });
            $http.get('/test');
        }
    );

    it('should reject promise if request fails',
        function() {
            $window.$fake = false;
            $window.jQuery = {
                ajax: function() {
                    return {
                        then: (success, failure) => failure({
                            status: 404,
                            getAllResponseHeaders: noOp,
                            statusText: 'resource not found'
                        }, 'resource not found')
                    }
                }
            };

            $http.get('/test').then(noOp, (error) => {
                expect(error.status).to.equal(404);
                expect(error.statusText).to.equal('resource not found');
            });
        }
    );

    it('should convert a node-response into an angular response', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config, responseHandler) => {
            responseHandler({
                headers: {
                    'content-type': 'application/json'
                },
                statusCode: 200,
                statusMessage: 'success',

                setEncoding: noOp,
                on: (event, handler) => {
                    switch (event) {
                        case 'data':
                            handler('{"a": "1"}');
                            break;

                        case 'end':
                            handler();
                            break;
                    }
                }
            });
            return {
                write: (data) => {
                    expect(data).to.equal('{"a":"1"}');
                },
                end: noOp
            };
        };

        $http.post('/test', {a: '1'}).then((response) => {
            expect(response.data).to.deep.equal({a: '1'});
            expect(response.headers).to.deep.equal({'content-type': 'application/json'});
            expect(response.config).to.deep.equal({
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                url: '/test',
                data: {a: '1'},
                protocol: 'https',
                host: 'localhost'
            });
            expect(response.status).to.equal(200);
            expect(response.statusText).to.equal('success');
        });
    });

    function makeEnsureContentTypeIsDetectedAsJson(contentType) {
        return function() {
            $http.$host = 'localhost';

            $nodeHttp.request = (config, responseHandler) => {
                responseHandler({
                    headers: {
                        'content-type': contentType
                    },

                    setEncoding: noOp,
                    on: (event, handler) => {
                        switch (event) {
                            case 'data':
                                handler('{"a": "1"}');
                                break;

                            case 'end':
                                handler();
                                break;
                        }
                    }
                });
                return {
                    end: noOp
                };
            };

            $http.get('/test').then((response) => {
                expect(response.data).to.deep.equal({a: '1'});
            });
        }
    }

    it('should json-decode application/json',
        makeEnsureContentTypeIsDetectedAsJson('application/json'));
    it('should json-decode text/json',
        makeEnsureContentTypeIsDetectedAsJson('text/json'));
    it('should json-decode vendor-api',
        makeEnsureContentTypeIsDetectedAsJson('application/vnd.api+json'));
    it('should json-decode vendorized-api',
        makeEnsureContentTypeIsDetectedAsJson(
            'application/vnd.github.api.v3+json'));

    it('should not JSON-encode a url-encoded payload', function(done) {
        $http.$host = 'localhost';

        var handlersToExecute = [];

        $nodeHttp.request = (config, responseHandler) => {
            responseHandler({
                headers: {
                    'content-type': 'text/html'
                },

                setEncoding: noOp,
                on: (event, handler) => {
                    switch (event) {
                        case 'data':
                            handlersToExecute.push(() => handler('no-data'));
                            break;

                        case 'end':
                            handlersToExecute.push(() => handler());
                            break;
                    }
                }
            });

            return {
                write: (data) => {
                    expect(data).to.equal('a=1&b=2');
                    handlersToExecute.forEach((handler) => handler());
                },
                end: noOp
            };
        };

        $http.post('/test', 'a=1&b=2', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(() => done());
    });

    it('should work without a content type for the request on node',
        function(done) {
            /*
             * If there is no content type on the request, `data` is not encoded
             * in any way - in this case it's up to the user to make sure things
             * work.
             */
            $http.$host = 'localhost';

            var handlersToExecute = [];

            $nodeHttp.request = (config, responseHandler) => {
                responseHandler({
                    headers: {
                        'content-type': 'text/html'
                    },

                    setEncoding: noOp,
                    on: (event, handler) => {
                        switch (event) {
                            case 'data':
                                handlersToExecute.push(() => handler('no-data'));
                                break;

                            case 'end':
                                handlersToExecute.push(() => handler());
                                break;
                        }
                    }
                });

                return {
                    write: (data) => {
                        expect(data).to.equal('a=1&b=2');
                        handlersToExecute.forEach((handler) => handler());
                    },
                    end: noOp
                };
            };

            $http.post('/test', 'a=1&b=2', {
                headers: {
                    'Content-Type': ''
                }
            }).then(() => done());
        }
    );

    it('should not decode xml', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config, responseHandler) => {
            responseHandler({
                headers: {
                    'content-type': 'text/xml'
                },

                setEncoding: noOp,
                on: (event, handler) => {
                    switch (event) {
                        case 'data':
                            handler('<test></test>');
                            break;

                        case 'end':
                            handler();
                            break;
                    }
                }
            });
            return {
                end: noOp
            };
        };

        $http.get('/test').then((response) => {
            expect(response.data).to.equal('<test></test>');
        });
    });

    it('should handle no body content on node-requests', function(done) {
        $http.$host = 'localhost';

        $nodeHttp.request = (config, responseHandler) => {
            responseHandler({
                headers: {
                    'content-type': 'text/html'
                },

                setEncoding: noOp,
                on: (event, handler) => {
                    switch (event) {
                        case 'end':
                            handler();
                            break;
                    }
                }
            });

            return {
                end: noOp
            };
        };

        $http.get('/test').then((response) => {
            expect(response.data).to.equal('');
            done();
        });
    });

    it('should handle errors on node-requests', function(done) {
        $http.$host = 'localhost';

        $nodeHttp.request = (config, responseHandler) => {
            responseHandler({
                headers: {
                    'content-type': 'text/html'
                },

                setEncoding: noOp,
                on: (event, handler) => {
                    switch (event) {
                        case 'error':
                            handler('error500');
                            break;
                    }
                }
            });

            return {
                end: noOp
            };
        };

        $http.get('/test').then(noOp, (error) => {
            expect(error).to.equal('error500');
            done();
        });
    });
});