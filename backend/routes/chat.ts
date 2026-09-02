import { Router, Request, Response } from 'express';
import { chatService, ChatRequestPayload } from '../services/chatService';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, role, language, history, context } = req.body as ChatRequestPayload;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const validRole = role === 'agent' ? 'agent' : 'shipper';
    const validLang = ['en', 'hi', 'or', 'bn', 'te'].includes(language) ? language : 'en';

    const result = await chatService.generateResponse({
      message: message.trim(),
      role: validRole,
      language: validLang as any,
      history: Array.isArray(history) ? history : [],
      context: context || {},
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[ChatRoute] Error handling chat message:', error);
    return res.status(500).json({
      error: 'Failed to process chat message.',
      details: error?.message || 'Unknown server error',
    });
  }
});

export default router;
