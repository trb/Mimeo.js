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

    it('should set the port when using node', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config) => {
            expect(config.host).to.equal('localhost');
            expect(config.port).to.equal('80');
            return { end: noOp };
        };

        $http.get('/test');
    });

    it('should set the port from the host if the host has a port when using node', function() {
        $http.$host = 'localhost:3000';

        $nodeHttp.request = (config) => {
            expect(config.host).to.equal('localhost');
            expect(config.port).to.equal('3000');
            return { end: noOp };
        };

        $http.get('/test');
    });

    it('should build url params correctly', function() {
        $http.$host = 'localhost';

        $nodeHttp.request = (config) => {
            expect(config.path).to.equal('https://localhost/test?a=1&b=2&b=3&c=%7B%22x%22:%22y%22%7D');
            return { end: noOp };
        };

        $http.get('/test', {
            a: 1,
            b: [2, 3],
            c: { x: 'y' }
        });
    });

    it('should set headers', function() {
        $http.$host = 'localhost';
        $http.$config.headers['Content-Type'] = 'text/html';
        $http.$config.headers['X-Test'] = '1';

        $nodeHttp.request = (config) => {
            expect(config.headers['Content-Type']).to.equal('text/html');
            expect(config.headers['X-Test']).to.equal('1');
            return { end: noOp };
        };

        $http.get('/test');

        $http.$config.headers = { 'Content-Type': 'application/json' };

        $nodeHttp.request = (config) => {
            expect(config.headers['Content-Type']).to.equal('text/xml');
            expect(config.headers['X-Test']).to.equal('100');
            return { end: noOp };
        };

        $http.get('/test', {}, {
            headers: {
                'Content-Type': 'text/xml',
                'X-Test': '100'
            }
        });
    });

    it('should use jQuery when available', function() {
        $window.$fake = false;
        $window.jQuery = {
            ajax: function(config) {
                expect(config.headers['Content-Type']).to.equal('text/html');
                expect(config.url).to.equal('/test?a=1&b=2&b=3');

                return {
                    then: noOp
                }
            }
        };

        $http.get('/test', {a: 1, b: [2, 3]}, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    });
});