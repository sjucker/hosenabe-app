import {API} from "./api";
import {Lobby} from "./gameLobby";
import express from "express";
import socketio from 'socket.io';
import http from 'http';

const APPPATH: string = 'client/build';
const PORT: number = 3000;

// Create the server
const app: express.Application = express();
let httpServer: http.Server = http.createServer(app);
let io: socketio.Server = socketio(httpServer);

// Serve the app
app.use(express.static(APPPATH));
app.get('/', (req, res) => {
    res.sendFile(APPPATH.concat('/index.html'));
});

// Socket api
const lobby: Lobby = new Lobby();
const api: API = new API(lobby, io);
api.listen();

// Listen
httpServer.listen(PORT, () => {
    console.log('Listening on *:'.concat(PORT.toString()));
})
