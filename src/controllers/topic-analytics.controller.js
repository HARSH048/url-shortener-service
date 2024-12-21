import { AnalyticsService } from '../services/analytics.service.js';
import { ApiError } from '../utils/api-error.js';
import { validateTopic } from '../validators/topic.validator.js';

export const getTopicAnalytics = async (req, res, next) => {
  try {
    const { topic } = req.params;
    
    if (!validateTopic(topic)) {
      throw new ApiError(400, 'Invalid topic');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const analytics = await AnalyticsService.getTopicAnalytics(topic, sevenDaysAgo);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};