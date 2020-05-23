import React from "react";
import Grid from "@material-ui/core/Grid";
import CardDirectory from "./karten";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import {Karte} from "./Karte";
import Badge from "@material-ui/core/Badge";


export class TableTop extends React.Component {
    render() {
        let tisch = <Typography component="h1" variant="h5">Tisch</Typography>
        if (this.props.isChlopfState) {
            tisch = <Badge badgeContent={'gchlopft!'} color="primary">{tisch}</Badge>
        }

        return (
            <Box>
                {tisch}
                <Grid container spacing={2}>
                    <Grid item xs={4} align="left">
                        <Karte
                            cardImageSource={CardDirectory[this.props.tableCardNames[0]]}
                            handleClick={() => this.props.handleCardClick({
                                cardRowName: 'table',
                                clickedCardIdx: 0
                            })}
                            selected={this.props.tableCardsHighlighted[0]}
                        />
                    </Grid>

                    <Grid item xs={4} align="center">
                        <Karte
                            cardImageSource={CardDirectory[this.props.tableCardNames[1]]}
                            handleClick={() => this.props.handleCardClick({
                                cardRowName: 'table',
                                clickedCardIdx: 1
                            })}
                            selected={this.props.tableCardsHighlighted[1]}
                        />
                    </Grid>

                    <Grid item xs={4} align="right">
                        <Karte
                            cardImageSource={CardDirectory[this.props.tableCardNames[2]]}
                            handleClick={() => this.props.handleCardClick({
                                cardRowName: 'table',
                                clickedCardIdx: 2
                            })}
                            selected={this.props.tableCardsHighlighted[2]}
                        />
                    </Grid>
                </Grid>

                <Box mt={2}>
                    <Typography component="h1" variant="h5">Hand</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={4} align="left">
                            <Karte
                                cardImageSource={CardDirectory[this.props.playerCardNames[0]]}
                                handleClick={() => this.props.handleCardClick({
                                    cardRowName: 'player',
                                    clickedCardIdx: 0
                                })}
                                selected={this.props.playerCardsHighlighted[0]}
                            />
                        </Grid>

                        <Grid item xs={4} align="center">
                            <Karte
                                cardImageSource={CardDirectory[this.props.playerCardNames[1]]}
                                handleClick={() => this.props.handleCardClick({
                                    cardRowName: 'player',
                                    clickedCardIdx: 1
                                })}
                                selected={this.props.playerCardsHighlighted[1]}
                            />
                        </Grid>

                        <Grid item xs={4} align="right">
                            <Karte
                                cardImageSource={CardDirectory[this.props.playerCardNames[2]]}
                                handleClick={() => this.props.handleCardClick({
                                    cardRowName: 'player',
                                    clickedCardIdx: 2
                                })}
                                selected={this.props.playerCardsHighlighted[2]}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        );
    }
}
