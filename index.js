const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket server is running.");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.event === "start") {
        console.log("📞 Call started");
      } else if (data.event === "media") {
        console.log(`🎤 Got audio chunk: ${data.media.payload.length} chars`);
      } else if (data.event === "stop") {
        console.log("📴 Call ended");
      }
    } catch (e) {
      console.error("❌ Error:", e.message);
    }
  });

  ws.on("close", () => {
    console.log("❌ Connection closed");
  });
});

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server running on port ${PORT}`);
});
