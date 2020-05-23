import * as gm from "./game";
import * as gl from "./gameLobby";
import socketio from "socket.io";


export interface NameCheckMessage {
    name: string;
}

export interface RegisterMessage {
    name: string,
    isHuman: boolean
}

export interface RegisterResponse {
    success: boolean,
    playerId: string,
    playerName: string
}

export interface PlayerIdMessage {
    playerId: string
}

export interface LobbyUpdate {
    joinableGames: gl.GameInfo[],
}

export interface JoinGameMessage {
    playerId: string,
    gameId: string
}

export interface SwitchMessage {
    playerId: string,
    playerCardName: string,
    tableCardName: string
}

export class API {

    private lobby: gl.Lobby;
    private io: socketio.Server;

    constructor(lobby: gl.Lobby, io: socketio.Server) {
        this.lobby = lobby;
        this.io = io;

        this.handleConnection = this.handleConnection.bind(this);
    }

    private emitLobbyUpdate(socket: socketio.Socket = null): void {
        // Sends a lobby update
        const joinableGames: gl.GameInfo[] = this.lobby.getJoinableGames();
        const lobbyUpdate: LobbyUpdate = {
            joinableGames: joinableGames
        }
        if (socket == null) { // send to everyone
            this.io.to('lobby').emit('lobby update', lobbyUpdate);
        } else { // send to socket
            socket.emit('lobby update', lobbyUpdate);
        }
    }

    private emitGameUpdate(gameId: string, playerId: string = null): void {
        // Emits (personalized) game update 
        const game: gm.Game = this.lobby.getGame(gameId);
        if (playerId == null) { // send update to all palyers in game
            const playerIds: string[] = game.getPlayerIds();
            for (const playerId of playerIds) {
                const socketId: string = this.lobby.getLobbyPlayer(playerId).socketId;
                const gameState: gm.GameState = game.getGameState(playerId);
                this.io.to(socketId).emit('game update', gameState);
            }
        } else { // send update to single player
            const socketId: string = this.lobby.getLobbyPlayer(playerId).socketId;
            const gameState: gm.GameState = game.getGameState(playerId);
            this.io.to(socketId).emit('game update', gameState);
        }
    }

    private emitPlayerNotFoundError(socket: socketio.Socket): void {
        socket.emit('server error', {type: 'player not found'});
    }

