import React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Typography from "@mui/material/Typography";
import StyleIcon from "@mui/icons-material/Style";
import {makeStyles} from "tss-react/mui";
import {PlayerAvatar} from "./PlayerAvatar";

const useStyles = makeStyles()(theme => ({
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
    buttons: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5)
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

export function JoinableGamesTable({joinableGames, handleJoinableGameSelect, handleSpectateGame}) {
    const {classes} = useStyles();

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
                            {game.nPlayers}/11 Spiler{game.joinable ? '' : ' · lauft scho'}
                        </Typography>
                    </div>
                    {game.joinable ? (
                        <div className={classes.buttons}>
                            <Tooltip title="Zueluege">
                                <IconButton size="large" aria-label="Zueluege" onClick={() => handleSpectateGame(game.gameId)}>
                                    <VisibilityIcon/>
                                </IconButton>
                            </Tooltip>
                            <Button
                                className={classes.joinButton}
                                variant="contained"
                                color="primary"
                                onClick={() => handleJoinableGameSelect(game.gameId)}
                            >
                                Biitrete
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className={classes.joinButton}
                            variant="outlined"
                            color="primary"
                            startIcon={<VisibilityIcon/>}
                            onClick={() => handleSpectateGame(game.gameId)}
                        >
                            Zueluege
                        </Button>
                    )}
                </li>
            ))}
        </ul>
    );
}
