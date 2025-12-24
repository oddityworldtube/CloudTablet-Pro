
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const enhanceSketch = async (imageData: string, prompt: string = "Professional digital art, highly detailed, clean lines") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `Refine this sketch into a ${prompt}. Keep the original composition and proportions but add professional shading, details, and color.`,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    throw error;
  }
};
