const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

// ==============================
// VARIABLES DE ENTORNO (RAILWAY)
// ==============================
const ACCESS_TOKEN     = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN     = process.env.WHATSAPP_VERIFY_TOKEN;

// TC-IA
const TCIA_API_KEY     = process.env.TCIA_API_KEY;
const TCIA_TOKEN       = process.env.TCIA_TOKEN;
const TCIA_API_URL     = "https://top-conquerors.com/IATC/TC-IA.php";

// URL WhatsApp API
const WA_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;


// ============================================
// HOME PARA PRUEBA
// ============================================
app.get("/", (req, res) => {
  res.send("TC-IA WhatsApp Bot funcionando ✔");
});


// ============================================
// 1) VERIFICACIÓN WEBHOOK
// ============================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente ✔");
    return res.status(200).send(challenge);
  }

  console.log("❌ Fallo en verificación");
  return res.sendStatus(403);
});


// ============================================
// 2) RECIBIR MENSAJES
// ============================================
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value  = change?.value;
    const msg    = value?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const from  = msg.from;
    const texto = msg.text?.body || "";

    console.log("📩 Mensaje recibido:", texto);

    // 3) ENVIAR A TC-IA
    const tcRes = await axios.post(TCIA_API_URL, {
      usuario: from,
      mensaje: texto,
      apikey: TCIA_API_KEY,
      token: TCIA_TOKEN
    });

    const respuestaIA = tcRes.data.respuesta || "No entendí eso 😥";

    // 4) RESPONDER A WHATSAPP
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
    console.log("❌ ERROR WhatsApp Bot:", err);
    res.sendStatus(500);
  }
});


// ============================================
// 5) INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 TC-IA WhatsApp en Railway en puerto " + PORT);
});
