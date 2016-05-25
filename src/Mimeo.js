/**
 * The mimeo modules describes the use of the mimeo framework.
 *
 * @module Mimeo
 */
var Module = require('./Module.js');

var Modules = require('./dependencies/Modules.js');
var Injectables = require('./dependencies/Injectables.js');

var registerBuiltIns = require('./builtins/Register.js');
/**
 * This is the entry point for the Mimeo framework. Create modules or bootstrap
 * an injectable.
 *
 * @class Mimeo
 * @static
 */
var Mimeo = function() {
    var modules = Modules();
    var injectables = Injectables();

    registerBuiltIns(injectables);

    function bootstrap(injectableName) {
        if (!injectableName) {
            throw new Error('Define an injectable to bootstrap!');
        }

        if (!modules.hasAllDependencies()) {
            throw new Error('Modules don\'t exist: ' + modules.getMissingDependencies());
        }

        if (!injectables.hasAllDependencies()) {
            throw new Error('Injectables don\'t exist: ' + injectables.getMissingDependencies());
        }

        injectables.instantiate();

        modules.instantiate();

        var entryInjectable = injectables.get(injectableName);

        if (!Boolean(entryInjectable)) {
            throw new Error('Injectable "' + injectableName + '" to bootstrap not found. Stringyfied injectable: ' + entryInjectable);
        }

        if (!(entryInjectable instanceof Function)) {
            throw new Error('Injectable "' + injectableName + '" is not executable. Stringyfied injectable: ' + String(entryInjectable));
        }

        return entryInjectable.apply(entryInjectable, Array.prototype.slice.call(arguments, 1));
    }

    return {
        /**
         * In Mimeo, modules are top-level constructs that own and manage
         * injectables. Modules can depend on other module and will be instantiated
         * in dependency-order.
         *
         * @method module
         * @for Mimeo
         * @example
         *      mimeo.module('example', [])
         *          .component('greeting', () => (name) => console.log('Hi, ' + name);
         * @param {string} name Name of the module
         * @param {Array} [dependencies] Array of module names that this
         *  module depends on
         * @return {Module}
         */
        module: function(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(injectables, name, dependencies));
            }

            return modules.get(name);
        },

        /**
         * @method bootstrap
         * @for Mimeo
         * @example
         *      mimeo.module('example', [])
         *          .component('greeting', () => (name) => console.log('Hi, ' + name);
         *      mimeo.bootstrap('greeting', 'John')
         *      //=> "Hi, John"
         * @param {string} injectableName
         * @param {object} [...parameters] Passed through to injectable
         */
        bootstrap: bootstrap
    }
};

module.exports = Mimeo();
