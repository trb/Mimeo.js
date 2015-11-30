function Deferred(callback) {
    var resolved = false;
    var resolvedValue;

    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];

    var promise = {
        then: function(onResolve, onReject, onNotify) {
            if (resolved && onResolve) {
                onResolve(resolvedValue);
            } else {
                resolveCallbacks.push(onResolve);
            }

            if (onReject) {
                rejectCallbacks.push(onReject);
            }

            if (onNotify) {
                notifyCallbacks.push(onNotify);
            }

            return promise;
        }
    };

    var resolve = function(resolution) {
        resolveCallbacks.forEach(function(callback) {
            callback(resolution);
        });
    };
    var reject = function(rejectionReason) {
        rejectCallbacks.forEach(function(callback) {
            callback(rejectionReason);
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