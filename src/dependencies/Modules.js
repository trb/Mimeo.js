var DependencyManager = require('./DependencyManager.js');

module.exports = function() {
    var modules = DependencyManager('modules');

    function add(module) {
        modules.register(module);
        return module;
    }

    function hasAllDependencies() {
        return modules.hasAllDependencies();
    }

    function instantiateModules() {
        modules.all.providers(function(_, module) {
            if (module) {
                module.executeRun();
            }
        });
    }

    function get(name) {
        return modules.getProvider(name);
    }

    function getMissingDependencies() {
        return modules.getMissingDependencies();
    }

    return {
        add: add,
        get: get,
        instantiate: instantiateModules,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies
    };
};