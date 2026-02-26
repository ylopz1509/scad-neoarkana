import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analizar-documento", async (req, res) => {
  try {
    const { nombreArchivo } = req.body;

    const prompt = `
Analiza el siguiente nombre de documento: "${nombreArchivo}"

Devuelve:
Tipo:
Descripción:
Vigencia:

Respuesta corta y profesional.
Sin asteriscos.
`;

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Eres un analista documental profesional." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const texto = response.data.choices[0].message.content.trim();

    res.json({ resultado: texto });

  } catch (error) {
    console.error("Error DeepSeek:", error.response?.data || error.message);
    res.status(500).json({ error: "No se pudo procesar el análisis" });
  }
});

app.listen(3000, () => {
  console.log("Servidor Backend corriendo en http://localhost:3000");
});