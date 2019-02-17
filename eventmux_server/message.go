//
// Message type for passing on the web socket
//

package main

import (
	"encoding/json"
	"log"
	"strconv"
)

const (

	//
	// Messages to server
	//

	// get new viewing message
	nextViewingMsg = 2

	// Begin streaming message
	// Requires stream ID string
	startStreamingMsg = 4

	// Request new offer for a new viewer
	requestNewOfferMsg = 6

	answerReq = 8

	//
	// Messages from server
	//

	// Response to nextViewingImage,
	// Has UUID
	nextViewingRespMsg = 3

	// Update a streamers' viewer count clientside
	updateViewerCountMsg = 5

	// Response containing a new offer from a streamer
	// expect id in args[0], offer in args[1]
	responseNewOfferMsg = 7

	answerReqPassthrough = 9
)

// A Message is the baseline frame for all socket messages
// one of the constants defined above
type Message struct {
	Command int      `json:"command"`
	Args    []string `json:"args"`
}

// turn message to JSON
func (m *Message) toJSON() []byte {
	b, err := json.Marshal(m)
	if err != nil {
		log.Println(err)
		return nil
	}
	return b
}

// MessageFromJSON Get message from json byte array
func MessageFromJSON(data []byte) (*Message, error) {
	newMsg := &Message{}
	err := json.Unmarshal(data, newMsg)
	if err != nil {
		log.Println(err)
	}
	return newMsg, err
}

// NewViewingRespMsg create a message for responding to request for new stream
func NewViewingRespMsg(id, offer string) *Message {
	return &Message{
		Command: nextViewingRespMsg,
		Args:    []string{id, offer},
	}
}

// NewViewerCountUpdateMsg used to send a message with new viewer count
func NewViewerCountUpdateMsg(count int) *Message {
	return &Message{
		Command: updateViewerCountMsg,
		Args:    []string{strconv.Itoa(count)},
	}
}

// NewReqOfferMsg used to request a new offer string for a viewer from a
// streamer
func NewReqOfferMsg(id string) *Message {
	return &Message{
		Command: requestNewOfferMsg,
		Args:    []string{id},
	}
}

// NewAnswerReqPassThruMsg prepares message to send back answer
func NewAnswerReqPassThruMsg(id, answer string) *Message {
	return &Message{
		Command: answerReqPassthrough,
		Args:    []string{id, answer},
	}
}
