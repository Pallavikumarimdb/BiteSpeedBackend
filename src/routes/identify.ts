import { Router, Request, Response } from 'express';
import { handleIdentify } from '../services/contactService'; 

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;
    const consolidatedContact = await handleIdentify({ email, phoneNumber });
    res.status(200).json({ contact: consolidatedContact });
  } catch (error) {
    console.error('Error processing identify request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
