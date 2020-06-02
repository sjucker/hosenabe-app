import * as api from './api';
import * as gm from './game';
import ioclient from 'socket.io-client';

export class AIPlayerManager {

    private aiPlayers: AIPlayer[];

    constructor() {
        this.aiPlayers = [];
    };

    private hasPlayer(playerId: string): boolean {
        return this.aiPlayers.some(pl => pl.id === playerId);
    }

    private addPlayer(aiPlayer: AIPlayer): void {
        if (this.hasPlayer(aiPlayer.id)) {
            throw new Error(`Cannot add AI player; player with same ID already present: ${aiPlayer.id}`);
        }
        this.aiPlayers.push(aiPlayer);
    }

    public spawnPlayer(playerName: string, gameId: string): void {
        // Creates a new AI player who registers with the API and joins the passed game
        const aiPlayer: AIPlayer = new DeterministicAIPlayer(playerName, gameId);
        aiPlayer.listen();
        aiPlayer.register();
        this.addPlayer(aiPlayer);
    }

    public killPlayer(playerId: string) {
        if (!this.hasPlayer(playerId)) {
            throw new Error('Cannot find AI player '.concat(playerId));
        }

        const idx = this.aiPlayers.findIndex(pl => pl.id === playerId);
        const aiPlayer: AIPlayer = this.aiPlayers.splice(idx, 1)[0];
        aiPlayer.kill();
    }
}

interface ActionAndCards {
    // A game action + optional card info for the switch action
    action: gm.Action,
    switchCards?: { playerCardName: string, tableCardName: string }
}

abstract class AIPlayer {
    public id: string;
    public gameId: string;
    public name: string;
    public socket: SocketIOClient.Socket;
    public gameState?: gm.GameState;

    constructor(playerName: string, gameId: string) {
        this.id = '';
        this.gameId = gameId;
        this.name = playerName;
        this.socket = ioclient.connect(`http://localhost:${process.env.PORT || 3000}`);
        this.gameState = undefined;

        this.play = this.play.bind(this);
        this.requestRoundStart = this.requestRoundStart.bind(this);
    };

    private static getRandomDelay(): number {
        return Math.random() * 2000 + 1000;
    }

    public listen() {
        this.socket.on('response player register', (message: api.RegisterResponse) => {
            if (message.success) {
                try {
                    this.id = message.playerId;
                    const joinMessage: api.JoinGameMessage = {playerId: this.id, gameId: this.gameId};
                    this.socket.emit('request join game', joinMessage);
                } catch (e) {
                    console.log(e);
                }
            } else {
                this.socket.disconnect();
                throw new Error('AI player was unable to register.');
            }
        });

        this.socket.on('game update', (gameState: gm.GameState) => {

            try {
                // Update the game state
                this.gameState = gameState;

                // Check whether round is ongoing
                if (this.gameState.isRoundOngoing) {

                    // Play action with some random delay
                    setTimeout(this.play, AIPlayer.getRandomDelay());

                } else {

                    if (!this.gameState.isGameEnded && this.gameState.isGameStarted) {
                        // Start new round if no active human players left
                        // and this AI player is the first one
                        const humanPlayerIds: string[] = this.gameState
                            .playerOverview.players.filter(pl => pl.isHuman && pl.tokens > 0)
                            .map(pl => pl.playerId);
                        const firstAIPlayerId: string = this.gameState
                            .playerOverview.players.filter(pl => !pl.isHuman)
                            .map(pl => pl.playerId)[0];
                        if (humanPlayerIds.length == 0 && this.id == firstAIPlayerId) {
                            // Request round start with some delay
                            setTimeout(this.requestRoundStart, AIPlayer.getRandomDelay());
                        }
                    }

                }
            } catch (e) {
                console.log(e);
            }
        });
    }

    public register() {
        // Request to register with the server
        const message: api.RegisterMessage = {name: this.name, isHuman: false};
        this.socket.emit('request player register', message);
    }

    public kill() {
        this.socket.disconnect();
    }

    public requestRoundStart(): void {
        const playerIdMessage: api.PlayerIdMessage = {playerId: this.id};
        this.socket.emit('request round start', playerIdMessage);
    }

    private play(): void {

        // First check whether any actions are allowed at all
        const allowedActions: gm.Action[] = this.gameState!.allowedActions;
        if (allowedActions.length == 0) {
            return;
        }
        if (allowedActions.length == 1 && allowedActions.includes(gm.Action.Nothing)) {
            return;
        }

        // Otherwise, choose and play action
        const actionAndCards: ActionAndCards = this.chooseAction();
        const action: gm.Action = actionAndCards.action;

        switch (action) {
            case gm.Action.Chlopfen:
                const chlopfMessage: api.PlayerIdMessage = {playerId: this.id};
                this.socket.emit('request chlopfen', chlopfMessage);
                break;

            case gm.Action.Losen:
                const losenMessage: api.PlayerIdMessage = {playerId: this.id};
                this.socket.emit('request losen', losenMessage);
                break;

            case gm.Action.SwitchAll:
                const switchAllMessage: api.PlayerIdMessage = {playerId: this.id};
                this.socket.emit('request switch all', switchAllMessage);
                break;

            case gm.Action.Hosenaben:
                const hosenabenMessage: api.PlayerIdMessage = {playerId: this.id};
                this.socket.emit('request hosenaben', hosenabenMessage);
                break;

            case gm.Action.Feuer:
                const feuerMessage: api.PlayerIdMessage = {playerId: this.id};
                this.socket.emit('request feuer', feuerMessage);
                break;

            case gm.Action.Switch:
                const switchMessage: api.SwitchMessage = {
                    playerId: this.id,
                    playerCardName: actionAndCards.switchCards!.playerCardName,
                    tableCardName: actionAndCards.switchCards!.tableCardName
                };
                this.socket.emit('request switch', switchMessage);
                break;

            default:
                break;
        }
    }

