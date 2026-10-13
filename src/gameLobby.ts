import * as gm from "./game";
import * as ai from "./ai";

// ä ö ü
const AI_NAME_CANDIDATES = ['Trudi', 'Fritzli', 'Köbi', 'Ruedi',
                            'Hanspi', 'Lotti', 'Monika', 'Alain',
                            'Hansli', 'Ursli', 'Chaschpi'];

export interface LobbyPlayer {
    player: gm.Player,
    isInGame: boolean,
    isSpectator: boolean, // only meaningful while isInGame
    gameId: string | null,
    socketId: string
}

export interface NameValidation {
    isValid: boolean,
    isValidReason: string
}

export interface GameInfo {
    gameId: string,
    hostPlayerId: string,
    hostPlayerName: string,
    nPlayers: number,
    joinable: boolean
}

// Game Lobby
export class Lobby {

    private lobbyPlayers: LobbyPlayer[];
    private games: gm.Game[];
    private aiManager: ai.AIPlayerManager;

    constructor() {
        this.lobbyPlayers = [];
        this.games = [];
        this.aiManager = new ai.AIPlayerManager();
    }

    public checkPlayerName(name: string): NameValidation {
        // Check whether player name is valid

        let isValid: boolean = true;
        var isValidReason: string = 'Name isch guet!';

        if (name.length < 4) {
            isValid = false;
            isValidReason = 'Name mues mindeschtens 4 zeiche lang si.';
        } else if (name.length > 12) {
            isValid = false;
            isValidReason = 'Name derf maximal 12 zeiche lang si.';
        } else if (this.lobbyPlayers.some(lb => lb.player.name == name)) {
            isValid = false;
            isValidReason = 'Name isch scho vergäh.';
        }

        const validation: NameValidation = {
            isValid: isValid,
            isValidReason: isValidReason
        };

        return validation;
    }

    public hasPlayer(playerId: string): boolean {
        return this.lobbyPlayers.some(lb => lb.player.id == playerId);
    }

    public hasPlayerWithSocketId(socketId: string) {
        return this.lobbyPlayers.some(lb => lb.socketId == socketId);
    }

    public getLobbyPlayerBySocketId(socketId: string): LobbyPlayer {
        const lobbyPlayer: LobbyPlayer | undefined = this.lobbyPlayers.find(lb => lb.socketId == socketId);
        if (lobbyPlayer === undefined) {
            throw new RangeError('Player not found');
        }
        return lobbyPlayer;
    }

    public addPlayer(player: gm.Player, socketId: string): void {
        if (this.hasPlayer(player.id)) {
            throw new Error('Player already in lobby.');
        }
        if (this.hasPlayerWithSocketId(socketId)) {
            throw new Error('Player with this socket id already in lobby.');
        }
        const lobbyPlayer: LobbyPlayer = {
            player: player,
            isInGame: false,
            isSpectator: false,
            gameId: null,
            socketId: socketId
        }
        this.lobbyPlayers.push(lobbyPlayer);
    }

    public updatePlayerSocketId(playerId: string, socketId: string): void {
        // Rebinds an existing player to a new socket (e.g. after a page refresh)
        if (this.lobbyPlayers.some(lb => lb.socketId == socketId && lb.player.id != playerId)) {
            throw new Error('Socket id already used by another player.');
        }
        this.getLobbyPlayer(playerId).socketId = socketId;
    }

    public getLobbyPlayer(playerId: string): LobbyPlayer {
        const lobbyPlayer: LobbyPlayer | undefined = this.lobbyPlayers.find(lb => lb.player.id == playerId);
        if (lobbyPlayer === undefined) {
            throw new RangeError('Player not found.');
        }
        return lobbyPlayer;
    }

    public getPlayerGameId(playerId: string): string {
        const gameId: string | null = this.getLobbyPlayer(playerId).gameId;
        if (gameId === null) {
            throw new Error('Player is not in a game.');
        }
        return gameId;
    }

    public removePlayer(playerId: string): void {
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        if (lobbyPlayer.isInGame) {
            throw new Error('Cannot remove player; player still in game.');
        }
        const idx: number = this.lobbyPlayers.findIndex(lp => lp.player.id == playerId);
        this.lobbyPlayers.splice(idx, 1)[0];
    }

    public spawnGame(playerId: string): gm.Game {
        // Creates a new game and adds player to it
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        if (lobbyPlayer.isInGame) {
            throw new Error('Cannot spawn game; player is already in existing game.');
        }
        const game = new gm.Game(lobbyPlayer.player);
        lobbyPlayer.isInGame = true;
        lobbyPlayer.gameId = game.id;
        this.games.push(game);
        return game;
    }

    public hasGame(gameId: string): boolean {
        return this.games.some(gm => gm.id == gameId);
    }

    public getGame(gameId: string): gm.Game {
        const game: gm.Game | undefined = this.games.find(gm => gm.id == gameId);
        if (game === undefined) {
            throw new RangeError('Game not found.');
        }
        return game;
    }

