import { GoogleGenAI } from "@google/genai";
import { Borrower, Loan, LoanStatus } from "../types";

// Helper to check if API key exists
const isApiKeyAvailable = () => !!process.env.API_KEY;

export const generateCollectionMessage = async (
  borrower: Borrower,
  loan: Loan,
  tone: 'FRIENDLY' | 'FIRM' | 'URGENT'
): Promise<string> => {
  if (!isApiKeyAvailable()) return "Error: API Key missing.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Write a short SMS/WhatsApp message to a borrower named ${borrower.name}.
    Loan details:
    - Amount Due: R${loan.balance.toFixed(2)}
    - Due Date: ${new Date(loan.dueDate).toLocaleDateString()}
    - Status: ${loan.status}
    
    Tone: ${tone}
    Keep it professional but informal enough for personal lending. Max 50 words.
    Do not include placeholders.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate message.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating message. Please check connection.";
  }
};

export const analyzeBorrowerRisk = async (borrower: Borrower, history: string): Promise<string> => {
  if (!isApiKeyAvailable()) return "AI analysis unavailable without API Key.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the risk for this borrower based on the following notes and history:
    Name: ${borrower.name}
    Notes: ${borrower.notes}
    History: ${history}
    
    Provide a concise risk assessment (1-2 sentences) and suggest a Risk Level (LOW, MEDIUM, HIGH).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error(error);
    return "Error performing analysis.";
  }
};