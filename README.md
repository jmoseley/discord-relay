# discord-relay
Relay for outbound webhooks for Discord messages.

## API Usage

### GET /bot/auth?clientId=<discord application id>

Helper to get a bot added to a channel. Redirects to the Discord OAuth endpoint.

### POST /bot/add

Include `botToken` and `webhookUrl` in the POST body. This is the token of your bot.

This adds your bot to the server and makes it begin listening to messages.

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
DISCORD_CLIENT_ID=<value> DISCORD_CLIENT_SECRET=<value> DISCORD_OAUTH_REDIRECT_URI=<value> COOKIE_SECRET='123456' yarn dev
```

## Deploy

Using Heroku, deployment is easy.

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
1. Login: `heroku login`
1. Push: `git push heroku master`
