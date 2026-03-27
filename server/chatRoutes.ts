import { Request, Response, Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface ChatRequest extends Request {
  body: {
    message: string;
    language: 'en' | 'es';
  };
}

// AI Chat endpoint
router.post('/chat', async (req: ChatRequest, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'Chat service unavailable - OpenAI API key not configured' });
    }

    const { message, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (typeof message !== 'string' || message.length > 5000) {
      return res.status(400).json({ error: 'Message must be a string under 5000 characters' });
    }

    const systemPrompt = language === 'es'
      ? `Eres un asistente de atención al cliente experto para CampAIgner, una plataforma de marketing automatizada que usa IA.

CampAIgner es una plataforma SaaS que:
- Genera campañas de marketing automáticamente usando IA
- Publica en más de 21 plataformas (Instagram, TikTok, Facebook, LinkedIn, etc.)
- Se integra con datos empresariales en tiempo real (POS, web, redes sociales)
- Crea contenido personalizado para cada plataforma con dimensiones perfectas
- Ofrece análisis y métricas en tiempo real
- Incluye gestión de inbox unificado para todas las redes sociales
- Proporciona respuestas automáticas inteligentes

Responde de manera útil, amigable y profesional. Mantén las respuestas concisas pero informativas. Si no estás seguro de algo específico, sugiere contactar soporte o revisar la documentación.`

      : `You are an expert customer support assistant for CampAIgner, an AI-powered automated marketing platform.

CampAIgner is a SaaS platform that:
- Automatically generates marketing campaigns using AI
- Posts to 21+ platforms (Instagram, TikTok, Facebook, LinkedIn, etc.)
- Integrates with real-time business data (POS, web, social media)
- Creates custom content for each platform with perfect dimensions
- Provides real-time analytics and metrics
- Includes unified inbox management for all social media
- Provides intelligent automatic responses

Respond in a helpful, friendly, and professional manner. Keep responses concise but informative. If you're unsure about something specific, suggest contacting support or checking documentation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ||
      (language === 'es'
        ? 'Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.'
        : 'Sorry, I couldn\'t process your message. Please try again.');

    res.json({ response });

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = req.body.language === 'es'
      ? 'Lo siento, hubo un error con el asistente IA. Por favor contacta soporte.'
      : 'Sorry, there was an error with the AI assistant. Please contact support.';

    res.status(500).json({ error: errorMessage });
  }
});

export default router;