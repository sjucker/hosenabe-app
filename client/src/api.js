import openSocket from 'socket.io-client';

// for development environment (when using 'npm run start') connect to separate hosen-server running on port 3000
// otherwise (i.e., production), we do not specify a hostname -> connects to host serving the site
const socket = openSocket(process.env.NODE_ENV === 'development' ? 'localhost:3000' : undefined);

function setCallbackOnMessage(message, callbackFunction) {
    socket.on(message, callbackFunction);
}

function removeCallbackOnMessage(message, callbackFunction) {
    socket.off(message, callbackFunction);
}

function emitToServer(messageName, messageContent) {
    socket.emit(messageName, messageContent);
}

function isConnected() {
    return socket.connected;
}

const api = {emitToServer, setCallbackOnMessage, removeCallbackOnMessage, isConnected};

export default api;
