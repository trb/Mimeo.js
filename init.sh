#!/usr/bin/env bash

if !(hash npm 2>/dev/null); then
    sudo dnf install npm;
fi

if !(hash gulp 2>/dev/null); then
    sudo npm install -g gulp;
fi

if !(hash bower 2>/dev/null); then
    sudo npm install -g bower;
fi

if [ -f ./package.json ]; then
    npm install
fi

if [ -f ./bower.json ]; then
    bower install
fi
