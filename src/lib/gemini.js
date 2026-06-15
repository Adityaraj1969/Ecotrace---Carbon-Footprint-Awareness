import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ─── Personalized Insights (returns JSON) ────────────────────────────────────
export async function getInsights(userData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const { categoryCO2, totalCO2, profile } = userData;

  const topCat = categoryCO2
    ? Object.entries(categoryCO2).sort(([, a], [, b]) => b - a)[0][0]
    : 'transport';

  const prompt = `You are EcoAI, a carbon footprint expert focused on India.

User data:
- Name: ${profile?.name || 'User'}
- City: ${profile?.location || 'India'}
- Annual CO₂: ${totalCO2} kg  (India avg = 2000 kg, Global avg = 4800 kg)
- Transport: ${categoryCO2?.transport || 0} kg
- Home energy: ${categoryCO2?.home || 0} kg
- Food: ${categoryCO2?.food || 0} kg
- Shopping: ${categoryCO2?.shopping || 0} kg
- Top emission source: ${topCat}

Generate 5 specific, actionable, India-relevant recommendations.
Respond ONLY with valid JSON — no markdown fences, no preamble:
{
  "summary": "One sentence personal analysis under 20 words",
  "insights": [
    {
      "id": 1,
      "emoji": "🚌",
      "title": "Short action title (max 6 words)",
      "description": "Specific advice, India-relevant, under 55 words",
      "impact": "Save ~XXX kg CO₂/year",
      "category": "transport",
      "difficulty": "Easy"
    }
  ]
}
difficulty must be Easy | Medium | Hard.
category must be transport | home | food | shopping.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

// ─── Streaming Eco Chatbot ───────────────────────────────────────────────────
const SYSTEM_CONTEXT = `You are EcoAI, a friendly carbon footprint expert for India.
Give specific, practical, India-relevant advice with real numbers.
Keep responses under 140 words. Use bullet points for lists.`;

export async function streamChat(history, userMessage, onChunk) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: [
      { role: 'user',  parts: [{ text: SYSTEM_CONTEXT }] },
      { role: 'model', parts: [{ text: 'Ready to help with India-specific carbon footprint advice.' }] },
      ...history.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
    ],
  });

  const result = await chat.sendMessageStream(userMessage);
  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    full += text;
    onChunk(text);
  }
  return full;
}