    abstract chooseAction(): ActionAndCards;
}


export class RandomAIPlayer extends AIPlayer {
    /*
    Implementation of AI Player that chooses actions randomly 
    */

    public chooseAction(): ActionAndCards {
        // If player has special combo: plays it
        // Otherwise: chooses action stochastically, but never switch

        const allowedActions: gm.Action[] = this.gameState!.allowedActions;

        if (allowedActions.includes(gm.Action.Feuer)) {
            return {action: gm.Action.Feuer};
        } else if (allowedActions.includes(gm.Action.Hosenaben)) {
            return {action: gm.Action.Hosenaben};
        }

        if (allowedActions.includes(gm.Action.Switch)) {
            allowedActions.splice(allowedActions.indexOf(gm.Action.Switch), 1);
        }

        const idx: number = Math.floor(Math.random() * allowedActions.length);
        const action: gm.Action = allowedActions[idx];
        return {action: action};
    }
}


export class DeterministicAIPlayer extends AIPlayer {
    /*
    Implementation of AI Player that always chooses the action maximizing short-term points
    */

    private getPoints(actionAndCards: ActionAndCards, handStack: gm.HandStack, tableStack: gm.HandStack): number {
        // Compute the points associated with different actions
        let points: number;
        switch (actionAndCards.action) {
            case gm.Action.Switch:
                const playerCardName: string = actionAndCards.switchCards!.playerCardName;
                const handStackCards: gm.Card[] = handStack.getCards().slice();
                const playerCardIdx: number = handStackCards.findIndex(pl => pl.name === playerCardName);
                const playerCard: gm.Card = handStackCards.splice(playerCardIdx, 1)[0];

                const tableCardName: string = actionAndCards.switchCards!.tableCardName;
                const tableStackCards: gm.Card[] = tableStack.getCards().slice();
                const tableCardIdx: number = tableStackCards.findIndex(pl => pl.name === tableCardName);
                const tableCard: gm.Card = tableStackCards.splice(tableCardIdx, 1)[0];

                const altHandStack: gm.HandStack = new gm.HandStack();
                altHandStack.addCards(handStackCards);
                altHandStack.addCard(tableCard);
                points = altHandStack.analyzeHand().points;
                break;

            case gm.Action.SwitchAll:
                points = tableStack.analyzeHand().points;
                break;

            default:
                // nothing, hosenaben, feuer, losen, chlopfen
                points = handStack.analyzeHand().points;
                break;
        }

        return points;
    }

    public chooseAction(): ActionAndCards {

        // Some error checking.. if hand/table cards are missing, play nothing
        if (this.gameState!.thisPlayerCards.length == 0) {
            return {action: gm.Action.Nothing};
        }

        // Turn hand- and table-cards into HandStack object (for point counting)
        const handStack: gm.HandStack = new gm.HandStack();
        for (const card of this.gameState!.thisPlayerCards) {
            const _card: gm.Card = new gm.Card(card.suit, card.rank);
            handStack.addCard(_card);
        }
        const tableStack: gm.HandStack = new gm.HandStack();
        for (const card of this.gameState!.tableCards) {
            const _card: gm.Card = new gm.Card(card.suit, card.rank);
            tableStack.addCard(_card);
        }

        // Make a list of all possible actions and record associated points\
        const allowedActions: gm.Action[] = this.gameState!.allowedActions;
        const actionCandidates: ActionAndCards[] = [];
        const actionCandidatePoints: number[] = [];
        for (const allowedAction of allowedActions) {
            switch (allowedAction) {
                case gm.Action.Switch:
                    // The switch action entails 3*3 possible card switches
                    for (const playerCard of handStack.getCards()) {
                        for (const tableCard of tableStack.getCards()) {
                            const switchActionAndCards: ActionAndCards = {
                                action: gm.Action.Switch,
                                switchCards: {
                                    playerCardName: playerCard.name,
                                    tableCardName: tableCard.name
                                }
                            }
                            actionCandidates.push(switchActionAndCards);
                            let points: number = this.getPoints(switchActionAndCards, handStack, tableStack);
                            actionCandidatePoints.push(points);
                        }
                    }
                    break;

                default:
                    actionCandidates.push({action: allowedAction});
                    let points: number = this.getPoints({action: allowedAction}, handStack, tableStack);
                    actionCandidatePoints.push(points);
                    break;
            }
        }

        // Pick the point maximizing action
        // Sample one if there are multiple
        const bestActions: ActionAndCards[] = [];
        const maxPoints: number = Math.max(...actionCandidatePoints);
        for (let i = 0; i < actionCandidates.length; i++) {
            if (actionCandidatePoints[i] == maxPoints) {
                bestActions.push(actionCandidates[i]);
            }
        }
        const randIdx: number = Math.floor(Math.random() * bestActions.length);
        return bestActions[randIdx];
    }
}
