import React, { Component } from 'react';
import './BasicButton.css'

class BasicButton extends Component {
    render() {
        return (
            <img className="basicbutton" src={this.props.src} onClick={this.props.onClick} alt={this.props.alt}/>
        )
    }
}

export default BasicButton;
