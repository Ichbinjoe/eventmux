import React, { Component } from 'react';
import './Viewer.css'

import NextSVG from './next.svg';

import BasicButton from './BasicButton'

class Viewer extends Component {
    constructor(props) {
        super(props)

        this.stream = null
        this.viewer = React.createRef();
    }

    continue(e) {
        if (typeof this.props.onContinue === "function") {
            this.props.onContinue(e, this.stream && this.stream.connectionState)
        }
    }

    componentWillUnmount() {
        const v = this.viewer.current
        if (v.srcObject) {
            v.srcObject.getTracks().forEach(t => t.stop())
            v.srcObject = null
            v.onLoadedMetadata = null
        }
    }

    startPlayback(stream) {
        const v = this.viewer.current
        this.stream = stream
        v.srcObject = this.stream
        v.onLoadedMetadata = _ => v.play()
    }

    render() {
        return (
            <>
            <canvas ref={this.viewer} className='viewer-canvas'/>
            <BasicButton src={NextSVG} onClick={this.continue.bind(this)} alt="View next video stream"/>
            </>
        )
    }
}

export default Viewer;
