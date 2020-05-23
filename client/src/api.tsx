import openSocket from 'socket.io-client';

// for development environment (when using 'npm run start') connect to separate hosen-server running on port 3000
// otherwise (i.e., production), we do not specify a hostname -> connects to host serving the site
const socket = process.env.NODE_ENV === 'development' ? openSocket('localhost:3000') : openSocket();

function setCallbackOnMessage(message: string, callbackFunction: Function) {
    socket.on(message, callbackFunction);
}

function removeCallbackOnMessage(message: string, callbackFunction: Function) {
    socket.off(message, callbackFunction);
}

function emitToServer(messageName: string, ...messageContent: any[]) {
    socket.emit(messageName, messageContent);
}

export default {emitToServer, setCallbackOnMessage, removeCallbackOnMessage};