    public removeGame(gameId: string): void {
        // Removes game -- only works if no players left in game
        if (!this.hasGame(gameId)) {
            throw new RangeError('Game not found.');
        }
        if (this.getGame(gameId).getNPlayers() > 0) {
            throw new Error('Cannot remove game; players still present in game.');
        }

        // Remove game
        const idx = this.games.findIndex(gm => gm.id == gameId);
        this.games.splice(idx, 1);
    }

    public removeAndKillAIPlayers(gameId: string): void {
        // Removes all AI players from a game and kills them
        if (!this.hasGame(gameId)) {
            throw new RangeError('Game not found.');
        }

        const game = this.getGame(gameId);
        const aiPlayers: gm.Player[] = game.getAIPlayers();
        const aiPlayerIds: string[] = aiPlayers.map(pl => pl.id);
        for (const playerId of aiPlayerIds) {
            this.removePlayerFromGame(playerId);
            this.removePlayer(playerId);
            this.aiManager.killPlayer(playerId);
        }
    }

    public getJoinableGames(): GameInfo[] {
        return this.games.map(game => {
            return {
                gameId: game.id,
                hostPlayerId: game.getPlayerIds()[0],
                hostPlayerName: game.getPlayerNames()[0],
                nPlayers: game.getNPlayers(),
                joinable: game.isGameJoinable()
            };
        });
    }

    public getNGames(): number {
        return this.games.length;
    }

    public canAddPlayerToGame(playerId: string, gameId: string): boolean {
        return this.getGame(gameId).canAddPlayer(playerId);
    }

    public addPlayerToGame(playerId: string, gameId: string): void {
        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Player not found.');
        }
        if (!this.canAddPlayerToGame(playerId, gameId)) {
            throw new Error('Cannot add player to game.');
        }
        const game: gm.Game = this.getGame(gameId);
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        game.addPlayer(lobbyPlayer.player);
        lobbyPlayer.isInGame = true;
        lobbyPlayer.gameId = game.id;
    }

    public addSpectatorToGame(playerId: string, gameId: string): void {
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        if (lobbyPlayer.isInGame) {
            throw new Error('Cannot add spectator to game; player already in game.');
        }
        const game: gm.Game = this.getGame(gameId);
        game.addSpectator(lobbyPlayer.player);
        lobbyPlayer.isInGame = true;
        lobbyPlayer.isSpectator = true;
        lobbyPlayer.gameId = game.id;
    }

    public isSpectating(playerId: string): boolean {
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        return lobbyPlayer.isInGame && lobbyPlayer.isSpectator;
    }

    public addAIPlayerToGame(gameId: string, aiType: gm.AIType = gm.AIType.Standard): void {

        if (!this.canAddPlayerToGame('some_player', gameId)) {
            throw new Error('Cannot add AI player to game.');
        }

        // Get the game
        const game: gm.Game = this.getGame(gameId);

        // Make AI player name (& ensure it is unique)
        let counter: number = 0;
        const existingNames = game.getPlayerNames();
        const nameCandidates = AI_NAME_CANDIDATES;
        const idx: number = Math.floor(Math.random() * nameCandidates.length);
        let candidateName: string = nameCandidates[idx];
        let nameDigit: string = '';
        let nameValid: boolean = false;
        while (!nameValid) {
            if (existingNames.includes(candidateName.concat(nameDigit))) {
                counter++;
                nameDigit = counter.toString();
            } else {
                nameValid = true;
            }
        }

        // Spawn the AI player (the AI registers and joins the game by itself)
        this.aiManager.spawnPlayer(candidateName.concat(nameDigit), gameId, aiType);
    }

    public removePlayerFromGame(playerId: string): void {
        const lobbyPlayer: LobbyPlayer = this.getLobbyPlayer(playerId);
        if (!lobbyPlayer.isInGame) {
            throw new Error('Cannot remove player from game; player is not in game.');
        }

        const game: gm.Game = this.getGame(this.getPlayerGameId(playerId));
        if (lobbyPlayer.isSpectator) {
            game.removeSpectator(lobbyPlayer.player.id);
        } else {
            game.removePlayer(lobbyPlayer.player.id);
        }
        lobbyPlayer.isInGame = false;
        lobbyPlayer.isSpectator = false;
        lobbyPlayer.gameId = null;
    }

    public cleanUpGame(gameId: string): string[] {
        // Removes game if no human players are left
        // Returns the ids of the spectators that were sent back to the lobby
        const game: gm.Game = this.getGame(gameId);
        if (game.getNHumanPlayers() > 0) {
            return [];
        }
        this.removeAndKillAIPlayers(game.id);
        const spectatorIds: string[] = game.getSpectatorIds();
        for (const spectatorId of spectatorIds) {
            this.removePlayerFromGame(spectatorId);
        }
        this.removeGame(game.id);
        return spectatorIds;
    }

    public isPlayerInGame(playerId: string): boolean {
        return this.getLobbyPlayer(playerId).isInGame;
    }
}
