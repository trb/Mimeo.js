var Modules = require('../src/dependencies/Modules.js');
var expect = require('chai').expect;

describe('Modules', function() {
    var modules;

    beforeEach(function() {
        modules = Modules();
    });

    it('should return a module after adding it', function() {
        function m() {
        }

        m.$name = 'm';
        m.$inject = [];

        expect(modules.add(m)).to.equal(m);
    });

    it('should retrieve a module by name', function() {
        function m() {
        }

        m.$name = 'm';
        m.$inject = [];

        modules.add(m);

        expect(modules.get('m')).to.equal(m);
    });

    it('should not instantiate when dependencies are missing', function() {
        function m() {
        }

        m.$name = 'm';
        m.$inject = ['does-not-exist'];

        modules.add(m);

        expect(function() {
            modules.instantiate()
        }).to.throw('Modules don\'t exist');
    });

    it('should instantiate when all dependencies are met', function() {
        function m() {
        }

        m.$name = 'm';
        m.$inject = [];

        modules.add(m);

        modules.instantiate();
    });
});