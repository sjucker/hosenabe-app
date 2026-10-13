import React from "react";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";
import cx from "./cx";
import {Karte} from "./Karte";
import {analyzeHand, formatPoints} from "./handValue";
import {tokens} from "./theme";
import {TokenPips} from "./TokenPips";

const useStyles = makeStyles(theme => ({
    felt: {
        position: 'relative',
        borderRadius: 28,
        padding: theme.spacing(2, 2, 2.5),
        color: tokens.feltText,
        background: `radial-gradient(ellipse at 50% 35%, ${tokens.feltLight} 0%, ${tokens.feltDark} 100%)`,
        border: `10px solid ${tokens.wood}`,
        boxShadow: `inset 0 0 0 2px ${tokens.woodDark}, inset 0 0 40px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.25)`,
        [theme.breakpoints.up('sm')]: {
            padding: theme.spacing(2.5, 4, 3)
        },
        [theme.breakpoints.down('xs')]: {
            borderRadius: 20,
            borderWidth: 6,
            padding: theme.spacing(1, 1, 1.25)
        }
    },
    statusBar: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
        minHeight: 32,
        [theme.breakpoints.down('xs')]: {
            minHeight: 28,
            padding: theme.spacing(0, 0.5)
        }
    },
    round: {
        fontFamily: tokens.displayFont,
        fontWeight: 600,
        fontSize: '1.05rem',
        color: tokens.feltTextMuted,
        [theme.breakpoints.down('xs')]: {
            fontSize: '0.95rem'
        }
    },
    pills: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        justifyContent: 'flex-end'
    },
    pill: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: '0.85rem',
        fontWeight: 600,
        background: 'rgba(0,0,0,0.28)',
        color: tokens.feltText,
        whiteSpace: 'nowrap',
        [theme.breakpoints.down('xs')]: {
            padding: '3px 10px',
            fontSize: '0.8rem'
        }
    },
    myTurnPill: {
        background: tokens.gold,
        color: '#2b1d00',
        animation: '$glow 1.6s ease-in-out infinite'
    },
    chlopfPill: {
        background: '#c0392b',
        color: '#ffffff'
    },
    '@keyframes glow': {
        '0%, 100%': {boxShadow: '0 0 0 0 rgba(232, 179, 58, 0.7)'},
        '50%': {boxShadow: '0 0 0 8px rgba(232, 179, 58, 0)'}
    },
    section: {
        marginTop: theme.spacing(2),
        textAlign: 'center',
        [theme.breakpoints.down('xs')]: {
            marginTop: theme.spacing(1)
        }
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing(1),
        minHeight: 28,
        marginBottom: theme.spacing(1.5),
        [theme.breakpoints.down('xs')]: {
            minHeight: 22,
            marginBottom: theme.spacing(0.75)
        }
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: tokens.feltTextMuted
    },
    valuePill: {
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: '0.8rem',
        fontWeight: 700,
        background: 'rgba(243, 239, 226, 0.92)',
        color: tokens.feltDark
    },
    specialValue: {
        background: tokens.gold,
        color: '#2b1d00'
    },
    cards: {
        display: 'flex',
        justifyContent: 'center',
        gap: 'min(3vw, 18px)',
        // Leave room for the lifted, selected card
        paddingTop: 14,
        marginTop: -14
    },
    divider: {
        height: 1,
        margin: theme.spacing(2.5, 'auto', 0),
        maxWidth: 420,
        background: 'linear-gradient(90deg, transparent, rgba(243,239,226,0.3), transparent)',
        [theme.breakpoints.down('xs')]: {
            marginTop: theme.spacing(1.5)
        }
    },
    hint: {
        marginTop: theme.spacing(2),
        minHeight: '1.5em',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: tokens.feltTextMuted,
        [theme.breakpoints.down('xs')]: {
            marginTop: theme.spacing(1),
            fontSize: '0.8rem'
        }
    },
    '@media (prefers-reduced-motion: reduce)': {
        myTurnPill: {
            animation: 'none'
        }
    },
    // Spectator view: every player's hand
    hands: {
        listStyle: 'none',
        margin: theme.spacing(1.5, 0, 0),
        padding: 0
    },
    handRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1, 1.5),
        borderRadius: 12,
        transition: 'background-color 200ms ease',
        '& + &': {
            marginTop: theme.spacing(0.5)
        },
        [theme.breakpoints.down('xs')]: {
            gap: theme.spacing(1),
            padding: theme.spacing(0.75, 1)
        }
    },
    handTurn: {
        background: 'rgba(232, 179, 58, 0.18)',
        boxShadow: `inset 3px 0 0 ${tokens.gold}`
    },
    handOut: {
        opacity: 0.45
    },
    handInfo: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4
    },
    handName: {
        maxWidth: '100%',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    handMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1)
    },
    handCards: {
        display: 'flex',
        gap: 4,
        flex: 'none'
    }
}));

