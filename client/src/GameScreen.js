// Game
import React, {useState} from "react";
import {Scorecard} from "./Scorecard";
import {SpectatorTable, TableTop} from "./TableTop";
import {PlayerList} from "./PlayerList";
import {GameLog} from "./GameLog";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import SendIcon from '@material-ui/icons/Send';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import StarIcon from '@material-ui/icons/Star';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import cx from "./cx";

const useStyles = makeStyles(theme => ({
    root: {
        paddingBottom: theme.spacing(4),
        [theme.breakpoints.down('xs')]: {
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            paddingBottom: theme.spacing(2)
        }
    },
    actions: {
        marginTop: theme.spacing(2),
        [theme.breakpoints.down('xs')]: {
            marginTop: theme.spacing(1)
        }
    },
    actionButton: {
        height: 52,
        fontSize: '1rem',
        [theme.breakpoints.down('xs')]: {
            height: 44,
            padding: theme.spacing(0, 0.5),
            fontSize: '0.85rem',
            lineHeight: 1.15,
            // Four buttons share one row on phones, so drop the icons
            '& .MuiButton-startIcon': {
                display: 'none'
            }
        }
    },
    special: {
        animation: '$pulse 1.4s ease-in-out infinite'
    },
    '@keyframes pulse': {
        '0%, 100%': {boxShadow: '0 0 0 0 rgba(232, 179, 58, 0.75)'},
        '50%': {boxShadow: '0 0 0 10px rgba(232, 179, 58, 0)'}
    },
    '@media (prefers-reduced-motion: reduce)': {
        special: {
            animation: 'none'
        }
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        [theme.breakpoints.down('xs')]: {
            gap: theme.spacing(1)
        }
    },
    panel: {
        padding: theme.spacing(2),
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(1, 1.5, 1.5)
        }
    },
    chat: {
        display: 'flex',
        alignItems: 'center',
        marginTop: theme.spacing(1.5),
        padding: theme.spacing(0.25, 0.5, 0.25, 1.5),
        borderRadius: 999,
        border: `1px solid ${theme.palette.divider}`,
        '&:focus-within': {
            borderColor: theme.palette.primary.main
        }
    },
    chatInput: {
        flex: 1,
        fontSize: '0.9rem'
    },
    leave: {
        alignSelf: 'center',
        color: theme.palette.text.secondary
    }
}));

