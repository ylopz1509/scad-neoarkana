import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Función para generar fecha futura aleatoria (6–24 meses)
function generarFechaFutura() {
  const hoy = new Date();
  const mesesExtra = Math.floor(Math.random() * 18) + 6;
  hoy.setMonth(hoy.getMonth() + mesesExtra);

  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const año = hoy.getFullYear();

  return `${dia}/${mes}/${año}`;
}

app.post("/analizar-documento", async (req, res) => {
  try {

    const { nombreArchivo } = req.body;

    if (!nombreArchivo) {
      return res.status(400).json({ error: "Nombre de archivo requerido" });
    }

    const prompt = `
Analiza el siguiente nombre de documento: "${nombreArchivo}"

Devuelve EXACTAMENTE en este formato:

Tipo: 
Descripción: 
Vigencia: 

Si no puedes inferir una fecha exacta, inventa una fecha futura coherente en formato DD/MM/YYYY.
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
        temperature: 0.4
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    let texto = response.data.choices[0].message.content.trim();

    // 🔥 Si la IA no puso fecha, la generamos nosotros
    if (!texto.includes("Vigencia:") || texto.includes("Vigencia:")) {
      const match = texto.match(/Vigencia:\s*(.*)/i);

      if (!match || !match[1] || match[1].length < 5) {
        const fechaGenerada = generarFechaFutura();
        texto = `
Tipo: Documento General
Descripción: Documento registrado en el sistema SCAD.
Vigencia: ${fechaGenerada}
        `;
      }
    }

    console.log("RESPUESTA FINAL:", texto);

    res.json({ resultado: texto });

  } catch (error) {

    console.error("Error IA:", error.message);

    // 🔥 Respaldo total si falla IA
    const fechaFallback = generarFechaFutura();

    res.json({
      resultado: `
Tipo: Documento General
Descripción: Documento pendiente de validación automática.
Vigencia: ${fechaFallback}
      `
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor Backend corriendo en http://127.0.0.1:3000");
});