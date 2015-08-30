var Graph = require('./Graph.js');

/**
 * Allows to register module, dependencies and get the order in which
 * modules need to be instantiated to fulfill all dependencies. It purely
 * resolves dependencies, module instances need to be handled separately.
 *
 * @returns {{register: register, addDependency: addDependency,
 *     getResolutionOrder: getResolutionOrder}}
 * @constructor
 */
var DependencyResolver = function() {
    var graph = new Graph();

    function register(module) {
        if (!graph.hasNodeValue(module)) {
            graph.add(module);
        }
    }

    function addDependency(module, dependency) {
        // Optimistically add a module if the dependency module doesn't
        // exist yet. It's possible to create dependencies on non-existing
        // modules, the user of the class has to handle that case.
        if (!graph.hasNodeValue(dependency)) {
            register(dependency);
        }

        graph.addEdge(dependency, module);
    }

    function getResolutionOrder() {
        return graph.getNodesTopological().map(function(node) {
            return node.value;
        });
    }

    return {
        register: register,
        addDependency: addDependency,
        getResolutionOrder: getResolutionOrder
    };
};

/**
 *
 * @returns {DependencyResolver}
 */
module.exports = function() {
    return new DependencyResolver();
};