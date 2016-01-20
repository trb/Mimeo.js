function isFunction(object) {
    return object && ((typeof object === 'function') && (object instanceof Function));
}

function Promise() {
    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var state = 'pending';
    var resolution;
    var rejection;

    var api = {
        then: function(onResolve, onReject) {
            var promise = new Promise();

            if (((state === 'pending') || (state === 'resolved')) && isFunction(onResolve)) {
                function resolveWrapper(resolution) {
                    var returnValue = onResolve(resolution);

                    if (returnValue && isFunction(returnValue.then)) {
                        returnValue.then(function(nextResolution) {
                            promise.resolve(nextResolution);
                        }, function(nextRejection) {
                            promise.reject(nextRejection);
                        });
                    } else {
                        promise.resolve(returnValue);
                    }
                }

                if (state === 'resolved') {
                    resolveWrapper(resolution);
                } else {
                    resolveCallbacks.push(resolveWrapper);
                }
            }

            if ((state === 'pending') || (state === 'rejected')) {
                function rejectionWrapper(rejectWith) {
                    if (isFunction(onReject)) {
                        onReject(rejectWith);
                    }

                    promise.reject(rejectWith);
                }

                if (state === 'rejected') {
                    rejectionWrapper(rejection);
                } else {
                    rejectCallbacks.push(rejectionWrapper);
                }
            }

            return promise;
        },

        'catch': function(onReject) {
            return api.then(null, onReject);
        },

        reject: function(rejectWith) {
            rejectCallbacks.forEach(function(callback) {
                callback(rejectWith);
            });

            state = 'rejected';
            rejection = rejectWith;
        },

        resolve: function(resolveWith) {
            resolveCallbacks.forEach(function(callback) {
                callback(resolveWith);
            });

            state = 'resolved';
            resolution = resolveWith;
        }
    };

    return api;
}

function Deferred(init) {
    var promise = new Promise();

    if (isFunction(init)) {
        init(promise.resolve, promise.reject, promise.notify);
    }

    return {
        resolve: promise.resolve,
        reject: promise.reject,
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