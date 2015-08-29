var DependencyResolver = require('./DependencyResolver.js');

var Meatball = function() {
    var _modules = {};
    var _moduleDependencies = new DependencyResolver();

    var _injectables = {};
    var _injectablesInstances = {};
    var _injectablesDependencies = new DependencyResolver();

    function Module(name, dependencies) {
        this.name = name;
        this.dependencies = dependencies;

        function Service(name, dependencies, definition) {
            this.name = name;
            this.dependencies = dependencies;
            this.definition = definition;
        }

        var createService = function(serviceName, parameters) {
            if (_injectables[serviceName]) {
                throw 'Injectable "' + serviceName + '" already exists';
            }

            var dependencies = parameters.slice(0, -1);
            var definition = parameters.slice(-1)[0];

            _injectables[serviceName] = new Service(serviceName,
                dependencies,
                definition
            );

            _injectablesDependencies.register(serviceName);
            dependencies.forEach(function(dependency) {
                _injectablesDependencies.addDependency(serviceName, dependency);
            });

            return this;
        }.bind(this);

        this.service = createService;
    }

    function createModule(moduleName, dependencies) {
        if (_modules[moduleName]) {
            throw 'Module "' + moduleName + '" already exists';
        }

        _modules[moduleName] = new Module(moduleName, dependencies);

        _moduleDependencies.register(moduleName);

        dependencies.forEach(function(dependency) {
            _moduleDependencies.addDependency(moduleName, dependency);
        });

        return _modules[moduleName];
    }

    function instantiateModules() {
        var moduleNames = _moduleDependencies.getResolutionOrder();

        var nonExistingModules = moduleNames.filter(function(moduleName) {
            return !Boolean(_modules[moduleName]);
        });

        if (nonExistingModules.length > 0) {
            throw 'Modules don\'t exist: ' + nonExistingModules;
        }
    }

    function instantiateInjectables() {
        var injectablesNames = _injectablesDependencies.getResolutionOrder();

        console.log('resolution order', injectablesNames);

        var nonExistingInjectables = injectablesNames.filter(function(injectableName) {
            return !Boolean(_injectables[injectableName]);
        });

        if (nonExistingInjectables.length > 0) {
            throw 'Injectables don\'t exist: ' + nonExistingInjectables;
        }

        injectablesNames.forEach(function(injectableName) {
            var dependencies = _injectables[injectableName].dependencies.map(function(dependency) {
                return _injectablesInstances[dependency];
            });

            _injectablesInstances[injectableName] = _injectables[injectableName].definition.apply(global, dependencies);
        });
    }

    function bootstrapToString() {
        instantiateModules();
        instantiateInjectables();
    }

    return {
        module: createModule,
        bootstrapToString: bootstrapToString
    }
};

module.exports = Meatball();