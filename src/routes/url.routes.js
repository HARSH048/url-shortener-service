import express from 'express';
import { createShortUrl, redirectToLongUrl } from '../controllers/url.controller.js';
import { getUrlAnalytics } from '../controllers/analytics.controller.js'
import { protect } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = express.Router();

router.post('/shorten',protect, rateLimiter, createShortUrl);
router.get('/:shortCode', redirectToLongUrl);
router.get('/:shortCode/analytics', protect, getUrlAnalytics);

export default router;