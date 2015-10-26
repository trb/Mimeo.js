var DependencyManager = require('./DependencyManager.js');

module.exports = function() {
    var injectables = DependencyManager('injectables');

    function add(injectable) {
        injectables.register(injectable);
        return injectable;
    }

    function instantiateInjectables() {
        if (!injectables.hasAllDependencies()) {
            throw new Error('Injectables don\'t exist: ' + injectables.getMissingDependencies());
        }

        injectables.instantiate();
    }

    function has(name) {
        return Boolean(injectables.getProvider(name));
    }

    function get(name) {
        return injectables.getInstance(name);
    }

    function hasAllDependencies() {
        return injectables.hasAllDependencies();
    }

    function getMissingDependencies() {
        return injectables.getMissingDependencies();
    }

    return {
        add: add,
        get: get,
        has: has,
        instantiate: instantiateInjectables,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies
    };
};