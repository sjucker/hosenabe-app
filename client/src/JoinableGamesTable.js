import React from "react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import StyleIcon from "@material-ui/icons/Style";
import {makeStyles} from "@material-ui/core/styles";
import {PlayerAvatar} from "./PlayerAvatar";

const useStyles = makeStyles(theme => ({
    list: {
        listStyle: 'none',
        margin: 0,
        padding: theme.spacing(0, 2, 1)
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1.5, 0),
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': {
            borderBottom: 0
        }
    },
    info: {
        flex: 1,
        minWidth: 0
    },
    host: {
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    joinButton: {
        minWidth: 104
    },
    empty: {
        padding: theme.spacing(4, 2, 5),
        textAlign: 'center',
        color: theme.palette.text.secondary
    },
    emptyIcon: {
        fontSize: 40,
        opacity: 0.5,
        marginBottom: theme.spacing(1)
    }
}));

export function JoinableGamesTable({joinableGames, handleJoinableGameSelect}) {
    const classes = useStyles();

    if (joinableGames.length === 0) {
        return (
            <div className={classes.empty}>
                <StyleIcon className={classes.emptyIcon}/>
                <Typography variant="body2">Es git na kei offeni Spiel. Fang doch eis a!</Typography>
            </div>
        );
    }

    return (
        <ul className={classes.list}>
            {joinableGames.map(game => (
                <li key={game.gameId} className={classes.row}>
                    <PlayerAvatar name={game.hostPlayerName} isHuman={true}/>
                    <div className={classes.info}>
                        <Typography className={classes.host}>Spiel vo {game.hostPlayerName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {game.nPlayers}/11 Spiler
                        </Typography>
                    </div>
                    <Button
                        className={classes.joinButton}
                        variant={game.joinable ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => handleJoinableGameSelect(game.gameId)}
                        disabled={!game.joinable}
                    >
                        {game.joinable ? 'Biitrete' : 'Lauft scho'}
                    </Button>
                </li>
            ))}
        </ul>
    );
}
