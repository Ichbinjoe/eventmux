// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"encoding/json"
	"log"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered viewers.
	viewers map[*Client]bool

	// Registered streamers. Client of streamer -> []viewers
	streamers map[*Client]map[*Client]bool // Joe is going to hate this

	// Register requests from the clients.
	registerViewer     chan *Client
	registerStreamer   chan *Client
	unregisterViewer   chan *Client
	unregisterStreamer chan *Client

	updateViewerCount chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		registerViewer:     make(chan *Client),
		registerStreamer:   make(chan *Client),
		unregisterViewer:   make(chan *Client),
		unregisterStreamer: make(chan *Client),
		unregister:         make(chan *Client),
		updateViewerCount:  make(chan *Client),

		viewers:   make(map[*Client]bool),
		streamers: make(map[*Client]map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.registerStreamer:
			// make sure this client wasn't previously viewing
			h.unregisterViewer <- client
			// The garbage collector will take care of this, right?
			h.streamers[client] = make(map[*Client]bool) // reset
		case client := <-h.registerViewer:

			log.Printf("sending shit")
			// make sure this client wasn't previously streaming
			h.unregisterStreamer <- client
			log.Printf("sending more shit")

			h.viewers[client] = true
			client.streamID = ""
			newStreamer := h.getStreamToView()
			if newStreamer != nil {
				client.streamer = newStreamer
				h.streamers[newStreamer][client] = true
			}

			// send back stream to start viewing
			byteArr, err := json.Marshal(
				//newViewingRespMsg(newStreamer.streamID))
				newViewingRespMsg("42"))
			if err != nil {
				log.Printf("error: %v", err)
			} else {
				client.send <- byteArr
			}

		case client := <-h.unregisterViewer:
			if _, ok := h.viewers[client]; ok {
				// cleanup
				delete(h.streamers[client.streamer], client)
				delete(h.viewers, client)
				close(client.send)
			}

		case client := <-h.unregisterStreamer:
			if _, ok := h.streamers[client]; ok {

				oldViewers := h.streamers[client]

				// go ahead and send the viewers a new streamer to watch
				for c := range oldViewers {
					h.registerViewer <- c
				}

				// cleanup the streamer
				delete(h.streamers, client)
				close(client.send)

			}
		case client := <-h.unregister:
			// Just pass to both because we want this client gone
			h.unregisterStreamer <- client
			h.unregisterViewer <- client

		case client := <-h.updateViewerCount:
			byteArr, err := json.Marshal(
				newViewerCountUpdateMsg(len(h.streamers[client])))
			if err != nil {
				log.Printf("error: %v", err)
			} else {
				client.send <- byteArr
			}
		}
	}
}

// TODO Make this not just the first streamer
func (h *Hub) getStreamToView() *Client {

	if len(h.streamers) > 0 {
		for c := range h.streamers {
			return c
		}
	}

	return nil
}
