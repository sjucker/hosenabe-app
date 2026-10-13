import React from "react";
import * as PropTypes from "prop-types";
import cx from "./cx";
import {makeStyles} from "@material-ui/core/styles";
import CardDirectory from "./karten";
import {cardLabel} from "./handValue";
import {tokens} from "./theme";

// Card images are 161 x 247
const CARD_RATIO = '161 / 247';

const useStyles = makeStyles({
    card: {
        position: 'relative',
        display: 'block',
        flex: '0 0 auto',
        aspectRatio: CARD_RATIO,
        padding: 0,
        border: 0,
        background: 'transparent',
        borderRadius: '7%/4.6%',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.25)',
        '& img': {
            display: 'block',
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            userSelect: 'none',
            pointerEvents: 'none'
        }
    },
    large: {
        width: 'min(27vw, 124px)'
    },
    small: {
        width: 38,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    },
    selectable: {
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), 0 12px 22px rgba(0,0,0,0.3)'
        },
        '&:focus': {
            outline: 'none'
        },
        '&:focus-visible': {
            boxShadow: `0 0 0 3px ${tokens.feltDark}, 0 0 0 6px #ffffff`
        }
    },
    selected: {
        transform: 'translateY(-14px)',
        boxShadow: `0 0 0 3px ${tokens.gold}, 0 10px 24px rgba(0,0,0,0.45)`,
        '&:hover': {
            transform: 'translateY(-14px)',
            boxShadow: `0 0 0 3px ${tokens.gold}, 0 10px 24px rgba(0,0,0,0.45)`
        }
    },
    placeholder: {
        boxShadow: 'none',
        border: `2px dashed rgba(243, 239, 226, 0.35)`,
        background: 'rgba(0, 0, 0, 0.12)'
    }
});

export function Karte(props) {
    const classes = useStyles();
    const sizeClass = props.size === 'small' ? classes.small : classes.large;

    if (props.placeholder) {
        return <div className={cx(classes.card, sizeClass, classes.placeholder)} aria-hidden="true"/>;
    }

    const label = cardLabel(props.cardName);
    const image = <img src={CardDirectory[props.cardName] || CardDirectory['back']} alt={label} draggable={false}/>;

    if (!props.selectable) {
        return <div className={cx(classes.card, sizeClass)}>{image}</div>;
    }

    return (
        <button
            type="button"
            className={cx(classes.card, sizeClass, classes.selectable, props.selected && classes.selected)}
            onClick={props.handleClick}
            aria-pressed={Boolean(props.selected)}
            aria-label={label}
        >
            {image}
        </button>
    );
}

Karte.propTypes = {
    cardName: PropTypes.string,
    handleClick: PropTypes.func,
    selected: PropTypes.bool,
    selectable: PropTypes.bool,
    placeholder: PropTypes.bool,
    size: PropTypes.oneOf(['large', 'small'])
};
