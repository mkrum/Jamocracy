# Jamocracy ![build status](https://travis-ci.org/mkrum/Jamocracy.svg?branch=master)

## Installation steps

1. Clone the repo
2. `npm install`
3. To run, `node app.js`, server at localhost:5000

## Environment Variables

- HOST: The host for making URIs
- PORT: The port on which to run the server
- TWILIO_SID: The SID for your Twilio account
- TWILIO_TOKEN: The access token for your Twilio account
- ORCHESTRATE_API_KEY: The api key for your Orchestrate account
- SPOTIFY_CLIENT_ID: The API ID for Spotify
- SPOTIFY_CLIENT_SECRET: The secret for the Spotify API

## Run the tests

    make test
