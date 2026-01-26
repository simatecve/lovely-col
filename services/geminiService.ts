
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

// Always use a named parameter object with the API key from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a studio analysis report using Gemini.
 * Uses gemini-3-pro-preview for complex reasoning tasks.
 */
export async function generateStudioReport(data: AppData, query: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Datos del estudio (JSON): ${JSON.stringify(data)}.\n\nConsulta del Usuario: ${query}`,
      config: {
        // Model personality and constraints should be in systemInstruction.
        systemInstruction: `Tu nombre es Asistente Virtual Lovelys. Eres un experto Analista de Estudios Webcam para el Estudio Lovely's. 
          El usuario gestiona un estudio con 30 salas independientes.
          
          Contexto del Sistema:
          - La medición es por TOKENS.
          - Ciclos de quincena: Q1 (del 5 al 19) y Q2 (del 20 al 4 del mes siguiente).
          
          Lineamientos de análisis:
          - Identifícate siempre como Asistente Virtual Lovelys.
          - Analiza tendencias de tokens por plataforma y por modelo.
          - Compara el rendimiento entre las quincenas Q1 y Q2.
          - Responde siempre en español de forma directa, elegante y profesional.`,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // Access the .text property directly (do not call as a method).
    return response.text;
  } catch (error) {
    console.error("Error de Gemini:", error);
    return "Lo siento, encontré un error al analizar los datos. Por favor, inténtalo de nuevo.";
  }
}
