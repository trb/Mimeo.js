function Chain() {
    var state = 'unresolved';
    var resolvedValue;
    var error;

    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];
    var finallyCallbacks = [];

    function executeCallbacks(callbacks, argument) {
        callbacks.forEach(function(callback) {
            callback(argument);
        });
    }

    function resolve(resolution) {
        state = 'resolved';
        resolvedValue = resolution;

        function executeNext(callbackIndex, previousResolution) {
            if (!previousResolution) {
                return;
            }
            if (callbackIndex >= resolveCallbacks.length) {
                return;
            }

            var returnValue = resolveCallbacks[callbackIndex](previousResolution);
            if (returnValue && (typeof returnValue.then === 'function' || (returnValue.then instanceof Function))) {
                returnValue.then(function(nextResolution) {
                    executeNext(++callbackIndex, nextResolution);
                });
            } else {
                executeNext(++callbackIndex, returnValue);
            }
        }

        executeNext(0, resolution);

        done();
    }

    function reject(error) {
        state = 'rejected';

        executeCallbacks(rejectCallbacks, error);

        done();
    }

    function done() {
        executeCallbacks(finallyCallbacks);
    }

    var publicApi = {
        /*
         * Figure out how to handle .then() calls to a resolved chain
         *
         * Thoughts:
         *
         * Split up the callback chain execution from resolve()
         *
         * Instead of taking callbacks from the array they can also be taken
         * from this call instead. So executeNext() could just as well work
         * for this .then()
         *
         * If the onResolve() parameter doesn't return anything nothing after it
         * should be executed anyhow.
         *
         * So if it return a promise the next .then() call wouldn't execute
         * onResolve until the last .then() call has concluded. This way a chain
         * can be started and continued for an already resolved promise. But only
         * until one of the onResolve() parameters to a .then() call doesn't
         * return anything
         */
        then: function(onResolve, onReject, onNotify) {
            if (onResolve) {
                if (state === 'resolved') {
                    onResolve(resolvedValue);
                } else {
                    resolveCallbacks.push(onResolve);
                }
            }

            if (onReject) {
                rejectCallbacks.push(onReject);
            }

            if (onNotify) {
                notifyCallbacks.push(onNotify);
            }

            return publicApi;
        },
        'catch': function(onReject) {
            rejectCallbacks.push(onReject);

            return publicApi;
        },
        'finally': function(complete, onNotify) {
            notifyCallbacks.push(onNotify);
            finallyCallbacks.push(complete);

            return publicApi;
        }
    };

    return {
        resolve: function(resolution) {
            resolve(resolution);
        },
        reject: function(error) {
            reject(error);
        },

        isResolved: function() {
            return state === 'resolved';
        },
        isRejected: function() {
            return state === 'rejected';
        },

        publicApi: publicApi
    }
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