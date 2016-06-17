'use strict';

let Routing = require('../src/builtins/Routing.js').Routing;
let expect = require('chai').expect;

describe('Routing', function() {
    let $q;
    let $window;
    let router;
    let noOp = () => {};

    beforeEach(function() {
        $q = {
            when: () => $q,
            all: () => $q
        };
        $window = {
            history: {
                pushState: noOp,
                replaceState: noOp
            },
            location: {
                href: ''
            },
            onpopstate: noOp,
            onclick: noOp,
            onload: noOp,
            document: {
                getElementById: noOp
            }
        };
        router = new Routing($q, $window);
    });

    it('should require default route to be a string', function() {
        expect(() => router.setDefaultRoute()).to.throw('given as a string');
    });

    it('should require makeRenderer to be a function', function() {
        expect(() => router.setMakeRenderer()).to.throw('must be a function');
    });

    it('should require an injectable when adding a route', function() {
        expect(() => router.set('/error', 'myApp')).to.throw('injectable that is executable');
    });

    it('should warn of switched parameter order', function() {
        expect(() => router.set('/error', noOp, 'myApp')).to.throw('switched the parameters');
    });

    it('should set event listeners', function() {
        expect($window.onclick).to.not.equal(noOp);
        expect($window.onload).to.not.equal(noOp);
        expect($window.onpopstate).to.not.equal(noOp);
    });

    it('should match a given route', function() {
        let targetNode = {};

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;
        let routeExecuted = false;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onload();

        expect(routeExecuted).to.be.true;
    });

    it('should not handle a route with .onload if it was already handled', function() {
        let targetNode = {};
        let handleCount = 0;

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            ++handleCount;
        });

        router.goto('/test');
        $window.onload();

        expect(handleCount).to.equal(1);
    });

    it('should match route parameters and decode query string', function() {
        let targetNode = {};
        let $context;

        $window.location.href = '/test/example?a=b&c=1&c=2&c=3';
        $window.document.getElementById = () => targetNode;

        router.set('/test/:name', 'elementId', function($innerContext) {
            $context = $innerContext;
        });

        $window.onload();

        expect($context.query).to.deep.equal({
            a: 'b',
            c: ['1', '2', '3']
        });

        expect($context.params).to.deep.equal({
            name: 'example'
        });
    });

    it('should match a sub-path', function() {
        let targetNode = {};
        let $context;

        $window.location.href = '/test/a/b/c/d';
        $window.document.getElementById = () => targetNode;

        router.set('/test/*path', 'elementId', function($innerContext) {
            $context = $innerContext;
        });

        $window.onload();

        expect($context.params).to.deep.equal({
            path: 'a/b/c/d'
        });
    });

    it('should do nothing if the route is not matched', function() {
        let targetNode = {};

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;
        let routeExecuted = false;

        router.set('/', 'elementId', function($context, renderer) {
            routeExecuted = true;
            /*
             * Calling renderer should set element#elementId.innerHTML to whatever
             * renderer is called with. In this case it's `undefined`
             */
            renderer();
        });

        $window.onload();

        expect(routeExecuted).to.be.false;
    });

    it('should goto route', function() {
        let targetNode = {};

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;
        $window.history.pushState = function(_, __, route) {
            $window.location.href = route;
        };
        let routeExecuted = false;

        router.set('/test', 'elementId', function($context, renderer) {
            routeExecuted = true;
            /*
             * Calling renderer should set element#elementId.innerHTML to whatever
             * renderer is called with. In this case it's `undefined`
             */
            renderer();
        });

        $window.onload();

        expect(routeExecuted).to.be.false;

        router.goto('/test');

        expect($window.location.href).to.equal('/test');
        expect(routeExecuted).to.be.true;
    });

    it('should execute default route', function() {
        let targetNode = {};

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;
        let defaultRouteExecuted = false;

        router.setDefaultRoute('/test');
        router.set('/test', 'elementId', function($context, renderer) {
            defaultRouteExecuted = true;
            /*
             * Calling renderer should set element#elementId.innerHTML to whatever
             * renderer is called with. In this case it's `undefined`
             */
            renderer();
        });

        $window.onload();

        expect(defaultRouteExecuted).to.be.true;
        expect(targetNode.innerHTML).to.be.undefined;
    });

    it('should use base renderer to set target nodes innerHTML', function() {
        let targetNode = {};
        let routeContent = 'route-content';

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;
        let defaultRouteExecuted = false;

        router.setDefaultRoute('/test');
        router.set('/test', 'elementId', function($context, renderer) {
            defaultRouteExecuted = true;
            renderer(routeContent);
        });

        $window.onload();

        expect(defaultRouteExecuted).to.be.true;
        expect(targetNode.innerHTML).to.equal(routeContent);
    });

    it('should call `render` if such an attribute exists on the route handler', function() {
        let targetNode = {};
        let routeContent = 'route-content';
        let injectable = function() {};
        injectable.render = function($context, renderer) {
            renderer(routeContent);
        };

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', injectable);

        $window.onload();

        expect(targetNode.innerHTML).to.equal(routeContent);
    });

    it('should use a custom renderer', function() {
        let targetNode = {};
        let routeContent = 'route-content';

        let renderer;

        function makeRenderer(targetDOMNode) {
            renderer = function(content) {
                targetDOMNode.customAttribute = content;
            };

            return renderer;
        }

        let injectable = function($context, givenRenderer) {
            expect(givenRenderer).to.equal(renderer);
            renderer(routeContent);
        };

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;

        router.setMakeRenderer(makeRenderer);
        router.set('/test', 'elementId', injectable);

        $window.onload();

        expect(targetNode.customAttribute).to.equal(routeContent);
    });

    it('should match a route after a click', function() {
        let routeExecuted = false;
        let targetNode = {};
        let eventTarget = {
            href: '/test',
            'data-internal': true,
            attributes: [],
        };

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick({
            target: eventTarget
        });

        expect(routeExecuted).to.be.true;
    });

    it('should support getAttributes() on DOMNode', function() {
        let routeExecuted = false;
        let targetNode = {};
        let eventTarget = {
            getAttribute: function(attribute) {
                switch (attribute) {
                    case 'href':
                        return '/test';

                    case 'data-internal':
                        return true;

                    default:
                        return undefined;
                }
            },
        };

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick({
            target: eventTarget
        });

        expect(routeExecuted).to.be.true;
    });

    it('should support attributes-attribute on DOMNode', function() {
        let routeExecuted = false;
        let targetNode = {};
        let eventTarget = {
            attributes: [
                {
                    nodeName: 'data-internal',
                    nodeValue: ''
                },
                {
                    nodeName: 'href',
                    nodeValue: '/test'
                }
            ],
        };

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick({
            target: eventTarget
        });

        expect(routeExecuted).to.be.true;
    });

    it('should support preventDefault()', function() {
        let preventDefaultCalled = false;
        let routeExecuted = false;
        let targetNode = {};
        let eventTarget = {
            href: '/test',
            'data-internal': true,
            attributes: []
        };

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick({
            preventDefault: () => preventDefaultCalled = true,
            target: eventTarget
        });

        expect(routeExecuted).to.be.true;
        expect(preventDefaultCalled).to.be.true;
    });

    it('should support returnValue', function() {
        let targetNode = {};
        let event = {
            returnValue: true,
            target: {
                href: '/test',
                'data-internal': true,
                attributes: []
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.true;
        expect(event.returnValue).to.be.false;
    });

    it('should support srcElement', function() {
        let targetNode = {};
        let event = {
            returnValue: true,
            srcElement: {
                href: '/test',
                'data-internal': true,
                attributes: []
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.true;
        expect(event.returnValue).to.be.false;
    });

    it('should support ignore clicks that are missing `data-internal` attribute', function() {
        let targetNode = {};
        let event = {
            target: {
                href: '/test',
                attributes: []
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.false;
    });

    it('should support fix safari text clicks', function() {
        let targetNode = {};
        let event = {
            returnValue: true,
            target: {
                parentNode: {
                    href: '/test',
                    'data-internal': true,
                    attributes: []
                },
                nodeType: 3
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.true;
        expect(event.returnValue).to.be.false;
    });

    it('should call push state', function() {
        let targetNode = {};
        let pushStateCalled = false;
        let event = {
            target: {
                href: '/test',
                'data-internal': true,
                attributes: []
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.history.pushState = () => pushStateCalled = true;
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.true;
        expect(pushStateCalled).to.be.true;
    });

    it('should call replace state with attribute `data-no-history`', function() {
        let targetNode = {};
        let replaceStateCalled = false;
        let event = {
            target: {
                href: '/test',
                'data-internal': true,
                'data-no-history': true,
                attributes: []
            }
        };
        let routeExecuted = false;

        $window.location.href = '/';
        $window.history.replaceState = () => replaceStateCalled = true;
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onclick(event);

        expect(routeExecuted).to.be.true;
        expect(replaceStateCalled).to.be.true;
    });

    it('should support onpopstate', function() {
        let targetNode = {};
        let routeExecuted = false;

        $window.location.href = '/test';
        $window.document.getElementById = () => targetNode;

        router.set('/test', 'elementId', function() {
            routeExecuted = true;
        });

        $window.onpopstate();

        expect(routeExecuted).to.be.true;
    });
});