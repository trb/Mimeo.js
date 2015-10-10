var mimeo = require('../src/Mimeo.js');
var expect = require('chai').expect;

mimeo.module('app', ['user'])
    .component('main', ['currentUser', function(currentUser) {
        return function() {
            return currentUser.id + '-' + currentUser.name + '-' + currentUser.permissions.isAdmin;
        }
    }]);

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
    .factory('permissions', [function() {
        return function(userId) {
            // pretend that there's a GET request for permissions here
            return {
                'isAdmin': 'no'
            }
        }
    }])
;

describe('Mimeo basic instantiation', function() {
    it('should render to string', function() {
        expect(mimeo.bootstrapToString('main')).to.equal('1-test-no');
    });
});

describe('Mimeo modules', function() {
    it('should create new module when called with dependencies', function() {
        mimeo.module('test-cache', []);
    });

    it('should return existing module when called without dependencies', function() {
        var module = mimeo.module('test-cache');
        expect(mimeo.module('test-cache')).to.not.be.empty;
        expect(mimeo.module('test-cache')).to.equal(module);
    });
});