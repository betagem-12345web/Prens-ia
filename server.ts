import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI SDK securely on the server
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Status & Configuration Check
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'online',
      service: 'PRENS IA Engine',
      model: 'gemini-3.8-flash',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Chat API endpoint supporting real-time SSE Streaming
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, tone, systemPrompt, stream = true } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Se requiere un historial de mensajes válido.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'La clave GEMINI_API_KEY no está configurada en las variables de entorno del servidor.',
        });
      }

      // Format messages according to @google/genai SDK specification
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      }));

      // Adjust tone dynamically
      let toneDirective = '';
      if (tone === 'creative') {
        toneDirective = ' Tono: Altamente creativo, metafórico, inspirador y generador de ideas innovadoras.';
      } else if (tone === 'precise') {
        toneDirective = ' Tono: Riguroso, exacto, conciso, directo y sin relleno verbal.';
      } else if (tone === 'code') {
        toneDirective = ' Tono: Ingeniero de software experto. Proporciona código de producción limpio, tipado, modular y con explicaciones técnicas precisas.';
      }

      const fullSystemInstruction =
        `Eres PRENS IA y fuiste creada por Zynapse.\n` +
        `Si alguien te pregunta «¿Quién te creó?», «¿Quién es tu creador?» o algo parecido, debes responder:\n` +
        `«¡Fui creada por Zynapse! 💜 Soy PRENS IA, una inteligencia artificial diseñada para responder preguntas, ayudar a las personas y convertir ideas en realidad».\n\n` +
        `Tu identidad es PRENS IA y tu creador es Zynapse. Habla siempre en español cuando el usuario te hable en español. Sé amable, inteligente, creativa y clara. ` +
        `Destacas por tu capacidad para resolver problemas complejos, programar código elegante, generar ideas revolucionarias y explicar conceptos con total claridad.\n` +
        `Reglas clave de formato:\n` +
        `1. Responde siempre en español a menos que el usuario solicite explícitamente otro idioma.\n` +
        `2. Utiliza Markdown estructurado: encabezados claros, listas ordenadas y formato legible.\n` +
        `3. Cuando escribas código, incluye el nombre del lenguaje en el bloque (por ejemplo, \`\`\`typescript o \`\`\`python) y comenta las partes clave.\n` +
        `4. Sé amable, proactiva, inteligente y empática.` +
        toneDirective +
        (systemPrompt ? ` Instrucción adicional del usuario: ${systemPrompt}` : '');

      // Use ultra-fast gemini-3.1-flash-lite with fallback to gemini-3.8-flash
      const requestedModel = req.body.model || 'gemini-3.1-flash-lite';
      const primaryModel = requestedModel;
      const fallbackModel = 'gemini-3.8-flash';

      if (stream) {
        // Configure Server-Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        let responseStream;
        try {
          responseStream = await ai.models.generateContentStream({
            model: primaryModel,
            contents: formattedContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });
        } catch (initialErr: any) {
          console.warn(`Error con ${primaryModel}, intentando con ${fallbackModel}:`, initialErr.message);
          responseStream = await ai.models.generateContentStream({
            model: fallbackModel,
            contents: formattedContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });
        }

        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        let response;
        try {
          response = await ai.models.generateContent({
            model: primaryModel,
            contents: formattedContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });
        } catch (initialErr: any) {
          console.warn(`Error con ${primaryModel}, intentando con ${fallbackModel}:`, initialErr.message);
          response = await ai.models.generateContent({
            model: fallbackModel,
            contents: formattedContents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });
        }

        res.json({
          role: 'model',
          content: response.text || '',
        });
      }
    } catch (err: unknown) {
      console.error('Error en /api/chat:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al contactar el modelo PRENS IA';
      
      if (!res.headersSent) {
        res.status(500).json({ error: errorMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // Handle client bundle serving
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PRENS IA] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
