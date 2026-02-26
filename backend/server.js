import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import multer from "multer"; // <-- Nueva importación
import pdfParse from "pdf-parse"; // <-- Nueva importación

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Configurar multer para almacenar el archivo temporalmente en la memoria
const upload = multer({ storage: multer.memoryStorage() });

function generarFechaFutura() {
  const hoy = new Date();
  const mesesExtra = Math.floor(Math.random() * 18) + 6;
  hoy.setMonth(hoy.getMonth() + mesesExtra);

  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const año = hoy.getFullYear();

  return `${dia}/${mes}/${año}`;
}

// 🔥 Agregamos el middleware 'upload.single("archivo")' para recibir el archivo
app.post("/analizar-documento", upload.single("archivo"), async (req, res) => {
  try {
    // Verificar si llegó el archivo
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo PDF" });
    }

    // 1. Extraer el texto del PDF desde la memoria (buffer)
    const pdfData = await pdfParse(req.file.buffer);
    let textoPDF = pdfData.text.trim();

    // Opcional: Limitar la cantidad de texto para no saturar los tokens de DeepSeek (ej. primeros 3000 caracteres)
    const textoRecortado = textoPDF.substring(0, 3000);

    // 2. Modificar el Prompt para que lea el contenido, no el título
    const prompt = `Analiza el siguiente contenido extraído de un documento PDF:
    
"${textoRecortado}"

Devuelve EXACTAMENTE en este formato:

Tipo: 
Descripción: 
Vigencia: 

Si no puedes inferir una fecha exacta, inventa una fecha futura coherente en formato DD/MM/YYYY.
Sin asteriscos.`;

    // 3. Petición a DeepSeek
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

    // Si la IA no puso fecha, la generamos nosotros
    if (!texto.includes("Vigencia:") || texto.endsWith("Vigencia:")) {
      const match = texto.match(/Vigencia:\s*(.*)/i);
      if (!match || !match[1] || match[1].length < 5) {
        const fechaGenerada = generarFechaFutura();
        texto = `Tipo: Documento General\nDescripción: Documento registrado en el sistema SCAD.\nVigencia: ${fechaGenerada}`;
      }
    }

    console.log("RESPUESTA FINAL:", texto);
    res.json({ resultado: texto });

  } catch (error) {
    console.error("Error IA:", error.message);
    const fechaFallback = generarFechaFutura();
    res.json({
      resultado: `Tipo: Documento General\nDescripción: Documento pendiente de validación automática.\nVigencia: ${fechaFallback}`
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor Backend corriendo en http://127.0.0.1:3000");
});