 
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

    // Log the raw event
    console.log("📨 Received event:", data.event);

    if (data.event === "start") {
      callSid = data.start.callSid;
      console.log("📞 Streaming started");
      console.log("📍 Call SID:", callSid);

      try {
        dgStream = Deepgram.listen.live({ 
          
  model: "nova-3",
  interim_results: false,
  encoding: "mulaw",
  sample_rate: 8000,
  channels: 1

         });

        dgStream.on(LiveTranscriptionEvents.Open, () => {
          console.log("✅ Deepgram connection opened");
        });

        dgStream.on(LiveTranscriptionEvents.Close, () => {
          console.log("❎ Deepgram connection closed");
        });

        dgStream.on(LiveTranscriptionEvents.Transcript, (data) => {
  console.log("📥 Transcript payload:", JSON.stringify(data, null, 2));
});



        dgStream.on(LiveTranscriptionEvents.Transcript, async (transcriptData) => {
          const transcript = transcriptData.channel.alternatives[0]?.transcript;
          console.log("📝 Transcript received:", transcriptData);

          if (transcript && transcriptData.is_final) {
            console.log("🗣️ Final transcript:", transcript);

            const twiml = `<Response><Say>You said: ${transcript}</Say></Response>`;
            await redirectCall(callSid, twiml);
          }
        });

        dgStream.on(LiveTranscriptionEvents.Error, (err) => {
          console.error("💥 Deepgram error:", err);
        });
      } catch (err) {
        console.error("❌ Error creating Deepgram stream:", err);
      }
    }

    if (data.event === "media") {
      if (!dgStream) {
        console.warn("⚠️ Media received but no Deepgram stream initialized");
        return;
      }

      const audio = Buffer.from(data.media.payload, "base64");
      dgStream.send(audio);
    }

    if (data.event === "stop") {
      console.log("🛑 Streaming stopped");
      if (dgStream) {
        dgStream.finish();
      }
    }
  });

  ws.on("close", () => {
    console.log("🔌 Client disconnected");
    dgStream?.finish();
  });

  ws.on("error", (err) => {
    console.error("🚨 WebSocket error:", err);
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