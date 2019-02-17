import React, { Component } from 'react';

import Viewer from './Viewer';

class ViewerManager extends Component {
    constructor(props) {
        super(props)
        this.state = {
            stream: undefined
        }
    }

    componentDidMount() {
        const ref = this
        ref.props.negotiator().onNewChannelPush = function(uid, offer) {
            const pc = new RTCPeerConnection({
                iceServers: [{
                    urls: ["stun:stun.eventmux.com:3478"]
                }]
            })
            pc.setRemoteDescription(JSON.parse(offer)).then(pc.createAnswer).then(answer => {
                pc.setLocalDescription(answer).then(() => {
                    ref.props.negotiator().offerAnswer(uid, JSON.stringify(answer))
                }).catch(e => console.log(e))
            }).catch(e => console.log(e))

            let connectedInTime = false

            pc.onicecandidate = function(candidate) {
                ref.props.negotiator().sendIce(uid, JSON.stringify(candidate), true)
            }

            ref.props.negotiator().onICE = function(uid, ice) {
                pc.addIceCandidate(JSON.parse(ice))
            }

            pc.onConnectionStateChange = function(e) {
                switch (pc.connectionState) {
                    case "connected":
                        connectedInTime = true
                        ref.setState({
                            stream: pc 
                        })
                        break
                    case "disconnected":
                    case "failed":
                        pc.close()
                    case "closed":
                        ref.startGrabNew()
                }
            }
            
            setTimeout(() => {
                if (!connectedInTime) {
                    pc.close()
                }
            }, 3000)
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
            <Viewer onContinue={this.startGrabNew.bind(this)} stream={this.state.stream}/>
        )
    }
}

export default ViewerManager;
