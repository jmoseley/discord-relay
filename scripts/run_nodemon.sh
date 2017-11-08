#!/usr/bin/env bash

nodemon_cmd="./scripts/node_modules/.bin/nodemon"
if [ ! -f "$nodemon_cmd" ]; then
  ( cd ./scripts && yarn )
fi

$nodemon_cmd \
  --ext ts \
  --watch src \
  --exec 'tslint -p tslint.json && tsc && node dist/start.js'
