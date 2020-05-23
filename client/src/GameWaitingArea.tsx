import React from "react";
import Container from "@material-ui/core/Container";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";

export class GameWaitingArea extends React.Component {

    constructor(props) {
        super(props);

        this.startGame = this.startGame.bind(this);
        this.addAI = this.addAI.bind(this);
        this.exitGame = this.exitGame.bind(this);
    }

    render() {
        // Determine host & whether this player is host
        let isHost = false;
        let numPlayers = this.props.playerInfoTable.numRows;
        let hostPlayerId = '';
        let hostPlayerName = '';
        if (numPlayers > 0) {
            hostPlayerId = this.props.playerInfoTable.getValue('id', 0);
            hostPlayerName = this.props.playerInfoTable.getValue('Name', 0);
            isHost = this.props.playerInfo.id === hostPlayerId;
        }

        let waitMessage;
        if (isHost) {
            if (numPlayers > 1) {
                waitMessage = '';
            } else {
                waitMessage = 'Warte uf wiiteri Spiler (mindeschtens 2).';
            }
        } else {
            waitMessage = `Warte druf, dass Spiler ${hostPlayerName} s'Spiel afangt.`
        }

        return (
            <Container component="main" maxWidth="xs">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.props.playerInfoTable.rows.map((row) => (
                                <TableRow
                                    key={row[0]}
                                >
                                    <TableCell>{row[1]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box
                    mt={2}
                >
                    <Button
                        variant="contained"
                        disabled={numPlayers < 2 || !isHost}
                        onClick={this.startGame}
                        fullWidth
                    >
                        Spiel Afange
                    </Button>
                </Box>

                <Box
                    mt={2}
                >
                    <Button
                        variant="outlined"
                        disabled={numPlayers >= 11 || !isHost}
                        onClick={this.addAI}
                        fullWidth
                    >
                        AI Hinzuefüege
                    </Button>
                </Box>

                <Box
                    mt={2}
                >
                    <Button
                        variant="outlined"
                        onClick={this.exitGame}
                        fullWidth
                    >
                        Spiel Verlah
                    </Button>
                </Box>
                <p>{waitMessage}</p>
            </Container>
        )
            ;
    }

    startGame() {
        this.props.handleMenuButtonClick('startGame');
    }

    addAI() {
        this.props.handleMenuButtonClick('addAI');
    }

    exitGame() {
        this.props.handleMenuButtonClick('exitGame');
    }
}
