import React from "react";
import * as PropTypes from "prop-types";

export class Karte extends React.Component {

    render() {
        return <img
            src={this.props.cardImageSource}
            alt=''
            onClick={this.props.handleClick}
            style={{maxWidth: '100%', maxHeight: '20vh', opacity: this.props.selected ? 0.4 : 1, cursor: 'pointer'}}
        />
    }
}

Karte.propTypes = {
    cardImageSource: PropTypes.node,
    handleClick: PropTypes.func,
    selected: PropTypes.bool
};
