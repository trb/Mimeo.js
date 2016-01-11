function Chain() {
    var state = 'pending';
    var onResolves = [new SingleDefer()];

    function reject() {}

    function SingleDefer() {
        var resolved = false;
        var resolution;

        var rejected = false;
        var rejection;

        var onResolve = function() {};
        var onReject = function() {};

        return {
            resolve: function(value) {
                resolved = true;
                resolution = value;

                onResolve(value);
            },
            reject: function(error) {
                rejected = true;
                rejection = error;

                onReject(error);
            },
            promise: {
                then: function(resolveHandler, rejectHandler) {
                    onResolve = resolveHandler;
                    if (resolved) {
                        onResolve(resolution);
                    }

                    onReject = rejectHandler;
                    if (rejected) {
                        onReject(rejection);
                    }
                }
            }
        }
    }

    SingleDefer.when = function(value) {
        var d = new SingleDefer();

        if (value.then) {
            value.then(function(resolution) {
                d.resolve(resolution);
            }, function(error) {
                d.reject(error);
            });

            return d.promise;
        } else {
            d.resolve(value);
            return d.promise;
        }
    };

    var publicApi = {
        then: function(onResolve) {
            if (typeof onResolve === 'function' || (onResolve instanceof Function)) {
                var q = new SingleDefer();

                onResolves[onResolves.length - 1].promise.then(function(previousValue) {
                    var onResolveReturn = onResolve(previousValue);

                    if (onResolveReturn) {
                        SingleDefer.when(onResolveReturn).then(function(currentValue) {
                            q.resolve(currentValue);
                        }, function(error) {
                            reject(error);
                        });
                    }
                });

                onResolves.push(q);
            }

            return publicApi;
        }
    };

    return {
        resolve: function(resolution) {
            onResolves[0].resolve(resolution);
        },
        publicApi: publicApi
    };
}

function Deferred(callback) {
    var state = 'unresolved';
    var resolvedValue;
    var rejectionReason;

    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];

    var thenChains = [];

    var promise = {
        then: function(onResolve, onReject, onNotify) {
            var chain = new Chain();

            thenChains.push(chain);

            chain.publicApi.then(onResolve, onReject, onNotify);

            if (state === 'resolved') {
                chain.resolve(resolvedValue);
            }

            return chain.publicApi;
        }
    };

    var resolve = function(resolution) {
        /*
         * Store first resolution so future .then() calls will be
         * resolved immediately
         */
        resolvedValue = resolution;
        state = 'resolved';

        thenChains.forEach(function(chain) {
            console.log('execute chain', chain);
            chain.resolve(resolution);
        });
    };
    var reject = function(givenRejectionReason) {
        state = 'rejected';
        rejectionReason = givenRejectionReason;
        rejectCallbacks.forEach(function(callback) {
            callback(givenRejectionReason);
        });
    };
    var notify = function(notification) {
        notifyCallbacks.forEach(function(callback) {
            callback(notification);
        });
    };

    if (callback) {
        callback(resolve, reject, notify);
    }

    return {
        resolve: resolve,
        reject: reject,
        notify: notify,
        promise: promise
    };
}

function $q(callback) {
    return (new Deferred(callback)).promise;
}

$q.defer = function() {
    return new Deferred();
};

$q.resolve = $q.when = function(value, onResolve, onReject, onNotify) {
    var defer = new Deferred(function(resolve, reject, notify) {
        if (value && value.then) {
            value.then(function(resolveValue) {
                resolve(resolveValue);
            }, function(error) {
                reject(error);
            }, function(notifyValue) {
                notify(notifyValue);
            });
        } else {
            resolve(value);
        }
    });

    defer.promise.then(onResolve, onReject, onNotify);

    return defer.promise;
};

$q.all = function(promises) {
    if (!promises instanceof Array) {
        throw new Error('Promises need to be passed to $q.all in an array');
    }

    var counter = 0;
    var resolutions = [];
    var hasRejections = false;

    var deferred = new Deferred();

    function checkComplete() {
        if (counter === promises.length) {
            if (hasRejections) {
                deferred.reject();
            } else {
                deferred.resolve(resolutions);
            }
        }
    }

    promises.forEach(function(promise, index) {
        promise.then(function(resolution) {
            resolutions[index] = resolution;
            ++counter;
            checkComplete();
        }, function() {
            hasRejections = true;
            ++counter;
            checkComplete();
        });
    });

    return deferred.promise;
};

module.exports = function() {
    return $q;
};