var Module = require('./Module.js');

var modules = require('./dependencies/Modules.js');
var injectables = require('./dependencies/Injectables.js');

var Mimeo = function() {
    function instantiateInjectables() {
        if (!injectables.hasAllDependencies()) {
            throw 'Injectables don\'t exist: ' + injectables.getMissingDependencies();
        }

        injectables.instantiate();
    }

    function bootstrapToString(name) {
        if (!name) {
            throw 'Mimeo.bootstrapToString(): Define an injectable to bootstrap!';
        }

        modules.instantiate();
        instantiateInjectables();

        var initInjectable = injectables.get(name);

        if (!initInjectable) {
            throw 'Mimeo.bootstrap(): Injectable to bootstrap named "' + name + '" not found';
        }

        return initInjectable();
    }

    function bootstrap(element, injectableName) {
        modules.instantiate();
        instantiateInjectables();

        injectables.get(injectableName)(element);
    }

    return {
        module: function(name, dependencies) {
            if (dependencies) {
                return modules.add(new Module(name, dependencies));
            }

            return modules.get(name);
        },
        bootstrapToString: bootstrapToString,
        bootstrap: bootstrap
    }
};

module.exports = Mimeo();