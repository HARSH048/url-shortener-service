import express from 'express';
import { getUrlAnalytics } from '../controllers/analytics.controller.js';
import { getTopicAnalytics } from '../controllers/topic-analytics.controller.js';
import { getOverallAnalytics } from '../controllers/overall-analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/overall', protect, getOverallAnalytics);
router.get('/topic/:topic', protect, getTopicAnalytics);
router.get('/:alias', protect, getUrlAnalytics);

export default router;