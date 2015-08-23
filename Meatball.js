;(function(global) {
    var Node = function(value) {
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
     * Directed graph to order nodes by dependencies. Favors precomputating lookup
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
    global.Graph = function() {
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
                throw 'Duplicate values not allowed. Node with value "' + node.value + '" already exists';
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
            if (_edgesByFrom[edgeToRemove._from._id]) {
                _edgesByFrom[edgeToRemove._from._id] = _edgesByFrom[edgeToRemove._from._id].filter(function(edge) {
                    return edge._id != edgeToRemove._id;
                });
            }
            if (_edgesByTo[edgeToRemove._to._id]) {
                _edgesByTo[edgeToRemove._to._id] = _edgesByTo[edgeToRemove._to._id].filter(function(edge) {
                    return edge._id != edgeToRemove._id;
                });
            }
        };

        var getNodeByValue = function(value) {
            return _nodesByValue[value];
        };

        return {
            add: function(value) {
                addNode(new Node(value));
            },
            addEdge: function(fromValue, toValue) {
                addEdge(new Edge(getNodeByValue(fromValue),
                    getNodeByValue(toValue)));
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
                    reset();

                    throw 'Cycle detected, remaining edges: ' + _edges.map(function(edge) {
                        return '(' + edge._from.value + ',' + edge._to.value + ')';
                    });
                }

                reset();

                return sortedNodes;
            }
        };
    };
})(this);

;(function(global) {
    /**
     * Allows to register module, dependencies and get the order in which
     * modules need to be instantiated to fulfill all dependencies. It purely
     * resolves dependencies, module instances need to be handled separately.
     *
     * @returns {{register: register, addDependency: addDependency,
     *     getResolutionOrder: getResolutionOrder}}
     * @constructor
     */
    var DependencyResolver = function() {
        var graph = new global.Graph();

        function register(module) {
            if (!graph.hasNodeValue(module)) {
                graph.add(module);
            }
        }

        function addDependency(module, dependency) {
            // Optimistically add a module if the dependency module doesn't
            // exist yet. It's possible to create dependencies on non-existing
            // modules, the user of the class has to handle that case.
            if (!graph.hasNodeValue(dependency)) {
                graph.add(dependency);
            }

            graph.addEdge(module, dependency);
        }

        function getResolutionOrder() {
            return graph.getNodesTopological().map(function(node) {
                return node.value;
            });
        }

        return {
            register: register,
            addDependency: addDependency,
            getResolutionOrder: getResolutionOrder
        };
    };

    global.DependencyResolver = DependencyResolver;
})(this);

;(function(global) {
    var Meatball = function() {
        var modules = {};
        var moduleDependencies = new global.DependencyResolver();

        var injectables = {};
        var injectablesDependencies = new global.DependencyResolver();

        function Module(name, dependencies) {
            this.name = name;
            this.dependencies = dependencies;

            function Service(name, dependencies, definition) {
                this.name = name;
                this.dependencies = dependencies;
                this.definition = definition;
            }

            var createService = function(serviceName, parameters) {
                if (injectables[serviceName]) {
                    throw 'Injectable "' + serviceName + '" already exists';
                }

                var dependencies = parameters.slice(0, -1);
                var definition = parameters.slice(-1);

                injectables[serviceName] = new Service(serviceName,
                    dependencies,
                    definition
                );

                injectablesDependencies.register(serviceName);
                dependencies.each(function(dependency) {
                    injectablesDependencies.addDependency(serviceName, dependency);
                });

                return this;
            }.bind(this);

            this.service = createService;
        }

        function createModule(moduleName, dependencies) {
            if (modules[moduleName]) {
                throw 'Module "' + moduleName + '" already exists';
            }

            modules[moduleName] = new Module(moduleName, dependencies);

            moduleDependencies.register(moduleName);

            dependencies.each(function(dependency) {
                moduleDependencies.addDependency(dependency);
            });

            return modules[moduleName];
        }

        return {
            module: createModule
        }
    };

    global.Meatball = Meatball();
})(this);

global.Meatball.module('test', ['testDep'])
    .service('test-service-one', ['test-service-2', function(t) {
        return {
            lol: 'rofl'
        };
    }]);

global.Meatball.module('testDep', [])
    .service('test-service-2', [function() { console.log('nothing')}]);