var mimeo = require('../src/Mimeo.js');

mimeo.module('test', ['testDep'])
    .service('test-service-one', ['test-service-2', function(t) {
        console.log(arguments);
    }]);

mimeo.module('testDep', [])
    .service('test-service-2', [function() {
        console.log('nothing');
        return {'my': 'balls'};
    }]);

mimeo.bootstrapToString();