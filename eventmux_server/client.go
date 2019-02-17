// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// used for cleaning up when streamer is done
	PairID string

	// Buffered channel of outbound messages.
	Send chan *Message

	IsStreamer bool    // fuck this
	Streamer   *Client // Streamer to which this viewer is subscribed
	Viewers    map[*Client]bool
}

func (c *Client) unregisterViewer() {
	if !c.IsStreamer && c.Streamer != nil {
		// cleanup both sides
		delete(c.Streamer.Viewers, c)
		c.Streamer = nil
	}
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, byteArr, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		log.Printf(string(byteArr))
		byteArr = bytes.TrimSpace(bytes.Replace(byteArr, newline, space, -1))
		msg, err := MessageFromJSON(byteArr)
		if err != nil {
			log.Println(err)
			continue
		}

		//log.Printf("Received message %d %s", msg.Command, msg.Args)

		switch msg.Command {
		case nextViewingMsg:
			log.Println("Requesting new viewer")
			c.hub.registerViewer <- c
		case startStreamingMsg:
			c.hub.registerStreamer <- c
		case responseNewOfferMsg:
			// We are current in the STREAMER's pump
			// expect id in args[0], offer in args[1]
			log.Println("Got back offer for %s. \n Offer: %s", msg.Args[0],
				msg.Args[1])
			pair := c.hub.SVPairs[msg.Args[0]]
			pair.S.Viewers[pair.V] = true
			pair.V.Streamer = pair.S
			pair.V.Send <- NewViewingRespMsg(msg.Args[0], msg.Args[1])
		case answerReq:
			// expect id in args[0], answer in args[1]
			log.Println("answer from viewer %s. \n answer: %s", msg.Args[0],
				msg.Args[1])
			pair := c.hub.SVPairs[msg.Args[0]]
			pair.S.Send <- NewAnswerReqPassThruMsg(msg.Args[0], msg.Args[1])

		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			log.Println("message type %d sent to client", message.Command)

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			byteArr, err := json.Marshal(message)
			if err != nil {
				log.Println(err)
				return
			}

			w.Write(byteArr)

			//w.Write(message)

			// Add queued chat messages to the current websocket message.
			//n := len(c.Send)
			//for i := 0; i < n; i++ {
			//	w.Write(newline)
			//	w.Write(<-c.Send)
			//}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// serveWs handles websocket requests from the peer.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{
		hub:        hub,
		conn:       conn,
		Send:       make(chan *Message, 256),
		IsStreamer: false,
		Viewers:    nil,
		PairID:     "",
		// leave Streamer uninitialized?
	}

	// Don't do anything until client initiates the stream
	//client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
