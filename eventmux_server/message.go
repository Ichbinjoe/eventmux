//
// Message type for passing on the web socket
//

package main

import (
	"encoding/json"
	"fmt"
	"strconv"
)

const (

	// get new viewing message
	nextViewingMsg = 2

	// Response to nextViewingImage, contains id of stream to open
	nextViewingRespMsg = 3

	// Begin streaming message
	// Requires stream ID string
	startStreamingMsg = 4

	// Update a streamers' viewer count clientside
	updateViewerCountMsg = 5
)

// A Message is the baseline frame for all socket messages
type Message struct {
	Command int    // one of the constants defined above
	Arg     string // optional Argument
}

func (m *Message) toJSON() []byte {
	b, err := json.Marshal(m)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return b
}

func messageFromJSON(data []byte) (*Message, error) {
	newMsg := &Message{}
	err := json.Unmarshal(data, newMsg)
	if err != nil {
		fmt.Println(err)
	}
	return newMsg, err
}

func newViewingRespMsg(streamID string) *Message {
	return &Message{Command: nextViewingRespMsg, Arg: streamID}
}

func newViewerCountUpdateMsg(count int) *Message {
	return &Message{Command: updateViewerCountMsg, Arg: strconv.Itoa(count)}
}
