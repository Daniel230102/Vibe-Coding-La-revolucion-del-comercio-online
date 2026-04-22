import { GoogleGenAI } from "@google/genai";

const getGeminiKey = () => {
  // En Vite, process.env es inyectado por vite.config.ts definiendo el valor
  const key = (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === "undefined" || key === "YOUR_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY no configurada. Las funciones de IA pueden no funcionar.");
    return "NO_KEY";
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getGeminiKey() });

export const generateProductDescription = async (productName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un experto en marketing para tiendas locales. Crea una descripción atractiva, corta y persuasiva para un producto llamado "${productName}". La descripción debe resaltar la calidad y el valor de comprar localmente. Máximo 150 caracteres.`,
    });

    return response.text?.trim() || "Calidad excepcional en cada detalle. Ideal para tu día a día.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Descripción generada por defecto con la mejor calidad local.";
  }
};
