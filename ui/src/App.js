import React, { Component } from 'react';
import './App.css';

import RecordButton from './RecordButton'
import Recorder from './Recorder'
import ViewerManager from './ViewerManager'

import NegotiationConnection from './NegotiationConnection'

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            recordState: false
        }
        this.negotiator = new NegotiationConnection()
    }

    componentDidMount() {
        this.negotiator.setup()
    }

    componentWillUnmount() {
        this.negotiator.close()
        this.negotiator = undefined
    }

    render() {
        function changeRecordState(newState) {
            this.setState({
                recordState: newState
            })
        }
        return (
            <div className="App">
                {this.state.recordState ? <Recorder negotiator={()=>this.negotiator}/> 
                        : <ViewerManager negotiator={()=>this.negotiator}/>}
                <RecordButton recordState={this.state.recordState} onRecordState={changeRecordState.bind(this)}/>
            </div>
        );
    }
}

export default App;
