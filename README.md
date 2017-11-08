# discord-relay
Relay for outbound webhooks for Discord messages.

## API Usage

### GET /bot/auth?clientId=<discord application id>

Helper to get a bot added to a channel. Redirects to the Discord OAuth endpoint.

### POST /bot/add

Body parameters:
* botToken (required)
* webhookUri (including protocol) (required)
* method (one of GET or POST) (required)
* headerName1 (optional)
* headerValue1 (optional)
* headerName2 (optional)
* headerValue2 (optional)
* headerName3 (optional)
* headerValue3 (optional)
* headerName4 (optional)
* headerValue4 (optional)
* headerName5 (optional)
* headerValue5 (optional)

This adds your bot to the server and makes it begin listening to messages. This
will also be persisted so it will start whenever the server starts.

## Install Deps

1. Install yarn
1. Install modules: `yarn`

## Running the Service

```bash
yarn start
```

## Local Development

Uses `forever` and `nodemon` to restart after changes and errors.

First, download and start DynamoDB locally:

http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html#DynamoDBLocal.DownloadingAndRunning

Start DynamodDB: `java -Djava.library.path=./dynamodb_local_latest/DynamoDBLocal_lib -jar ./dynamodb_local_latest/DynamoDBLocal.jar -inMemory`

```bash
DISCORD_CLIENT_ID=<value> DISCORD_CLIENT_SECRET=<value> DISCORD_OAUTH_REDIRECT_URI=<value> COOKIE_SECRET='123456' yarn dev
```

## Deploy

Using Heroku, deployment is easy.

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
1. Login: `heroku login`
1. Push: `git push heroku master`