    private handleConnection(socket: socketio.Socket): void {

        // Name validation
        socket.on('request name check', function (message: NameCheckMessage) {
            try {
                const answer: gl.NameValidation = this.lobby.checkPlayerName(message.name);
                socket.emit('response name check', answer);
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Add new player to lobby
        socket.on('request player register', function (message: RegisterMessage) {

            try {
                const player: gm.Player = new gm.Player(message.name, message.isHuman);
                this.lobby.addPlayer(player, socket.id);

                socket.join('lobby'); // Adds player to lobby socket.io room
                const registerResponse: RegisterResponse = {
                    success: true,
                    playerId: player.id,
                    playerName: player.name
                };
                socket.emit('response player register', registerResponse);
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Sends joinable games to requesting player
        socket.on('request lobby update', function (message: PlayerIdMessage) {
            try {
                this.emitLobbyUpdate(socket);
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to start new game
        socket.on('request new game', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                const playerId = message.playerId;
                if (!this.lobby.isPlayerInGame(playerId)) {
                    const game: gm.Game = this.lobby.spawnGame(playerId);

                    socket.join(game.id); // Adds player to socket.io room of this game
                    socket.leave('lobby');

                    socket.emit('response join game', {}); // Let player know that they joined
                    this.emitLobbyUpdate(); // Send lobby update to everyone in lobby
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to join existing game
        socket.on('request join game', function (message: JoinGameMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (!this.lobby.isPlayerInGame(message.playerId) &&
                    this.lobby.hasGame(message.gameId)) {
                    this.lobby.addPlayerToGame(message.playerId, message.gameId);

                    socket.join(message.gameId); // Adds player to socket.io room of this game
                    socket.leave('lobby');

                    socket.emit('response join game', {}); // Let player know that they joined
                    this.emitLobbyUpdate(); // Send lobby update to everyone in lobby
                    this.emitGameUpdate(message.gameId); // Send update to everyone in game
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to add an AI player to their game
        socket.on('request add ai', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    // Get the game
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);

                    // Spawn & add the AI player
                    this.lobby.addAIPlayerToGame(game.id);
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this))

        // Player requests update on the game they're currently in
        socket.on('request game update', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    this.emitGameUpdate(lobbyPlayer.gameId, message.playerId);
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to exit game
        socket.on('request game exit', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                const playerId = message.playerId;
                if (this.lobby.isPlayerInGame(playerId)) {
                    const gameId: string = this.lobby.getLobbyPlayer(playerId).gameId;
                    this.lobby.removePlayerFromGame(playerId);
                    this.lobby.cleanUpGame(gameId);

                    socket.join('lobby');
                    socket.leave(gameId);

                    socket.emit('response game exit', {}); // Let player know that they exited
                    this.emitLobbyUpdate();
                    if (this.lobby.hasGame(gameId)) { // bc game might have been auto removed when no players left
                        this.emitGameUpdate(gameId);
                    }

                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player disconnects
        socket.on('disconnect', function () {
            try {
                if (this.lobby.hasPlayerWithSocketId(socket.id)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayerBySocketId(socket.id);
                    const playerId: string = lobbyPlayer.player.id;
                    if (this.lobby.isPlayerInGame(playerId)) {
                        const gameId: string = lobbyPlayer.gameId;
                        this.lobby.removePlayerFromGame(playerId);
                        this.lobby.cleanUpGame(gameId);
                        if (this.lobby.hasGame(gameId)) { // bc game might have been auto removed when no players left
                            this.emitGameUpdate(gameId);
                        }
                    }
                    this.lobby.removePlayer(playerId);
                    this.emitLobbyUpdate();
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to start game
        socket.on('request game start', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.isGameStartable()) {
                        game.startGame();
                        this.emitGameUpdate(game.id);
                        this.emitLobbyUpdate();
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to take losen action
        socket.on('request losen', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.Losen)) {
                        game.takeActionLosen(message.playerId);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to take chlopfen action
        socket.on('request chlopfen', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.Chlopfen)) {
                        game.takeActionChlopf(message.playerId);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to switch all cards
        socket.on('request switch all', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.SwitchAll)) {
                        game.takeActionSwitchAll(message.playerId);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to switch two cards
        socket.on('request switch', function (message: SwitchMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.Switch)) {
                        game.takeActionSwitch(message.playerId, message.playerCardName, message.tableCardName);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to take hosenaben action
        socket.on('request hosenaben', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.Hosenaben)) {
                        game.takeActionHosenaben(message.playerId);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to take feuer action
        socket.on('request feuer', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (game.canPlayerTakeAction(message.playerId, gm.Action.Feuer)) {
                        game.takeActionFeuer(message.playerId);
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));

        // Player requests to start round
        socket.on('request round start', function (message: PlayerIdMessage) {

            if (!this.lobby.hasPlayer(message.playerId)) {
                this.emitPlayerNotFoundError(socket);
                return;
            }

            try {
                if (this.lobby.isPlayerInGame(message.playerId)) {
                    const lobbyPlayer: gl.LobbyPlayer = this.lobby.getLobbyPlayer(message.playerId);
                    const game: gm.Game = this.lobby.getGame(lobbyPlayer.gameId);
                    if (!game.getIsRoundOngoing() && game.getIsGameStarted() && !game.getIsGameEnded()) {
                        game.startRound();
                        this.emitGameUpdate(game.id);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this));
    }

    public listen() {
        this.io.on('connection', this.handleConnection);
    }
}
