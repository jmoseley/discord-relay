#!/usr/bin/env bash
set -e

./node_modules/.bin/tsc
node ./dist/start.js
