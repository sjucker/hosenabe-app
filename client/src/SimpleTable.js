class SimpleTable {

    constructor(colNames) {
        // column names as string array
        this.colNames = colNames.slice();
        this.numCols = colNames.length;
        this.numRows = 0;
        this.rows = [];
    }

    addRow(row) {
        // row is an array of length numCols
        if (row.length !== this.numCols) {
            throw RangeError;
        }
        this.rows.push(row.slice());
        this.numRows++;
    }

    getValue(colName, rowIndex) {
        const colIndex = this.colNames.findIndex(x => x === colName);
        if (colIndex < 0) {
            throw RangeError;
        }
        if (rowIndex < 0 || rowIndex > this.numRows - 1) {
            throw RangeError;
        }
        return this.rows[rowIndex][colIndex];
    }

    clone() {
        const st = new SimpleTable(this.colNames.slice());
        for (let i = 0; i < this.numRows; i++) {
            st.addRow(this.rows[i].slice());
        }
        return st;
    }

    dropCols(colNames) {
        for (const cn of colNames) {
            this.dropCol(cn);
        }
    }

    dropCol(colName) {
        const colIndex = this.colNames.findIndex(x => x === colName);
        if (colIndex < 0) {
            throw RangeError;
        }
        this.colNames.splice(colIndex, 1);
        for (let i = 0; i < this.numRows; i++) {
            this.rows[i].splice(colIndex, 1);
        }
    }
}

export default SimpleTable;