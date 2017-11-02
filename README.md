# discord-relay
Relay for outbound webhooks for Discord messages.

## Install Deps

1. Install yarn
1. Install modules: `yarn`

## Running the Service

```bash
yarn start
```

## Local Development

Uses `forever` and `nodemon` to restart after changes and errors.

```bash
yarn dev
```

## Deploy

Using Heroku, deployment is easy.

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
1. Login: `heroku login`
1. Push: `git push heroku master`
