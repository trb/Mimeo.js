var expect = require('chai').expect;
var makeDependencyManager = require('../src/dependencies/DependencyManager');

describe('DependencyManager', function() {
    it('should return an instance and set the name', function() {
        var dm = makeDependencyManager('test');

        expect(dm.$name).to.equal('test');
    });

    it('should register a dependency and return a provider', function() {
        var dm = makeDependencyManager('test');

        var provider = function() {};
        provider.$name = 'provider';
        provider.$inject = [];

        dm.register(provider);

        expect(dm.getProvider('provider')).to.equal(provider);
    });

    it('should check dependencies and instantiate', function() {
        var dm = makeDependencyManager('test');
        var a = function() { return 'a'; };
        var b = function() { return 'b'; };
        a.$name = 'a';
        b.$name = 'b';
        a.$inject = [];
        b.$inject = ['a'];

        dm.register(a);
        dm.register(b);

        expect(dm.hasAllDependencies()).to.be.true;

        dm.instantiate();

        expect(dm.getInstance('a')).to.equal('a');
        expect(dm.getInstance('b')).to.equal('b');
    });

    it('should detect missing dependencies', function() {
        var dm = makeDependencyManager('test');

        var a = function() {};
        a.$name = 'a';
        a.$inject = ['b']; //missing

        dm.register(a);

        expect(dm.hasAllDependencies()).to.be.false;
        expect(dm.getMissingDependencies()).to.deep.equal(['b']);
    });

    it('should not accept an empty entity', function() {
        var dm = makeDependencyManager('test');

        expect(dm.register).to.throw(Error, 'No entity to register was given');
    });

    it('should not accept an entity without a name', function() {
        var dm = makeDependencyManager('test');

        var a = function() {};
        a.$inject = [];

        expect(dm.register.bind(dm, a)).to.throw(Error,
            'missing property $name');
    });

    it('should not accept an entity without injection parameters', function() {
        var dm = makeDependencyManager('test');

        var a = function() {};
        a.$name = 'test';

        expect(dm.register.bind(dm, a)).to.throw(Error,
            'missing property $inject');
    });

    it('should not accept entities with the same name', function() {
        var dm = makeDependencyManager('test');

        function a() {}

        function aDuplicate() {}

        a.$name = 'a';
        a.$inject = [];

        aDuplicate.$name = 'a';
        aDuplicate.$inject = [];

        dm.register(a);

        expect(function() { dm.register(aDuplicate); }).to.throw(
            'already exists');
    });

    it('should provide access to all providers and instances', function() {
        var dm = makeDependencyManager('test');

        function a() { return 'a-instance'; }

        function b() { return 'b-instance'; }

        a.$name = 'a';
        a.$inject = [];

        b.$name = 'b';
        b.$inject = [];

        dm.register(a);
        dm.register(b);

        dm.instantiate();

        var providers = {};
        var instances = {};

        dm.all.providers(function(name, provider) {
            providers[name] = provider;
        });
        dm.all.instances(function(name, instance) {
            instances[name] = instance;
        });

        expect(providers['a']).to.equal(a);
        expect(providers['b']).to.equal(b);

        expect(instances['a']).to.equal('a-instance');
        expect(instances['b']).to.equal('b-instance');

        expect(Object.keys(providers).sort()).to.deep.equal(['a', 'b']);
        expect(Object.keys(instances).sort()).to.deep.equal(['a', 'b']);
    });
});