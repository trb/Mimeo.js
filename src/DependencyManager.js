var DependencyResolver = require('./DependencyResolver.js');

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
    var _dependencies = DependencyResolver();

    var _getMissingDependenciesCache = undefined;

    function register(entity) {
        if (!entity.$name || !entity.$inject) {
            throw 'Entity "' + entity + '" is missing $name or $inject';
        }

        _getMissingDependenciesCache = undefined;

        _providers[entity.$name] = entity;
        _dependencies.register(entity.$name);
        entity.$inject.forEach(function(dependency) {
            _dependencies.addDependency(entity.$name, dependency);
        });
    }

    function getMissingDependencies() {
        if (_getMissingDependenciesCache) {
            return _getMissingDependenciesCache;
        }

        var providersInjects = _providers.map(function(provider) {
            return provider.$inject;
        });

        _getMissingDependenciesCache = [].concat.apply(providersInjects).filter(function(providerName) {
            return !Boolean(_providers[providerName]);
        });

        return _getMissingDependenciesCache;
    }

    function hasAllDependencies() {
        return getMissingDependencies().length > 0;
    }

    function instantiate() {
        _dependencies.getResolutionOrder().forEach(function(providerName) {
            var provider = _providers[providerName];

            _instances[providerName] = provider.$constructor.apply(provider.$constructor, provider.$inject.map(function(dependencyName) {
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
        getInstance: getInstance
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