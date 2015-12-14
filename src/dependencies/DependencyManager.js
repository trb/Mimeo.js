//var DependencyResolver = require('./DependencyResolver.js');
var Graph = require('./Graph.js');

/**
 *
 * @param name
 * @returns {{$name: string, register: register, hasAllDependencies:
 *     hasAllDependencies, instantiate: instantiate, getInstance: getInstance}}
 * @constructor
 */
function DependencyManager(name) {
    var _providers = {};
    var _instances = {};
    var _graph = new Graph();

    var _getMissingDependenciesCache = undefined;

    function register(entity) {
        if (!entity) {
            throw new Error('No entity to register was given');
        }

        if (!entity.$name) {
            throw new Error('Entity "' + entity.$name + '" is missing property $name');
        }

        if (!entity.$inject) {
            throw new Error('Entity "' + entity.$name + '" is missing property $inject');
        }

        if (_providers[entity.$name]) {
            throw new Error('Entity "' + entity.$name + '" already exists');
        }

        _getMissingDependenciesCache = undefined;

        _providers[entity.$name] = entity;

        /*
         * Name might've been registered as a dependency of another entity
         */
        if (!_graph.hasNodeValue(entity.$name)) {
            _graph.add(entity.$name);
        }

        entity.$inject.forEach(function(dependency) {
            if (!_graph.hasNodeValue(dependency)) {
                _graph.add(dependency);
            }

            _graph.addEdge(dependency, entity.$name);
        });
    }

    function getMissingDependencies() {
        if (_getMissingDependenciesCache) {
            return _getMissingDependenciesCache;
        }

        var providersInjects = Object.keys(_providers).map(function(providerName) {
            return _providers[providerName].$inject;
        });

        _getMissingDependenciesCache = [].concat.apply([], providersInjects).filter(function(providerName) {
            return !Boolean(_providers[providerName]);
        });

        return _getMissingDependenciesCache;
    }

    function hasAllDependencies() {
        return getMissingDependencies().length == 0;
    }

    function instantiate() {
        _graph.getNodesTopological().forEach(function(providerName) {
            var provider = _providers[providerName];

            _instances[providerName] = provider.apply(provider, provider.$inject.map(function(dependencyName) {
                return _instances[dependencyName];
            }));
        });
    }

    function getProvider(providerName) {
        return _providers[providerName];
    }

    function getInstance(providerName) {
        return _instances[providerName];
    }

    return {
        $name: name,
        register: register,
        hasAllDependencies: hasAllDependencies,
        getMissingDependencies: getMissingDependencies,
        instantiate: instantiate,
        getProvider: getProvider,
        getInstance: getInstance,
        all: {
            providers: function(callback) {
                Object.keys(_providers).forEach(function(name) {
                    callback(name, _providers[name]);
                });
            },
            instances: function(callback) {
                Object.keys(_instances).forEach(function(name) {
                    callback(name, _instances[name]);
                });
            }
        }
    }
}

/**
 *
 * @param name
 * @returns {DependencyManager}
 */
module.exports = function(name) {
    return new DependencyManager(name);
};