package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":80", "http service address")

func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()

	r := mux.NewRouter()

	//r.HandleFunc("/", serveHome)
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../ui/build")))

	http.ListenAndServeTLS(":443",
		"/etc/letsencrypt/live/eventhub.ibj.io/cert.pem",
		"/etc/letsencrypt/live/eventhub.ibj.io/privkey.pem", r)

	log.Fatal()
}
