import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analizar-documento", async (req, res) => {
  try {
    const { nombreArchivo } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analiza el siguiente nombre de documento: "${nombreArchivo}"
      Clasifícalo y dame:
      1. Tipo de documento
      2. Posible descripción
      3. Si parece vigente o no
      Responde de forma corta, profesional y SIN usar asteriscos ni símbolos de formato Markdown (**).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // LIMPIEZA TOTAL: Eliminamos asteriscos que la IA pueda colar por hábito
    const textoLimpio = text.replace(/\*/g, '').trim();

    res.json({ resultado: textoLimpio });

  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "No se pudo procesar el análisis" });
  }
});

app.listen(3000, () => {
  console.log("Servidor Backend corriendo en http://localhost:3000");
});