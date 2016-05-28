#!/usr/bin/env bash

set -e

TMP="/tmp"
MIMEO_DOCS="${TMP}/mimeo-docs"
CURRENT_DIR="$(pwd)"
TMP_GIT="${TMP}/mimeo-docs-git"

if [ -d "${MIMEO_DOCS}" ]; then
    rm -r "${MIMEO_DOCS}";
fi
if [ -d "${TMP_GIT}" ]; then
    rm -rf "${TMP_GIT}";
fi

mkdir -p "${MIMEO_DOCS}/examples"

node_modules/.bin/yuidoc

cp -r docs/* "${MIMEO_DOCS}"
cp -r examples/hello_world "${MIMEO_DOCS}/examples/hello-world"
cp -r dist "${MIMEO_DOCS}/"
cp mimeo-logo.png "${MIMEO_DOCS}/"

git clone git@github.com:trb/Mimeo.js.git "${TMP_GIT}"

cd "${TMP_GIT}"

git checkout gh-pages
git checkout -b gh-pages-update

rm -r *

echo "${MIMEO_DOCS}/"
ls "${MIMEO_DOCS}/"
cp -r "${MIMEO_DOCS}/." "${TMP_GIT}/"

git add -A .
git commit -m "Update docs"
git push origin gh-pages-update

cd "${CURRENT_DIR}"

rm -rf "${MIMEO_DOCS}"
rm -rf "${TMP_GIT}"

exit 0