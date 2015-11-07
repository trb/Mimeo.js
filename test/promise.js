var $q = require('../src/builtins/Promise.js')();
var expect = require('chai').expect;

describe('Promise', function() {
    it('should resolve via callback', function(done) {
        var promise = $q(function(resolve) {
            setTimeout(function() {
                resolve('test');
            }, 10);
        });

        promise.then(function(resolution) {
            expect(resolution).to.equal('test');
            done();
        });
    });

    it('should reject via callback', function(done) {
        var promise = $q(function(resolve, reject) {
            setTimeout(function() {
                reject('test');
            }, 10);
        });

        promise.then(function() {}, function(rejection) {
            expect(rejection).to.equal('test');
            done();
        });
    });

    it('should enable multiple deferres to resolve individually', function(done) {
        var promiseA = $q(function(resolve) {
            setTimeout(function() {
                resolve('testA');
            }, 20);
        });
        var promiseB = $q(function(resolve) {
            setTimeout(function() {
                resolve('testB');
            }, 10);
        });

        promiseA.then(function(resolution) {
            expect(resolution).to.equal('testA');
            done();
        });
        promiseB.then(function(resolution) {
            expect(resolution).to.equal('testB');
        });
    });

    it('should mimic angulars .defer()', function(done) {
        var defer = $q.defer();

        var testValue = 'test';

        defer.promise.then(function(resolution) {
            expect(resolution).to.equal(testValue);
            done();
        });

        defer.resolve(testValue);
    });

    it('should wait for multiple promises when using .all()', function(done) {
        var defer1 = $q.defer();
        var defer2 = $q.defer();
        var defer3 = $q.defer();

        var testValue1 = 'a';
        var testValue2 = 'b';
        var testValue3 = 'c';

        $q.all([defer1.promise, defer2.promise, defer3.promise]).then(function(resolutions) {
            expect(resolutions).to.deep.equal([testValue1, testValue2, testValue3]);
            done();
        });

        //Resolve out of order to ensure that .all() resolves promises in the
        //order it received them
        defer1.resolve(testValue1);
        defer3.resolve(testValue3);
        defer2.resolve(testValue2);
    })
});