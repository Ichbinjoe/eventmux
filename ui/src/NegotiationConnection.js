import adapter from 'webrtc-adapter';

class NegotiationConnection {

    constructor(stun=null) {
        this.conn = new WebSocket("ws://" + document.location.host +
            "/ws");

        this.conn.onclose = function (evt) {
            console.log("Web socket closed; trying for a new stream...");
            // TODO is this supposed to be called by someone else?
            //grabNewStream();
        }

        this.conn.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);

            switch(msg.command=) {

                    this.updateViewerCountMsg) ?

        };

        this.stream_identifier = "";

        // constants
        this.nextViewingMsg = 2;
        this.nextViewingRespMsg = 3;
        this.startStreamingMsg = 4;
        this.updateViewerCountMsg = 5;

    }

    writeMessage(command, arg) {
        var msg = { command: command, arg: arg };
        this.conn.send(JSON.stringify(msg));
    }

    // Promise<RPCPeerConnection>
    async grabNewStream() {

        // Register ourselves as a viewer and get a new stream


    }

    // Promise<Void>
    async startBroadcast() {

        // First get stream identifier from STUN server

        // Register ourselves as a streamer

    }

    // Promise<Void>
    async stopBroadcast() {

    }
}

export default NegotiationConnection;
