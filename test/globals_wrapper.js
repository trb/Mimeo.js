'use strict';

let GlobalsWrapper = require('../src/builtins/GlobalsWrapper.js');

let expect = require('chai').expect;

describe('Globals wrapper', function() {
    beforeEach(() => {
        delete global.window;
    });

    it('should provide a fake window object for a node environment', function() {
        let window = GlobalsWrapper.Window();

        expect(window.$fake).to.be.true;
        expect(window.onclick()).to.be.undefined;
    });

    it('should return window in a browser environment', function() {
        global.window = { '$fake': false };

        let window = GlobalsWrapper.Window();

        expect(window.$fake).to.be.false;
    });

    it('should return NodeHttp module in a node environment', function() {
        let nodeHttp = GlobalsWrapper.NodeHttp();
        expect(nodeHttp.request).to.exist;
    });

    it('should return an empty object instead of NodeHttp browser environment', function() {
        global.window = {};

        let nodeHttp = GlobalsWrapper.NodeHttp();

        expect(nodeHttp.request).to.be.an.object;
        expect(nodeHttp.request).to.be.empty;
    });

    it('should return NodeHttps module in a node environment', function() {
        let nodeHttps = GlobalsWrapper.NodeHttps();
        expect(nodeHttps.request).to.exist;
    });

    it('should return an empty object instead of NodeHttps browser environment', function() {
        global.window = {};

        let nodeHttps = GlobalsWrapper.NodeHttps();

        expect(nodeHttps.request).to.be.an.object;
        expect(nodeHttps.request).to.be.empty;
    });
});