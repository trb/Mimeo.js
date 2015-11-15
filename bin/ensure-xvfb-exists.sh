#!/bin/bash

if hash xvfb-run 2>/dev/null; then
    exit 0
fi

PACKAGEMANAGER="";
PACKAGE="";

if hash dnf 2>/dev/null; then
    PACKAGEMANAGER="dnf";
    PACKAGE="xorg-x11-server-Xvfb";
elif hash yum 2>/dev/null; then
    PACKAGEMANAGER="yum";
    PACKAGE="xorg-x11-server-Xvfb";
elif hash apt-get 2>/dev/null; then
    PACKAGEMANAGER="apt-get";
    PACKAGE="xvfb";
else
    echo "No supported package manager found, can't install xvfb. This means that you can not run integration tests unless you install the package on your own.";
    echo "Supported package managers: dnf, yum and apt-get";
    exit 0;
fi

sudo ${PACKAGEMANAGER} install -y ${PACKAGE}