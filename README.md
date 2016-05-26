Mimeo.js
========

Almost like Angular:

```javascript
mimeo.module('example', [])
    .value('name', 'Anonymous User')
    .factory('Greeting', ['name', (name) => () => 'Welcome ' + name])
    .component('greetUser', ['Greeting', (greeting) => (element) => {
        element.innerText = greeting();
    }]);

mimeo.bootstrap('greetUser', document.getElementById('greeting'));
```

Mimeo implements a subset of the Angular Api and built-in services.
Like a [mimeo](https://en.wikipedia.org/wiki/Mimeograph) of Angular. Gives you
the dependency-injection goodness without `$scope` and directives. Check out [the docs](http://trb.github.io/Mimeo.js), in particular [for mimeo and the modules](http://trb.github.io/Mimeo.js/modules/Mimeo.html) and [for the three built-ins, $q, $http and $routing](http://trb.github.io/Mimeo.js/modules/Builtins.html).

The goal is a dependency injection framework for pretty much any rendering
library. Mimeo does not include any rendering abilities, that's left up to the
user (use e.g. [React](https://facebook.github.io/react/) or [Riot](http://riotjs.com/)
or just a [simple templating language](https://github.com/janl/mustache.js)).

Take a look at `examples/hello_world/hello.html` for a very minimal example use
Mimeo, or `examples/messaging` for a complete app that makes use of Mimeos
ability to run on NodeJS as well as in the browser.

Workflow
-------

In Mimeo, just like in Angular, you create modules which can create various
*injectables* like `.factory()`, `.value()` or `.component()`:

```javascript
mimeo.module('example', [])
    .value('exampleComponent', () => (element) => element.innerText = 'Example';
```

You then bootstrap a root injectable into a DOM element:

`mimeo.bootstrap('exampleComponent', document.getElementById('example'))`

`.component()` signifies that the injectable is meant to render something. Aside
from that, `.component()` and `.factory()` are identical.

Why Mimeo exists
--------------

Dependency Injection is awesome and makes unit-testing so much easier. Also,
immutability and idempotence are awesome. Sadly, there seems to be a lack of
projects mixing the two, e.g. React doesn't offer anything like dependency
injection. Mimeo aims to provide a dependency injection API similar to Angulars and
work well with other libraries for managing state, data access and views.

Angular is too big
----------------

When you use Angular to wrap another view library and follow [modern styleguides](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#services),
you're going to end up not using much of Angulars functionality. This means your
Javascript files will be large and most of that space is wasted on feature
you don't end up using.

Angular has a huge API as well, which can make learning Angular quite a
challenge. And since Angular is not very opinionated, having to make many
choices right at the start can feel overwhelming:

* Scope vs. Bind-to-controller
* Services vs. Factories
* Values vs. Constants
* ng-route vs. ui-router
* ng-controller vs. controllerAs

And there's many more, e.g. the precise scope-binding of attributes on a
directive (&, = or @). Popular styleguides frequently discourage use of
`.service()` and have a host of recommendations to make Angular simpler and
easier to understand.

Mimeo provides a more focused API and is opinionated on how it should be used.

Differences to Angular
------------------

The only injectables Mimeo offers are `.factory()`, `.component()`, and
`.value()`. `.run()` executes when the module is instantiated, and is meant for
setup/configuration/initialization of your app.

`.component()` is the same as `.factory()`, and not related to `.directive()`.
It should signify that the injectable will generate some sort of output.

The only built-in services available are `$http` and `$q`. `$routing` is
Mimeo-specific and not related to any Angular router.
