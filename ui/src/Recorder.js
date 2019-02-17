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

        this.peers = []
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
    
        const waitingForAnswer = {}

        // Grab the streams and attach
        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
            this.setState({
                allowed: true
            })

            function generateOffer(uid) {
                const pc = new RTCPeerConnection({
                    iceServers: {
                        urls: ["stun:stun.eventmux.com:3478"]
                    }
                })
                this.peers.push(pc)

                let connectedInTime = false

                function deleteFromList() {
                    const idx = this.peers.indexOf(pc)
                    if (idx > -1)
                        this.peers.splice(idx, 1)

                    delete waitingForAnswer[uid]
                }

                pc.onConnectionStateChange = function(e) {
                    switch (pc.connectionState) {
                        case "connected":
                            connectedInTime = true
                            break
                        case "disconnected":
                        case "failed":
                            pc.close()
                        case "closed":
                            deleteFromList()
                    }
                }

                setTimeout(() => {
                    if (!connectedInTime) {
                        pc.close()
                    }
                }, 3000)

                function onErr(e) {
                    console.log(e)
                    generateOffer()
                }

                pc.createOffer(offer => {
                    pc.setLocalDescription(offer, () => {
                        waitingForAnswer[uid] = pc
                        this.props.negotiator.supplyOffer(uid, offer)
                    }, onErr)
                }, onErr)


            }

            this.props.negotiator.onRequestOffer = generateOffer
            this.props.negotiator.onSupplyAnswer = function(uid, answer) {
                if (waitingForAnswer[uid]) {
                    waitingForAnswer[uid].setRemoteDescription(answer)
                    delete waitingForAnswer[uid]
                }
            }
                
            this.props.negotiator.startBroadcast()
            
            const v = this.video.current
            v.srcObject = stream
            v.onloadedmetadata = e => v.play()

        }).catch(this.handleUMError.bind(this))
    }

    componentWillUnmount() {
        // Stop handling stuff
        this.props.negotiator.onRequestOffer = undefined
        this.props.negotiator.onUpdateViewerCount = undefined

        this.peers.forEach(peer => {
            this.peer.close()
        })
        this.peers = []
        
        const v = this.video.current
        if (v && v.srcObject) {
            v.srcObject.getTracks().forEach(t => t.stop())
        }
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
