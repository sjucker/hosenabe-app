import React from "react";
import SimpleTable from "./SimpleTable";
import api from "./api";
import {GameWaitingArea} from "./GameWaitingArea";
import {GameScreen} from "./GameScreen";
import {arrayContentEqual} from "./App";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

export class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isGameStarted: false,
            isRoundOngoing: false,
            isRoundEnded: false,
            isGameEnded: false,
            currentRound: 0,
            playerInfoTable: new SimpleTable([]),
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
            trashTalkMessage: null
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
        api.removeCallbackOnMessage('server error', this.handleGameStateUpdate);
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

        /* Make a simple table with all the player info */
        const playerInfoTable = new SimpleTable(['id', 'Name', 'Isätz', 'turn']);
        for (let i = 0; i < gameState.playerOverview.players.length; i++) {
            const pl = gameState.playerOverview.players[i];
            const turn = (gameState.currentPlayerId === pl.playerId);
            playerInfoTable.addRow([pl.playerId, pl.playerName, pl.tokens, turn]);
        }
        this.setState({playerInfoTable: playerInfoTable});

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

        /* Update player's tokens */
        const myTokens = gameState.playerOverview.players.find(pl => pl.playerId === this.props.playerInfo.id).tokens;
        this.setState({myTokens: myTokens});

        /* If the round just ended: update the scorecard and display it */
        if (gameState.isRoundEnded && this.state.isRoundOngoing) {
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
            players: gameState.playerOverview.players,
            currentPlayerId: gameState.currentPlayerId,
            allowedActions: gameState.allowedActions,
            logEntries: gameState.log.reverse()
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
            const message = {playerId: this.props.playerInfo.id};
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
                    playerInfoTable={this.state.playerInfoTable}
                    handleMenuButtonClick={this.handleMenuButtonClick}
                />
            );
        } else {
            retVal = (
                <div>
                    <GameScreen
                        playerInfo={this.props.playerInfo}
                        playerInfoTable={this.state.playerInfoTable}
                        playerCardNames={this.state.playerCardNames}
                        tableCardNames={this.state.tableCardNames}
                        currentPlayerId={this.state.currentPlayerId}
                        isGameEnded={this.state.isGameEnded}
                        scorecardInfo={this.state.scorecardInfo}
                        playerCardsHighlighted={this.state.playerCardsHighlighted}
                        tableCardsHighlighted={this.state.tableCardsHighlighted}
                        showScorecard={this.state.showScorecard}
                        logEntries={this.state.logEntries}
                        allowedActions={this.state.allowedActions}
                        handleMenuButtonClick={this.handleMenuButtonClick}
                        handleCardClick={this.handleCardClick}
                        isChlopfState={this.state.isChlopfState}
                        makeTrashTalk={this.trashTalk}
                    />
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        autoHideDuration={3000}
                        open={this.state.myTurnInfoOpen}
                        onClose={() => {
                            this.setState({myTurnInfoOpen: false})
                        }}
                    >
                        <Alert severity="success" variant="filled">Du bisch dra</Alert>
                    </Snackbar>
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
                            severity="error"
                            variant="filled"
                            icon={false}
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
