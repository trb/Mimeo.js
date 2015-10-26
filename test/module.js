var Module = require('../src/Module.js');
var expect = require('chai').expect;

describe('Module', function() {
    var module;
    var injectables;

    beforeEach(function() {
        injectables = {
            has: function() {
                return false;
            }
        };
        module = new Module(injectables, 'test', []);
    });

    it('should not accept injectables with the same name', function() {
        injectables.has = function() {
            return true;
        }

        expect(function() {
            module.factory('test');
        }).to.throw('already exists');
    });

    it('should accept a function as an injectable', function() {
        function factory() {
        }

        injectables.add = function(injectable) {
            expect(injectable.$inject).to.deep.equal([]);
            expect(injectable.$name).to.equal('factory');
            expect(injectable).to.equal(factory);
        };

        module.factory('factory', factory);
    });

    it('should accept dependencies from an injectables $inject attribute',
        function() {
            function factory() {
            }

            factory.$inject = ['a'];

            injectables.add = function(injectable) {
                expect(injectable.$inject).to.deep.equal(['a']);
                expect(injectable.$name).to.equal('factory');
                expect(injectable).to.equal(factory);
            };

            module.factory('factory', factory);
        });

    it('should accept an array for dependencies and injectable', function() {
        function factory() {
        }

        injectables.add = function(injectable) {
            expect(injectable.$inject).to.deep.equal(['a']);
            expect(injectable.$name).to.equal('factory');
            expect(injectable).to.equal(factory);
        };

        module.factory('factory', ['a', factory]);
    });

    it('should expose factory, component and value', function() {
        function sameForAllTypes() {}

        injectables.add = function(injectable) {
            expect(injectable).to.be.a('function');
        };

        module.factory('factory', sameForAllTypes);
        module.component('factory', sameForAllTypes);
        module.value('factory', sameForAllTypes);
    });

    it('should pass through values for .value injectables', function() {
        var string = 'test';

        injectables.add = function(injectable) {
            expect(injectable()).to.equal('test');
        };

        module.value('value', string);
    })
});