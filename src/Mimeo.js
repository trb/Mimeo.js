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

    function bootstrapToString() {
        modules.instantiate();
        instantiateInjectables();
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