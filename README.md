# assistant-service

Global Digital Library's Google assistant service

## Installation

### Before you start

- [node](https://nodejs.org/) version should be 10 or above (to check `node -v`) or use [nvm](https://github.com/creationix/nvm).
- [serverless](https://serverless.com/) should be installed globally (`npm install -g serverless`)

#### Install Dependencies

- `cd assistant-service/`
- `npm install`

##### Plugins
The application uses some serverless plugins which may affect the use of additional plugins (so you are aware). Current plugins used are:
* [serverless-plugin-warmup](https://github.com/FidelLimited/serverless-plugin-warmup)

### Run locally

To run the assistant locally on `localhost:3000`, use the command:
`npm run dev`

#### Run tests

Test are run by using the command:
`npm run test`

### Test with Google actions and dialogflow

To be able to test the API on an assistant like Google Home, Google home mini or an assistant on your phone you first need to create a project on [Google actions](https://developers.google.com/actions/).
Then you can integrate with [Dialogflow](https://console.dialogflow.com/) where you set up the following:

   * A `fulfilment` (webhook url) which must be a `https`-address (you can use [ngrok](https://ngrok.com/))
   * A list of `intents` (should correlate with the ones defined in `app.js`)
   * A set of `entities` (we use `read` and `topic`)

In the folder `config/intents` and `config/entities` lies the configuration setup for `intents` and `entities` in the project which can be uploaded on [Dialogflow](https://console.dialogflow.com/).
