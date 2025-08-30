const http = require("http");
const WebSocket = require("ws");
const axios = require("axios");

const PORT = process.env.PORT || 10000;
const ACCOUNT_SID = "AC5ff1b2b373abe50bfce7bc7a79340f0d";
const AUTH_TOKEN = "e1ae78b1a4be6419059d2329e8f427ff";


const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  let callSid = null;
  let audioChunks = [];
  let timerStarted = false;

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "start") {
      callSid = data.start.callSid;
      console.log("📞 Streaming started, callSid:", callSid);
    }

    if (data.event === "media") {
      audioChunks.push(data.media.payload);

      if (!timerStarted && callSid) {
        timerStarted = true;

        setTimeout(async () => {
          const audioBuffer = Buffer.from(audioChunks.join(""), "base64");
          const durationSeconds = (audioBuffer.length / 32000).toFixed(2);
          const message = `Thanks. Your audio was about ${durationSeconds} seconds long.`;

          console.log("⌛ 5 seconds elapsed, redirecting...");
          try {
            await redirectCall(callSid, message);
            console.log("✅ Redirected successfully");
          } catch (err) {
            console.error("❌ Error redirecting call:", err.response?.data || err.message);
          }
        }, 5000);
      }
    }

    if (data.event === "stop") {
      console.log("🛑 Streaming stopped");
    }
  });
});

async function redirectCall(callSid, message) {
  const twiml = `<Response><Say>${message}</Say></Response>`;

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}.json`,
    new URLSearchParams({ Twiml: twiml }),
    {
      auth: {
        username: ACCOUNT_SID,
        password: AUTH_TOKEN,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
}

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});