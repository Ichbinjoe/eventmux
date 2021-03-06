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
        const ref = this

        // Grab the streams and attach
        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
            function generateOffer(uid) {
                const pc = new RTCPeerConnection({
                    iceServers: [{
                        urls: ["stun:stun.u-blox.com:3478"]
                    }]
                })
                ref.peers.push(pc)

                const so = ref.video.srcObject

                so.getTracks().forEach(t => {
                    pc.addTrack(t, so)

                })


                let connectedInTime = false

                function deleteFromList() {
                    const idx = ref.peers.indexOf(pc)
                    if (idx > -1)
                        ref.peers.splice(idx, 1)

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

                    /*                setTimeout(() => {
                    if (!connectedInTime) {
                        pc.close()
                    }
                }, 10000)*/

                function onErr(e) {
                    console.log(e)
                    generateOffer(uid)
                }

                pc.onicecandidate = function(candidate) {
                    ref.props.negotiator().sendIce(uid, JSON.stringify(candidate.candidate), false)
                }

                pc.createOffer(offer => {
                    pc.setLocalDescription(offer, () => {
                        waitingForAnswer[uid] = pc
                        ref.props.negotiator().supplyOffer(uid, JSON.stringify(offer))
                    }, onErr)
                }, onErr, {
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                })
            }

            ref.props.negotiator().onRequestOffer = generateOffer
            ref.props.negotiator().onSupplyAnswer = function(uid, answer) {
                if (waitingForAnswer[uid]) {
                    waitingForAnswer[uid].setRemoteDescription(JSON.parse(answer))
                    delete waitingForAnswer[uid]
                }
            }
            ref.props.negotiator().onICE = function(uid, ice) {
                if (waitingForAnswer[uid]) {
                    waitingForAnswer[uid].addIceCandidate(JSON.parse(ice))
                }
            }
                
            ref.props.negotiator().startBroadcast()
            
            const v = ref.video.current
            v.srcObject = stream
            v.onloadedmetadata = e => v.play()

        }).catch(this.handleUMError.bind(this))
    }

    componentWillUnmount() {
        // Stop handling stuff
        this.props.negotiator().onRequestOffer = undefined
        this.props.negotiator().onSupplyAnswer = undefined
        this.props.negotiator().onUpdateViewerCount = undefined

        this.peers.forEach(peer => {
            peer.close()
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
