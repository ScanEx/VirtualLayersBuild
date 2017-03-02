#!/usr/bin/env bash

git submodule sync
git submodule update --init --recursive

npm i

# npm install http-server -g
# http-server &

# npm install webpack-dev-server -g
# webpack-dev-server --progress --colors

# gulp production

webpack
