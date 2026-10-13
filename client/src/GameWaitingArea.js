import React from "react";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import CircularProgress from "@material-ui/core/CircularProgress";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ComputerIcon from "@material-ui/icons/Computer";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import {makeStyles} from "@material-ui/core/styles";
import {PlayerAvatar} from "./PlayerAvatar";

// Mirrors Game.isGameJoinable / isGameStartable on the server
const MAX_PLAYERS = 11;
const MIN_PLAYERS = 2;

const useStyles = makeStyles(theme => ({
    root: {
        paddingBottom: theme.spacing(4)
    },
    card: {
        padding: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
            padding: theme.spacing(4)
        }
    },
    header: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: theme.spacing(2)
    },
    count: {
        whiteSpace: 'nowrap'
    },
    list: {
        listStyle: 'none',
        margin: theme.spacing(2, 0),
        padding: 0
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1, 0),
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': {
            borderBottom: 0
        }
    },
    name: {
        flex: 1,
        fontWeight: 500
    },
    message: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(1),
        margin: theme.spacing(1, 0, 2),
        color: theme.palette.text.secondary,
        textAlign: 'center'
    },
    buttons: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5)
    },
    leave: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: theme.spacing(2)
    },
    leaveButton: {
        color: theme.palette.text.secondary
    }
}));

export function GameWaitingArea({playerInfo, players, handleMenuButtonClick}) {
    const classes = useStyles();

    // The first player in the game is the host
    const numPlayers = players.length;
    const host = numPlayers > 0 ? players[0] : null;
    const isHost = host !== null && host.playerId === playerInfo.id;

    let message;
    if (isHost) {
        message = numPlayers < MIN_PLAYERS
            ? 'Warte uf wiiteri Spiler (mindeschtens 2) – oder nimm en Computer-Spiler dezue.'
            : 'Alli parat? Denn chasch s\'Spiel afange.';
    } else {
        message = host !== null ? `Warte druf, dass ${host.playerName} s'Spiel afangt.` : 'Lade…';
    }
    const isWaiting = !isHost || numPlayers < MIN_PLAYERS;

    return (
        <Container component="main" maxWidth="sm" className={classes.root}>
            <Paper className={classes.card}>
                <div className={classes.header}>
                    <Typography variant="h4" component="h1">Wartebereich</Typography>
                    <Typography variant="body2" color="textSecondary" className={classes.count}>
                        {numPlayers}/{MAX_PLAYERS} Spiler
                    </Typography>
                </div>
                {host !== null && (
                    <Typography variant="body2" color="textSecondary">Spiel vo {host.playerName}</Typography>
                )}

                <ul className={classes.list}>
                    {players.map((pl, i) => (
                        <li key={pl.playerId} className={classes.row}>
                            <PlayerAvatar name={pl.playerName} isHuman={pl.isHuman}/>
                            <Typography className={classes.name}>
                                {pl.playerName}{pl.playerId === playerInfo.id ? ' (du)' : ''}
                            </Typography>
                            {i === 0 && <Chip size="small" label="Chef" color="primary" variant="outlined"/>}
                        </li>
                    ))}
                </ul>

                <div className={classes.message} role="status">
                    {isWaiting && <CircularProgress size={18} thickness={5} color="inherit"/>}
                    <Typography variant="body2" component="span">{message}</Typography>
                </div>

                {isHost && (
                    <div className={classes.buttons}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={numPlayers < MIN_PLAYERS}
                            onClick={() => handleMenuButtonClick('startGame')}
                            startIcon={<PlayArrowIcon/>}
                            fullWidth
                        >
                            Spiel afange
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            disabled={numPlayers >= MAX_PLAYERS}
                            onClick={() => handleMenuButtonClick('addAI')}
                            startIcon={<ComputerIcon/>}
                            fullWidth
                        >
                            Computer-Spiler dezue
                        </Button>
                    </div>
                )}
            </Paper>

            <div className={classes.leave}>
                <Button className={classes.leaveButton} startIcon={<ExitToAppIcon/>}
                        onClick={() => handleMenuButtonClick('exitGame')}>
                    Spiel verlah
                </Button>
            </div>
        </Container>
    );
}
