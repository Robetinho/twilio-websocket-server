const http = require("http");
const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  let audioChunks = [];

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "start") {
      console.log("📞 Streaming started");
    }

    if (data.event === "media") {
      audioChunks.push(data.media.payload); // still base64
    }

    if (data.event === "stop") {
      console.log("📴 Streaming stopped");

      const base64Audio = audioChunks.join("");
      const audioBuffer = Buffer.from(base64Audio, "base64");

      const durationSeconds = audioBuffer.length / 32000; // Approximate: 16-bit PCM mono @ 16kHz = 32000 bytes/sec

      const message = `Thanks. Your audio was approximately ${durationSeconds.toFixed(
        2
      )} seconds long.`;

      // Respond via TwiML redirect
      const twimlUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(
        `<Response><Say>${message}</Say></Response>`
      )}`;

      // POST to redirect the call (replace with real values or test stub)
      console.log(`🔁 Redirecting call to Twimlet:\n${twimlUrl}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});
