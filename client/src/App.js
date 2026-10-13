import React from 'react';
import './App.css'
import {RegistrationPage} from "./RegistrationPage";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import CssBaseline from "@material-ui/core/CssBaseline";
import {ThemeProvider} from "@material-ui/core/styles";
import {GameLobby} from "./GameLobby";
import {Game} from "./Game";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import PersonIcon from '@material-ui/icons/Person';
import api from "./api";
import {createAppTheme, tokens} from "./theme";


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

// Colour mode preference (per browser); defaults to the system setting

const DARK_MODE_STORAGE_KEY = 'hosenabe.darkMode';

function loadDarkModePreference() {
    try {
        const stored = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
        if (stored !== null) {
            return stored === 'true';
        }
    } catch (e) {
        // Storage unavailable -- fall through to the system setting
    }
    if (window.matchMedia) {
        return !window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return true;
}

function storeDarkModePreference(useDarkMode) {
    try {
        window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(useDarkMode));
    } catch (e) {
        // Storage unavailable -- preference only lasts for this visit
    }
}

// Brand mark: three fanned cards
function BrandMark() {
    return (
        <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden="true" style={{marginRight: 10, flex: 'none'}}>
            <rect x="3" y="4" width="12" height="18" rx="2" fill="#f3efe2" transform="rotate(-16 9 22)"/>
            <rect x="9" y="2" width="12" height="18" rx="2" fill="#ffffff" stroke={tokens.header} strokeWidth="1"/>
            <rect x="15" y="4" width="12" height="18" rx="2" fill={tokens.gold} stroke={tokens.header}
                  strokeWidth="1" transform="rotate(16 21 22)"/>
            <circle cx="15" cy="11" r="2.6" fill="#c0392b"/>
        </svg>
    );
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
            useDarkMode: loadDarkModePreference(),
            isRestoringSession: loadStoredPlayer() !== null
        }

        this.setPlayerInfo = this.setPlayerInfo.bind(this);
        this.setGameJoined = this.setGameJoined.bind(this);
        this.requestReconnect = this.requestReconnect.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
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

    toggleDarkMode() {
        const useDarkMode = !this.state.useDarkMode;
        storeDarkModePreference(useDarkMode);
        this.setState({useDarkMode: useDarkMode});
    }

    setGameJoined(value) {
        this.setState({
            hasPlayerJoinedGame: value
        });
    }

    render() {

        let pageElement;
        if (this.state.isRestoringSession) {
            pageElement = (
                <Typography align="center" color="textSecondary">Verbinde...</Typography>
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

        const theme = createAppTheme(this.state.useDarkMode);
        const modeLabel = this.state.useDarkMode ? 'Häll' : 'Dunkel';

        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <AppBar position="sticky" elevation={0} style={{backgroundColor: tokens.header, color: '#ffffff'}}>
                    <Toolbar>
                        <BrandMark/>
                        <Typography variant="h6" component="div" style={{flexGrow: 1, fontSize: '1.3rem'}}>
                            Hosenabe
                        </Typography>
                        {this.state.hasPlayerRegistered && (
                            <Chip
                                icon={<PersonIcon style={{color: 'inherit'}}/>}
                                label={this.state.playerInfo.name}
                                size="small"
                                style={{
                                    color: '#ffffff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.14)',
                                    fontWeight: 500,
                                    maxWidth: 160
                                }}
                            />
                        )}
                        <Tooltip title={modeLabel}>
                            <IconButton color="inherit" edge="end" onClick={this.toggleDarkMode}
                                        aria-label={modeLabel} style={{marginLeft: 8}}>
                                {this.state.useDarkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>
                <Box pt={3}>
                    {pageElement}
                </Box>
            </ThemeProvider>
        );
    }
}

export default App;
