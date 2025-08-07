import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de verificación
app.get("/", (req, res) => res.send("OK: WhatsApp API backend running"));
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Variables ambiente (acepta ACCESS_TOKEN o META_TOKEN)
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || process.env.META_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WA_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

// Enviar plantilla
app.post("/api/send-template", async (req, res) => {
  try {
    const { phone, template, language = "en_US", params = [], headerImageUrl, headerMediaId } = req.body;

    const components = [];
    if (headerImageUrl) components.push({ type: "header", parameters: [{ type: "image", image: { link: headerImageUrl } }] });
    if (headerMediaId) components.push({ type: "header", parameters: [{ type: "image", image: { id: headerMediaId } }] });
    if (params.length) components.push({ type: "body", parameters: params.map(p => ({ type: "text", text: String(p) })) });

    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: { name: template, language: { code: language }, ...(components.length ? { components } : {}) }
    };

    const r = await axios.post(WA_URL, payload, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" }
    });

    res.json(r.data);
  } catch (e) {
    res.status(400).json({ error: e.response?.data || { message: e.message } });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor backend corriendo en puerto ${PORT}`));
