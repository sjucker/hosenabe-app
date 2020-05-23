import React from "react";
import api from "./api";
import {JoinableGamesTable} from "./JoinableGamesTable";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";

export class GameLobby extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            joinableGames: [],
            selectedGameId: null
        }

        this.handleLobbyUpdate = this.handleLobbyUpdate.bind(this);
        this.handleServerError = this.handleServerError.bind(this);
        this.requestNewGame = this.requestNewGame.bind(this);
        this.handleJoinableGameSelect = this.handleJoinableGameSelect.bind(this);
        this.handleJoinGame = this.handleJoinGame.bind(this);
    }

    componentDidMount() {
        /* Set the callback for receiving game lobby updates*/
        api.setCallbackOnMessage('lobby update', this.handleLobbyUpdate);

        /* Set the callback for handling errors */
        api.setCallbackOnMessage('server error', this.handleServerError);

        /* Request lobby update from the server*/
        const message = {playerId: this.props.playerInfo.id};
        api.emitToServer('request lobby update', message);

        /* Set the callback for successfully joining game*/
        api.setCallbackOnMessage('response join game', this.handleJoinGame);
    }

    componentWillUnmount() {
        api.removeCallbackOnMessage('lobby update', this.handleLobbyUpdate);
        api.removeCallbackOnMessage('server error', this.handleServerError);
        api.removeCallbackOnMessage('response join game', this.handleJoinGame);
    }

    requestNewGame() {
        const newGameRequest = {playerId: this.props.playerInfo.id};
        api.emitToServer('request new game', newGameRequest);
    }

    handleJoinableGameSelect(newGameId) {
        this.setState({
            selectedGameId: newGameId
        });

        const joinGameRequest = {
            playerId: this.props.playerInfo.id,
            gameId: newGameId
        };
        api.emitToServer('request join game', joinGameRequest);
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

    handleLobbyUpdate(message) {
        this.setState({
            joinableGames: message.joinableGames
        });
    }

    handleJoinGame(message) {
        this.props.setGameJoined(true);
    }

    render() {

        return (
            <Container component="main" maxWidth="xs">
                <Typography component="h1" variant="h5">Lobby</Typography>
                <JoinableGamesTable
                    joinableGames={this.state.joinableGames}
                    handleJoinableGameSelect={this.handleJoinableGameSelect}
                    selectedGameId={this.state.selectedGameId}
                />
                <Box mt={2}>
                    <Button
                        color="primary"
                        onClick={this.requestNewGame}
                        variant="contained"
                        fullWidth
                    >
                        Neus Spiel
                    </Button>
                </Box>
            </Container>
        );

    }
}
