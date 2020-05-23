// Helper functions
function makeId(length: number): string {
    let result: string = '';
    let characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength: number = characters.length;
    for (let i: number = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// A single playing card
export enum CardSuit {
    Schilten = 'Schilten', 
    Eicheln = 'Eicheln', 
    Rosen = 'Rosen', 
    Schellen = 'Schellen'
};

export enum CardRank {
    Sechs = 'Sechs',
    Sieben = 'Sieben',
    Acht = 'Acht',
    Neun = 'Neun',
    Banner = 'Banner',
    Under = 'Under',
    Ober = 'Ober',
    Koenig = 'Koenig',
    As = 'As'
};

export class Card {
    
    readonly suit: CardSuit;
    readonly rank: CardRank;
    readonly name:string;
    
    constructor (suit: CardSuit, rank: CardRank) {
        this.suit = suit;
        this.rank = rank;
        this.name = suit.concat(rank);
    }

    public getPrintName(): string {
        return `${this.suit.toString()} ${this.rank.toString()}`;
    }

    public getPoints(): number {
        let points: number;
        switch(this.rank) {
            case CardRank.Sechs:
                points = 6;
                break;
            case CardRank.Sieben:
                points = 7;
                break;
            case CardRank.Acht:
                points = 8;
                break;
            case CardRank.Neun:
                points = 9;
                break;
            case CardRank.Banner:
                points = 10;
                break;
            case CardRank.Under:
                points = 10;
                 break;
            case CardRank.Ober:
                points = 10;
                break;
            case CardRank.Koenig:
                points = 10;
                break;
            case CardRank.As:
                points = 11;
                break;
        }
        return points;
    }
}

// A stack of cards
export class CardStack {

    private cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    };
    
    public drawCard(): Card {
        // Samples, removes, and returns a random card
        if (this.cards.length == 0) {
            throw new Error('Cannot draw card; no cards in deck.');
        }

        const idx: number = Math.floor(Math.random() * this.cards.length);
        const card: Card = this.cards.splice(idx, 1)[0];
        return card;
    }

    public addCard(card: Card): void {
        // Adds the card to the end of the stack
        if (!this.cards.includes(card)) {
            this.cards.push(card);
        }
    }

    public addCards(cards: Card[]): void {
        // Adds the array of cards to the stack
        for (const card of cards) {
            this.addCard(card);
        }
    }

    public addCardAtIndex(card: Card, index: number) {
        if (index <= this.cards.length && index >= 0) {
            this.cards.splice(index, 0, card);
        } else {
            throw new RangeError('Cannot add card at index.');
        }
    }

    public hasCard(cardName: string): boolean {
        return this.cards.some(card => card.name === cardName);
    }

    public getCardIndex(cardName: string): number {
        if (!this.hasCard(cardName)) {
            throw new RangeError('Card not found.');
        }
        return this.cards.findIndex(card => card.name === cardName);
    }

    public popCard(cardName: string): Card {
        // Removes and returns card
        if (!this.hasCard(cardName)) {
            throw new RangeError('Card not found.');
        }
        const idx: number = this.cards.findIndex(card => card.name === cardName);
        const card = this.cards.splice(idx, 1)[0];
        return card;
    }

    public getCards(): Card[] {
        return this.cards;
    }

    public popCards(): Card[] {
        // Removes and returns all cards
        return this.cards.splice(0, this.cards.length);
    }

    public getNCards(): number {
        return this.cards.length;
    }

    public print(): void {
        // Print this cardstack
        this.cards.forEach(card => {
            console.log(card.name);
        });
    }

    public getCardNames(): string[] {
        return this.cards.map(card => card.name);
    }

    public getCardPrintName(cardName: string): string {
        // Returns pretty printable name for card
        if (!this.hasCard(cardName)) {
            throw new RangeError('Card not found.');
        }
        return this.cards.find(cr => cr.name == cardName).getPrintName();
    }
}

// The Jass deck
export class JassDeck extends CardStack {

    constructor() {
        super([]);
        this.addCards(this.makeJassCards());
    }

    private makeJassCards(): Card[] {
        let cards: Card[] = [];
        for (const iterSuit in CardSuit) {
            const suit: CardSuit = iterSuit as CardSuit;
            for (const iterRank of Object.values(CardRank)) {
                const rank: CardRank = CardRank[iterRank] as any as CardRank;
                let card: Card = new Card(suit, rank);
                cards.push(card);
            }
        }
        return cards;
    }
}

// The hand stack
export interface HandValue {
    readonly isValid: boolean;
    readonly points: number;
    readonly hasHosenaben: boolean;
    readonly hasFeuer: boolean;
}

export class HandStack extends CardStack {
    // Enforces the 3 card limit & allows counting points

    constructor() {
        super([]);
    }

    public addCard(card: Card): void {
        if (this.getNCards() >= 3) {
            throw new Error('Cannot add card to hand stack; maximum of 3 cards.');
        }
        super.addCard(card);
    }

    public addCardAtIndex(card: Card, index: number): void {
        if (this.getNCards() >= 3) {
            throw new Error('Cannot add card to hand stack; maximum of 3 cards.');
        }
        super.addCardAtIndex(card, index);
    }

    public analyzeHand(): HandValue {

        if (this.getNCards() != 3) {
            // Only hands of 3 cards are valid
            return {
                isValid: false,
                points: 0,
                hasHosenaben: false,
                hasFeuer: false
            }; 
        }

        // Analyze cards and establish regular points
        let suits: CardSuit[] = [];
        let ranks: CardRank[] = [];
        let suitPoints: number[] = [];
        const cards: Card[] = this.getCards();
        for (const card of cards) {
            if (!suits.includes(card.suit)) {
                suits.push(card.suit);
                suitPoints.push(card.getPoints());
            } else {
                const idx: number = suits.findIndex(s => s===card.suit);
                suitPoints[idx] = suitPoints[idx] + card.getPoints();
            }
            if (!ranks.includes(card.rank)) {
                ranks.push(card.rank);
            }
        }
        let points: number = Math.max(...suitPoints);

        // Check for triplet
        let hasTriplet: boolean = false;
        if (suits.length == 3 && ranks.length == 1) {
            points = 30.5;
            hasTriplet = true;
        }

        // Check for feuer
        let hasFeuer: boolean = false;
        if (hasTriplet && ranks[0] == CardRank.As) {
            points = 33;
            hasFeuer = true;
        }

        // Check for hosenaben
        let hasHosenaben: boolean = false;
        if (suits.length == 1 && points == 31) {
            hasHosenaben = true;
        }

        return {
            isValid: true,
            points: points,
            hasFeuer: hasFeuer,
            hasHosenaben: hasHosenaben
        };
    }
}

// Player
export class Player {

    readonly id: string;
    private tokens: number;
    public isHuman: boolean;
    public name: string;
    public hand: HandStack;

    constructor(
        name: string, 
        isHuman: boolean,
        tokens: number = 3,
        idLength: number = 8
        ) {
            this.name = name;
            this.isHuman = isHuman;
            this.tokens = tokens;
            this.hand = new HandStack();
            this.id = makeId(idLength);
    }

    public getTokens(): number {
        return this.tokens;
    }

    public setTokens(tokens: number): void {
        this.tokens = tokens;
    }

    public analyzeHand(): HandValue {
        return this.hand.analyzeHand();
    }
}

// The game
export enum GameEndReason {
    Chlopf = 'Chlopf',
    Hosenaben = 'Hosenaben',
    Feuer = 'Feuer'
}

export enum Action {
    Switch = 'Switch',
    SwitchAll = 'SwitchAll',
    Losen = 'Losen',
    Chlopfen = 'Chlopfen',
    Hosenaben = 'Hosenaben',
    Feuer = 'Feuer',
    Nothing = 'Nothing'
}

export interface LogMessage {
    readonly playerId: string,
    readonly playerName: string,
    readonly message: string
}

export interface PlayerScorecard {
    readonly id: string,
    readonly name: string,
    readonly tokens: number,
    readonly tokensDiff: number,
    readonly points:number,
    readonly hasHosenaben: boolean,
    readonly hasFeuer: boolean,
    readonly handCardNames: string[]
}

export interface RoundScorecard {
    readonly round: number,
    readonly gameEndReason: GameEndReason,
    readonly lastPlayerName: string,
    readonly tableCardNames: string[],
    readonly playerScorecards: PlayerScorecard[]
}

export interface PlayerOverview {
    readonly players: {
        playerId: string, 
        playerName: string,
        isHuman: boolean,
        tokens: number}[]
}

export interface GameState {

    readonly gameId: string,
    readonly thisPlayerId: string,
    
    // Cards
    readonly thisPlayerCards: Card[],
    readonly tableCards: Card[],
    
    // Players
    readonly playerOverview: PlayerOverview,

    // Allowed actions
    readonly allowedActions: Action[],

    // Game state
    readonly isGameStarted: boolean,
    readonly isGameEnded: boolean,
    readonly isRoundOngoing: boolean,
    readonly currentRound: number,
    readonly isRoundEnded: boolean,
    readonly currentTurn: number,
    readonly numTurnsLeft: number,
    readonly currentPlayerId: string,
    readonly isChlopfState: boolean,

    // Scorecards
    readonly scorecards: RoundScorecard[],

    // Logging
    readonly log: LogMessage[]
}

export class Game {
    
    readonly id: string;
    
    private deck: CardStack;
    private table: CardStack;
    private players: Player[];

    private isGameStarted: boolean;
    private isGameEnded: boolean;
    private isRoundOngoing: boolean;
    private isRoundEnded: boolean;
    private currentRound: number;
    private currentTurn: number;
    private numTurnsLeft: number;
    private currentPlayerId: string;
    private currentStartingPlayerId: string;
    private isChlopfState: boolean;

    private scorecards: RoundScorecard[];

    private log: LogMessage[];

    constructor(player: Player, idLength: number = 8) {
        this.id = makeId(idLength);
        
        // Cards
        this.deck = new JassDeck();
        this.table = new CardStack([]);

        // Players
        this.players = [];
        this.addPlayer(player);

        // Game state
        this.isGameStarted = false;
        this.isRoundOngoing = false;
        this.isGameEnded = false;
        this.isRoundEnded = false;
        this.currentRound = -1;
        this.currentTurn = -1;
        this.numTurnsLeft = 99;
        this.currentStartingPlayerId = player.id;
        this.currentPlayerId = player.id;
        this.isChlopfState = false;

        // Scores
        this.scorecards = [];

        // Log
        this.log = [];
    }

    // Private helper methods
    private drawFromDeck(n: number): Card[] {
        if (n > this.deck.getNCards()) {
            throw new Error('Not enough cards in deck.');
        }
        let cards: Card[] = [];
        for (let i: number = 0; i < n; i++) {
            let card: Card = this.deck.drawCard();
            cards.push(card);
        }
        return cards;
    }

    private getPlayerIndex(playerId: string): number {
        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Card not found.');
        }
        return this.players.findIndex(player => player.id === playerId);
    }

    private isLosenLegal(): boolean {
        return (this.currentTurn < this.getNActivePlayers());
    }

    private isChlopfLegal(): boolean {
        return !this.isLosenLegal();
    }

    private addLogMessage(message:string, playerId: string = null): void {
        let playerName = null;
        if (playerId != null) {
            playerName = this.getPlayerName(playerId);
        }
        this.log.push({playerId: playerId, playerName: playerName, message:message});
    }

    // Player controls
    public canAddPlayer(playerId: string): boolean {
        return this.isGameJoinable() && !this.hasPlayer(playerId);
    }

    public addPlayer(player: Player): void {
        if (!this.canAddPlayer(player.id)) {
            throw new Error('Cannot add player to game.');
        }
        player.setTokens(3);
        this.players.push(player);
    }

    public removePlayer(playerId: string): void {
        if (!this.hasPlayer(playerId)) {
            throw new Error('Cannot remove player; player not found.');
        }

        // Log
        this.addLogMessage('isch gange.', playerId);

        // Increment player
        if (this.isRoundOngoing && this.currentPlayerId === playerId) {
            this.incrementPlayer();
        }

        // Increment the starting player
        this.currentStartingPlayerId = this.getNextPlayerId(playerId);

        // Put player's cards back on stack
        let player: Player = this.getPlayer(playerId);
        const cards: Card[] = player.hand.popCards();
        this.deck.addCards(cards);

        // Remove the player
        const idx: number = this.getPlayerIndex(playerId);
        this.players.splice(idx, 1)[0];
    }

    public hasPlayer(playerId: string): boolean {
        return this.players.some(pl => pl.id === playerId);
    }

    public getPlayer(playerId: string): Player {
        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Player not found.');
        }
        return this.players.find(pl => pl.id === playerId);
    }

    public getActivePlayers(): Player[] {
        return this.players.filter(pl => pl.getTokens() > 0);
    }

    public getAIPlayers(): Player[] {
        return this.players.filter(pl => !pl.isHuman);
    }

    // Game state queries
    public getNPlayers(): number {
        return this.players.length;
    }

    public getNActivePlayers(): number {
        return this.players.filter(pl => pl.getTokens() > 0).length;
    }

    public getNHumanPlayers(): number {
        return this.players.filter(pl => pl.isHuman).length;
    }

    public getPlayerIds(): string[] {
        return this.players.map(pl => pl.id);
    }

    public getPlayerNames(): string[] {
        return this.players.map(pl => pl.name);
    }

    public getPlayerName(playerId: string): string {
        return this.getPlayer(playerId).name;
    }

    public getIsGameStarted(): boolean {
        return this.isGameStarted;
    }

    public getIsRoundOngoing(): boolean {
        return this.isRoundOngoing;
    }

    public getIsRoundEnded(): boolean {
        return this.isRoundEnded;
    }

    public getCurrentPlayerId(): string {
        return this.currentPlayerId;
    }

    public isGameJoinable(): boolean {
        return this.getNPlayers() < 11 && !this.isGameStarted;
    }

    public isGameStartable(): boolean {
        return !this.isGameStarted && this.getNPlayers() > 1;
    }

    public canPlayerTakeAction(playerId: string, action: Action): boolean {
        const allowedActions: Action[] = this.getAllowedActions(playerId);
        return allowedActions.includes(action);
    }

    public getAllowedActions(playerId: string): Action[] {
        // Notes: 
        // For now, Hosenaben & Feuer can only be played if the player has the respective combo
        let actions: Action[] = [];
        if (this.isRoundOngoing) {
            const handValue: HandValue = this.getPlayer(playerId).analyzeHand();
            // Player can play hosenaben & feuer at any time
            if (handValue.hasFeuer) {
                actions.push(Action.Feuer);
            }
            if (handValue.hasHosenaben) {
                actions.push(Action.Hosenaben);
            }
            if (this.currentPlayerId == playerId) {
                // These actions only allowed if it's their turn
                actions.push(
                    Action.Switch, 
                    Action.SwitchAll
                );
                if (this.isLosenLegal()) {
                    actions.push(Action.Losen);
                }
                if (this.isChlopfLegal()) {
                    actions.push(Action.Chlopfen);
                }
            } else {
                // Player can only play 'nothing' if it isn't their turn..
                // or if no cards have been distributed (see below)
                // This is only relevant for AI player
                actions.push(Action.Nothing); 
            }
        } else {
            actions.push(Action.Nothing);
        }
        return actions;
    }

    public getCurrentRound(): number {
        return this.currentRound;
    }

    public getIsGameEnded(): boolean {
        return this.isGameEnded;
    }

    public getTable(): CardStack {
        return this.table;
    }

    public getDeck(): CardStack {
        return this.deck;
    }

    public getScorecards(): RoundScorecard[] {
        return this.scorecards;
    }

    public getGameState(playerId: string): GameState {
        // Returns game state from perspective of a player
        // All objects are clones, so the game-state is immutable

        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Player not found.');
        }

        const playerOverview: PlayerOverview = {
            players: this.players.map(function(pl) {
                return {
                    playerId: pl.id, 
                    playerName: pl.name, 
                    isHuman: pl.isHuman,
                    tokens: pl.getTokens()}
            })
        };

        const gameState: GameState = {
            gameId: this.id,

            thisPlayerId: playerId,

            thisPlayerCards: this.getPlayer(playerId).hand.getCards(),
            tableCards: this.getTable().getCards(),

            playerOverview: playerOverview,
            allowedActions: this.getAllowedActions(playerId),
            isGameStarted: this.isGameStarted,
            isGameEnded: this.isGameEnded,
            isRoundOngoing: this.isRoundOngoing,
            isRoundEnded: this.isRoundEnded,
            currentRound: this.currentRound,
            currentTurn: this.currentTurn,
            numTurnsLeft: this.numTurnsLeft,
            currentPlayerId: this.currentPlayerId,
            isChlopfState: this.isChlopfState,

            scorecards: this.getScorecards(),

            log: this.log
        };

        const gameStateClone: GameState = JSON.parse(JSON.stringify(gameState));
        return gameStateClone;
    }

    // Public game controls
    public startGame(): void {
        if (this.isGameStarted) {
            throw new Error('Game already started.');
        } 
        
        this.isGameStarted = true;
        this.startRound();
    }

    public startRound(): void {

        // Check whether we can start round
        if (!this.isGameStarted || this.isGameEnded || this.isRoundOngoing) {
            throw new Error('Round cannot be started.');
        }

        // Reset game state
        this.isRoundOngoing = true;
        this.isRoundEnded = false;
        this.currentRound++;
        this.currentTurn = 0;
        this.numTurnsLeft = 99;
        this.isChlopfState = false;

        // Hand out cards
        for (const player of this.players) {
            if (player.getTokens() > 0) {
                player.hand.addCards(this.drawFromDeck(3));
            }
        }
        this.table.addCards(this.drawFromDeck(3));

        // Set first player
        this.currentPlayerId = this.currentStartingPlayerId; 

        // Log message
        this.addLogMessage(`Rundi ${this.currentRound} hät agfange.`);
    }

    public takeActionChlopf(playerId: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.Chlopfen)) {
            throw new Error('Player cannot take action chlopf.');
        }

        // 2 Log message
        this.addLogMessage(`hät gchlopfet.`, playerId);

        // 3 Increment counters

        // 4 Update cards / game state
        if (this.isChlopfState == false) {
            this.isChlopfState = true;
            this.numTurnsLeft = this.getNActivePlayers();
        }

        // 4 End the turn
        this.endTurn(playerId);
    }

    public takeActionLosen(playerId: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.Losen)) {
            throw new Error('Player cannot take action losen.');
        }

        // 2 Log message
        this.addLogMessage(`hät gloset.`, playerId);

        // 3 Increment counters

        // 4 Update cards / game state

        // 5 End the turn
        this.endTurn(playerId);
    }

    public takeActionSwitch(playerId: string, playerCardName: string, tableCardName: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.Switch)) {
            throw new Error('Player cannot take action switch.');
        }
        const player: Player = this.getPlayer(playerId);
        if (!player.hand.hasCard(playerCardName)) {
            throw new Error('Player cannot take action switch; player does not have card.');
        }
        if (!this.table.hasCard(tableCardName)) {
            throw new Error('Player cannot take action switch; table does not have card.');
        }

        // 2 Log message
        const tableCardPrintName: string = this.table.getCardPrintName(tableCardName);
        const playerCardPrintName: string = player.hand.getCardPrintName(playerCardName);
        this.addLogMessage(`nimmt ${tableCardPrintName} und leit ${playerCardPrintName}.`, playerId);

        // 3 Increment counters

        // 4 Update cards / game state
        const playerCardIndex: number = player.hand.getCardIndex(playerCardName);
        const tableCardIndex: number = this.table.getCardIndex(tableCardName);
        const playerCard: Card = player.hand.popCard(playerCardName);
        const tableCard: Card = this.table.popCard(tableCardName);
        player.hand.addCardAtIndex(tableCard, playerCardIndex);
        this.table.addCardAtIndex(playerCard, tableCardIndex);

        // 5 End the turn
        this.endTurn(playerId);
    }

    public takeActionSwitchAll(playerId: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.SwitchAll)) {
            throw new Error('Player cannot take action switch all.');
        }

        // 2 Log message
        let cardString: string = '';
        const cardNames = this.table.getCardNames();
        for (let i = 0; i < cardNames.length; i++) {
            switch(i) {
                case 0: 
                    break;
                case 1: 
                    cardString = cardString.concat(', ');
                    break;
                case 2:
                    cardString = cardString.concat(' und ');
                    break;
            }
            cardString = cardString.concat(this.table.getCardPrintName(cardNames[i]));
        }
        this.addLogMessage(`nimmt ${cardString}.`, playerId);

        // 3 Increment counters

        // 4 Update cards / game state
        const player: Player = this.getPlayer(playerId);
        const playerCards: Card[] = player.hand.popCards();
        const tableCards: Card[] = this.table.popCards();
        player.hand.addCards(tableCards);
        this.table.addCards(playerCards);

        // 5 End the turn
        this.endTurn(playerId);
    }

    public takeActionHosenaben(playerId: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.Hosenaben)) {
            throw new Error('Player cannot take action hosenaben.');
        }

        // 2 Log
        this.addLogMessage(`spilt HOSENABE!`, playerId);

        // 3 Increment counters

        // 4 Successful hosenaben ends the round
        this.endRound(playerId, GameEndReason.Hosenaben);
    }

    public takeActionFeuer(playerId: string): void {
        // 1 Check whether action allowed
        if (!this.canPlayerTakeAction(playerId, Action.Feuer)) {
            throw new Error('Player cannot take action feuer.');
        }

        // 2 Log
        this.addLogMessage(`spilt FÜÜR!`, playerId);

        // 3 Increment counters

        // 4 Successful feuer ends the round
        this.endRound(playerId, GameEndReason.Feuer);
    }

    public endTurn(playerId: string): void {

        // Check whether player can end turn
        if (!(this.isRoundOngoing && this.currentPlayerId == playerId)) {
            throw new Error('Player cannot end turn.');
        }

        // Increment / reset counters
        this.currentTurn++;

        // Check whether we need to end the round due to chlopf
        let isRoundEnded: boolean = false;
        if (this.isChlopfState) {
            this.numTurnsLeft--;
            if (this.numTurnsLeft == 0) {
                this.endRound(this.currentPlayerId, GameEndReason.Chlopf);
                isRoundEnded = true;
            }
        }

        // Increment player
        if (!isRoundEnded) {
            this.incrementPlayer();
        }
    }

    // Private game-state controls
    private getNextPlayerId(playerId: string): string {
        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Player not found.');
        }
        let retVal: string;
        let idx: number = this.players.findIndex(x => playerId == x.id);
        if (idx + 1 == this.players.length) {
            retVal = this.players[0].id;
        } else {
            retVal = this.players[idx+1].id;
        }
        return retVal;
    }

    private incrementPlayer(): void {
        // Set next player
        const activePlayers: Player[] = this.getActivePlayers();
        if (activePlayers.length > 0) {
            let idx: number = activePlayers.findIndex(x => this.currentPlayerId == x.id);
            if (idx + 1 == activePlayers.length) {
                this.currentPlayerId = activePlayers[0].id;
            } else {
                this.currentPlayerId = activePlayers[idx+1].id;
            }
        }
    }

    private changePlayerToken(playerId: string, tokensDelta: number): void {
        if (!this.hasPlayer(playerId)) {
            throw new RangeError('Player not found.');
        }
        let player: Player = this.players.find(pl => pl.id == playerId);
        player.setTokens(player.getTokens() + tokensDelta);
    }

    private endRound(lastPlayerId: string, reason: GameEndReason): void {

        this.isRoundOngoing = false;
        this.isRoundEnded = true;
        let roundScorecard: RoundScorecard;
        const activePlayers: Player[] = this.getActivePlayers();

        // Log
        this.addLogMessage(`Rundi ${this.currentRound} isch fertig.`);

        // Count points
        let points: number[] = [];
        for (const player of activePlayers) {
            const handValue: HandValue = player.analyzeHand();
            points.push(handValue.points);
        }
        const minPoints: number = Math.min(...points);

        // Determine loser(s), account for tokens, and make scorecards
        let playerScorecards: PlayerScorecard[] = [];
        for (const player of activePlayers) {
            const handValue: HandValue = player.analyzeHand();
            const cardNames: string[] = player.hand.getCardNames();

            let tokensDiff: number;
            if (reason == GameEndReason.Chlopf || reason == GameEndReason.Hosenaben) {
                tokensDiff = (handValue.points == minPoints) ? -1 : 0;
            } else if (reason == GameEndReason.Feuer) {
                tokensDiff = (player.id == lastPlayerId) ? 0 : -1;
            }

            this.changePlayerToken(player.id, tokensDiff);
            const thisScorecard: PlayerScorecard = {
                id: player.id,
                name: player.name,
                tokens: player.getTokens(),
                tokensDiff: tokensDiff,
                points: handValue.points,
                hasHosenaben: handValue.hasHosenaben,
                hasFeuer: handValue.hasFeuer,
                handCardNames: cardNames
            };
            playerScorecards.push(thisScorecard);
        }

        roundScorecard = {
            round: this.currentRound,
            gameEndReason: reason,
            lastPlayerName: this.getPlayerName(lastPlayerId),
            tableCardNames: this.table.getCardNames(),
            playerScorecards: playerScorecards
        };
        this.scorecards.push(roundScorecard);

        // Put cards back in deck
        for (const player of activePlayers) {
            const cards: Card[] = player.hand.popCards();
            this.deck.addCards(cards);
        }
        const cards: Card[] = this.table.popCards();
        this.deck.addCards(cards);

        // Unset the current player
        this.currentPlayerId = null;

        // Set the player starting the next round
        let currentIdx = this.players.findIndex(pl => pl.id == this.currentStartingPlayerId);
        let found = false;
        for (let i = 0; i < this.players.length; i++) {
            if (currentIdx == this.players.length - 1) {
                currentIdx = 0;
            } else {
                currentIdx++;
            }
            if (this.players[currentIdx].getTokens() > 0) {
                found = true;
                break;
            }
        }
        if (found) {
            this.currentStartingPlayerId = this.players[currentIdx].id;
        }

        // If there are less than 2 players left: end game
        if (this.getNActivePlayers() < 2) {
            this.endGame();
        }
    }

    private endGame(): void {
        this.isGameEnded = true;
    }
}
