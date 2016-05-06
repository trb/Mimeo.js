var mimeo = require('../src/Mimeo.js');
var expect = require('chai').expect;

describe('Mimeo', function() {
    before(function() {
        mimeo.module('app', ['user'])
            .component('main', [
                'currentUser', function(currentUser) {
                    return function() {
                        return currentUser.id + '-' + currentUser.name + '-' + currentUser.permissions.isAdmin;
                    }
                }
            ]);

        mimeo.module('user', [])
            .factory('currentUser', [
                'permissions', function(permissions) {
                    return {
                        'id': 1,
                        'name': 'test',
                        'permissions': permissions(1)
                    };
                }
            ])
            .factory('permissions', [
                function() {
                    return function(userId) {
                        // pretend that there's a GET request for permissions
                        // here
                        return {
                            'isAdmin': 'no'
                        }
                    }
                }
            ])
        ;
    });

    it('should notify of missing injectable when bootstrapping', function() {
        expect(function() { mimeo.bootstrap('does-not-exist'); }).to.throw('to bootstrap not found');
    });

    it('basic instantiation should render to string ', function() {
        expect(mimeo.bootstrap('main')).to.equal('1-test-no');
    });

    it('modules should create new module when called with dependencies',
        function() {
            mimeo.module('new-module', []);
        }
    );

    it('should pass through bootstrap arguments', function() {
        var passthrough = 'test-string';

        mimeo.module('passthroughModule', []).component('passthroughComponent', function() {
            return function(testString) {
                expect(testString).to.equal(passthrough);
            }
        });

        mimeo.bootstrap('passthroughComponent', passthrough);
    });

    it('should return existing module when called without dependencies',
        function() {
            mimeo.module('test-cache', []);
            var module = mimeo.module('test-cache');
            expect(mimeo.module('test-cache')).to.not.be.empty;
            expect(mimeo.module('test-cache')).to.equal(module);
        }
    );

    /*
     * Due to mimeo.js global nature, all following tests have to remain the order
     * they're currently written in.
     */
    it('should require all module dependencies to be resolved', function() {
        mimeo.module('user').value('userName', 'Rudy');
        expect(function() { mimeo.bootstrap('userName'); }).to.throw('is not executable');
    });

    it('should not continue with missing dependencies', function() {
        mimeo.module('test', []).factory('missingDependencies', ['does-not-exist', function() {}]);

        expect(function() { mimeo.bootstrap('test'); }).to.throw('Injectables don\'t exist');
    });

    it('should require an injectables name to bootstrap into a string', function() {
        expect(function() { mimeo.bootstrap(); }).to.throw('Define an injectable');
    });

    it('should require all module dependencies to be resolved', function() {
        mimeo.module('missingDependencyTest', ['missing']);
        expect(function() { mimeo.bootstrap('test'); }).to.throw('Modules don\'t exist');
    });
});