import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import cx from "./cx";
import {tokens as designTokens} from "./theme";

// Every player starts with 3 tokens (see Game.addPlayer on the server)
const MAX_TOKENS = 3;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'inline-flex',
        gap: 4,
        alignItems: 'center',
        verticalAlign: 'middle'
    },
    pip: {
        width: 12,
        height: 12,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: `2px solid ${theme.palette.text.disabled}`
    },
    filled: {
        border: `2px solid ${designTokens.goldDark}`,
        background: `radial-gradient(circle at 35% 35%, #ffe08a, ${designTokens.gold} 55%, ${designTokens.goldDark})`
    }
}));

export function TokenPips({tokens, className}) {
    const classes = useStyles();
    const label = `${tokens} vo ${MAX_TOKENS} Isätz`;
    const pips = [];
    for (let i = 0; i < Math.max(MAX_TOKENS, tokens); i++) {
        pips.push(<span key={i} className={cx(classes.pip, i < tokens && classes.filled)}/>);
    }
    return <span className={cx(classes.root, className)} role="img" aria-label={label} title={label}>{pips}</span>;
}
