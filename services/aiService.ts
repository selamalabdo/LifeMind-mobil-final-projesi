import { GoogleGenerativeAI } from "@google/generative-ai";

// buda gemini kullandım  ucretsiz oldugu icin  ve denedim çalışıyor 
const API_KEY = "burda anahtarı yazmalıyız "; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const getAIRecommendation = async (userPrompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(
      `Sen akıllı bir asistan olan lifemin'din. Kullanıcının şu isteğine kısa, motive edici ve planlayıcı bir yanıt ver: ${userPrompt}`
    );
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "Bağlantı hatası oluştu, ama planlarına devam etmelisin!";
  }
};