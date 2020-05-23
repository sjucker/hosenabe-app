import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";

export class GameLog extends React.Component {

    render() {
        return <Paper style={{height: 200, overflow: 'auto'}}>
            <List>
                {this.props.logEntries.map((entry) => (
                    <ListItem dense divider>
                        <Box fontSize={'0.8rem'}>
                            {entry.playerName != null ? `${entry.playerName} ${entry.message}` : entry.message}
                        </Box>
                    </ListItem>
                ))}

            </List>
        </Paper>
    }
}
