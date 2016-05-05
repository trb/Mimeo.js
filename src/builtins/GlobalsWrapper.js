function Window() {
    if (typeof window === 'undefined') {
        var noOp = function() {
        };
        return {
            $fake: true,
            onpopstate: noOp,
            onclick: noOp,
            onload: noOp,
            document: {
                getElementById: noOp
            },
            history: {
                pushState: noOp,
                replaceState: noOp
            }
        };
    }

    return window;
}

function NodeHttp() {
    if (typeof window === 'undefined') {
        return require('http');
    } else {
        return {};
    }
}

function NodeHttps() {
    if (typeof window === 'undefined') {
        return require('https');
    } else {
        return {};
    }
}

module.exports = {
    Window: Window,
    NodeHttp: NodeHttp,
    NodeHttps: NodeHttps
};