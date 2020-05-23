import React from 'react';
import './App.css'
import {RegistrationPage} from "./RegistrationPage";
import {createMuiTheme} from '@material-ui/core/styles';
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import CssBaseline from "@material-ui/core/CssBaseline";
import {ThemeProvider} from "@material-ui/styles";
import {GameLobby} from "./GameLobby";
import {Game} from "./Game";
import {Box} from "@material-ui/core";
import Switch from "@material-ui/core/Switch";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from '@material-ui/icons/Menu';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ListItem from "@material-ui/core/ListItem";
import List from "@material-ui/core/List";


// Helper functions

export function arrayContentEqual(array1, array2) {
    return (array1.length === array2.length) && (array1.every(val => array2.includes(val)));
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
            useDarkMode: true
        }

        this.setPlayerInfo = this.setPlayerInfo.bind(this);
        this.setGameJoined = this.setGameJoined.bind(this);
    }

    setPlayerInfo(isRegistered, playerInfo = {}) {
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
        if (!this.state.hasPlayerRegistered) {
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

        const theme = createMuiTheme({
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
