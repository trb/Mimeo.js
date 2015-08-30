var DependencyManager = require('./DependencyManager.js');
var Module = require('./Module.js');

var Mimeo = function() {
    var _modules = DependencyManager('modules');
    var _injectables = DependencyManager('injectables');

    function createModule(moduleName, dependencies) {
        _modules.register(new Module(moduleName, dependencies));
        return _modules.getProvider(moduleName);
    }

    function instantiateModules() {
        if (!_modules.hasAllDependencies()) {
            throw 'Modules don\'t exist: ' + _modules.getMissingDependencies();
        }
    }

    function instantiateInjectables() {
        if (!_injectables.hasAllDependencies()) {
            throw 'Injectables don\'t exist: ' + _injectables.getMissingDependencies();
        }

        _injectables.instantiate();
    }

    function bootstrapToString() {
        instantiateModules();
        instantiateInjectables();
    }

    return {
        module: function(name, dependencies) {
            if (dependencies) {
                return createModule(name, dependencies);
            }

            return _modules.getProvider(name);
        },
        bootstrapToString: bootstrapToString
    }
};

module.exports = Mimeo();