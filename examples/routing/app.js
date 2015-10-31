function Todos() {
    return [
        {
            'name': 'Call parents'
        },
        {
            'name': 'Wash dishes'
        },
        {
            'name': 'Write essay'
        }
    ]
}


function TodoList($context, todos) {
    return function() {
        return '<h1>HAI ' + ($context()['lolbert'] || 'Guy') + '</h1>' +
            '<ul class="todo-list">'
            + todos.map(function(todo) {
                return '<li>' + todo.name + '</li>';
            }).join('')
            + '</ul>';
    }
}

TodoList.$inject = ['$context', 'Todos'];

function CreateTodo() {
    return form = {
        state: {'a': 'b'},
        render: function() {
            return '<form action="#" id="create_todo">' +
                '<textarea name="todo" id="todo"></textarea>' +
                '<button class="btn btn-primary">Create todo entry</button>' +
                '</form>';
        }
    }
}

function App($routing, TodoList, CreateTodo) {
    return function() {
        $routing.set('/todos', 'app', TodoList);
        $routing.set('/todo-create', 'app', CreateTodo);
        $routing.default('/todos');
    };
}

App.$inject = ['$routing', 'TodoList', 'CreateTodo'];

function Window() {
    return window;
}

var context = {};
function Context() {
    return function() {
        return context;
    }
}

function Routing($window) {
    var routes = {};
    var defaultRoute;

    function preventDefault(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            /*
             * Internet explorer support
             */
            event.returnValue = false;
        }
    }

    function getAttribute(element, attribute) {
        if (element[attribute]) {
            return element[attribute];
        }

        if (element.getAttribute) {
            return element.getAttribute(attribute);
        }

        var value = null;
        for (var i = 0; i < element.attributes.length; ++i) {
            if (element.attributes[i].nodeName === attribute) {
                value = element.attributes[i].nodeValue;
            }
        }

        return value;
    }

    function doDefaultRoute() {
        if (defaultRoute) {
            $window.history.pushState(null, '', defaultRoute);
            doRoutingSkipDefault();
        }
    }

    function doRoutingSkipDefault() {
        doRouting(false);
    }

    function doRouting(doDefault) {
        var route = routes[$window.document.location.pathname];
        if (route) {
            context = {};
            /*
             * @todo find something to do proper query parsing with decoding stuff
             * etc. or at least make this more thorough
             */
            $window.document.location.search.substr(1).split('&').map(function(parameter) {
                return parameter.split('=');
            }).forEach(function(pair) {
                context[pair[0]] = pair[1];
            });

            if (route.renderer.render) {
                route.view.innerHTML = route.renderer.render();
            } else {
                route.view.innerHTML = route.renderer();
            }
        } else if (doDefault !== false) {
            doDefaultRoute();
        }
    }

    $window.onpopstate = function() {
        doRouting();
    };

    $window.onclick = function(event) {
        var target = event.target || event.srcElement;

        /*
         * Related to Safari firing events on text nodes
         */
        if (target.nodeType === 3) {
            target = target.parentNode;
        }

        if (getAttribute(target, 'data-internal') !== null) {
            if (getAttribute(target, 'data-no-history') !== null) {
                $window.history.replaceState(null,
                    '',
                    getAttribute(target, 'href'));
            } else {
                $window.history.pushState(null,
                    '',
                    getAttribute(target, 'href'));
            }

            preventDefault(event);
            doRouting();
        }
    };

    $window.onload = function() {
        doRouting();
    };

    return {
        'default': function(newDefaultRoute) {
            defaultRoute = newDefaultRoute;
        },
        'set': function(route, target, injectable) {
            routes[route] = {
                view: window.document.getElementById(target),
                renderer: injectable
            };
        }
    }
}

Routing.$inject = ['$window'];

mimeo.module('app', [])
    .factory('$context', Context)
    .factory('$routing', Routing)
    .factory('Todos', Todos)
    .factory('$window', Window)
    .component('TodoList', TodoList)
    .component('CreateTodo', CreateTodo)
    .component('app', App)
;