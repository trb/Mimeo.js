function Todos() {
    var todos = [
        {
            'name': 'Call parents'
        },
        {
            'name': 'Wash dishes'
        },
        {
            'name': 'Write essay'
        }
    ];

    return {
        todos: todos,
        create: function(todo) {
            todos.push(todo);
        }
    }
}

function TodoList($context, todos) {
    return function() {
        return '<h1>Hi ' + ($context().query.name || 'Random Internet Person') + '</h1>' +
            '<ul class="todo-list">'
            + todos.todos.map(function(todo) {
                return '<li>' + todo.name + '</li>';
            }).join('')
            + '</ul>';
    }
}

TodoList.$inject = ['$context', 'Todos'];

function CreateTodo($, $routing, todos) {
    $(document).on('submit', '#create_todo', function(event) {
        event.preventDefault();

        todos.create({
            name: $('#todo').val()
        });

        $routing.goto('/todos');
    });

    return form = {
        render: function() {
            return '<form action="#" id="create_todo">' +
                '<textarea name="todo" id="todo"></textarea>' +
                '<button class="btn btn-primary">Create todo entry</button>' +
                '</form>';
        }
    }
}

CreateTodo.$inject = ['$', '$routing', 'Todos'];

function App($routing, TodoList, CreateTodo) {
    return function() {
        $routing.set('/todos', 'app', TodoList);
        $routing.set('/todo-create', 'app', CreateTodo);
        $routing.default('/todos?name=' + encodeURIComponent('Richard & Emily'));
    };
}

App.$inject = ['$routing', 'TodoList', 'CreateTodo'];

mimeo.module('app', [])
    .value('$', jQuery)
    .factory('Todos', Todos)
    .component('TodoList', TodoList)
    .component('CreateTodo', CreateTodo)
    .component('app', App)
;