function Module(name, dependencies) {
    this.$name = name;
    this.$inject = dependencies;

    function Service(name, dependencies, constructor) {
        this.$name = name;
        this.$inject = dependencies;
        this.$constructor = constructor;
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

module.exports = Module;