import React from "react";
import api from "./api";
import {JoinableGamesTable} from "./JoinableGamesTable";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";

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
        this.handleSpectateGame = this.handleSpectateGame.bind(this);
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

    handleSpectateGame(gameId) {
        const spectateGameRequest = {
            playerId: this.props.playerInfo.id,
            gameId: gameId
        };
        api.emitToServer('request spectate game', spectateGameRequest);
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
            <Container component="main" maxWidth="sm">
                <Typography component="h1" variant="h4">Hoi {this.props.playerInfo.name}!</Typography>
                <Box sx={{mt: 0.5, mb: 3}}>
                    <Typography color="textSecondary">
                        Tritt emene offene Spiel bi, lueg zue oder fang es neus a.
                    </Typography>
                </Box>
                <Button
                    color="primary"
                    onClick={this.requestNewGame}
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon/>}
                    fullWidth
                >
                    Neus Spiel
                </Button>
                <Box sx={{mt: 3, mb: 4}}>
                    <Paper variant="outlined">
                        <Box sx={{px: 2, pt: 1.5}}>
                            <Typography variant="overline" color="textSecondary" component="h2">
                                Spiel
                            </Typography>
                        </Box>
                        <JoinableGamesTable
                            joinableGames={this.state.joinableGames}
                            handleJoinableGameSelect={this.handleJoinableGameSelect}
                            handleSpectateGame={this.handleSpectateGame}
                            selectedGameId={this.state.selectedGameId}
                        />
                    </Paper>
                </Box>
            </Container>
        );

    }
}
