import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

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
