function isFunction(object) {
    return object && ((typeof object === 'function') && (object instanceof Function));
}

/**
 * An instance of a promise. Created and accessed through $q.
 *
 * @class Promise
 * @private
 * @constructor
 */
function Promise() {
    var resolveCallbacks = [];
    var rejectCallbacks = [];
    var notifyCallbacks = [];
    var state = 'pending';
    var resolution;
    var rejection;

    var api = {
        /**
         * Attach resolution, rejection and notification handlers to the promise.
         *
         * @method then
         * @for Promise
         * @chainable
         * @param {Function} onResolve Executed when the promise is resolved.
         *  If another promise is returned, the next promise in the chain is
         *  attached to the returned promise. If a value is returned, the next
         *  promise in the chain is resolved with the returned value immediately.
         * @param {Function} onReject Executed when the promise is rejected
         * @param {Function} onNotify Executed when the promise notified
         * @return {Promise}
         */
        then: function(onResolve, onReject, onNotify) {
            var promise = new Promise();

            if (((state === 'pending') || (state === 'resolved')) && isFunction(
                    onResolve)) {
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
                    } else {
                        /*
                         * Stop rejecting the promise chain once the rejection
                         * has been handled.
                         */
                        promise.reject(rejectWith);
                    }
                }

                if (state === 'rejected') {
                    rejectionWrapper(rejection);
                } else {
                    rejectCallbacks.push(rejectionWrapper);
                }
            }

            notifyCallbacks.push(function(notifyWith) {
                if (isFunction(onNotify)) {
                    onNotify(notifyWith);
                }

                promise.notify(notifyWith);
            });

            return promise;
        },

        /**
         * Registers a rejection handler. Shorthand for `.then(_, onReject)`.
         *
         * @method catch
         * @for Promise
         * @chainable
         * @param onReject Executed when
         *  the promise is rejected. Receives the rejection reason as argument.
         * @return {Promise}
         */
        'catch': function(onReject) {
            return api.then(null, onReject);
        },

        /**
         * Send a notification to the promise.
         *
         * @method notify
         * @for Promise
         * @param {*} notifyWith Notification value
         */
        notify: function(notifyWith) {
            notifyCallbacks.forEach(function(callback) {
                callback(notifyWith);
            });
        },

        /**
         * Rejects the promise.
         *
         * @method reject
         * @for Promise
         * @param {*} rejectWith Rejection reason. Will be passed on to the
         *  rejection handlers
         */
        reject: function(rejectWith) {
            rejectCallbacks.forEach(function(callback) {
                callback(rejectWith);
            });

            state = 'rejected';
            rejection = rejectWith;
        },

        /**
         * Resolves the promise.
         *
         * @method resolve
         * @for Promise
         * @param {*} resolveWith This value is passed on to the resolution
         *  handlers attached to the promise.
         */
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

/**
 * The deferred object that's wrapped by $q
 *
 * @class Deferred
 * @param {Function} init This callback is passed three arguments, `resolve`,
 *  `reject` and `notify` that respectively resolve, reject or notify the
 *  deferreds promise.
 * @constructor
 */
function Deferred(init) {
    var promise = new Promise();

    if (isFunction(init)) {
        init(promise.resolve, promise.reject, promise.notify);
    }

    return {
        /**
         * See {{#crossLink "Promise/resolve:method"}}the underlying
         * promises resolve{{/crossLink}} documentation.
         *
         * @method resolve
         * @for Deferred
         */
        resolve: promise.resolve,

        /**
         * See {{#crossLink "Promise/reject:method"}}the underlying
         * promises reject{{/crossLink}} documentation.
         *
         * @method reject
         * @for Deferred
         */
        reject: promise.reject,

        /**
         * See {{#crossLink "Promise/notify:method"}}the underlying
         * promises notify{{/crossLink}} documentation.
         *
         * @method notify
         * @for Deferred
         */
        notify: promise.notify,

        /**
         * @property {Promise} promise
         * @for Deferred
         */
        promise: promise
    };
}

