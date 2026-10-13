import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Typography from "@material-ui/core/Typography";
import EmojiEventsIcon from "@material-ui/icons/EmojiEvents";
import {makeStyles} from "@material-ui/core/styles";
import cx from "./cx";
import {Karte} from "./Karte";
import {TokenPips} from "./TokenPips";
import {formatPoints} from "./handValue";
import {tokens} from "./theme";

const useStyles = makeStyles(theme => ({
    paper: {
        [theme.breakpoints.down('xs')]: {
            margin: theme.spacing(2),
            width: `calc(100% - ${theme.spacing(4)}px)`
        }
    },
    content: {
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(1, 1.5)
        }
    },
    title: {
        textAlign: 'center',
        paddingBottom: theme.spacing(1),
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(2, 2, 1)
        }
    },
    trophy: {
        display: 'block',
        margin: '0 auto 4px',
        fontSize: 48,
        color: tokens.gold
    },
    subtitle: {
        display: 'block',
        marginTop: theme.spacing(0.5),
        color: theme.palette.text.secondary,
        fontFamily: theme.typography.fontFamily,
        fontSize: '0.95rem',
        fontWeight: 400
    },
    tableCards: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: theme.spacing(2),
        [theme.breakpoints.down('xs')]: {
            marginBottom: theme.spacing(1)
        }
    },
    tableLabel: {
        marginRight: theme.spacing(1),
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: theme.palette.text.secondary
    },
    list: {
        listStyle: 'none',
        margin: 0,
        padding: 0
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1.25, 1.5),
        borderRadius: 14,
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(0.75, 1.25)
        },
        '& + &': {
            marginTop: theme.spacing(0.5)
        }
    },
    loser: {
        backgroundColor: theme.palette.type === 'dark' ? 'rgba(217, 72, 59, 0.16)' : 'rgba(192, 57, 43, 0.09)'
    },
    who: {
        flex: 1,
        minWidth: 0
    },
    nameLine: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0
    },
    name: {
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    hand: {
        display: 'flex',
        gap: 4,
        marginTop: 6
    },
    badge: {
        flex: 'none',
        marginLeft: theme.spacing(1),
        padding: '1px 8px',
        borderRadius: 999,
        fontSize: '0.7rem',
        fontWeight: 700,
        background: tokens.gold,
        color: '#2b1d00'
    },
    points: {
        minWidth: 40,
        textAlign: 'right',
        fontFamily: tokens.displayFont,
        fontSize: '1.4rem',
        fontWeight: 700,
        lineHeight: 1
    },
    pointsLabel: {
        display: 'block',
        fontFamily: theme.typography.fontFamily,
        fontSize: '0.7rem',
        fontWeight: 400,
        color: theme.palette.text.secondary
    },
    tokens: {
        textAlign: 'right'
    },
    diff: {
        display: 'block',
        marginTop: 4,
        whiteSpace: 'nowrap',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: theme.palette.primary.main
    },
    actions: {
        padding: theme.spacing(1, 3, 3),
        [theme.breakpoints.down('xs')]: {
            padding: theme.spacing(1, 2, 2)
        }
    }
}));

function buildTitle(scorecard, isGameEnded) {
    if (isGameEnded) {
        const winners = scorecard.playerScorecards.filter(psc => psc.tokens > 0).map(psc => psc.name);
        let subtitle = 'Niemert hät gunne!';
        if (winners.length === 1) {
            subtitle = `${winners[0]} hät gunne!`;
        }
        return {title: "S'Spiel isch fertig", subtitle};
    }

    let subtitle;
    switch (scorecard.gameEndReason) {
        case 'Chlopf':
            subtitle = 'Fertig gchlopfet!';
            break;
        case 'Hosenaben':
            subtitle = `${scorecard.lastPlayerName} hät Hosenabe!`;
            break;
        case 'Feuer':
            subtitle = `${scorecard.lastPlayerName} hät FÜÜR!`;
            break;
        default:
            subtitle = '';
            break;
    }
    return {title: `Rundi ${scorecard.round + 1} isch fertig`, subtitle};
}

export function Scorecard({scorecard, thisPlayerId, isGameEnded, canStartRound, handleMenuButtonClick}) {
    const classes = useStyles();
    const {title, subtitle} = buildTitle(scorecard, isGameEnded);

    return (
        <Dialog open={true} fullWidth maxWidth="sm" aria-labelledby="scorecard-title" classes={{paper: classes.paper}}>
            <DialogTitle id="scorecard-title" disableTypography className={classes.title}>
                {isGameEnded && <EmojiEventsIcon className={classes.trophy}/>}
                <Typography variant="h5" component="h2">{title}</Typography>
                <span className={classes.subtitle}>{subtitle}</span>
            </DialogTitle>
            <DialogContent className={classes.content}>
                {scorecard.tableCardNames.length > 0 && (
                    <div className={classes.tableCards}>
                        <span className={classes.tableLabel}>Tisch</span>
                        {scorecard.tableCardNames.map(cardName => (
                            <Karte key={cardName} cardName={cardName} size="small"/>
                        ))}
                    </div>
                )}
                <ul className={classes.list}>
                    {scorecard.playerScorecards.map(psc => {
                        let badge = null;
                        if (psc.hasFeuer) {
                            badge = 'Füür';
                        } else if (psc.hasHosenaben) {
                            badge = 'Hosenabe';
                        }
                        return (
                            <li key={psc.id} className={cx(classes.row, psc.tokensDiff < 0 && classes.loser)}>
                                <div className={classes.who}>
                                    <div className={classes.nameLine}>
                                        <Typography variant="body2" className={classes.name}>
                                            {psc.name}{psc.id === thisPlayerId ? ' (du)' : ''}
                                        </Typography>
                                        {badge && <span className={classes.badge}>{badge}</span>}
                                    </div>
                                    <div className={classes.hand}>
                                        {psc.handCardNames.map(cardName => (
                                            <Karte key={cardName} cardName={cardName} size="small"/>
                                        ))}
                                    </div>
                                </div>
                                <div className={classes.points}>
                                    {formatPoints(psc.points)}
                                    <span className={classes.pointsLabel}>Pünkt</span>
                                </div>
                                <div className={classes.tokens}>
                                    <TokenPips tokens={psc.tokens}/>
                                    {psc.tokensDiff < 0 && <span className={classes.diff}>{psc.tokensDiff} Isatz</span>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </DialogContent>
            <DialogActions className={classes.actions}>
                {isGameEnded ? (
                    <Button variant="contained" color="primary" size="large" fullWidth
                            onClick={() => handleMenuButtonClick('exitGame')}>
                        Spiel verlah
                    </Button>
                ) : (
                    <Button variant="contained" color="primary" size="large" fullWidth
                            onClick={() => handleMenuButtonClick('acknowledgeScore')}>
                        {canStartRound ? 'Nächsti Rundi' : 'OK'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
