import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Table from "@material-ui/core/Table";
import TableContainer from "@material-ui/core/TableContainer";

type ScorecardProps = {}

export class Scorecard extends React.Component {

    render() {

        const scorecard = this.props.scorecard;

        // Make the rows and get the names of the still active players
        var rows = [];
        var counter = 0;
        var activePlayerNames = [];
        for (const psc of scorecard.playerScorecards) {
            const playerName = psc.name;
            if (psc.tokens > 0) {
                activePlayerNames.push(playerName);
            }
            const tokenString = `${psc.tokens} (${psc.tokensDiff})`;
            rows.push(
                <TableRow
                    key={counter}
                    selected={psc.tokensDiff < 0}
                >
                    <TableCell>{playerName}</TableCell>
                    <TableCell>{psc.points}</TableCell>
                    <TableCell>{tokenString}</TableCell>
                </TableRow>
            );
            counter++;
        }

        // Determine which button to show
        let button;
        if (this.props.isGameEnded) {
            button = <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => this.props.handleMenuButtonClick('exitGame')}
            >
                Spiel Verlah
            </Button>
        } else {
            button = <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => this.props.handleMenuButtonClick('acknowledgeScore')}
            >
                OK
            </Button>
        }

        // Make the message
        let message;
        if (this.props.isGameEnded) {
            message = "S'Spiel isch fertig.";
            if (activePlayerNames.length === 1) {
                message = message.concat(` Spiler ${activePlayerNames[0]} hät gunne!`);
            }
            if (activePlayerNames.length === 0) {
                message = message.concat(` Niemert hät gunne!.`);
            }
        } else {
            switch (scorecard.gameEndReason) {
                case 'Chlopf':
                    message = "Fertig gchlopfet!";
                    break;
                case 'Hosenaben':
                    message = `Spiler ${scorecard.lastPlayerName} hät Hosenabe!`;
                    break;
                case 'Feuer':
                    message = `Spiler ${scorecard.lastPlayerName} hät FÜÜR!`;
                    break;
                default:
                    message = '';
                    break;
            }
            message = message.concat(" D'rundi isch fertig.");
        }

        return (
            <Dialog
                open={true}
            >
                <DialogTitle>{message}</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Pünkt</TableCell>
                                    <TableCell>Isätz</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    {button}
                </DialogActions>
            </Dialog>
        );
    }
}
