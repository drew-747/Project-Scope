package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/go-redis/redis/v8"
)

type Server struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
	redis      *redis.Client
	mu         sync.RWMutex
}

type Client struct {
	server   *Server
	conn     *websocket.Conn
	send     chan []byte
	userID   string
	deviceID string
}

type Message struct {
	Type    string          `json:"type"`
	From    string          `json:"from"`
	To      string          `json:"to"`
	Content json.RawMessage `json:"content"`
}

type PreKeyBundle struct {
	IdentityKey           []byte `json:"identityKey"`
	SignedPreKey         []byte `json:"signedPreKey"`
	SignedPreKeySignature []byte `json:"signedPreKeySignature"`
	OneTimePreKey        []byte `json:"oneTimePreKey"`
	RegistrationID       uint32 `json:"registrationId"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // In production, implement proper origin checks
	},
}

func newServer() *Server {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // In production, use proper authentication
		DB:       0,
	})

	return &Server{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
		redis:      rdb,
	}
}

func (s *Server) run() {
	for {
		select {
		case client := <-s.register:
			s.mu.Lock()
			s.clients[client.userID+":"+client.deviceID] = client
			s.mu.Unlock()

		case client := <-s.unregister:
			s.mu.Lock()
			if _, ok := s.clients[client.userID+":"+client.deviceID]; ok {
				delete(s.clients, client.userID+":"+client.deviceID)
				close(client.send)
			}
			s.mu.Unlock()

		case message := <-s.broadcast:
			s.mu.RLock()
			if client, ok := s.clients[message.To]; ok {
				select {
				case client.send <- message.Content:
				default:
					close(client.send)
					delete(s.clients, client.userID+":"+client.deviceID)
				}
			} else {
				// Store message in Redis for offline delivery
				key := "messages:" + message.To
				msg, _ := json.Marshal(message)
				s.redis.RPush(context.Background(), key, msg)
			}
			s.mu.RUnlock()
		}
	}
}

func (s *Server) serveWs(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	deviceID := r.URL.Query().Get("device_id")
	if userID == "" || deviceID == "" {
		http.Error(w, "Missing user_id or device_id", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		server:   s,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		deviceID: deviceID,
	}

	client.server.register <- client

	go client.writePump()
	go client.readPump()

	// Deliver any pending messages
	key := "messages:" + userID
	ctx := context.Background()
	for {
		msg, err := s.redis.LPop(ctx, key).Result()
		if err == redis.Nil {
			break
		}
		if err != nil {
			log.Printf("Error retrieving messages for %s: %v", userID, err)
			break
		}
		client.send <- []byte(msg)
	}
}

func (c *Client) readPump() {
	defer func() {
		c.server.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512 * 1024) // 512KB max message size
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("error unmarshaling message: %v", err)
			continue
		}

		msg.From = c.userID
		c.server.broadcast <- &msg
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func main() {
	server := newServer()
	go server.run()

	http.HandleFunc("/ws", server.serveWs)
	http.HandleFunc("/prekey", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			// Store pre-key bundle
			var bundle PreKeyBundle
			if err := json.NewDecoder(r.Body).Decode(&bundle); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			userID := r.URL.Query().Get("user_id")
			deviceID := r.URL.Query().Get("device_id")
			if userID == "" || deviceID == "" {
				http.Error(w, "Missing user_id or device_id", http.StatusBadRequest)
				return
			}

			key := "prekeys:" + userID + ":" + deviceID
			data, _ := json.Marshal(bundle)
			server.redis.Set(context.Background(), key, data, 0)
			
			w.WriteHeader(http.StatusCreated)
		} else if r.Method == "GET" {
			// Retrieve pre-key bundle
			userID := r.URL.Query().Get("user_id")
			deviceID := r.URL.Query().Get("device_id")
			if userID == "" || deviceID == "" {
				http.Error(w, "Missing user_id or device_id", http.StatusBadRequest)
				return
			}

			key := "prekeys:" + userID + ":" + deviceID
			data, err := server.redis.Get(context.Background(), key).Result()
			if err == redis.Nil {
				http.Error(w, "Pre-key bundle not found", http.StatusNotFound)
				return
			}
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(data))
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
} 