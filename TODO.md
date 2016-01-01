#List of things to do next:

## Server side example:
- switch to routes to actually display output
- use routes on cli to render html
- make express route 404s to '/', so e.g. '/send-message' can be handled by
  the application
- create README.md to explain what example is for
- Focus this example solely on server-side/browser shared code
- Test with mocha

## Todo example
- Merge into routing example

## Routing example
- Rename to "Todo"
- Use to showcase in-browser app
- Set up package.json and express to actually provide some routes to call
- Use kefir.js/rx.js and React for data/rendering
- Set up decent directory structure
- Make this an example for file structures, compontents, etc.
- Test with nightmare.js

## Mimeo
- '$context' needs to go away and be injected into the injectable that handles
  a route. There can be multiple handlers for each route (e.g. menu, greeting and
  main content), and the routing library creates a $context for each handlers, so
  having a global $context doesn't make any sense)
- Write tests for new module ($http, $window, etc)
- Write tests for non-covered code (use istanbul to find that)
- Fix promise.then(), chained then's should received previous resolved value
- Remove babel presets once mimeo is installable via npm