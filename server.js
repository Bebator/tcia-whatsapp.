import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// ==============================
// VARIABLES DE ENTORNO RAILWAY
// ==============================
const ACCESS_TOKEN     = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN     = process.env.WHATSAPP_VERIFY_TOKEN;
const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID;

// ==============================
// RUTA PRINCIPAL
// ==============================
app.get("/", (req, res) => {
  res.send("TC-IA WhatsApp Bot funcionando ✔");
});

// ==============================
// WEBHOOK VERIFICATION (GET)
// ==============================
app.get("/webhook", (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log("Intento de verificación:", { mode, token });

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente ✔");
    return res.status(200).send(challenge);
  }

  console.log("Fallo en verificación ❌");
  return res.sendStatus(403);
});

// ==============================
// WEBHOOK MENSAJES (POST)
// ==============================
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;        // Número del usuario
      const text = message.text?.body;  // Mensaje que envió

      console.log("📩 Mensaje recibido:", text, "de", from);

      // RESPUESTA AUTOMÁTICA
      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: `TC-IA te escuchó: ${text}` }
        },
        {
          headers: {
            "Authorization": `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("📤 Respuesta enviada");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en POST webhook:", error.response?.data || error);
    res.sendStatus(500);
  }
});

// ==============================
// PUERTO
// ==============================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor activo en puerto ${port} 🚀`);
});
