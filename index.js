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
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("❌ Failed to parse message:", msg);
      return;
    }

    if (data.event === "start") {
      console.log("📞 Streaming started");
      console.log("Start event data:", data);
      ws.callSid = data.start.callSid;
    }

    if (data.event === "media") {
      audioChunks.push(data.media.payload);
    }

    if (data.event === "stop") {
      console.log("🛑 Streaming stopped");

      const audioBuffer = Buffer.from(audioChunks.join(""), "base64");
      const durationSeconds = (audioBuffer.length / 32000).toFixed(2);
      const message = `Thanks. Your audio was approximately ${durationSeconds} seconds long.`;

      if (ws.callSid) {
        await redirectCall(ws.callSid, message);
      } else {
        console.error("⚠️ No callSid available at stop event.");
      }
    }
  });
});


server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});


const axios = require("axios");

// Replace with your real credentials
const ACCOUNT_SID = "AC5ff1b2b373abe50bfce7bc7a79340f0d";
const AUTH_TOKEN = "e1ae78b1a4be6419059d2329e8f427ff";

async function redirectCall(callSid, message) {
  const twiml = `<Response><Say>${message}</Say></Response>`;

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}.json`,
    new URLSearchParams({
      Twiml: twiml,
    }),
    {
      auth: {
        username: ACCOUNT_SID,
        password: AUTH_TOKEN,
      },
    }
  );
}
