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
        console.log(this.props)
        this.props.negotiator().onNewChannelPush = function(uid, offer) {
            const pc = new RTCPeerConnection({
                iceServers: [{
                    urls: ["stun:stun.eventmux.com:3478"]
                }]
            })
            pc.setRemoteDescription(offer).then(pc.createAnswer).then(answer => {
                pc.setLocalDescription(answer).then(() => {
                    this.props.negotiator().offerAnswer(uid, answer)
                }).catch(e => console.log(e))
            }).catch(e => console.log(e))

            let connectedInTime = false

            pc.onConnectionStateChange = function(e) {
                switch (pc.connectionState) {
                    case "connected":
                        connectedInTime = true
                        this.setState({
                            stream: pc 
                        })
                        break
                    case "disconnected":
                    case "failed":
                        pc.close()
                    case "closed":
                        this.startGrabNew()
                }
            }
            
            setTimeout(() => {
                if (!connectedInTime) {
                    pc.close()
                }
            }, 3000)
        }

        const ref = this
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
