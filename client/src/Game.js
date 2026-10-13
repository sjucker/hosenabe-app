import React from "react";
import api from "./api";
import {GameWaitingArea} from "./GameWaitingArea";
import {GameScreen} from "./GameScreen";
import {arrayContentEqual} from "./App";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import ChatIcon from "@material-ui/icons/Chat";
import {makeStyles} from "@material-ui/core/styles";

const useTurnInfoStyles = makeStyles(theme => ({
    root: {
        top: 80,
        // Phones: show it over the app bar, so it doesn't cover the game status on the table
        [theme.breakpoints.down('xs')]: {
            top: 4
        }
    }
}));

function TurnInfo({open, onClose}) {
    const classes = useTurnInfoStyles();
    return (
        <Snackbar
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            className={classes.root}
            autoHideDuration={3000}
            open={open}
            onClose={onClose}
        >
            <Alert severity="success" variant="filled">Du bisch dra</Alert>
        </Snackbar>
    );
}

export class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isGameStarted: false,
            isRoundOngoing: false,
            isRoundEnded: false,
            isGameEnded: false,
            currentRound: 0,
            numTurnsLeft: 0,
            players: [],
            currentPlayerId: null,
            myTurn: false,
            myTokens: 3,
            allowedActions: [],
            tableCardNames: ['back', 'back', 'back'],
            playerCardNames: ['back', 'back', 'back'],
            tableCardsHighlighted: [false, false, false],
            playerCardsHighlighted: [false, false, false],
            scorecardInfo: {display: false, scorecard: null},
            logEntries: [],
            myTurnInfoOpen: false,
            isChlopfState: false,
            trashTalkMessage: null,
            hasReceivedGameState: false,
            isSpectator: false,
            playerHands: [],
            spectators: [],
            saboteurTargets: []
        };

        this.handleGameStateUpdate = this.handleGameStateUpdate.bind(this);
        this.handleGameExitResponse = this.handleGameExitResponse.bind(this);
        this.handleServerError = this.handleServerError.bind(this);
        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleCardClick = this.handleCardClick.bind(this);
        this.trashTalk = this.trashTalk.bind(this);
        this.handleTrashTalk = this.handleTrashTalk.bind(this);
    }

    componentDidMount() {
        /* Set the callback for receiving game state updates*/
        api.setCallbackOnMessage('game update', this.handleGameStateUpdate);

        /* Set the callback for receiving a server error*/
        api.setCallbackOnMessage('server error', this.handleServerError);

        /* Set the callback for receiving game exit response */
        api.setCallbackOnMessage('response game exit', this.handleGameExitResponse);

        api.setCallbackOnMessage('trashtalk', this.handleTrashTalk)

        /* Request game state update from the server*/
        const message = {playerId: this.props.playerInfo.id};
        api.emitToServer('request game update', message);
    }

    componentWillUnmount() {
        api.removeCallbackOnMessage('game update', this.handleGameStateUpdate);
        api.removeCallbackOnMessage('server error', this.handleServerError);
        api.removeCallbackOnMessage('response game exit', this.handleGameExitResponse);
        api.removeCallbackOnMessage('trashtalk', this.handleTrashTalk);
    }

    handleServerError(message) {
        switch (message.type) {
            case 'player not found':
                console.error('server did not find player - resetting app.');
                this.props.setPlayerInfo(false); // Set player to unregistered -> will take them back to start screen
                break;
            default:
                break;
        }
    }

    handleGameStateUpdate(gameState) {

        /* Get new card names */
        let playerCardNames = gameState.thisPlayerCards.map(cr => cr.name);
        playerCardNames = (playerCardNames.length !== 3) ? ['back', 'back', 'back'] : playerCardNames;
        let tableCardNames = gameState.tableCards.map(cr => cr.name);
        tableCardNames = (tableCardNames.length !== 3) ? ['back', 'back', 'back'] : tableCardNames;

        /* Unselect cards if changed */
        if (!arrayContentEqual(playerCardNames, this.state.playerCardNames)) {
            this.setState({
                playerCardsHighlighted: [false, false, false]
            });
        }

        if (!arrayContentEqual(tableCardNames, this.state.tableCardNames)) {
            this.setState({
                tableCardsHighlighted: [false, false, false]
            });
        }

        /* Set new card names */
        this.setState({
            playerCardNames: playerCardNames,
            tableCardNames: tableCardNames
        });

        /* Check whether it's this player's turn */
        const myTurn = (gameState.isRoundOngoing && gameState.currentPlayerId === this.props.playerInfo.id);
        this.setState({myTurn: myTurn});
        this.setState({myTurnInfoOpen: myTurn})
        this.setState({isChlopfState: gameState.isChlopfState})

        /* Update player's tokens (spectators have none) */
        const me = gameState.playerOverview.players.find(pl => pl.playerId === this.props.playerInfo.id);
        this.setState({myTokens: me ? me.tokens : 0});

        /* If the round just ended (or we (re)joined while its scorecard is due): update the scorecard and display it */
        if (gameState.isRoundEnded && (this.state.isRoundOngoing || !this.state.hasReceivedGameState)) {
            const currentRound = gameState.currentRound;
            const scorecard = gameState.scorecards[currentRound];
            const scorecardInfo = {
                display: true,
                scorecard: scorecard
            }
            this.setState({
                scorecardInfo: scorecardInfo
            });
        }

        /* Update remaining state attributes */
        this.setState({
            isGameStarted: gameState.isGameStarted,
            isGameEnded: gameState.isGameEnded,
            isRoundOngoing: gameState.isRoundOngoing,
            isRoundEnded: gameState.isRoundEnded,
            currentRound: gameState.currentRound,
            numTurnsLeft: gameState.numTurnsLeft,
            players: gameState.playerOverview.players,
            currentPlayerId: gameState.currentPlayerId,
            allowedActions: gameState.allowedActions,
            logEntries: gameState.log.reverse(),
            hasReceivedGameState: true,
            isSpectator: gameState.isSpectator,
            playerHands: gameState.playerHands,
            spectators: gameState.spectators,
            saboteurTargets: gameState.saboteurTargets
        });
    }

    handleGameExitResponse(message) {
        // Server says this player exits game
        this.props.setGameJoined(false);
    }

    handleTrashTalk(message) {
        this.setState({trashTalkMessage: message})
    }

    handleMenuButtonClick(buttonId) {

        if (buttonId === 'exitGame') {
            const message = {playerId: this.props.playerInfo.id};
            api.emitToServer('request game exit', message);
        }

        if (buttonId === 'startGame') {
            const message = {playerId: this.props.playerInfo.id};
            api.emitToServer('request game start', message);
        }

        if (buttonId === 'addAI') {
            const message = {playerId: this.props.playerInfo.id, aiType: 'Standard'};
            api.emitToServer('request add ai', message);
        }

        if (buttonId === 'addSaboteur') {
            const message = {playerId: this.props.playerInfo.id, aiType: 'Saboteur'};
            api.emitToServer('request add ai', message);
        }

        const allowedActions = this.state.allowedActions;

        if (buttonId === 'switchAll' && allowedActions.includes('SwitchAll')) {
            const switchAllRequest = {playerId: this.props.playerInfo.id};
            api.emitToServer('request switch all', switchAllRequest);
        }

        if (buttonId === 'losen' && allowedActions.includes('Losen')) {
            const losenRequest = {playerId: this.props.playerInfo.id};
            api.emitToServer('request losen', losenRequest);
        }

        if (buttonId === 'chlopfen' && allowedActions.includes('Chlopfen')) {
            const chlopfenRequest = {playerId: this.props.playerInfo.id};
            api.emitToServer('request chlopfen', chlopfenRequest);
        }

        if (buttonId === 'hosenaben' && allowedActions.includes('Hosenaben')) {
            const hosenRequest = {playerId: this.props.playerInfo.id};
            api.emitToServer('request hosenaben', hosenRequest);
        }

        if (buttonId === 'feuer' && allowedActions.includes('Feuer')) {
            const feuerRequest = {playerId: this.props.playerInfo.id};
            api.emitToServer('request feuer', feuerRequest);
        }

        if (buttonId === 'acknowledgeScore') {
            const message = {playerId: this.props.playerInfo.id};
            // Only players still in the game can request new round start
            if (this.state.myTokens > 0) {
                api.emitToServer('request round start', message);
            }
            this.setState((state) => {
                return {
                    scorecardInfo: {display: false, scorecard: state.scorecardInfo.scorecard}
                }
            });
        }
    }

    trashTalk(message) {
        api.emitToServer('make trashtalk', {
            playerId: this.props.playerInfo.id,
            message: message
        });
    }

    handleCardClick(clickedCard) {
        /*
          Highlights card if clicked (unless it was already highlighted).
          Unhighlights all other cards.
        */
        // Cards can only be selected when switching is possible
        if (!this.state.allowedActions.includes('Switch')) {
            return;
        }

        var tableCardsHighlighted = this.state.tableCardsHighlighted.slice();
        var playerCardsHighlighted = this.state.playerCardsHighlighted.slice();
        var newState;
        if (clickedCard.cardRowName === 'table') {
            newState = !tableCardsHighlighted[clickedCard.clickedCardIdx];
            tableCardsHighlighted = [false, false, false];
            tableCardsHighlighted[clickedCard.clickedCardIdx] = newState;
            this.setState({tableCardsHighlighted: tableCardsHighlighted});
        } else {
            newState = !playerCardsHighlighted[clickedCard.clickedCardIdx];
            playerCardsHighlighted = [false, false, false];
            playerCardsHighlighted[clickedCard.clickedCardIdx] = newState;
            this.setState({playerCardsHighlighted: playerCardsHighlighted});
        }

        /*
          Issue switch request if two cards are highlighted
        */
        const isTableCardSelected = tableCardsHighlighted.some(h => h);
        const isPlayerCardSelected = playerCardsHighlighted.some(h => h);
        if (isTableCardSelected && isPlayerCardSelected) {
            const playerCardIdx = playerCardsHighlighted.findIndex(h => h);
            const playerCardName = this.state.playerCardNames[playerCardIdx];
            const tableCardIdx = tableCardsHighlighted.findIndex(h => h);
            const tableCardName = this.state.tableCardNames[tableCardIdx];
            const switchRequest = {
                playerId: this.props.playerInfo.id,
                playerCardName: playerCardName,
                tableCardName: tableCardName
            };
            api.emitToServer('request switch', switchRequest);
        }
    }

    render() {

        let retVal;
        if (!this.state.isGameStarted) {
            retVal = (
                <GameWaitingArea
                    playerInfo={this.props.playerInfo}
                    players={this.state.players}
                    spectators={this.state.spectators}
                    isSpectator={this.state.isSpectator}
                    handleMenuButtonClick={this.handleMenuButtonClick}
                />
            );
        } else {
            retVal = (
                <div>
                    <GameScreen
                        playerInfo={this.props.playerInfo}
                        players={this.state.players}
                        playerCardNames={this.state.playerCardNames}
                        tableCardNames={this.state.tableCardNames}
                        currentPlayerId={this.state.currentPlayerId}
                        currentRound={this.state.currentRound}
                        numTurnsLeft={this.state.numTurnsLeft}
                        isRoundOngoing={this.state.isRoundOngoing}
                        isGameEnded={this.state.isGameEnded}
                        myTurn={this.state.myTurn}
                        myTokens={this.state.myTokens}
                        scorecardInfo={this.state.scorecardInfo}
                        playerCardsHighlighted={this.state.playerCardsHighlighted}
                        tableCardsHighlighted={this.state.tableCardsHighlighted}
                        logEntries={this.state.logEntries}
                        allowedActions={this.state.allowedActions}
                        handleMenuButtonClick={this.handleMenuButtonClick}
                        handleCardClick={this.handleCardClick}
                        isChlopfState={this.state.isChlopfState}
                        makeTrashTalk={this.trashTalk}
                        isSpectator={this.state.isSpectator}
                        playerHands={this.state.playerHands}
                        spectators={this.state.spectators}
                        saboteurTargets={this.state.saboteurTargets}
                    />
                    <TurnInfo
                        open={this.state.myTurnInfoOpen}
                        onClose={() => {
                            this.setState({myTurnInfoOpen: false})
                        }}
                    />
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        autoHideDuration={4000}
                        open={this.state.trashTalkMessage != null}
                        onClose={() => {
                            this.setState({trashTalkMessage: null})
                        }}
                    >
                        <Alert
                            severity="info"
                            variant="filled"
                            icon={<ChatIcon fontSize="inherit"/>}
                        >
                            {this.state.trashTalkMessage}
                        </Alert>
                    </Snackbar>
                </div>
            );
        }

        return retVal;
    }
}
