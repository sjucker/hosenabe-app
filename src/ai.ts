import * as api from './api';
import * as gm from './game';
import { io, Socket } from 'socket.io-client';

export class AIPlayerManager {

    private aiPlayers: AIPlayer[];

    constructor() {
        this.aiPlayers = [];
    };

    private hasPlayer(playerId: string | null): boolean {
        return this.aiPlayers.some(pl => pl.id === playerId);
    }

    private addPlayer(aiPlayer: AIPlayer): void {
        // The id is only known once the player has registered, so several new players can still share null
        if (aiPlayer.id !== null && this.hasPlayer(aiPlayer.id)) {
            throw new Error(`Cannot add AI player; player with same ID already present: ${aiPlayer.id}`);
        }
        this.aiPlayers.push(aiPlayer);
    }

    public spawnPlayer(playerName: string, gameId: string, aiType: gm.AIType = gm.AIType.Standard): void {
        // Creates a new AI player who registers with the API and joins the passed game
        const aiPlayer: AIPlayer = aiType === gm.AIType.Saboteur
            ? new SaboteurAIPlayer(playerName, gameId)
            : new DeterministicAIPlayer(playerName, gameId);
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
    public id: string | null;
    public gameId: string;
    public name: string;
    public aiType: gm.AIType = gm.AIType.Standard;
    public socket: Socket;
    public gameState: gm.GameState | null;

    constructor(playerName: string, gameId: string) {
        this.id = null;
        this.gameId = gameId;
        this.name = playerName;
        // TODO solve this differently
        this.socket = io(`http://localhost:${process.env.PORT || 3000}`);
        this.gameState = null;

        this.play = this.play.bind(this);
        this.requestRoundStart = this.requestRoundStart.bind(this);
    };

    private getRandomDelay(): number {
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
                this.onGameState(gameState);

                // Check whether round is ongoing
                if (this.gameState.isRoundOngoing) {

                    // Play action with some random delay
                    setTimeout(this.play, this.getRandomDelay());

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
                            setTimeout(this.requestRoundStart, this.getRandomDelay());
                        }
                    }

                }
            } catch (e) {
                console.log(e);
            }
        });
    }

    protected onGameState(gameState: gm.GameState): void {
        // Hook for AI players that track the game beyond the current state
    }

    public register() {
        // Request to register with the server
        const message: api.RegisterMessage = {name: this.name, isHuman: false, aiType: this.aiType};
        this.socket.emit('request player register', message);
    }

    public kill() {
        this.socket.disconnect();
    }

    public requestRoundStart(): void {
        if (this.id === null) {
            return;
        }
        const playerIdMessage: api.PlayerIdMessage = {playerId: this.id};
        this.socket.emit('request round start', playerIdMessage);
    }

    private play(): void {

        // Not registered or no game state received yet
        if (this.id === null || this.gameState === null) {
            return;
        }
        const playerId: string = this.id;

        // First check whether any actions are allowed at all
        const allowedActions: gm.Action[] = this.gameState.allowedActions;
        if (allowedActions.length == 0) {
            return;
        }
        if (allowedActions.length == 1 && allowedActions.includes(gm.Action.Nothing)) {
            return;
        }

        // Otherwise, choose and play action
        const actionAndCards: ActionAndCards = this.chooseAction(this.gameState);
        const action: gm.Action = actionAndCards.action;

        switch (action) {
            case gm.Action.Chlopfen:
                const chlopfMessage: api.PlayerIdMessage = {playerId: playerId};
                this.socket.emit('request chlopfen', chlopfMessage);
                break;

            case gm.Action.Losen:
                const losenMessage: api.PlayerIdMessage = {playerId: playerId};
                this.socket.emit('request losen', losenMessage);
                break;

            case gm.Action.SwitchAll:
                const switchAllMessage: api.PlayerIdMessage = {playerId: playerId};
                this.socket.emit('request switch all', switchAllMessage);
                break;

            case gm.Action.Hosenaben:
                const hosenabenMessage: api.PlayerIdMessage = {playerId: playerId};
                this.socket.emit('request hosenaben', hosenabenMessage);
                break;

            case gm.Action.Feuer:
                const feuerMessage: api.PlayerIdMessage = {playerId: playerId};
                this.socket.emit('request feuer', feuerMessage);
                break;

            case gm.Action.Switch:
                if (actionAndCards.switchCards === undefined) {
                    break;
                }
                const switchMessage: api.SwitchMessage = {
                    playerId: playerId,
                    playerCardName: actionAndCards.switchCards.playerCardName,
                    tableCardName: actionAndCards.switchCards.tableCardName
                };
                this.socket.emit('request switch', switchMessage);
                break;

            default:
                break;
        }
    }

    abstract chooseAction(gameState: gm.GameState): ActionAndCards;
}


