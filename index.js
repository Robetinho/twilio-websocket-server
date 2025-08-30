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

  let audioChunks = [];
  let callSid = null;
  let silenceTimeout = null;
  let alreadyHandled = false;

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "start") {
      callSid = data.start.callSid;
      console.log("📞 Streaming started");
      console.log("callSid:", callSid);
    }

    if (data.event === "media") {
      audioChunks.push(data.media.payload);

      // Reset silence timer on every media chunk
      if (silenceTimeout) clearTimeout(silenceTimeout);

      silenceTimeout = setTimeout(async () => {
        if (!alreadyHandled && callSid) {
          alreadyHandled = true;

          const audioBuffer = Buffer.from(audioChunks.join(""), "base64");
          const durationSeconds = (audioBuffer.length / 32000).toFixed(2);
          const message = `Thanks. Your audio was approximately ${durationSeconds} seconds long.`;

          console.log(`🗣️ Silence detected. Redirecting call ${callSid}...`);
          await redirectCall(callSid, message);
        }
      }, 2000); // 2 seconds of silence
    }

    if (data.event === "stop") {
      console.log("🛑 Streaming stopped");

      if (!alreadyHandled && callSid) {
        alreadyHandled = true;

        const audioBuffer = Buffer.from(audioChunks.join(""), "base64");
        const durationSeconds = (audioBuffer.length / 32000).toFixed(2);
        const message = `Thanks. Your audio was approximately ${durationSeconds} seconds long.`;

        console.log("⌛ Stream ended naturally. Redirecting...");
        await redirectCall(callSid, message);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});

// 🔁 Redirect call with TwiML
async function redirectCall(callSid, message) {
  const twiml = `<Response><Say>${message}</Say></Response>`;

  try {
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
    console.log("✅ Redirected call successfully.");
  } catch (err) {
    console.error("❌ Error redirecting call:", err.response?.data || err.message);
  }
}
 