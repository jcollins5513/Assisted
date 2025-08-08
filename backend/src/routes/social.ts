import express from 'express';
import { socialAccounts } from '../data/socialAccounts';

const router = express.Router();

router.get('/accounts', (_req, res) => {
  res.json(socialAccounts);
});

router.post('/publish', (req, res) => {
  const { accountId, content, scheduledTime } = req.body;
  const account = socialAccounts.find(a => a.id === accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const publishedAt = scheduledTime ? new Date(scheduledTime) : new Date();

  return res.json({
    id: `post-${Date.now()}-${accountId}`,
    accountId,
    platform: account.platform,
    accountName: account.name,
    content,
    publishedAt,
    status: 'published',
    postUrl: `https://${account.platform}.com/${account.username}/posts/${Date.now()}`
  });
});

export default router;
