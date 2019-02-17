import React, { Component } from 'react';
import './Recorder.css'

import adapter from 'webrtc-adapter';

import NextSourceSVG from './switchinput.svg'

import BasicButton from './BasicButton'

class Recorder extends Component {
    constructor(props) {
        super(props)
        this.state = {
            allowed: true
        }

        this.video = React.createRef()
    }

    handleUMError(err) {
        // TODO: Lmao rip
        console.log(err)
        this.setState({
            allowed: false
        })
    }

    cycleSource() {
        // TODO
    }

    componentDidMount() {
        // Grab the streams and attach
    
        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
            this.setState({
                allowed: true
            })
            
            this.props.negotiator.startBroadcast().catch(this.handleUMError.bind(this))
                .then(() => {
                    const v = this.video.current
                    v.srcObject = stream
                    v.onloadedmetadata = e => v.play()
                })
        }).catch(this.handleUMError.bind(this))
    }

    componentWillUnmount() {
        const v = this.video.current
        if (v && v.srcObject) {
            v.srcObject.getTracks().forEach(t => t.stop())
        }

        this.props.negotiator.stopBroadcast().catch(console.log)
    }

    render() {
        if (!this.state.allowed) {
            return (
                <div className="errorContainer">
                    <span className="error">We couldn't capture a video stream from your device :(</span>
                </div>
            )
        }
        return  (
            <>
            <video ref={this.video} className="viewer"/>
            <BasicButton src={NextSourceSVG} alt="Switch to another camera" onClick={this.cycleSource.bind(this)}/>
            </>
        )
    }
}

export default Recorder;
