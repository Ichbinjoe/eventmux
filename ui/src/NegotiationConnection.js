import adapter from 'webrtc-adapter';

const NEXT_VIEWING_MSG = 2
const NEW_VIEWING_CHANNEL_PUSH_MSG = 3
const START_STREAMING_MSG = 4;
const UPDATE_VIEWER_COUNT_MSG = 5;
const REQUEST_OFFER_MSG = 6;
const SUPPLY_OFFER_MSG = 7;
const SUPPLY_ANSWER_MSG = 8;

class NegotiationConnection {
    constructor() {
    }
    
    setup() {
        this.connectWebsocket()
        this.running = true

    }

    connectWebsocket() {
        if (this.conn !== undefined) {
            this.conn.close()
        }

        const ref = this

        this.conn = new WebSocket("ws://" + document.location.host + "/ws");
        this.conn.onclose = function (evt) {
            if (!this.running) return;
            console.log("Web socket closed; trying for a new stream...");
            this.connectWebsocket()
        }

        this.conn.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);
            console.log(`Got message ${JSON.stringify(msg)}`)

            switch (msg.command) {
                case NEW_VIEWING_CHANNEL_PUSH_MSG:
                    if (ref.onNewChannelPush !== undefined)
                        ref.onNewChannelPush(msg.args[0], msg.args[1])
                    break
                case UPDATE_VIEWER_COUNT_MSG:
                    if (ref.onUpdateViewerCount !== undefined)
                        ref.onUpdateViewerCount(msg.args[0])
                    break
                case REQUEST_OFFER_MSG:
                    console.log(ref.onRequestOffer)
                    if (ref.onRequestOffer !== undefined)
                        ref.onRequestOffer(msg.args[0])
                    break
                case SUPPLY_ANSWER_MSG:
                    if (ref.onSupplyAnswer !== undefined)
                        ref.onSupplyAnswer(msg.args[0])
                    break
            }
        };
    }

    writeMessage(command, arg=null) {
        if (this.conn.readyState !== 1) {
            console.log("Websocket couldn't connect!")
            return
        }

        if (arg == null) {
            arg = []
        } else if (typeof arg !== Array) {
            arg = [arg]
        }

        var msg = {command: command, args: arg};
        const m = JSON.stringify(msg)
        console.log(m)
        this.conn.send(m)
    }

    requestNewStream() {
        // Register ourselves as a viewer and get a new stream
        this.writeMessage(NEXT_VIEWING_MSG)
    }
    
    startBroadcast() {
        this.writeMessage(START_STREAMING_MSG)
    }

    supplyOffer(uid, offer) {
        this.writeMessage(SUPPLY_OFFER_MSG, [uid, offer])
    }

    supplyAnswer(uid, answer) {
        this.writeMessage(SUPPLY_ANSWER_MSG, [uid, answer])
    }

    close() {
        this.running = false
        this.conn.close()
    }
}

export default NegotiationConnection;
