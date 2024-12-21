import { Url } from '../models/url.model.js';

export const validateTopic = (topic) => {
  const validTopics = ['acquisition', 'activation', 'retention', 'other'];
  return validTopics.includes(topic);
};