var modules = require('./DependencyManager.js')('modules');

function add(module) {
    modules.register(module);
    return module;
}

function instantiateModules() {
    if (!modules.hasAllDependencies()) {
        throw 'Modules don\'t exist: ' + modules.getMissingDependencies();
    }
}

function get(name) {
    return modules.getProvider(name);
}

module.exports = {
    add: add,
    get: get,
    instantiate: instantiateModules
};