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

    it('should add nodes and edges and return topological order', function() {
        var g = new Graph();

        g.add('a');
        g.add('b');
        g.add('c');
        g.addEdge('a', 'b');
        g.addEdge('b', 'c');
        g.addEdge('a', 'c');

        expect(g.getNodesTopological().map(function(node) { return node.value; })).to.deep.equal(['a', 'b', 'c']);
    });
});