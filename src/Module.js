/**
 * @module Mimeo
 */

/**
 * Modules are the primary interface to mimeo. On a module, you can define
 * injectables. Each injectable definition will return the current module,
 * allowing you to chain injectable definitions.
 *
 * Injectables consist of three parts: A name, a list of dependencies and an
 * executable. The dependencies are names of other injectables that will be
 * passed to the executable.
 *
 * There are two ways of defining an injectable. The first is an array notation
 * where the last entry in the array is the executable. The other is an
 * executable that has the special properties $name and $inject.
 *
 * Here is an example of the array-style. Two factories A and B are defined,
 * with B having a dependency on A:
 *
 *      mimeo.module('example', [])
 *          .factory('A', [() => {}])
 *          .factory('B', ['B', (b) => {}])
 *
 * And here's how the same example would look like with the executable style:
 *
 *      function A() {}
 *      A.$name = 'A';
 *      A.$inject = [];
 *
 *      function B() {}
 *      B.$name = 'B';
 *      B.$inject = ['A'];
 *
 *      mimeo.module('example', [])
 *          .factory(A)
 *          .factory(B);
 *
 * The executable-style makes it very easy to separate out your code from the
 * mimeo bindings. In the example, function A and B can be used independent of
 * mimeo. This is great of unit-testing your code, as you can import the
 * executables into your test suite without having to worry about mimeo.
 *
 * @class Module
 * @constructor
 */
function Module(injectables, name, dependencies) {
    var module = this;

    var toRun = [];

    this.$name = name;
    this.$inject = dependencies;

    function prepareInjectable(name, parameters) {
        if (injectables.has(name)) {
            throw new Error('Injectable "' + name + '" already exists');
        }

        var injectable;

        if (parameters instanceof Function) {
            injectable = parameters;
            if (!injectable.$inject) {
                injectable.$inject = [];
            }
        } else {
            var dependencies = parameters.slice(0, -1);
            injectable = parameters.slice(-1)[0];
            injectable.$inject = dependencies;
        }

        injectable.$name = name;

        return injectable;
    }

    function addInjectable(name, parameters) {
        injectables.add(prepareInjectable(name, parameters));

        return module;
    }

    this.executeRun = function executeRun() {
        toRun.forEach(function(injectableName) {
            injectables.get(injectableName)();
        });
    };

    /*
     * I don't like the wrapper and auto-generated name, but for now I can't
     * come up with a better solution. The problem is that the run-function
     * needs to work with the injection system (since it can have other
     * injectables injected), and the whole system isn't designed to deal with
     * unnamed things.
     *
     * In fact, I feel that an injection system that can handle unnamed items
     * would be wrong. How would you identify what to inject? Having names for
     * injectables (or at least IDs) is a core aspect of an injection system.
     *
     * So this would have to live outside of it. But that means having it's own
     * "make sure all these injectables exist" system. Then we could just get
     * the named injectables the run-function needs and call the run-function
     * with those.
     *
     * I can't think of a good way to de-duplicated that dependency resolution
     * system though, so there'd be one for all named injectables and one for
     * the run-functions.
     *
     * I don't plan on having other unnamed injectables, so I feel that effort
     * would be wasted. Hence the "hack" here with an auto-generated name and
     * a wrapper that executes the run-function with pass-through arguments.
     */
    /**
     * Defines an injectable that will be run after modules are instantiated.
     *
     * @method run
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.run = function(parameters) {
        var name = module.$name + '-run.' + toRun.length;
        toRun.push(name);

        var provider = function providerRun() {
            var args = arguments;
            return function() {
                if (parameters instanceof Function) {
                    return parameters.apply(parameters, args);
                } else {
                    var lastEntry = parameters.slice(-1)[0];
                    return lastEntry.apply(lastEntry, args);
                }
            }
        };

        if (parameters instanceof Function) {
            provider.$inject = parameters.$inject;
        } else {
            provider.$inject = parameters.slice(0, -1);
        }

        return addInjectable(name, provider);
    };

    /**
     * Use factories for anything that doesn't create output
     *
     * @method factory
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.factory = addInjectable;

    /**
     * Components are meant to produce some output, regardless of what rendering
     * technique you use
     *
     * @method component
     * @for Module
     * @chainable
     * @param {Array|Function} Injectable definition
     * @return {Module}
     */
    this.component = addInjectable;

    /**
     * Values are different from factories and components in that there's no
     * executable. It's just a name and a value.
     *
     * @example
     *      mimeo.module('example', [])
     *          .value('name', 'value')
     *
     * @method value
     * @for Module
     * @chainable
     * @param {string} name Name of value
     * @param {*} value Value you want available for injection
     * @return {Module}
     */
    this.value = function(name, value) {
        return addInjectable(name, function() {
            return value;
        });
    }
}

module.exports = Module;