function CardRow({cardNames, highlighted, rowName, selectable, placeholder, handleCardClick}) {
    const classes = useStyles();
    return (
        <div className={classes.cards}>
            {cardNames.map((cardName, idx) => (
                <Karte
                    key={idx}
                    cardName={cardName}
                    placeholder={placeholder}
                    selectable={selectable}
                    selected={selectable && highlighted[idx]}
                    handleClick={() => handleCardClick({cardRowName: rowName, clickedCardIdx: idx})}
                />
            ))}
        </div>
    );
}

export function TableTop(props) {
    const classes = useStyles();

    const isHandSelected = props.playerCardsHighlighted.some(h => h);
    const isTableSelected = props.tableCardsHighlighted.some(h => h);

    // Guidance for the switch action
    let hint = '';
    if (props.isEliminated) {
        hint = 'Du bisch usgschiede – lueg de andere no chli zue.';
    } else if (props.canSwitch) {
        if (isHandSelected && !isTableSelected) {
            hint = 'Jetzt e Charte vom Tisch wähle.';
        } else if (isTableSelected && !isHandSelected) {
            hint = 'Jetzt e Charte us dinere Hand wähle.';
        } else {
            hint = 'Tipp: E Charte us dinere Hand und eini vom Tisch wähle.';
        }
    }

    return (
        <section className={classes.felt} aria-label="Spieltisch">
            <div className={classes.statusBar}>
                <span className={classes.round}>Rundi {props.currentRound + 1}</span>
                <StatusPills
                    classes={classes}
                    isGameEnded={props.isGameEnded}
                    isRoundOngoing={props.isRoundOngoing}
                    isChlopfState={props.isChlopfState}
                    numTurnsLeft={props.numTurnsLeft}
                    myTurn={props.myTurn}
                    currentPlayerName={props.currentPlayerName}
                />
            </div>

            <div className={classes.section}>
                <div className={classes.sectionHeader}>
                    <Typography component="h2" className={classes.label}>Tisch</Typography>
                </div>
                <CardRow
                    cardNames={props.tableCardNames}
                    highlighted={props.tableCardsHighlighted}
                    rowName="table"
                    selectable={props.canSwitch}
                    handleCardClick={props.handleCardClick}
                />
            </div>

            <div className={classes.divider}/>

            <div className={classes.section}>
                <div className={classes.sectionHeader}>
                    <Typography component="h2" className={classes.label}>Dini Hand</Typography>
                    <HandValuePill classes={classes} cardNames={props.playerCardNames}/>
                </div>
                <CardRow
                    cardNames={props.playerCardNames}
                    highlighted={props.playerCardsHighlighted}
                    rowName="player"
                    selectable={props.canSwitch}
                    placeholder={props.isEliminated}
                    handleCardClick={props.handleCardClick}
                />
            </div>

            <div className={classes.hint}>{hint}</div>
        </section>
    );
}

