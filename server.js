import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// ==============================
// VARIABLES DESDE RAILWAY
// ==============================
const ACCESS_TOKEN     = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN     = process.env.WHATSAPP_VERIFY_TOKEN;

// 🔥 TU API PRIVADA DE TC-IA (como Discord)
const TCIA_API_URL     = process.env.TCIA_API_URL;
const TCIA_TOKEN       = process.env.TCIA_TOKEN; // el que generás en el panel

const WA_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// ==============================
// 1) VERIFICAR WEBHOOK
// ==============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ==============================
// 2) RECIBIR MENSAJES
// ==============================
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg   = entry?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from  = msg.from;
    const texto = msg.text?.body || "";

    console.log("Mensaje recibido:", texto);

    // ======================================================
    // 🔥 LLAMAR A TC-IA DE LA MISMA MANERA QUE DISCORD
    // ======================================================
    const data = {
      usuario: from,
      mensaje: texto,
      token: TCIA_TOKEN
    };

    const tcRes = await axios.post(TCIA_API_URL, data);
    const respuesta = tcRes.data.respuesta || "No entendí eso 😥";

    // ======================================================
    // 🔥 RESPONDER A WHATSAPP
    // ======================================================
    await axios({
      method: "POST",
      url: WA_URL,
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      data: {
        messaging_product: "whatsapp",
        to: from,
        text: { body: respuesta }
      }
    });

    res.sendStatus(200);

  } catch (e) {
    console.error("Error:", e.toString());
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("TC-IA WhatsApp corriendo en Railway 🔥");
});
