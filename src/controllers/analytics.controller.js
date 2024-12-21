import { Analytics } from '../models/analytics.model.js';
import { Url } from '../models/url.model.js';
import { ApiError } from '../utils/api-error.js';
import { getRecentDays } from '../utils/date.utils.js';

export const getUrlAnalytics = async (req, res, next) => {
  try {
    const { alias } = req.params;
    
    // Find URL by alias
    const url = await Url.findOne({ shortCode: alias });
    if (!url) {
      throw new ApiError(404, 'URL not found');
    }

    // Get analytics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const analytics = await Analytics.find({
      urlId: url._id,
      timestamp: { $gte: sevenDaysAgo }
    });

    // Calculate total and unique clicks
    const totalClicks = url.clicks;
    const uniqueIPs = new Set(analytics.map(a => a.ipAddress));
    const uniqueClicks = uniqueIPs.size;

    // Calculate clicks by date for the last 7 days
    const clicksByDate = await getClicksByDate(url._id, sevenDaysAgo);

    // Calculate OS statistics
    const osStats = calculateOSStats(analytics);

    // Calculate device type statistics
    const deviceStats = calculateDeviceStats(analytics);

    res.json({
      totalClicks,
      uniqueClicks,
      clicksByDate,
      osType: osStats,
      deviceType: deviceStats
    });
  } catch (error) {
    next(error);
  }
};

const getClicksByDate = async (urlId, startDate) => {
  const recentDays = getRecentDays(7);
  
  const clicksByDay = await Analytics.aggregate([
    {
      $match: {
        urlId: urlId,
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
    {
      $sort: { _id: 1 }
    }
  ]);

  // Fill in missing dates with zero clicks
  return recentDays.map(date => {
    const dayStats = clicksByDay.find(day => day._id === date);
    return {
      date,
      clicks: dayStats ? dayStats.count : 0
    };
  });
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
    stats.uniqueUsers.add(visit.ipAddress); // In a real app, you might use a user ID instead
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
    stats.uniqueUsers.add(visit.ipAddress); // In a real app, you might use a user ID instead
  });

  return Array.from(deviceMap.values()).map(stat => ({
    deviceName: stat.deviceName,
    uniqueClicks: stat.uniqueClicks.size,
    uniqueUsers: stat.uniqueUsers.size
  }));
};