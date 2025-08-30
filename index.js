 
const TWILIO_ACCOUNT_SID = "AC5ff1b2b373abe50bfce7bc7a79340f0d";
const TWILIO_AUTH_TOKEN = "e1ae78b1a4be6419059d2329e8f427ff";
const DEEPGRAM_API_KEY = "70bf5ae2ea1d44a5f7d46609c13bfe1011c5632c";
const OPENAI_API_KEY = "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";

 
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
            const text  =  await getBranchResponse(transcript);
            const twiml = `<Response><Say>You said: ${text}</Say></Response>`;
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


const { Configuration, OpenAIApi } = require("openai");
const openai = new OpenAIApi(
  new Configuration({ apiKey: OPENAI_API_KEY })
);

async function getBranchResponse(userText) {
  
  const systemPrompt = `   You are a helpful assistant in a voice-based appointment booking system.
                            You know the valid branch locations and their addres detailsare: .{
  "Identifier": "w4V4GkcKjEWmsHdw7W8A6g",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "1 Market St",
  "AddressLine2": "",
  "Suburb": "Sydney",
  "Postcode": "2000",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "yOqPMqle80SSwjgj3GBOcA",
  "DisplayName": "LANA Dental",
  "Email": "support@minkmedia.com.au",
  "AddressLine1": "Shop 4/46-48 President Ave",
  "AddressLine2": "",
  "Suburb": "Caringbah",
  "Postcode": "2229",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "ogsirL4-MEu86NQg050dTw",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "Sydney 2154",
  "AddressLine2": "",
  "Suburb": "Castle Hill",
  "Postcode": "2154",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "xm8F-ELfy0CgMQlh7RGgPg",
  "DisplayName": "DentalFlo (Brisbane)",
  "Email": "hunny.professional@gmail.com",
  "AddressLine1": "Vijay Nagar",
  "AddressLine2": "Jagadhri",
  "Suburb": "Brisbane",
  "Postcode": "4001",
  "State": "QLD",
  "Country": "AU"
}, {
  "Identifier": "ohV7h5WwNEe9LLFwDktaUQ",
  "DisplayName": "Healthengine (Perth)",
  "Email": "integrations@healthengine.com.au",
  "AddressLine1": "432 Murray St",
  "AddressLine2": "",
  "Suburb": "Perth",
  "Postcode": "6000",
  "State": "WA",
  "Country": "AU"
}, {
  "Identifier": "OgLBV8US3UO6IUkRzxy0RA",
  "DisplayName": "Delhi",
  "Email": "aniket.sharma@birdeye.com",
  "AddressLine1": "Delhi",
  "AddressLine2": "",
  "Suburb": "Malinong",
  "Postcode": "5259",
  "State": "SA",
  "Country": "AU"
}, {
  "Identifier": "tZRzwvWYKEu2cpuXo85DHQ",
  "DisplayName": "Hunny Dental Clinic - Delhi",
  "Email": "",
  "AddressLine1": "New Delhi",
  "AddressLine2": "",
  "Suburb": "Newmarket",
  "Postcode": "4051",
  "State": "QLD",
  "Country": "AU"
}, {
  "Identifier": "gv_EXVNshUqFOHjTPwUQ1Q",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "MUMBAI",
  "AddressLine2": "",
  "Suburb": "Nana Glen",
  "Postcode": "2450",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "auDlCSUTuEy12DX2ZzISBA",
  "DisplayName": "Wod Clinic",
  "Email": "rodrigo.barien.iii@gmail.com",
  "AddressLine1": "Rod",
  "AddressLine2": "",
  "Suburb": "Manilla",
  "Postcode": "2346",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "cCplVmQ6sk2--RZbo9BPHw",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "1 Market St",
  "AddressLine2": "",
  "Suburb": "Perth",
  "Postcode": "6000",
  "State": "WA",
  "Country": "AU"
}, {
  "Identifier": "zjUJZbZes0ywz9Yj2JK0Bg",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "35 Whitehorse Road",
  "AddressLine2": "",
  "Suburb": "Deepdene",
  "Postcode": "3103",
  "State": "VIC",
  "Country": "AU"
}, {
  "Identifier": "EcshjtH_D0O5I0yrjaVw0g",
  "DisplayName": "True Smile Clinic",
  "Email": "info@truesmileclinic.com",
  "AddressLine1": "236 Jersey Rd",
  "AddressLine2": "",
  "Suburb": "Sydney",
  "Postcode": "2000",
  "State": "NSW",
  "Country": "AU"
}, {
  "Identifier": "rs7cp-tj7Eqxi6MIgKh43A",
  "DisplayName": "dernancourt",
  "Email": "",
  "AddressLine1": "825 Lower North East Rd",
  "AddressLine2": "",
  "Suburb": "Dernancourt",
  "Postcode": "5075",
  "State": "SA",
  "Country": "AU"
}, {
  "Identifier": "N3jja7NEbEKfG-7t0-teWQ",
  "DisplayName": "Glandore",
  "Email": "",
  "AddressLine1": "Unit 4/780 South Rd",
  "AddressLine2": "",
  "Suburb": "Glandore",
  "Postcode": "5037",
  "State": "SA",
  "Country": "AU"
}, {
  "Identifier": "u_sj2k7jsEKGF88nqLaTZQ",
  "DisplayName": "MelbourneST",
  "Email": "",
  "AddressLine1": "Unit 54/55 Melbourne St",
  "AddressLine2": "",
  "Suburb": "North Adelaide",
  "Postcode": "5006",
  "State": "SA",
  "Country": "AU"
}, {
  "Identifier": "POE_vLpKkk6cvQ7-DmK-EQ",
  "DisplayName": "",
  "Email": "",
  "AddressLine1": "1 George street",
  "AddressLine2": "",
  "Suburb": "Sydney",
  "Postcode": "2000",
  "State": "NSW",
  "Country": "AU"
}.
                            The identifier of the branch has no relvence to the user and should not be mentioned.     

                            The user has been asked “Which branch would you like to book an appointment at?”, follow this process:

                            1. If the user’s answer clearly matches one of the valid branches (even with small spelling or pronunciation differences), return the exact branch name.
                            2. If the user’s answer is unclear, incomplete, or doesn’t match any valid branch, politely ask one short follow-up question to clarify. 
                               - Do NOT read out the full branch list unless requested by the user.
                               - Keep the question brief and natural for spoken conversation.
                               - Avoid repeating the original wording exactly.
                            3. Return only the clarified branch name once it’s identified.
                            4. Once you feel the user has confirmed a branch, prefix your final response with the identifier without whitespace so the systme knows to move onto the next step, for example 'sdV7h5WwNEe9LLFwDktaUQ|Thanks, I'll book you in for blah blah'.

                            Be concise, natural, and friendly, assuming the conversation is happening over the phone.

                               `;

  const completion = await openai.createChatCompletion({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ]
  });

  return completion.data.choices[0].message.content;
}