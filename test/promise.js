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

        promise.then(function() {
            done('Promise should not resolve');
        }, function(rejection) {
            expect(rejection).to.equal('test');
            done();
        });
    });

    it('should enable multiple deferres to resolve individually',
        function(done) {
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

        $q.all([
            defer1.promise,
            defer2.promise,
            defer3.promise
        ]).then(function(resolutions) {
            expect(resolutions).to.deep.equal([
                testValue1,
                testValue2,
                testValue3
            ]);
            done();
        });

        //Resolve out of order to ensure that .all() resolves promises in the
        //order it received them
        defer1.resolve(testValue1);
        defer3.resolve(testValue3);
        defer2.resolve(testValue2);
    });

    it('should resolve value with .when', function(done) {
        var value = 123;
        $q.when(value).then(function(thenValue) {
            expect(thenValue).to.equal(value);
            done();
        });
    });

    it('should use .when to convert a different promise into a $q promise',
        function(done) {
            var value = 123;
            var error = 'error';
            var notify = 'notify';
            var noop = function() {
            };

            var otherPromiseSuccess = {
                then: function(onSuccess) {
                    onSuccess(value);
                }
            };
            var otherPromiseFailure = {
                then: function(_, onReject) {
                    onReject(error);
                }
            };
            /*
             * Last promise to complete, so in this promises handler the
             * 'done' function is called
             */
            var otherPromiseNotify = {
                then: function(_, __, onNotify) {
                    /*
                     * onNotify doesn't cache previous calls so the timeout
                     * gives the test time to attach the onNotify handler
                     */
                    setTimeout(function() {
                        onNotify(notify);
                    }, 100);
                }
            };

            $q.when(otherPromiseSuccess).then(function(promiseSuccess) {
                try {
                    expect(promiseSuccess).to.equal(value);
                } catch (error) {
                    done(error);
                }
            });

            $q.when(otherPromiseFailure).then(
                noop,
                function(promiseError) {
                    try {
                        expect(promiseError).to.equal(error);
                    } catch (error) {
                        done(error);
                    }
                });

            $q.when(otherPromiseNotify).then(
                noop,
                noop,
                function(promiseNotify) {
                    try {
                        expect(promiseNotify).to.equal(notify);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        }
    );

    it('should accept resolve, reject and notify handlers as arguments to a .when call',
        function(done) {
            var value = 123;
            var error = 'error';
            var notify = 'notify';
            var noop = function() {
            };

            var otherPromiseSuccess = {
                then: function(onSuccess) {
                    onSuccess(value);
                }
            };
            var otherPromiseFailure = {
                then: function(_, onReject) {
                    onReject(error);
                }
            };
            var otherPromiseNotify = {
                then: function(_, __, onNotify) {
                    /*
                     * onNotify doesn't cache previous calls so the timeout
                     * gives the test time to attach the onNotify handler
                     */
                    setTimeout(function() {
                        onNotify(notify);
                    }, 10);
                }
            };

            $q.when(otherPromiseSuccess, function(promiseSuccess) {
                expect(promiseSuccess).to.equal(value);
            });

            $q.when(otherPromiseFailure,
                noop,
                function(promiseError) {
                    expect(promiseError).to.equal(error);
                });

            $q.when(otherPromiseNotify,
                noop,
                noop,
                function(promiseNotify) {
                    expect(promiseNotify).to.equal(notify);
                    done();
                });
        }
    );

    it('should chain .then calls and pass return values to the next handler',
        function(done) {
            var value1 = 'a';
            var value2 = 'b';
            var value3 = 'c';
            var originalValue = {
                key: value1
            };

            var promise = $q(function(resolve) {
                //allow .then calls to attach
                resolve(originalValue);
            });

            promise
                .then(function(value) {
                    return $q.when(value.key);
                })
                .then(function(value) {
                    expect(value).to.equal(value1);
                    return value + value2;
                })
                .then(function(value) {
                    expect(value).to.equal(value1 + value2);

                    return $q(function(resolve) {
                        setTimeout(function() {
                            resolve(value + value3);
                        }, 200);
                    });
                })
                .then(function(value) {
                    expect(value).to.equal(value1 + value2 + value3);
                    done();
                });

            promise.then(function(value) {
                expect(value).to.equal(originalValue);
            });
        }
    );

    it('should error out a then-chain if a returned promised is rejected',
        function(done) {
            var q = $q(function(resolve) {
                resolve(1);
            })
                .then(function(one) {
                    expect(one).to.equal(1);
                    return $q(function(resolve, reject) {
                        reject('rejection');
                    });
                })
                .then(function() {
                    done('This .then should be skipped');
                })
                .catch(function(error) {
                    expect(error).to.equal('rejection');
                    done();
                });

            return q;
        });
});