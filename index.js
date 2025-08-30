 
const TWILIO_ACCOUNT_SID = "AC5ff1b2b373abe50bfce7bc7a79340f0d";
const TWILIO_AUTH_TOKEN = "e1ae78b1a4be6419059d2329e8f427ff";
const DEEPGRAM_API_KEY = "70bf5ae2ea1d44a5f7d46609c13bfe1011c5632c";


require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const axios = require("axios");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
});
const wss = new WebSocket.Server({ server });
const Deepgram = createClient(DEEPGRAM_API_KEY);

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  let dgStream;
  let callSid;

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "start") {
      console.log("📞 Streaming started");
      callSid = data.start.callSid;

      dgStream = Deepgram.listen.live({ model: "nova-3" });

      dgStream.on(LiveTranscriptionEvents.Transcript, async (transcriptData) => {
        const transcript = transcriptData.channel.alternatives[0]?.transcript;
        if (transcript && transcriptData.is_final) {
          console.log("🗣️ Final transcript:", transcript);

          const twiml = `<Response><Say>You said: ${transcript}</Say></Response>`;
          await redirectCall(callSid, twiml);
        }
      });
    }

    if (data.event === "media" && dgStream) {
      const audio = Buffer.from(data.media.payload, "base64");
      dgStream.send(audio);
    }

    if (data.event === "stop") {
      console.log("🛑 Streaming stopped");
      dgStream?.finish();
    }
  });
});

async function redirectCall(callSid, twiml) {
  try {
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`,
      new URLSearchParams({ Twiml: twiml }),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    console.log("🔁 Redirected with TwiML");
  } catch (err) {
    console.error("❌ Error redirecting call:", err.response?.data || err.message);
  }
}

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server listening on port ${PORT}`);
});