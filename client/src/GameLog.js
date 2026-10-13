import React from "react";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
    list: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        maxHeight: 220,
        overflowY: 'auto',
        [theme.breakpoints.down('xs')]: {
            maxHeight: 160
        }
    },
    entry: {
        padding: theme.spacing(0.75, 0),
        fontSize: '0.85rem',
        lineHeight: 1.4,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': {
            borderBottom: 0
        }
    },
    system: {
        color: theme.palette.text.secondary,
        fontStyle: 'italic'
    },
    player: {
        fontWeight: 600
    }
}));

export function GameLog({logEntries}) {
    const classes = useStyles();

    if (logEntries.length === 0) {
        return <Typography variant="body2" color="textSecondary">Na nüt passiert.</Typography>;
    }

    // Entries arrive newest first
    return (
        <ul className={classes.list} aria-live="polite">
            {logEntries.map((entry, i) => (
                <li key={logEntries.length - i} className={classes.entry}>
                    {entry.playerName != null
                        ? <><span className={classes.player}>{entry.playerName}</span> {entry.message}</>
                        : <span className={classes.system}>{entry.message}</span>}
                </li>
            ))}
        </ul>
    );
}
