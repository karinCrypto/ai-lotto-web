
import { GoogleGenAI, Type } from "@google/genai";
import { LotteryType, PastResult } from "../types";
import { LOTTERY_CONFIGS } from "../constants";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getLuckyNumbers(type: LotteryType, pastResults: PastResult[] = []) {
    const ai = this.getClient();
    const config = LOTTERY_CONFIGS[type];
    const bonusName = (config as any).bonusName || 'bonus';
    
    const historyContext = pastResults.length > 0 
      ? `Here are the latest official results for reference:\n${pastResults.map(r => `RD ${r.round}: ${r.numbers.join(', ')} (Bonus: ${r.bonus})`).join('\n')}`
      : "No historical data available currently.";

    const prompt = `Act as a mystical lottery algorithm expert with deep statistical knowledge. 
    Predict a set of winning numbers for ${config.name}.
    
    ${historyContext}
    
    Based on the historical data above (if any), perform a frequency analysis, identify "hot" or "overdue" numbers, and apply quantum probability models to generate the most likely next winning set.
    
    Requirement: ${config.mainCount} unique main numbers (1-${config.mainMax})${config.hasBonus ? ` and 1 bonus ${bonusName} (1-${config.bonusMax})` : ''}.
    
    Return JSON with:
    1. 'numbers': int[] (sorted)
    2. 'bonus': int (if any)
    3. 'fortune': string (short lucky quote related to the data analysis)
    4. 'analysis': string (detailed technical explanation of how the historical data influenced this specific prediction, mentioning patterns or anomalies observed)`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              bonus: { type: Type.INTEGER },
              fortune: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["numbers", "fortune", "analysis"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        numbers: Array.isArray(data.numbers) ? data.numbers.sort((a: number, b: number) => a - b) : [],
        bonus: data.bonus,
        fortune: data.fortune || "The data points to prosperity.",
        analysis: data.analysis || "Generated via trend analysis of recent draws."
      };
    } catch (error) {
      console.error("Gemini Predict Error:", error);
      const fallback = Array.from({ length: config.mainCount }, () => Math.floor(Math.random() * config.mainMax) + 1).sort((a, b) => a - b);
      return {
        numbers: fallback,
        bonus: config.hasBonus ? Math.floor(Math.random() * config.bonusMax) + 1 : undefined,
        fortune: "Luck is on your side.",
        analysis: "Fallback generation due to atmospheric noise."
      };
    }
  }

  async getLatestOfficialResults(type: LotteryType): Promise<PastResult[]> {
    const ai = this.getClient();
    const config = LOTTERY_CONFIGS[type];
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const prompt = `Search for the MOST RECENT official draw results for ${config.name}. 
    Today's date is ${today}. Use Google Search to find the latest confirmed winning numbers from official sources.
    Required Information for each of the last 3 draws:
    - Draw/Round number
    - Winning numbers
    - Bonus ball (if applicable)
    - Exact date of draw
    
    Return as a clean JSON array of objects. High accuracy is mandatory.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                round: { type: Type.STRING },
                numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                bonus: { type: Type.INTEGER },
                date: { type: Type.STRING }
              },
              required: ["round", "numbers", "date"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || '[]');
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({ title: chunk.web.title, url: chunk.web.uri }));

      if (results.length > 0 && sources.length > 0) {
        results.forEach((res: any) => { res.sources = sources; });
      }

      return results;
    } catch (error) {
      console.error("Gemini History Error:", error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
