function Module(injectables, name, dependencies) {
    var module = this;

    var toRun = [];

    this.$name = name;
    this.$inject = dependencies;

    function prepareInjectable(name, parameters) {
        if (injectables.has(name)) {
            throw new Error('Injectable "' + name + '" already exists');
        }

        var injectable;

        if (parameters instanceof Function) {
            injectable = parameters;
            if (!injectable.$inject) {
                injectable.$inject = [];
            }
        } else {
            var dependencies = parameters.slice(0, -1);
            injectable = parameters.slice(-1)[0];
            injectable.$inject = dependencies;
        }

        injectable.$name = name;

        return injectable;
    }

    function addInjectable(name, parameters) {
        injectables.add(prepareInjectable(name, parameters));

        return module;
    }

    function executeRun() {
        toRun.forEach(function(injectableToRun) {
            injectables.get(injectableToRun)();
        });
    }

    this.executeRun = function executeRun() {
        toRun.forEach(function(injectableName) {
            injectables.get(injectableName)();
        });
    };

    this.run = function(name, parameters) {
        toRun.push(name);
        addInjectable(name, parameters);
    };

    this.factory = addInjectable;
    this.component = addInjectable;
    this.value = function(name, value) {
        return addInjectable(name, function() {
            return value;
        });
    }
}

module.exports = Module;