export class RandomAIPlayer extends AIPlayer {
    /*
    Implementation of AI Player that chooses actions randomly 
    */

    public chooseAction(gameState: gm.GameState): ActionAndCards {
        // If player has special combo: plays it
        // Otherwise: chooses action stochastically, but never switch

        const allowedActions: gm.Action[] = gameState.allowedActions;

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

    protected getPoints(actionAndCards: ActionAndCards, handStack: gm.HandStack, tableStack: gm.HandStack): number {
        // Compute the points associated with different actions
        let points: number;
        switch (actionAndCards.action) {
            case gm.Action.Switch:
                if (actionAndCards.switchCards === undefined) {
                    throw new Error('Switch action without cards.');
                }
                const playerCardName: string = actionAndCards.switchCards.playerCardName;
                const handStackCards: gm.Card[] = handStack.getCards().slice();
                const playerCardIdx: number = handStackCards.findIndex(pl => pl.name === playerCardName);
                const playerCard: gm.Card = handStackCards.splice(playerCardIdx, 1)[0];

                const tableCardName: string = actionAndCards.switchCards.tableCardName;
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

    public chooseAction(gameState: gm.GameState): ActionAndCards {

        // Some error checking.. if hand/table cards are missing, play nothing
        if (gameState.thisPlayerCards.length == 0) {
            return {action: gm.Action.Nothing};
        }

        // Turn hand- and table-cards into HandStack object (for point counting)
        const handStack: gm.HandStack = new gm.HandStack();
        for (const card of gameState.thisPlayerCards) {
            const _card: gm.Card = new gm.Card(card.suit, card.rank);
            handStack.addCard(_card);
        }
        const tableStack: gm.HandStack = new gm.HandStack();
        for (const card of gameState.tableCards) {
            const _card: gm.Card = new gm.Card(card.suit, card.rank);
            tableStack.addCard(_card);
        }

        // Make a list of all possible actions and record associated points\
        const allowedActions: gm.Action[] = gameState.allowedActions;
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
        const bestAction: ActionAndCards = bestActions[randIdx];

        return bestAction;
    }
}


// Cards by name (e.g. 'RosenAs'), to rebuild cards that are only known by name
const CARDS_BY_NAME: Map<string, gm.Card> = new Map(new gm.JassDeck().getCards().map(card => [card.name, card]));

// Saboteur: number of sampled card distributions per decision
const N_SAMPLES: number = 100;
// Saboteur: playouts stop after this many laps without anyone knocking
const MAX_PLAYOUT_LAPS: number = 3;
// Saboteur: how much it minds losing a token itself (it can only sabotage while still in the game)
const SELF_LOSS_WEIGHT: number = 1;

function cardByName(cardName: string): gm.Card {
    const card: gm.Card | undefined = CARDS_BY_NAME.get(cardName);
    if (card === undefined) {
        throw new RangeError(`Unknown card: ${cardName}`);
    }
    return card;
}

function analyzeCards(cards: gm.Card[]): gm.HandValue {
    const handStack: gm.HandStack = new gm.HandStack();
    handStack.addCards(cards);
    return handStack.analyzeHand();
}

function shuffled<T>(items: T[]): T[] {
    const result: T[] = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

// A simplified model of the rest of a round, for playouts. It mirrors the rules in Game:
// turns go round the active players; Losen while the first lap lasts, Chlopfen after it;
// after a knock everyone gets one more turn; Hosenabe / Füür end the round at once.
interface RoundModel {
    order: string[];              // active players in turn order
    hands: Map<string, gm.Card[]>;
    table: gm.Card[];
    currentIdx: number;
    turn: number;                 // turns played this round
    turnsLeft: number | null;     // after a knock: turns until the round ends
}

type ModelMove =
    { kind: 'switch', handIdx: number, tableIdx: number } |
    { kind: 'switchAll' } |
    { kind: 'pass' } |            // Losen, or Chlopfen once someone knocked
    { kind: 'knock' };

function copyModel(model: RoundModel): RoundModel {
    return {
        order: model.order,
        hands: new Map(Array.from(model.hands, ([id, cards]) => [id, cards.slice()])),
        table: model.table.slice(),
        currentIdx: model.currentIdx,
        turn: model.turn,
        turnsLeft: model.turnsLeft
    };
}

function lowestPlayers(model: RoundModel): string[] {
    const points: number[] = model.order.map(id => analyzeCards(model.hands.get(id) as gm.Card[]).points);
    const minPoints: number = Math.min(...points);
    return model.order.filter((_, i) => points[i] === minPoints);
}

function specialEndLosers(model: RoundModel): string[] | null {
    // Players holding Füür / Hosenabe play it right away (as the AI players do)
    for (const id of model.order) {
        if (analyzeCards(model.hands.get(id) as gm.Card[]).hasFeuer) {
            return model.order.filter(other => other !== id);
        }
    }
    for (const id of model.order) {
        if (analyzeCards(model.hands.get(id) as gm.Card[]).hasHosenaben) {
            return lowestPlayers(model);
        }
    }
    return null;
}

function legalMoves(model: RoundModel): ModelMove[] {
    const moves: ModelMove[] = [{kind: 'switchAll'}];
    for (let handIdx = 0; handIdx < 3; handIdx++) {
        for (let tableIdx = 0; tableIdx < 3; tableIdx++) {
            moves.push({kind: 'switch', handIdx, tableIdx});
        }
    }
    if (model.turn < model.order.length) {
        moves.push({kind: 'pass'});
    } else {
        moves.push(model.turnsLeft === null ? {kind: 'knock'} : {kind: 'pass'});
    }
    return moves;
}

function handAfterMove(model: RoundModel, move: ModelMove): gm.Card[] {
    const hand: gm.Card[] = model.hands.get(model.order[model.currentIdx]) as gm.Card[];
    switch (move.kind) {
        case 'switch':
            return hand.map((card, i) => i === move.handIdx ? model.table[move.tableIdx] : card);
        case 'switchAll':
            return model.table.slice();
        default:
            return hand;
    }
}

function applyMove(model: RoundModel, move: ModelMove): string[] | null {
    // Plays the current player's move; returns the round's losers if it ended
    const playerId: string = model.order[model.currentIdx];
    const hand: gm.Card[] = model.hands.get(playerId) as gm.Card[];
    if (move.kind === 'switch') {
        const tableCard: gm.Card = model.table[move.tableIdx];
        model.table[move.tableIdx] = hand[move.handIdx];
        hand[move.handIdx] = tableCard;
    } else if (move.kind === 'switchAll') {
        model.hands.set(playerId, model.table);
        model.table = hand;
    }

    const specialLosers: string[] | null = specialEndLosers(model);
    if (specialLosers !== null) {
        return specialLosers;
    }

    model.turn++;
    if (move.kind === 'knock') {
        model.turnsLeft = model.order.length;
    }
    if (model.turnsLeft !== null) {
        model.turnsLeft--;
        if (model.turnsLeft === 0) {
            return lowestPlayers(model);
        }
    }
    model.currentIdx = (model.currentIdx + 1) % model.order.length;
    return null;
}

function pointsGreedyMove(model: RoundModel): ModelMove {
    // The policy of DeterministicAIPlayer: maximize the own points right away, ties at random
    const moves: ModelMove[] = legalMoves(model);
    const points: number[] = moves.map(move => analyzeCards(handAfterMove(model, move)).points);
    const maxPoints: number = Math.max(...points);
    return pickRandom(moves.filter((_, i) => points[i] === maxPoints));
}

function playOut(model: RoundModel): string[] {
    // Plays the round to its end with every player following the points-greedy policy
    const maxTurns: number = model.turn + MAX_PLAYOUT_LAPS * model.order.length;
    while (model.turn < maxTurns) {
        const losers: string[] | null = applyMove(model, pointsGreedyMove(model));
        if (losers !== null) {
            return losers;
        }
    }
    return lowestPlayers(model); // Nobody knocked: count it as if the round ended now
}


export class SaboteurAIPlayer extends DeterministicAIPlayer {
    /*
    Implementation of AI Player whose sole goal is to make one other (randomly picked) player lose.
    It follows all public card switches to narrow down the other hands, then rates each possible
    action by playing the rest of the round out many times (with the unknown cards dealt at random):
    it picks the action most likely to cost the target a token, while not losing one itself.
    */

    public aiType: gm.AIType = gm.AIType.Saboteur;

    private targetId: string | null = null;
    private knownCardNames: Map<string, string[]> = new Map(); // per player: cards they are known to hold
    private trackedRound: number = -1;
    private nProcessedLogEntries: number = 0;

    protected onGameState(gameState: gm.GameState): void {
        this.updateTarget(gameState);
        this.trackKnownCards(gameState);
    }

    private updateTarget(gameState: gm.GameState): void {
        const players = gameState.playerOverview.players;
        const target = players.find(pl => pl.playerId === this.targetId);
        if (target !== undefined && target.tokens > 0) {
            return;
        }

        // Pick a new target among the other players still in the game
        const candidates = players.filter(pl => pl.playerId !== this.id && pl.tokens > 0);
        this.targetId = candidates.length > 0 ? pickRandom(candidates).playerId : null;
    }

    private trackKnownCards(gameState: gm.GameState): void {
        // New round, new cards
        if (gameState.currentRound !== this.trackedRound) {
            this.trackedRound = gameState.currentRound;
            this.knownCardNames = new Map();
        }

        // Follow everyone's switches in the log
        for (const entry of gameState.log.slice(this.nProcessedLogEntries)) {
            const takenCardNames: string[] | undefined = entry.takenCardNames;
            const givenCardNames: string[] | undefined = entry.givenCardNames;
            if (entry.playerId === null || takenCardNames === undefined || givenCardNames === undefined) {
                continue;
            }
            const known: string[] = this.knownCardNames.get(entry.playerId) || [];
            this.knownCardNames.set(entry.playerId, known
                .filter(cardName => !givenCardNames.includes(cardName))
                .concat(takenCardNames));
        }
        this.nProcessedLogEntries = gameState.log.length;
    }

    private sampleModels(gameState: gm.GameState, myId: string): RoundModel[] {
        // Deals the cards this player can't see at random, keeping what is known about the other hands
        const order: string[] = gameState.playerOverview.players.filter(pl => pl.tokens > 0).map(pl => pl.playerId);
        const myCards: gm.Card[] = gameState.thisPlayerCards.map(card => cardByName(card.name));
        const tableCards: gm.Card[] = gameState.tableCards.map(card => cardByName(card.name));
        const visible: Set<string> = new Set(myCards.concat(tableCards).map(card => card.name));

        const known: Map<string, string[]> = new Map();
        for (const id of order) {
            if (id !== myId) {
                known.set(id, (this.knownCardNames.get(id) || []).filter(name => !visible.has(name)).slice(0, 3));
            }
        }
        const knownNames: Set<string> = new Set(Array.from(known.values()).flat());
        const unseen: gm.Card[] = Array.from(CARDS_BY_NAME.values())
            .filter(card => !visible.has(card.name) && !knownNames.has(card.name));

        const models: RoundModel[] = [];
        for (let i = 0; i < N_SAMPLES; i++) {
            const pool: gm.Card[] = shuffled(unseen);
            const hands: Map<string, gm.Card[]> = new Map();
            for (const id of order) {
                if (id === myId) {
                    hands.set(id, myCards.slice());
                } else {
                    const cards: gm.Card[] = (known.get(id) as string[]).map(cardByName);
                    while (cards.length < 3) {
                        cards.push(pool.pop() as gm.Card);
                    }
                    hands.set(id, cards);
                }
            }
            models.push({
                order,
                hands,
                table: tableCards.slice(),
                currentIdx: Math.max(0, order.indexOf(gameState.currentPlayerId as string)),
                turn: gameState.currentTurn,
                turnsLeft: gameState.isChlopfState ? gameState.numTurnsLeft : null
            });
        }
        return models;
    }

    private rate(losersPerSample: string[][], myId: string): number {
        // Share of samples in which the target loses, minus (weighted) the share in which this player loses
        const targetId: string = this.targetId as string;
        const n: number = losersPerSample.length;
        const targetLosses: number = losersPerSample.filter(losers => losers.includes(targetId)).length;
        const ownLosses: number = losersPerSample.filter(losers => losers.includes(myId)).length;
        return (targetLosses - SELF_LOSS_WEIGHT * ownLosses) / n;
    }

    public chooseAction(gameState: gm.GameState): ActionAndCards {

        const allowedActions: gm.Action[] = gameState.allowedActions;
        const myId: string | null = this.id;
        const isTargetActive: boolean = gameState.playerOverview.players
            .some(pl => pl.playerId === this.targetId && pl.tokens > 0);
        if (myId === null || !isTargetActive || gameState.thisPlayerCards.length !== 3 || gameState.tableCards.length !== 3) {
            return super.chooseAction(gameState);
        }

        // Füür: everyone else loses a token, the target included
        if (allowedActions.includes(gm.Action.Feuer)) {
            return {action: gm.Action.Feuer};
        }

        const models: RoundModel[] = this.sampleModels(gameState, myId);
        const myTurn: boolean = gameState.currentPlayerId === myId;

        // Hosenabe ends the round now and the lowest hand loses: play it if that beats playing on
        const canHosenaben: boolean = allowedActions.includes(gm.Action.Hosenaben);
        const endNowScore: number = canHosenaben ? this.rate(models.map(model => lowestPlayers(model)), myId) : -Infinity;

        if (!myTurn) {
            if (canHosenaben) {
                const playOnScore: number = this.rate(models.map(model => playOut(copyModel(model))), myId);
                if (endNowScore >= playOnScore) {
                    return {action: gm.Action.Hosenaben};
                }
            }
            return {action: gm.Action.Nothing};
        }

        const best = this.bestTurnAction(gameState, models, myId);
        return endNowScore >= best.score ? {action: gm.Action.Hosenaben} : best.actionAndCards;
    }

    private bestTurnAction(gameState: gm.GameState, models: RoundModel[], myId: string): { actionAndCards: ActionAndCards, score: number } {
        // Rates every allowed action by playing the round out from each sampled card distribution
        const allowedActions: gm.Action[] = gameState.allowedActions;
        const handNames: string[] = gameState.thisPlayerCards.map(card => card.name);
        const tableNames: string[] = gameState.tableCards.map(card => card.name);

        const candidates: { actionAndCards: ActionAndCards, move: ModelMove }[] = [];
        if (allowedActions.includes(gm.Action.Switch)) {
            for (let handIdx = 0; handIdx < 3; handIdx++) {
                for (let tableIdx = 0; tableIdx < 3; tableIdx++) {
                    candidates.push({
                        actionAndCards: {
                            action: gm.Action.Switch,
                            switchCards: {playerCardName: handNames[handIdx], tableCardName: tableNames[tableIdx]}
                        },
                        move: {kind: 'switch', handIdx, tableIdx}
                    });
                }
            }
        }
        if (allowedActions.includes(gm.Action.SwitchAll)) {
            candidates.push({actionAndCards: {action: gm.Action.SwitchAll}, move: {kind: 'switchAll'}});
        }
        if (allowedActions.includes(gm.Action.Losen)) {
            candidates.push({actionAndCards: {action: gm.Action.Losen}, move: {kind: 'pass'}});
        }
        if (allowedActions.includes(gm.Action.Chlopfen)) {
            const move: ModelMove = gameState.isChlopfState ? {kind: 'pass'} : {kind: 'knock'};
            candidates.push({actionAndCards: {action: gm.Action.Chlopfen}, move});
        }

        let best = {actionAndCards: candidates[0].actionAndCards, score: -Infinity};
        for (const candidate of candidates) {
            // The same samples for every candidate, so they're compared on equal terms
            const losersPerSample: string[][] = models.map(sample => {
                const model: RoundModel = copyModel(sample);
                const losers: string[] | null = applyMove(model, candidate.move);
                return losers !== null ? losers : playOut(model);
            });
            const score: number = this.rate(losersPerSample, myId);
            if (score > best.score || (score === best.score && Math.random() < 0.5)) {
                best = {actionAndCards: candidate.actionAndCards, score};
            }
        }
        return best;
    }
}
