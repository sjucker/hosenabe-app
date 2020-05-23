import React from "react";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Table from "@material-ui/core/Table";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";

export class JoinableGamesTable extends React.Component {

    constructor(props) {
        super(props);

        this.handleRowClick = this.handleRowClick.bind(this);
    }

    handleRowClick(selectedGameId) {
        this.props.handleJoinableGameSelect(selectedGameId);
    }

    render() {
        if (this.props.joinableGames.length === 0) {
            return <p>Es git na kei offeni Spiel.</p>;
        } else {
            return <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Chef</TableCell>
                            <TableCell># Spiler</TableCell>
                            <TableCell/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.props.joinableGames.map((row) => (
                            <TableRow
                                key={row.gameId}
                            >
                                <TableCell>
                                    {row.hostPlayerName}
                                </TableCell>
                                <TableCell>
                                    {row.nPlayers.toString()}/11
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                        onClick={() => this.handleRowClick(row.gameId)}
                                    >
                                        Biitrete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>;
        }
    }
}
