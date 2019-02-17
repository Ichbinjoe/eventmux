// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"errors"
	"log"

	"github.com/google/uuid"
)

// StreamerViewerPair used for tracking session pairs between requests
type StreamerViewerPair struct {
	S *Client
	V *Client
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {

	// Registered streamers. Client of streamer -> []viewers
	streamers map[*Client]bool
	SVPairs   map[string]StreamerViewerPair

	// Register requests from the clients.
	registerViewer   chan *Client
	registerStreamer chan *Client
	//unregisterViewer   chan *Client
	//unregisterStreamer chan *Client

	updateViewerCount chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		registerViewer:    make(chan *Client),
		registerStreamer:  make(chan *Client),
		unregister:        make(chan *Client),
		updateViewerCount: make(chan *Client),

		streamers: make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.registerStreamer:
			// make sure this client wasn't previously viewing
			client.unregisterViewer()
			client.IsStreamer = true
			h.streamers[client] = true

		case client := <-h.registerViewer:

			// make sure this client wasn't previously streaming
			h.unregisterStreamer(client)

			if s, err := h.getStreamToView(); err == nil {
				h.initiateNewSVPair(s, client)
			}

		case client := <-h.unregister:
			// Just pass to both because we want this client gone
			h.unregisterStreamer(client)
			client.unregisterViewer()

			if _, ok := h.streamers[client]; ok {
				delete(h.streamers, client)
			}
			close(client.Send)

			/*case client := <-h.updateViewerCount:
			/*byteArr, err := json.Marshal(
				NewViewerCountUpdateMsg(len(h.streamers[client])))
			if err != nil {
				log.Printf("error: %v", err)
			} else {
				client.Send <- byteArr
			}*/
		}
	}
}

// TODO Make this not just the first streamer
func (h *Hub) getStreamToView() (*Client, error) {

	if len(h.streamers) > 0 {
		for c := range h.streamers {
			return c, nil
		}
	}

	return nil, errors.New("No streamers available")
}

func (h *Hub) initiateNewSVPair(s *Client, v *Client) {

	svPair := StreamerViewerPair{S: s, V: v}
	id := uuid.New().String()
	h.SVPairs[id] = svPair

	s.Send <- NewReqOfferMsg(id)
}

func (h *Hub) unregisterStreamer(c *Client) {
	if _, ok := h.streamers[c]; ok {

		// Take care of viewers of the now defunct streamer
		for v := range c.Viewers {
			if s, err := h.getStreamToView(); err == nil {
				h.initiateNewSVPair(s, v)
			} else {
				log.Println(err)
			}
		}
	}

	c.IsStreamer = false
	c.Viewers = nil

}
