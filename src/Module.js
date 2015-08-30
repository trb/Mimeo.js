var injectables = require('./dependencies/Injectables.js');

function Module(name, dependencies) {
    var module = this;

    this.$name = name;
    this.$inject = dependencies;

    function addInjectable(name, parameters) {
        if (injectables.has(name)) {
            throw 'Injectable "' + name + '" already exists';
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

        injectables.add(injectable);

        return module;
    }

    this.service = addInjectable;
    this.factory = addInjectable;
    this.directive = addInjectable;
    this.value = function(name, value) {
        return addInjectable(name, function() {
            return value;
        });
    }
}

module.exports = Module;