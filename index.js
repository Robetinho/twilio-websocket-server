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
    const callSid = data.start.callSid;

if (data.event === "stop" && callSid) {
  const audioBuffer = Buffer.from(mediaChunks.join(""), "base64");
  const durationSeconds = (audioBuffer.length / 32000).toFixed(2);

  const message = `Thanks. Your audio was approximately ${durationSeconds} seconds long.`;
  await redirectCall(callSid, message);
}

    
  });
});

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});


const axios = require("axios");

// Replace with your real credentials 

async function redirectCall(callSid, message) {
  const twiml = `<Response><Say>${message}</Say></Response>`;

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/.json`,
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
