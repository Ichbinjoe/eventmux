import React, {Component} from 'react';
import RecordStart from './record_start.svg';
import RecordStop from './record_stop.svg';

import './RecordButton.css'

class RecordButton extends Component {
    render() {
        function onClick() {
            if (typeof this.props.onRecordState === 'function')
                this.props.onRecordState(!this.props.recordState)
        }
        const innerContent = this.props.recordState ? RecordStop : RecordStart
        const innerAlt = this.props.recordState ? "Stop recording" : "Start recording"
        
        return (
            <div className='recordbutton' onClick={onClick.bind(this)}>
                <img src={innerContent} alt={innerAlt}/>
            </div>
        )
    }
}

export default RecordButton;
