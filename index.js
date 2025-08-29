const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Twilio connected");

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

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🟢 WebSocket server running on port ${PORT}`);
});
