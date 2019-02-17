import React, { Component } from 'react';

import Viewer from './Viewer';

class ViewerManager extends Component {
    constructor(props) {
        super(props)
        this.viewer = React.createRef()
    }

    componentDidMount() {
        const ref = this
        ref.props.negotiator().onNewChannelPush = function(uid, offer) {
            const pc = new RTCPeerConnection({
                iceServers: [{
                    urls: ["stun:stun.u-blox.com:3478"]
                }]
            })
            pc.setRemoteDescription(JSON.parse(offer)).then(pc.createAnswer.bind(pc)).then(answer => {
                pc.setLocalDescription(answer).then(() => {
                    ref.props.negotiator().supplyAnswer(uid, JSON.stringify(answer))
                }).catch(e => console.log(e))
            }).catch(e => console.log(e))

            let connectedInTime = false

            pc.onicecandidate = function(candidate) {
                ref.props.negotiator().sendIce(uid, JSON.stringify(candidate.candidate), true)
            }

            ref.props.negotiator().onICE = function(uid, ice) {
                pc.addIceCandidate(JSON.parse(ice))
            }

            pc.onConnectionStateChange = function(e) {
                switch (pc.connectionState) {
                    case "connected":
                        connectedInTime = true
                        ref.viewer.current.startPlayback(pc)
                        break
                    case "disconnected":
                    case "failed":
                        pc.close()
                    case "closed":
                        ref.startGrabNew()
                }
            }
                /*            
            setTimeout(() => {
                if (!connectedInTime) {
                    pc.close()
                }
            }, 10000)*/
        }

        setTimeout(() => {
            ref.startGrabNew()
        })
    }

    startGrabNew() {
        this.props.negotiator().requestNewStream()
    }

    render() {
        return (
            <Viewer ref={this.viewer} onContinue={this.startGrabNew.bind(this)}/>
        )
    }
}

export default ViewerManager;
