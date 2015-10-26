var Injectables = require('../src/dependencies/Injectables.js');
var expect = require('chai').expect;

describe('Injectables', function() {
    var injectables;

    beforeEach(function() {
        injectables = Injectables();
    });

    it('should add and get values, check for existance and verify dependencies',
        function() {
            function a() {
            }

            a.$name = 'a';
            a.$inject = [];

            injectables.add(a);
            expect(injectables.has('a')).to.be.true;
            expect(injectables.has('b')).to.be.false;

            function b() {
            }

            b.$name = 'b';
            b.$inject = ['a', 'c'];

            injectables.add(b);

            expect(injectables.hasAllDependencies()).to.be.false;

            function c() {
            }

            c.$name = 'c';
            c.$inject = [];

            injectables.add(c);

            expect(injectables.hasAllDependencies()).to.be.true;
        });

    it('should not instantiate if any dependencies are missing', function() {
        function missingDeps() {
        }

        missingDeps.$name = 'missingDeps';
        missingDeps.$inject = ['does-not-exist'];

        injectables.add(missingDeps);

        expect(function() {
            injectables.instantiate();
        }).to.throw('Injectables don\'t exist');

        expect(injectables.getMissingDependencies()).to.deep.equal(['does-not-exist']);
    });

    it('should instantiate injectables', function() {
        function dependency() {
            return function() {
                return 'passthrough';
            };
        }

        dependency.$name = 'dependency';
        dependency.$inject = [];

        function instantiateMe(dependency) {
            return function() {
                return dependency();
            };
        }

        instantiateMe.$name = 'instantiateMe';
        instantiateMe.$inject = ['dependency'];

        injectables.add(dependency);
        injectables.add(instantiateMe);

        injectables.instantiate();

        expect(injectables.get('instantiateMe')()).to.equal('passthrough');
    });
});