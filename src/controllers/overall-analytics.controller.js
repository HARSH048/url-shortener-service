import { Analytics } from '../models/analytics.model.js';
import { Url } from '../models/url.model.js';
import { CacheService } from '../services/cache.service.js';
import { getRecentDays } from '../utils/date.utils.js';

export const getOverallAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = CacheService.generateKey('overall-analytics', userId.toString());

    const analytics = await CacheService.getOrSet(cacheKey, async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get all URLs created by the user
      const urls = await Url.find({ userId });
      const urlIds = urls.map(url => url._id);

      // Get analytics for all URLs
      const analytics = await Analytics.find({
        urlId: { $in: urlIds },
        timestamp: { $gte: sevenDaysAgo }
      });

      // Calculate statistics
      const totalUrls = urls.length;
      const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
      const uniqueIPs = new Set(analytics.map(a => a.ipAddress));
      const uniqueClicks = uniqueIPs.size;

      return {
        totalUrls,
        totalClicks,
        uniqueClicks,
        clicksByDate: await getClicksByDate(urlIds, sevenDaysAgo),
        osType: calculateOSStats(analytics),
        deviceType: calculateDeviceStats(analytics)
      };
    }, 300); // Cache for 5 minutes

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

const getClicksByDate = async (urlIds, startDate) => {
  const recentDays = getRecentDays(7);
  
  const clicksByDay = await Analytics.aggregate([
    {
      $match: {
        urlId: { $in: urlIds },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return recentDays.map(date => ({
    date,
    clicks: clicksByDay.find(day => day._id === date)?.count || 0
  }));
};

const calculateOSStats = (analytics) => {
  const osMap = new Map();

  analytics.forEach(visit => {
    const os = visit.userAgent.os;
    if (!osMap.has(os)) {
      osMap.set(os, {
        osName: os,
        uniqueClicks: new Set(),
        uniqueUsers: new Set()
      });
    }
    
    const stats = osMap.get(os);
    stats.uniqueClicks.add(visit.ipAddress);
    stats.uniqueUsers.add(visit.ipAddress);
  });

  return Array.from(osMap.values()).map(stat => ({
    osName: stat.osName,
    uniqueClicks: stat.uniqueClicks.size,
    uniqueUsers: stat.uniqueUsers.size
  }));
};

const calculateDeviceStats = (analytics) => {
  const deviceMap = new Map();

  analytics.forEach(visit => {
    const device = visit.userAgent.device;
    if (!deviceMap.has(device)) {
      deviceMap.set(device, {
        deviceName: device,
        uniqueClicks: new Set(),
        uniqueUsers: new Set()
      });
    }
    
    const stats = deviceMap.get(device);
    stats.uniqueClicks.add(visit.ipAddress);
    stats.uniqueUsers.add(visit.ipAddress);
  });

  return Array.from(deviceMap.values()).map(stat => ({
    deviceName: stat.deviceName,
    uniqueClicks: stat.uniqueClicks.size,
    uniqueUsers: stat.uniqueUsers.size
  }));
};