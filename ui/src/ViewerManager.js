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
        this.startGrabNew()
    }

    startGrabNew() {
        this.props.negotiator.grabNewStream()
            .then(stream => {
                this.setState({
                    stream: stream
                })
            }).catch(e => {
                console.log(`Error occurred while trying to grab a stream: ${e}`)
                this.startGrabNew()
            })
    }

    render() {
        return (
            <Viewer onContinue={this.startGrabNew.bind(this)} stream={this.state.stream}/>
        )
    }
}

export default ViewerManager;
