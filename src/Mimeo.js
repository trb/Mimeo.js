var Module = require('./Module.js');

var Modules = require('./dependencies/Modules.js');
var Injectables = require('./dependencies/Injectables.js');

var Mimeo = function() {
    var modules = Modules();
    var injectables = Injectables();

    function instantiateInjectables() {
        if (!injectables.hasAllDependencies()) {
            throw new Error('Injectables don\'t exist: ' + injectables.getMissingDependencies());
        }

        injectables.instantiate();
    }

    function bootstrap(injectableName) {
        if (!injectableName) {
            throw new Error('Define an injectable to bootstrap!');
        }

        modules.instantiate();

        instantiateInjectables();

        var entryInjectable = injectables.get(injectableName);

        if (!Boolean(entryInjectable)) {
            throw new Error('Injectable "' + injectableName + '" to bootstrap not found');
        }

        return entryInjectable.apply(entryInjectable, Array.prototype.slice.call(arguments, 1));
    }

    return {
        module: function(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(injectables, name, dependencies));
            }

            return modules.get(name);
        },
        bootstrap: bootstrap
    }
};

module.exports = Mimeo();
