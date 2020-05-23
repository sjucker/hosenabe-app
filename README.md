# Hosenaben App

## hosen-server (this directory)

* node.js app that runs 
    * the hosenabe game (and the game lobby)
    * a http express server serving the client site (hosen-client)
    * a socket.io server managing interactions between players and the game
* written in TypeScript; to compile typescript, run `npm run build-ts` from the directory root
* the TypeScript source files are in `src/`, the compiled javascript files are in `dist/`
* to start the app, run `npm start`, which runs `dist/server.js`, and serves the client site to port 3000
* the app assumes that the client site is located at `/home/hunzikp/proj/hosen-client/build`
* a note on the AI players:
    * implemented as socket.io-clients, run by the main hosen-server process
    * interact with the hosen-server API as if they were human players (i.e. via port 3000)

## hosen-client

* a react web app, written in JavaScript
* to build the site, run `npm run build` from the directory root
* the static site will then be located in the `build/` subdirectory; this is the directory served by the hosen-server app
* note the the socket.io client in the client app will connect to the host that serves the client page, so we don't have to hardcode the server hostname in the app; if we run the server in the dev enviroment, the client might connect to `localhost:3000`, whereas in the prod environment it might connect to `hosenabe.philipphunziker.com`

## nginx server

* on the production machine, we run an nginx webserver that acts as a reverse proxy; that is, it listens to port 80 and reroutes relevant requests to the hosen-server app on `localhost:3000`
* the relevant configuration files are in directory `/etc/nginx/sites-available`
    * configuration `philipphunziker.com` is the default configuration and serves `/var/www/html/index.html` to requests for `philipphunziker.com`, `www.philipphunziker.com`, or any other request (e.g. to `localhost`)
    * configuration `hosenabe` takes care of requests to `hosenabe.philipphunziker.com` and channels them to `http://localhost:3000`
* to enable these configurations, we created symlinks to `/etc/nginx/sites-enabled`
* to restart the server, use `sudo systemctl restart nginx`; don't forget to restart after any configuration change

## domain

* we can configure the `philipphunziker.com` domain at [dynu.com](http://www.dynu.com)
* the `philipphunziker.com` domain is pointed to my personal home IP via dynamic DNS
* to change the IP, go to the dynu.com control panel, select the domain, and click on Manage Dynamic DNS Service

## pm2

* we use pm2 to run the hosen-server in the background; pm2 also restarts the app should it crash
* to start the app with pm2, from the hosen-server directory, run `pm2 start dist/server.js --name hosen`
* to monitor the process, use `pm2 monit`
