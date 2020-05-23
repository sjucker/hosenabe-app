// Game
import React from "react";
import {Scorecard} from "./Scorecard";
import {TableTop} from "./TableTop";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";
import Box from "@material-ui/core/Box";
import {GameLog} from "./GameLog";

export class GameScreen extends React.Component {

    render() {

        // Prepare scorecard
        let scorecardElement = <div/>
        if (this.props.scorecardInfo.display) {
            scorecardElement = (
                <Scorecard
                    scorecard={this.props.scorecardInfo.scorecard}
                    playerInfoTable={this.props.playerInfoTable}
                    isGameEnded={this.props.isGameEnded}
                    handleMenuButtonClick={this.props.handleMenuButtonClick}
                />
            );
        }

        return (
            <Container component="main" maxWidth="md">
                <TableTop
                    playerCardNames={this.props.playerCardNames}
                    playerCardsHighlighted={this.props.playerCardsHighlighted}
                    tableCardNames={this.props.tableCardNames}
                    tableCardsHighlighted={this.props.tableCardsHighlighted}
                    handleCardClick={this.props.handleCardClick}
                    isChlopfState={this.props.isChlopfState}
                />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Button
                            disabled={!this.props.allowedActions.includes('SwitchAll')}
                            variant="contained"
                            fullWidth
                            onClick={() => this.props.handleMenuButtonClick('switchAll')}
                        >
                            Ali Wechsle
                        </Button>
                    </Grid>

                    <Grid item xs={6}>
                        <Button
                            disabled={!this.props.allowedActions.includes('Losen') && !this.props.allowedActions.includes('Chlopfen')}
                            variant="contained"
                            fullWidth
                            onClick={() => this.props.handleMenuButtonClick(this.props.allowedActions.includes('Losen') ? 'losen' : 'chlopfen')}
                        >
                            {this.props.allowedActions.includes('Losen') ? 'Lose' : 'Chlopfe'}
                        </Button>
                    </Grid>

                    <Grid item xs={6}>
                        <Button
                            disabled={!this.props.allowedActions.includes('Hosenaben')}
                            variant="contained"
                            fullWidth
                            onClick={() => this.props.handleMenuButtonClick('hosenaben')}
                        >
                            Hosenabe
                        </Button>
                    </Grid>

                    <Grid item xs={6}>
                        <Button
                            disabled={!this.props.allowedActions.includes('Feuer')}
                            variant="contained"
                            fullWidth
                            onClick={() => this.props.handleMenuButtonClick('feuer')}
                        >
                            Füür
                        </Button>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Isätz</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {this.props.playerInfoTable.rows.map((row, i) => (
                                        <TableRow
                                            key={row[0]}
                                            selected={this.props.playerInfoTable.getValue('turn', i)}
                                        >
                                            <TableCell>{row[1]}</TableCell>
                                            <TableCell>{row[2]}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid item xs={6}>
                        <GameLog logEntries={this.props.logEntries}/>
                    </Grid>
                </Grid>
                {scorecardElement}
                <Box
                    mt={2}
                    mb={2}
                >
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => this.props.handleMenuButtonClick('exitGame')}
                    >
                        Spiel Verlah
                    </Button>
                </Box>
            </Container>
        )
    }
}
