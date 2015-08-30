var injectables = require('./DependencyManager.js')('injectables');

function add(injectable) {
    injectables.register(injectable);
    return injectable;
}

function instantiateInjectables() {
    if (!injectables.hasAllDependencies()) {
        throw 'Injectables don\'t exist: ' + injectables.getMissingDependencies();
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

module.exports = {
    add: add,
    get: get,
    has: has,
    instantiate: instantiateInjectables,
    hasAllDependencies: hasAllDependencies
};