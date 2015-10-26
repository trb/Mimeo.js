var Graph = require('../src/dependencies/Graph.js');
var expect = require('chai').expect;

describe('Graph', function() {
    it('should add a node and find it by value', function() {
        var g = new Graph();

        g.add('a');

        expect(g.hasNodeValue('a')).to.equal(true);
    });

    it('should add two nodes and an edge without throwing an exception', function() {
        var g = new Graph();

        g.add('a');
        g.add('b');

        g.addEdge('b', 'a');
    });

    it('should not accept two nodes with the same value', function() {
        var g = new Graph();

        g.add('a');

        expect(function() {g.add('a');}).to.throw('Duplicate values not allowed');
    });

    it('should add nodes and edges and return topological order', function() {
        var g = new Graph();

        g.add('a');
        g.add('b');
        g.add('c');
        g.addEdge('a', 'b');
        g.addEdge('b', 'c');
        g.addEdge('a', 'c');

        expect(g.getNodesTopological()).to.deep.equal(['a', 'b', 'c']);
    });

    it('should only accept strings as node values', function() {
        var g = new Graph();

        expect(function() {g.add(1); }).to.throw('Only strings are accepted as node values');
        expect(function() {g.add({}); }).to.throw('Only strings are accepted as node values');
        expect(function() {g.add(function() {}); }).to.throw('Only strings are accepted as node values');

        g.add('a');
        g.add(String('b'));
    });

    it('should not create an edge if to- or from-nodes (or both) are missing', function() {
        var g = new Graph();

        expect(function() {g.addEdge('a', 'b'); }).to.throw('Neither from- nor to-node exist');

        g.add('a');

        expect(function() {g.addEdge('b', 'a')}).to.throw('From-node doesn\'t exist');
        expect(function() {g.addEdge('a', 'b')}).to.throw('To-node doesn\'t exist');
    });

    it('should detect cyclical dependencies', function() {
        var g = new Graph();

        g.add('a');
        g.add('b');
        g.add('c');

        g.addEdge('a', 'b');
        g.addEdge('b', 'c');
        g.addEdge('c', 'a');

        expect(function() {g.getNodesTopological();}).to.throw('Cycle detected');
    });

    it('should allow adding existing edges', function() {
        var g = new Graph();

        g.add('a');
        g.add('b');

        g.addEdge('a', 'b');
        g.addEdge('a', 'b');
    });
});