/**
 * Creates and manages promises. Used by $http and $routing.
 *
 * $q is used to create a deferred object, which contains a promise. The
 * deferred is used to create and manage promises.
 *
 * A promise accepts resolution, rejection and notification handlers that are
 * executed when the promise itself is resolved, rejected or notified. The
 * handlers are attached to the promise via the {{#crossLink "Promise/then:method"}}
 * .then(){{/crossLink}} method.
 *
 * You can attach multiple handlers by calling .then() multiple times with
 * different handlers. In addition, you can chain .then() calls. In this case,
 * the return value from .then() is a new promise that's attached to the resolve
 * handler passed to .then(). This way you can return promises from your resolve
 * handler and the next .then() will wait until that promise is resolved to
 * continue. Usually used to do multiple asyncronous calls in sequence.
 *
 * @class $q
 * @param {Function} callback The callback to initialized the deferred object
 * with
 * @constructor
 * @return {Promise}
 */
function $q(callback) {
    return (new Deferred(callback)).promise;
}

/**
 * Create a new defer. This method requires no arguments, the returned defer has
 * the methods required to resolve/reject/notify the promise.
 *
 * @example
 *      let defer = $q.defer();
 *      defer.promise.then((name) => console.log('Hi ' + name));
 *      defer.resolve('John');
 *      //=> "Hi John"
 * @method defer
 * @for $q
 * @return {Deferred}
 */
$q.defer = function() {
    return new Deferred();
};

/**
 * Creates a new promise and resolves it with `value`. If `value` is a promise,
 * the returned promise is attached to `value`. If onResolve, onReject or
 * onNotify are given, they are attached to the new promise.
 *
 * @method when
 * @for $q
 * @example
 *      $q.when('John').then((name) => console.log('Hi ' + name));
 *      //=> "Hi John"
 * @param {*|Promise} value Value that the returned promise is resolve with. If
 *  value is a promise, the returned promise is attached to value.
 * @param {Function} [onResolve] Resolve handler
 * @param {Function} [onReject] Rejection handler
 * @param {Function} [onNotify] Notification handler
 * @return {Promise}
 */
$q.when = function(value, onResolve, onReject, onNotify) {
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

/**
 * Alias for {{#crossLink "$q/when:method"}}$q.when{{/crossLink}}
 * @method resolve
 * @for $q
 */
$q.resolve = $q.when;

/**
 * Takes an array of promises (called inner promises) and creates a new promise
 * (called outer promise) that resolves when all the inner promises resolve.
 * If any of the inner promises are rejected, the outer promise is
 * immediately rejected as well and any other inner promises left over are
 * discarded.
 *
 * E.g. if you have three inner promises, A, B, and C, then the outer promise O
 * is resolved once all three A, B and C are resolved.
 *
 * If A is resolved, and B is rejected, and C is pending, then O will be
 * rejected regardless of C's outcome.
 *
 * @method all
 * @example
 *      let greeting = $q.defer();
 *      let name = $q.defer();
 *
 *      $q.all([greeting.promise, name.promise])
 *          .then((greeting, name) => console.log(greeting + ' ' + name));
 *
 *      greeting.resolve('Welcome');
 *      name.resolve('John')
 *      //=> "Welcome John"
 * @param {Array} promises Array of promises
 * @return {Promise}
 */
$q.all = function(promises) {
    if (!(promises instanceof Array)) {
        throw new Error('Promises need to be passed to $q.all in an array');
    }

    var counter = 0;
    var resolutions = [];

    var deferred = new Deferred();

    function checkComplete() {
        if (counter === promises.length) {
            deferred.resolve(resolutions);
        }
    }

    promises.forEach(function(promise, index) {
        promise.then(function(resolution) {
            resolutions[index] = resolution;
            ++counter;
            checkComplete();
        }, function(rejection) {
            deferred.reject(rejection);
        });
    });

    return deferred.promise;
};

module.exports = function() {
    return $q;
};