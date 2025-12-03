import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// ==============================
// VARIABLES DESDE RAILWAY
// ==============================
// CREDENCIALES DE META (WhatsApp)
const ACCESS_TOKEN     = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN     = process.env.WHATSAPP_VERIFY_TOKEN;

// CREDENCIALES REALES DE TC-IA (LAS QUE VOS SACÁS DEL PANEL)
const TCIA_API_KEY     = process.env.TCIA_API_KEY;   // API-KEY (30 días)
const TCIA_TOKEN       = process.env.TCIA_TOKEN;     // TOKEN (60 min)
const TCIA_API_URL     = process.env.TCIA_API_URL;   // Tu endpoint privado

// URL para enviar mensajes vía Meta API
const WA_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;


// ==============================
// 1) VERIFICAR WEBHOOK (FUNCIONANDO)
// ==============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Intento de verificación:", { mode, token, VERIFY_TOKEN });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente ✔");
    return res.status(200).send(challenge);
  }

  console.log("Webhook rechazado ❌");
  return res.sendStatus(403);
});


// ==============================
// 2) RECIBIR MENSAJES DE WHATSAPP
// ==============================
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg   = entry?.messages?.[0];

    if (!msg) return res.sendStatus(200); // nada que procesar

    const from  = msg.from;
    const texto = msg.text?.body || "";

    console.log("Mensaje recibido:", texto);

    // ======================================================
    // 3) 🔥 LLAMAR A TC-IA (TU SISTEMA REAL)
    // ======================================================
    const tcRes = await axios.post(TCIA_API_URL, {
      usuario: from,
      mensaje: texto,
      apikey: TCIA_API_KEY,     // LO QUE VOS USÁS
      token: TCIA_TOKEN         // TOKEN (60 minutos)
    });

    const respuestaIA = tcRes.data.respuesta || "No entendí eso 😥";

    // ======================================================
    // 4) 🔥 RESPONDER A WHATSAPP
    // ======================================================
    await axios.post(
      WA_URL,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: respuestaIA }
      },
      {
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);

  } catch (err) {
    console.log("ERROR WhatsApp Bot:", err.toString());
    res.sendStatus(500);
  }
});


// ==============================
// 5) ARRANCAR SERVIDOR
// ==============================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 TC-IA WhatsApp corriendo en Railway 🚀");
});
