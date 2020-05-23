import React from "react";

export class PlayerTable extends React.Component {
    render() {
        let rows = [];
        for (let i = 0; i < this.props.playerInfoTable.numRows; i++) {

            // Fill in the cells
            let cells = [];
            let counter = 0;
            for (const cn of this.props.playerInfoTable.colNames) {
                if (this.props.displayColNames.includes(cn)) {
                    cells.push(
                        <td key={counter}>{this.props.playerInfoTable.getValue(cn, i)}</td>
                    );
                    counter++;
                }
            }

            // Highlight row of player whose turn it is
            let className = 'PlayerTableRow PrettyTableRow';
            if (this.props.playerInfoTable.getValue('turn', i) && this.props.highlightTurn) {
                className = 'PlayerTableRow PrettyTableRow SelectedRow';
            }

            rows.push(
                <tr className={className} key={i}>
                    {cells}
                </tr>
            );
        }

        // Fill in the headers
        let headers = [];
        let counter = 0;
        for (const cn of this.props.playerInfoTable.colNames) {
            if (this.props.displayColNames.includes(cn)) {
                headers.push(
                    <th key={counter}>{cn}</th>
                );
                counter++;
            }
        }

        return (
            <div className='PlayerTableContainer ContentBox'>
                <table className='PlayerTable PrettyTable'>
                    <thead>
                    <tr className='PlayerTableHeader PrettyTableHeader'>
                        {headers}
                    </tr>
                    </thead>
                    <tbody>
                    {rows}
                    </tbody>
                </table>
            </div>
        );
    }
}
