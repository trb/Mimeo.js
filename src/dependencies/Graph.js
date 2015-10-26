var Node = function(value) {
    if (!(value instanceof String || typeof value === 'string')) {
        throw new Error('Only strings are accepted as node values');
    }

    this._id = Math.random().toString(36);
    this.value = value;
};


var Edge = function(nodeFrom, nodeTo) {
    this._id = Math.random().toString(36);
    this._from = nodeFrom;
    this._to = nodeTo;
};

var makeNodeIdentifier = function(node1, node2) {
    return node1._id + ':' + node2._id;
};

Edge.prototype.getNodeIdentifier = function() {
    return makeNodeIdentifier(this._from, this._to);
};

/**
 * Directed graph to order nodes by dependencies. Only handles values whose
 * .toString() function returns unique values. Favors pre-computed lookup
 * tables over lookups at sort time. Most machines have lots of ram and
 * especially on mobile the CPU is more restricted. Using more ram and less
 * CPU cycles is preferable in those conditions, although it should hardly
 * matter since most dependency graphs (which this implementation is focused
 * on) shouldn't exceed a few hundred nodes.
 *
 * @returns {{add: Function, addEdge: Function, hasNodeValue: Function,
 *     getNodesTopological: Function}}
 * @constructor
 */
var Graph = function() {
    var _nodes = [];
    var _nodesById = {};
    var _nodesByValue = {};
    var _zeroIngreeNodes = [];
    var _edges = [];
    var _edgesByNodes = {};
    var _edgesByTo = {};
    var _edgesByFrom = {};

    /*
     * The current topological sort implementation mutates the graph, after
     * which it's unusable. This function allows to clean the entire graph
     * up, removing any dangling data that might be left after the sort.
     */
    var reset = function() {
        _nodes = [];
        _nodesById = {};
        _nodesByValue = {};
        _zeroIngreeNodes = [];
        _edges = [];
        _edgesByNodes = {};
        _edgesByTo = {};
        _edgesByFrom = {};
    };

    var addNode = function(node) {
        if (_nodesByValue[node.value]) {
            throw new Error('Duplicate values not allowed. Node with value "' + node.value + '" already exists');
        }

        _nodes.push(node);
        _nodesById[node._id] = node;
        _nodesByValue[node.value] = node;

        _zeroIngreeNodes.push(node);
    };

    var addEdge = function(edge) {
        if (_edgesByNodes[edge.getNodeIdentifier()]) {
            return;
        }

        _edges.push(edge);
        _edgesByNodes[edge.getNodeIdentifier()] = edge;

        if (!_edgesByFrom[edge._from._id]) {
            _edgesByFrom[edge._from._id] = [];
        }
        _edgesByFrom[edge._from._id].push(edge);

        if (!_edgesByTo[edge._to._id]) {
            _edgesByTo[edge._to._id] = [];
        }
        _edgesByTo[edge._to._id].push(edge);

        _zeroIngreeNodes = _zeroIngreeNodes.filter(function(existingNode) {
            return existingNode._id != edge._to._id;
        });
    };
    var removeEdge = function(edgeToRemove) {
        _edges = _edges.filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });

        delete _edgesByNodes[edgeToRemove.getNodeIdentifier()];

        _edgesByFrom[edgeToRemove._from._id] = _edgesByFrom[edgeToRemove._from._id].filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });

        _edgesByTo[edgeToRemove._to._id] = _edgesByTo[edgeToRemove._to._id].filter(function(edge) {
            return edge._id != edgeToRemove._id;
        });
    };

    var getNodeByValue = function(value) {
        return _nodesByValue[value];
    };

    return {
        add: function(value) {
            addNode(new Node(value));
        },
        addEdge: function(fromValue, toValue) {
            var fromNode = getNodeByValue(fromValue);
            var toNode = getNodeByValue(toValue);

            if (!fromNode && !toNode) {
                throw 'Neither from- nor to-node exist: ' + fromValue + ', ' + toValue;
            }

            if (!fromNode) {
                throw 'From-node doesn\'t exist: ' + fromValue;
            }

            if (!toNode) {
                throw 'To-node doesn\'t exist: ' + toValue;
            }

            addEdge(new Edge(fromNode, toNode));
        },
        hasNodeValue: function(value) {
            return Boolean(getNodeByValue(value));
        },
        getNodesTopological: function() {
            var sortedNodes = [];

            while (_zeroIngreeNodes.length > 0) {
                var currentNode = _zeroIngreeNodes.pop();
                sortedNodes.push(currentNode);
                (_edgesByFrom[currentNode._id] || []).slice(0).forEach(function(edge) {
                    removeEdge(edge);
                    if (!_edgesByTo[edge._to._id] || _edgesByTo[edge._to._id].length < 1) {
                        _zeroIngreeNodes.push(edge._to);
                    }
                });
            }

            if (_edges.length > 0) {
                var remainingEdges = _edges.map(function(edge) {
                    return '(' + edge._from.value + ',' + edge._to.value + ')';
                });

                reset();

                throw new Error('Cycle detected, remaining edges: ' + remainingEdges);
            }

            reset();

            return sortedNodes.map(function(node) {
                return node.value;
            });
        }
    };
};

module.exports = Graph;