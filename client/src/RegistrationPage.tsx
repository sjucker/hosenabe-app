import React from "react";
import api from "./api";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {NameValidation} from "../../src/gameLobby";
import {RegisterResponse} from "../../src/api";

type RegistrationPageProps = {
    setPlayerInfo: Function
}

type RegistrationPageState = {
    value: string,
    isNameValid: boolean,
    formFeedback: string
}

export class RegistrationPage extends React.Component<RegistrationPageProps, RegistrationPageState> {
    constructor(props: RegistrationPageProps) {
        super(props);

        this.state = {
            value: '',
            isNameValid: false,
            formFeedback: 'Bitte wähl en beliebige Name.'
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

    handleNameValidationMessage(message: NameValidation) {
        this.setState({
            isNameValid: message.isValid,
            formFeedback: message.isValidReason
        });
    }

    handleRegisterResponse(message: RegisterResponse) {
        if (message.success) {

            // Registration successful!
            let playerInfo = {
                id: message.playerId,
                name: message.playerName
            };

            // Call the callback from the App object
            this.props.setPlayerInfo(true, playerInfo);
        }
    }

    handleChange(event: any) { // TODO

        const newValue = event.target.value;
        const checkNameMessage = {name: newValue};
        api.emitToServer('request name check', checkNameMessage);

        this.setState({
            value: newValue,
        });

    }

    handleSubmit(event: any) { // TODO
        if (this.state.isNameValid) {
            const registerMessage = {name: this.state.value, isHuman: true};
            api.emitToServer('request player register', registerMessage);
        }
        event.preventDefault();
    }

    render() {
        return (
            <Container component="main" maxWidth="xs">
                <Typography component="h1" variant="h5">Registrierig</Typography>
                <form noValidate autoComplete="off" onSubmit={this.handleSubmit}>
                    <p>{this.state.formFeedback}</p>
                    <TextField
                        label="Name"
                        onChange={this.handleChange}
                        margin="normal"
                        variant="outlined"
                        required
                        fullWidth
                        autoFocus
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!this.state.isNameValid}
                        fullWidth
                    >
                        Los!
                    </Button>
                </form>
            </Container>
        );
    }
}

// <div className='RegistrationPage'>
//     <div className='RegistrationPageTitle PageTitle'>Registrierig</div>
//     <div className='RegistrationFormContainer ContentBox'>
//         <p>{this.state.formFeedback}</p>
//         <form className='RegistrationForm' onSubmit={this.handleSubmit}>
//             <label>
//                 <input type="text" value={this.state.value} onChange={this.handleChange}/>
//             </label>
//             <input className='RegistrationSubmit MenuButton' type="submit" value="Los!"/>
//             <Button variant={"contained"} onClick={this.handleSubmit}
//                     disabled={!this.state.isNameValid}>
//                 Los!
//             </Button>
//         </form>
//     </div>
// </div>
