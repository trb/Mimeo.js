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

    this.executeRun = function executeRun() {
        toRun.forEach(function(injectableName) {
            injectables.get(injectableName)();
        });
    };

    /*
     * I don't like the wrapper and auto-generated name, but for now I can't
     * come up with a better solution. The problem is that the run-function
     * needs to work with the injection system (since it can have other
     * injectables injected), and the whole system isn't designed to deal with
     * unnamed things.
     *
     * In fact, I feel that an injection system that can handle unnamed items
     * would be wrong. How would you identify what to inject? Having names for
     * injectables (or at least IDs) is a core aspect of an injection system.
     *
     * So this would have to live outside of it. But that means having it's own
     * "make sure all this injectables" exist system. Then we could just get the
     * named injectables the run-function needs and call the run-function with
      * those.
      *
      * I can't think of a good way to de-duplicated that dependency resolution
      * system though, so there'd be one for all named injectables and one for
      * the run-functions.
      *
      * I don't plan on having other unnamed injectables, so I feel that effort
      * would be wasted. Hence the "hack" here with an auto-generated name and
      * a wrapper that executes the run-function with pass-through arguments.
     */
    this.run = function(parameters) {
        var name = module.$name + '-run.' + toRun.length;
        toRun.push(name);

        var provider = function providerRun() {
            var args = arguments;
            return function() {
                if (parameters instanceof Function) {
                    return parameters.apply(parameters, args);
                } else {
                    var lastEntry = parameters.slice(-1)[0];
                    return lastEntry.apply(lastEntry, args);
                }
            }
        };

        if (parameters instanceof Function) {
            provider.$inject = parameters.$inject;
        } else {
            provider.$inject = parameters.slice(0, -1);
        }

        addInjectable(name, provider);

        return module;
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