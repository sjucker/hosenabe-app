import React from "react";
import Avatar from "@material-ui/core/Avatar";
import ComputerIcon from "@material-ui/icons/Computer";
import {makeStyles} from "@material-ui/core/styles";

// Stable, pleasant colours per player name
const AVATAR_COLORS = ['#c0392b', '#2e7d5b', '#3b6ea8', '#8e5bb5', '#c77d1a', '#2b8a9b', '#a8436f', '#5c6b2e'];

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const useStyles = makeStyles({
    avatar: {
        width: 36,
        height: 36,
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#ffffff'
    }
});

export function PlayerAvatar({name, isHuman}) {
    const classes = useStyles();
    return (
        <Avatar className={classes.avatar} style={{backgroundColor: colorForName(name)}}>
            {isHuman ? name.charAt(0).toUpperCase() : <ComputerIcon fontSize="small" aria-label="Computer-Spiler"/>}
        </Avatar>
    );
}
