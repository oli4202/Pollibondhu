import { Router } from 'express';
import { getAiResponse } from '../services/groqService';
import { AuthenticatedRequest } from '../middleware/rbacMiddleware';
// Assuming you have an authMiddleware to authenticate user
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { prompt } = req.body;
        const userRole = req.user?.role || 'CITIZEN';

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await getAiResponse(userRole, prompt);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

export default router;
