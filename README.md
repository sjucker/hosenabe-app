# Hosenaben App

## server (this directory)

* node.js app that runs 
    * the hosenabe game (and the game lobby)
    * a http express server serving the client site
    * a socket.io server managing interactions between players and the game
* written in TypeScript; to compile typescript, run `npm run build-ts` from the directory root
* the TypeScript source files are in `src/`, the compiled javascript files are in `dist/`
* to start the app, run `npm start`, which runs `dist/server.js`, and serves the client site to port 3000
* a note on the AI players:
    * implemented as socket.io-clients, run by the main hosen-server process
    * interact with the hosen-server API as if they were human players (i.e. via port 3000)

## client

* a react web app, written in JavaScript
* to build the site, run `npm run build` from the directory root
* the static site will then be located in the `build/` subdirectory; this is the directory served by the server

## Heroku

TODO document