function StatusPills({classes, isGameEnded, isRoundOngoing, isChlopfState, numTurnsLeft, myTurn, currentPlayerName}) {
    let statusPill = null;
    if (isGameEnded) {
        statusPill = <span className={classes.pill}>S'Spiel isch fertig</span>;
    } else if (!isRoundOngoing) {
        statusPill = <span className={classes.pill}>Rundi fertig</span>;
    } else if (myTurn) {
        statusPill = <span className={cx(classes.pill, classes.myTurnPill)}>Du bisch dra!</span>;
    } else if (currentPlayerName) {
        statusPill = <span className={classes.pill}>{currentPlayerName} isch dra</span>;
    }

    let chlopfPill = null;
    if (isRoundOngoing && isChlopfState) {
        const turnsText = numTurnsLeft === 1 ? 'letschte Zug' : `na ${numTurnsLeft} Züg`;
        chlopfPill = <span className={cx(classes.pill, classes.chlopfPill)}>Gchlopft · {turnsText}</span>;
    }

    return (
        <div className={classes.pills} role="status">
            {chlopfPill}
            {statusPill}
        </div>
    );
}

function HandValuePill({classes, cardNames}) {
    const handValue = analyzeHand(cardNames);
    if (handValue === null) {
        return null;
    }
    let text = `${formatPoints(handValue.points)} Pünkt`;
    if (handValue.hasFeuer) {
        text = 'Füür!';
    } else if (handValue.hasHosenaben) {
        text = 'Hosenabe!';
    }
    const isSpecial = handValue.hasFeuer || handValue.hasHosenaben;
    return <span className={cx(classes.valuePill, isSpecial && classes.specialValue)}>{text}</span>;
}

export function SpectatorTable(props) {
    // Table as seen by a spectator: the table cards plus every player's hand
    const classes = useStyles();
    const currentPlayer = props.players.find(pl => pl.playerId === props.currentPlayerId);

    return (
        <section className={classes.felt} aria-label="Spieltisch">
            <div className={classes.statusBar}>
                <span className={classes.round}>Rundi {props.currentRound + 1}</span>
                <StatusPills
                    classes={classes}
                    isGameEnded={props.isGameEnded}
                    isRoundOngoing={props.isRoundOngoing}
                    isChlopfState={props.isChlopfState}
                    numTurnsLeft={props.numTurnsLeft}
                    myTurn={false}
                    currentPlayerName={currentPlayer ? currentPlayer.playerName : null}
                />
            </div>

            <div className={classes.section}>
                <div className={classes.sectionHeader}>
                    <Typography component="h2" className={classes.label}>Tisch</Typography>
                </div>
                <CardRow
                    cardNames={props.tableCardNames}
                    highlighted={[false, false, false]}
                    rowName="table"
                    selectable={false}
                    handleCardClick={() => null}
                />
            </div>

            <div className={classes.divider}/>

            <ul className={classes.hands} aria-label="Händ vo de Spiler">
                {props.players.map(pl => {
                    const hand = props.playerHands.find(h => h.playerId === pl.playerId);
                    const cardNames = hand ? hand.cards.map(cr => cr.name) : [];
                    const isOut = pl.tokens <= 0;
                    const isTurn = props.isRoundOngoing && pl.playerId === props.currentPlayerId;
                    return (
                        <li key={pl.playerId}
                            className={cx(classes.handRow, isTurn && classes.handTurn, isOut && classes.handOut)}
                            aria-current={isTurn ? 'true' : undefined}>
                            <div className={classes.handInfo}>
                                <span className={classes.handName}>{pl.playerName}</span>
                                <div className={classes.handMeta}>
                                    <TokenPips tokens={pl.tokens}/>
                                    <HandValuePill classes={classes} cardNames={cardNames}/>
                                </div>
                            </div>
                            <div className={classes.handCards}>
                                {cardNames.length === 3
                                    ? cardNames.map(cardName => <Karte key={cardName} cardName={cardName} size="medium"/>)
                                    : [0, 1, 2].map(i => <Karte key={i} placeholder size="medium"/>)}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
