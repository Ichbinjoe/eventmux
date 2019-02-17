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
	command int    // one of the constants defined above
	arg     string // optional argument
}

func (m *Message) toJSON() []byte {
	b, err := json.Marshal(m)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return b
}

func messageFromJSON(data []byte) *Message {
	newMsg := &Message{}
	err := json.Unmarshal(data, newMsg)
	if err != nil {
		fmt.Println(err)
	}
	return newMsg
}

func newViewingRespMsg(streamID string) *Message {
	return &Message{command: nextViewingRespMsg, arg: streamID}
}

func newViewerCountUpdateMsg(count int) *Message {
	return &Message{command: updateViewerCountMsg, arg: strconv.Itoa(count)}
}
