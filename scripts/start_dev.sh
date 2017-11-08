#!/usr/bin/env bash
set -e

export DEV=1

tslint -p tslint.json
tsc

forever_cmd="./scripts/node_modules/.bin/forever"
if [ ! -f "$nodemon_cmd" ]; then
  ( cd ./scripts && yarn )
fi

set -x
$forever_cmd --minUptime 1000 --spinSleepTime 1000 -c './scripts/run_nodemon.sh' dist/start.js