export function GameScreen(props) {
    const classes = useStyles();
    const isPhone = useMediaQuery(useTheme().breakpoints.down('xs'));
    const [trashTalkMessage, setTrashTalkMessage] = useState('');
    const [confirmExitOpen, setConfirmExitOpen] = useState(false);

    const allowed = action => props.allowedActions.includes(action);
    const canLosen = allowed('Losen');
    const canChlopfen = allowed('Chlopfen');
    const canHosenaben = allowed('Hosenaben');
    const canFeuer = allowed('Feuer');

    const currentPlayer = props.players.find(pl => pl.playerId === props.currentPlayerId);

    function handleTrashTalkSubmit(event) {
        event.preventDefault();
        const message = trashTalkMessage.trim();
        if (message.length > 0) {
            props.makeTrashTalk(message);
            setTrashTalkMessage('');
        }
    }

    function handleExitClick() {
        // Leaving a running game loses the seat for good, so ask first (spectators lose nothing)
        if (props.isGameEnded || props.isSpectator) {
            props.handleMenuButtonClick('exitGame');
        } else {
            setConfirmExitOpen(true);
        }
    }

    // Prepare scorecard
    let scorecardElement = null;
    if (props.scorecardInfo.display) {
        scorecardElement = (
            <Scorecard
                scorecard={props.scorecardInfo.scorecard}
                thisPlayerId={props.playerInfo.id}
                isGameEnded={props.isGameEnded}
                canStartRound={!props.isSpectator && props.myTokens > 0}
                handleMenuButtonClick={props.handleMenuButtonClick}
            />
        );
    }

    return (
        <Container component="main" maxWidth="lg" className={classes.root}>
            <Grid container spacing={isPhone ? 1 : 3}>
                <Grid item xs={12} md={8}>
                    {props.isSpectator ? (
                        <SpectatorTable
                            players={props.players}
                            playerHands={props.playerHands}
                            tableCardNames={props.tableCardNames}
                            currentPlayerId={props.currentPlayerId}
                            currentRound={props.currentRound}
                            numTurnsLeft={props.numTurnsLeft}
                            isRoundOngoing={props.isRoundOngoing}
                            isGameEnded={props.isGameEnded}
                            isChlopfState={props.isChlopfState}
                        />
                    ) : (
                        <>
                            <TableTop
                                playerCardNames={props.playerCardNames}
                                playerCardsHighlighted={props.playerCardsHighlighted}
                                tableCardNames={props.tableCardNames}
                                tableCardsHighlighted={props.tableCardsHighlighted}
                                handleCardClick={props.handleCardClick}
                                canSwitch={allowed('Switch')}
                                isChlopfState={props.isChlopfState}
                                numTurnsLeft={props.numTurnsLeft}
                                currentRound={props.currentRound}
                                isRoundOngoing={props.isRoundOngoing}
                                isGameEnded={props.isGameEnded}
                                myTurn={props.myTurn}
                                currentPlayerName={currentPlayer ? currentPlayer.playerName : null}
                                isEliminated={props.myTokens <= 0}
                            />

                            <Grid container spacing={1} className={classes.actions}>
                                <Grid item xs={3}>
                                    <Button
                                        className={classes.actionButton}
                                        disabled={!canLosen && !canChlopfen}
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={() => props.handleMenuButtonClick(canLosen ? 'losen' : 'chlopfen')}
                                    >
                                        {canLosen ? 'Lose' : 'Chlopfe'}
                                    </Button>
                                </Grid>
                                <Grid item xs={3}>
                                    <Button
                                        className={classes.actionButton}
                                        disabled={!allowed('SwitchAll')}
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                        startIcon={<SwapHorizIcon/>}
                                        onClick={() => props.handleMenuButtonClick('switchAll')}
                                    >
                                        Ali wechsle
                                    </Button>
                                </Grid>
                                <Grid item xs={3}>
                                    <Button
                                        className={cx(classes.actionButton, canHosenaben && classes.special)}
                                        disabled={!canHosenaben}
                                        variant={canHosenaben ? 'contained' : 'outlined'}
                                        color="secondary"
                                        fullWidth
                                        startIcon={<StarIcon/>}
                                        onClick={() => props.handleMenuButtonClick('hosenaben')}
                                    >
                                        Hosenabe
                                    </Button>
                                </Grid>
                                <Grid item xs={3}>
                                    <Button
                                        className={cx(classes.actionButton, canFeuer && classes.special)}
                                        disabled={!canFeuer}
                                        variant={canFeuer ? 'contained' : 'outlined'}
                                        color="secondary"
                                        fullWidth
                                        startIcon={<WhatshotIcon/>}
                                        onClick={() => props.handleMenuButtonClick('feuer')}
                                    >
                                        Füür
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Grid>

                <Grid item xs={12} md={4} className={classes.sidebar}>
                    {/* Spectators see the players (with their tokens) on the table already */}
                    {!props.isSpectator && (
                        <PlayerList
                            players={props.players}
                            spectators={props.spectators}
                            currentPlayerId={props.currentPlayerId}
                            thisPlayerId={props.playerInfo.id}
                            isRoundOngoing={props.isRoundOngoing}
                        />
                    )}

                    <Paper className={classes.panel} variant="outlined">
                        <Typography variant="overline" color="textSecondary" component="h2">Verlauf</Typography>
                        <GameLog logEntries={props.logEntries}/>
                        <form className={classes.chat} noValidate autoComplete="off" onSubmit={handleTrashTalkSubmit}>
                            <InputBase
                                className={classes.chatInput}
                                placeholder="Trash Talk…"
                                value={trashTalkMessage}
                                onChange={event => setTrashTalkMessage(event.target.value)}
                                inputProps={{maxLength: 100, 'aria-label': 'Trash Talk'}}
                            />
                            <IconButton type="submit" size="small" color="primary" aria-label="Schicke"
                                        disabled={trashTalkMessage.trim().length === 0}>
                                <SendIcon fontSize="small"/>
                            </IconButton>
                        </form>
                    </Paper>

                    <Button className={classes.leave} startIcon={<ExitToAppIcon/>} onClick={handleExitClick}>
                        {props.isSpectator ? 'Nüme zueluege' : 'Spiel verlah'}
                    </Button>
                </Grid>
            </Grid>

            {scorecardElement}

            <Dialog open={confirmExitOpen} onClose={() => setConfirmExitOpen(false)} maxWidth="xs">
                <DialogTitle>Spiel würkli verlah?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        S'Spiel lauft na. Wenn du gahsch, chasch nüme zrugg.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmExitOpen(false)}>Bliibe</Button>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => {
                            setConfirmExitOpen(false);
                            props.handleMenuButtonClick('exitGame');
                        }}
                    >
                        Verlah
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
