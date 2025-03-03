const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const cors = require('cors');
app.use(cors());


// Serve static files (frontend code)
app.use(express.static("public"));

// WebSocket communication
io.on("connection", (socket) => {
  console.log("A user connected");

  // Relay signaling messages
  socket.on("signal", (data) => {
    socket.broadcast.emit("signal", data); // Send to other peers
  });

  socket.on("ready", () => {
    socket.emit("ready");
    });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
