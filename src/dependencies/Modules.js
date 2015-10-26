var DependencyManager = require('./DependencyManager.js');

module.exports = function() {
    var modules = DependencyManager('modules');

    function add(module) {
        modules.register(module);
        return module;
    }

    function instantiateModules() {
        if (!modules.hasAllDependencies()) {
            throw new Error('Modules don\'t exist: ' + modules.getMissingDependencies());
        }
    }

    function get(name) {
        return modules.getProvider(name);
    }

    return {
        add: add,
        get: get,
        instantiate: instantiateModules
    };
};