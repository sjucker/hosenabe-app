import React from "react";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";
import cx from "./cx";
import {PlayerAvatar} from "./PlayerAvatar";
import {TokenPips} from "./TokenPips";
import {tokens} from "./theme";

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(2),
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(1, 1.5, 1.5)
        }
    },
    list: {
        listStyle: 'none',
        margin: theme.spacing(1, 0, 0),
        padding: 0,
        [theme.breakpoints.down('xs')]: {
            marginTop: 0
        }
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1, 1),
        borderRadius: 12,
        transition: 'background-color 200ms ease',
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(0.5, 1)
        }
    },
    turn: {
        backgroundColor: theme.palette.type === 'dark' ? 'rgba(232, 179, 58, 0.14)' : 'rgba(232, 179, 58, 0.2)',
        boxShadow: `inset 3px 0 0 ${tokens.gold}`
    },
    out: {
        opacity: 0.45
    },
    name: {
        flex: 1,
        minWidth: 0
    },
    nameText: {
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    status: {
        display: 'block',
        fontSize: '0.75rem',
        color: theme.palette.text.secondary
    },
    turnStatus: {
        color: theme.palette.type === 'dark' ? tokens.gold : tokens.goldDark,
        fontWeight: 600
    }
}));

export function PlayerList({players, currentPlayerId, thisPlayerId, isRoundOngoing}) {
    const classes = useStyles();

    return (
        <Paper className={classes.root} variant="outlined">
            <Typography variant="overline" color="textSecondary">Spiler</Typography>
            <ul className={classes.list}>
                {players.map(pl => {
                    const isOut = pl.tokens <= 0;
                    const isTurn = isRoundOngoing && pl.playerId === currentPlayerId;
                    let status = null;
                    if (isTurn) {
                        status = <span className={cx(classes.status, classes.turnStatus)}>isch dra</span>;
                    } else if (isOut) {
                        status = <span className={classes.status}>usgschiede</span>;
                    }
                    return (
                        <li key={pl.playerId} className={cx(classes.row, isTurn && classes.turn, isOut && classes.out)}
                            aria-current={isTurn ? 'true' : undefined}>
                            <PlayerAvatar name={pl.playerName} isHuman={pl.isHuman}/>
                            <div className={classes.name}>
                                <Typography className={classes.nameText} variant="body2">
                                    {pl.playerName}{pl.playerId === thisPlayerId ? ' (du)' : ''}
                                </Typography>
                                {status}
                            </div>
                            <TokenPips tokens={pl.tokens}/>
                        </li>
                    );
                })}
            </ul>
        </Paper>
    );
}
