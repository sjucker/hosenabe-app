import React from "react";
import api from "./api";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import {withStyles} from "@material-ui/core/styles";
import CardDirectory from "./karten";
import {tokens} from "./theme";

const styles = theme => ({
    root: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(6)
    },
    fan: {
        position: 'relative',
        height: 150,
        margin: theme.spacing(1, 'auto', 3),
        width: 200
    },
    fanCard: {
        position: 'absolute',
        left: '50%',
        bottom: 0,
        width: 84,
        marginLeft: -42,
        borderRadius: '7%/4.6%',
        boxShadow: '0 4px 10px rgba(0,0,0,0.25), 0 12px 28px rgba(0,0,0,0.2)',
        transformOrigin: '50% 100%'
    },
    title: {
        textAlign: 'center',
        fontSize: '2.75rem'
    },
    tagline: {
        textAlign: 'center',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(3)
    },
    card: {
        padding: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
            padding: theme.spacing(4)
        }
    },
    submit: {
        marginTop: theme.spacing(2)
    },
    accent: {
        color: theme.palette.type === 'dark' ? tokens.gold : '#8a5d00',
        fontWeight: 500
    }
});

// A Hosenabe: As, König and Ober of the same suit (31 points)
const FAN_CARDS = [['RosenOber', -18, -34], ['RosenKoenig', 0, 0], ['RosenAs', 18, 34]];


class RegistrationPageBase extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: '',
            isNameValid: false,
            formFeedback: 'Zwüsche 4 und 12 Zeiche.'
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleNameValidationMessage = this.handleNameValidationMessage.bind(this);
        this.handleRegisterResponse = this.handleRegisterResponse.bind(this);
    }

    componentDidMount() {
        /* Set the callback for receiving name validation message*/
        api.setCallbackOnMessage('response name check', this.handleNameValidationMessage);

        /* Set the callback for receiving registration response*/
        api.setCallbackOnMessage('response player register', this.handleRegisterResponse);
    }

    componentWillUnmount() {
        api.removeCallbackOnMessage('response name check', this.handleNameValidationMessage);
        api.removeCallbackOnMessage('response player register', this.handleRegisterResponse);
    }

    handleNameValidationMessage(message) {
        this.setState({
            isNameValid: message.isValid,
            formFeedback: message.isValidReason
        });
    }

    handleRegisterResponse(message) {
        if (message.success) {

            // Registration successful!
            var playerInfo = {
                id: message.playerId,
                name: message.playerName
            };

            // Call the callback from the App object
            this.props.setPlayerInfo(true, playerInfo);
        }
    }

    handleChange(event) {

        const newValue = event.target.value;
        const checkNameMessage = {name: newValue};
        api.emitToServer('request name check', checkNameMessage);

        this.setState({
            value: newValue,
        });

    }

    handleSubmit(event) {
        if (this.state.isNameValid) {
            const registerMessage = {name: this.state.value, isHuman: true};
            api.emitToServer('request player register', registerMessage);
        }
        event.preventDefault();
    }

    render() {
        const {classes} = this.props;
        const showError = this.state.value.length > 0 && !this.state.isNameValid;

        return (
            <Container component="main" maxWidth="xs" className={classes.root}>
                <div className={classes.fan} aria-hidden="true">
                    {FAN_CARDS.map(([cardName, angle, offset]) => (
                        <img
                            key={cardName}
                            src={CardDirectory[cardName]}
                            alt=""
                            className={classes.fanCard}
                            style={{transform: `translateX(${offset}px) rotate(${angle}deg)`}}
                        />
                    ))}
                </div>
                <Typography component="h1" variant="h2" className={classes.title}>Hosenabe</Typography>
                <Typography color="textSecondary" className={classes.tagline}>
                    De Jass für 2 bis 11 Spiler. <span className={classes.accent}>31 Pünkt</span> –
                    und d'Hose sind abe.
                </Typography>
                <Paper className={classes.card}>
                    <form noValidate autoComplete="off" onSubmit={this.handleSubmit}>
                        <TextField
                            id="player-name"
                            label="Wie heissisch?"
                            value={this.state.value}
                            onChange={this.handleChange}
                            helperText={this.state.formFeedback}
                            error={showError}
                            variant="outlined"
                            inputProps={{maxLength: 20}}
                            required
                            fullWidth
                            autoFocus
                        />
                        <Button
                            className={classes.submit}
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={!this.state.isNameValid}
                            fullWidth
                        >
                            Los!
                        </Button>
                    </form>
                </Paper>
            </Container>
        );
    }
}

export const RegistrationPage = withStyles(styles)(RegistrationPageBase);
