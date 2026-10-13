import React from 'react';
import './App.css'
import {RegistrationPage} from "./RegistrationPage";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import CssBaseline from "@material-ui/core/CssBaseline";
import {ThemeProvider} from "@material-ui/styles";
import {GameLobby} from "./GameLobby";
import {Game} from "./Game";
import {Box, createTheme} from "@material-ui/core";
import Switch from "@material-ui/core/Switch";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from '@material-ui/icons/Menu';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ListItem from "@material-ui/core/ListItem";
import List from "@material-ui/core/List";
import api from "./api";


// Helper functions

export function arrayContentEqual(array1, array2) {
    return (array1.length === array2.length) && (array1.every(val => array2.includes(val)));
}

// Session persistence: remember the registered player per browser tab, so a page refresh can reclaim the seat

const SESSION_STORAGE_KEY = 'hosenabe.player';

function loadStoredPlayer() {
    try {
        const stored = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
        return (stored && stored.id) ? stored : null;
    } catch (e) {
        return null;
    }
}

function storePlayer(playerInfo) {
    try {
        if (playerInfo) {
            window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(playerInfo));
        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (e) {
        // Storage unavailable (e.g. private mode) -- refresh will simply not be persistent
    }
}

// App
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            playerInfo: {},
            hasPlayerRegistered: false,
            hasPlayerJoinedGame: false,
            hasGameStarted: false,
            drawerOpen: false,
            useDarkMode: true,
            isRestoringSession: loadStoredPlayer() !== null
        }

        this.setPlayerInfo = this.setPlayerInfo.bind(this);
        this.setGameJoined = this.setGameJoined.bind(this);
        this.requestReconnect = this.requestReconnect.bind(this);
        this.handleReconnectResponse = this.handleReconnectResponse.bind(this);
    }

    componentDidMount() {
        api.setCallbackOnMessage('response reconnect', this.handleReconnectResponse);
        // 'connect' also fires after socket.io re-establishes a dropped connection
        api.setCallbackOnMessage('connect', this.requestReconnect);
        if (api.isConnected()) {
            this.requestReconnect();
        }
    }

    componentWillUnmount() {
        api.removeCallbackOnMessage('response reconnect', this.handleReconnectResponse);
        api.removeCallbackOnMessage('connect', this.requestReconnect);
    }

    requestReconnect() {
        const storedPlayer = loadStoredPlayer();
        if (storedPlayer !== null) {
            api.emitToServer('request reconnect', {playerId: storedPlayer.id});
        }
    }

    handleReconnectResponse(message) {
        if (message.success) {
            this.setPlayerInfo(true, {id: message.playerId, name: message.playerName});
            this.setGameJoined(message.isInGame);
        } else {
            // Server no longer knows this player -> back to registration
            this.setPlayerInfo(false);
        }
        this.setState({isRestoringSession: false});
    }

    setPlayerInfo(isRegistered, playerInfo = {}) {
        storePlayer(isRegistered ? playerInfo : null);
        this.setState({
            playerInfo: playerInfo,
            hasPlayerRegistered: isRegistered
        });
        // If player unregisters: set game states to false
        if (!isRegistered) {
            this.setState({
                hasPlayerJoinedGame: false,
                hasGameStarted: false
            })
        }
    }

    setGameJoined(value) {
        this.setState({
            hasPlayerJoinedGame: value
        });
    }

    render() {

        let playerName;
        if (this.state.hasPlayerRegistered) {
            playerName = ` (${this.state.playerInfo.name})`;
        } else {
            playerName = '';
        }

        let pageElement;
        if (this.state.isRestoringSession) {
            pageElement = (
                <Typography align="center">Verbinde...</Typography>
            );
        } else if (!this.state.hasPlayerRegistered) {
            pageElement = (
                <RegistrationPage setPlayerInfo={this.setPlayerInfo}/>
            );
        } else if (!this.state.hasPlayerJoinedGame) {
            pageElement = (
                <GameLobby setPlayerInfo={this.setPlayerInfo} playerInfo={this.state.playerInfo}
                           setGameJoined={this.setGameJoined}/>
            );
        } else {
            pageElement = (
                <Game setPlayerInfo={this.setPlayerInfo} playerInfo={this.state.playerInfo}
                      setGameJoined={this.setGameJoined}/>
            );
        }

        const theme = createTheme({
            palette: {
                type: this.state.useDarkMode ? 'dark' : 'light',
                primary: {
                    main: '#c24c4c'
                }
            },
        });

        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" style={{flexGrow: 1}}>
                            HOSENABE {playerName}
                        </Typography>
                        <IconButton
                            color="inherit"
                            onClick={() => {
                                this.setState({...this.state, drawerOpen: true})
                            }}
                        >
                            <MenuIcon/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <SwipeableDrawer
                    anchor={"left"}
                    open={this.state.drawerOpen}
                    onOpen={() => {
                        this.setState({...this.state, drawerOpen: true})
                    }}
                    onClose={() => {
                        this.setState({...this.state, drawerOpen: false})
                    }}
                >
                    <List>
                        <ListItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={this.state.useDarkMode}
                                        onChange={(event) => {
                                            this.setState({...this.state, useDarkMode: event.target.checked})
                                        }}/>
                                }
                                label="Dark Mode"
                            />
                        </ListItem>
                    </List>
                </SwipeableDrawer>
                <Box
                    mt={2}>
                    {pageElement}
                </Box>
            </ThemeProvider>
        );
    }
}

export default App;
