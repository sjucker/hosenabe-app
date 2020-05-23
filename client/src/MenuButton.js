import React from "react";

export class MenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        let isActive = true;
        if (this.props.isActive !== undefined) {
            isActive = this.props.isActive;
        }
        if (isActive) {
            this.props.handleButtonClick(this.props.buttonId);
        }
    }

    render() {
        let isActive = true;
        if (this.props.isActive !== undefined) {
            isActive = this.props.isActive;
        }
        return (
            <button className={'MenuButton'.concat((isActive) ? '' : ' MenuButtonInactive')} onClick={this.handleClick}>
                {this.props.buttonText}
            </button>
        );
    }
}
